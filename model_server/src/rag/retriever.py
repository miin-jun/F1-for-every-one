from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from config import Settings
from sentence_transformers import CrossEncoder
from langchain_core.documents import Document
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_embedding_model = None
_vector_store = None
_translator = None
_reranker = None
_keyword_docs = None
_keyword_vectorizer = None
_keyword_matrix = None

def get_embedding_model():
    global _embedding_model

    if _embedding_model is None:
        _embedding_model = HuggingFaceEmbeddings(
            model_name="intfloat/multilingual-e5-large",
            model_kwargs={"device": "cpu"},
            encode_kwargs={
                "normalize_embeddings": True,
                "prompt": "query: ",
            },
        )

    return _embedding_model

def get_vector_store():
    global _vector_store

    if _vector_store is None:
        _vector_store = Chroma(
            persist_directory=Settings.VECTOR_DIR,
            embedding_function=get_embedding_model(),
            collection_name=Settings.VECTOR_COLLECTION_NAME,
        )

        count = _vector_store._collection.count()
        print(f"[RAG] VECTOR_DIR: {Settings.VECTOR_DIR}")
        print(f"[RAG] COLLECTION: {Settings.VECTOR_COLLECTION_NAME}")
        print(f"[RAG] CHUNK COUNT: {count}")

    return _vector_store

def get_keyword_index():
    """
    Chroma vectorstore에 들어 있는 문서들을 꺼내서
    간단한 TF-IDF keyword search index를 만든다.
    """
    global _keyword_docs, _keyword_vectorizer, _keyword_matrix

    if _keyword_docs is not None:
        return _keyword_docs, _keyword_vectorizer, _keyword_matrix

    vector_store = get_vector_store()
    raw = vector_store._collection.get(include=["documents", "metadatas"])

    documents = raw.get("documents", [])
    metadatas = raw.get("metadatas", [])

    docs = []
    texts = []

    for content, metadata in zip(documents, metadatas):
        metadata = metadata or {}

        doc = Document(
            page_content=content,
            metadata=metadata,
        )
        docs.append(doc)

        # keyword 검색에는 본문 + 메타데이터를 같이 넣는 게 유리함
        searchable_text = " ".join(
            [
                str(metadata.get("source", "")),
                str(metadata.get("doc_type", "")),
                str(metadata.get("Clause", "")),
                str(metadata.get("term", "")),
                content,
            ]
        )
        texts.append(searchable_text)

    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(3, 5),
        lowercase=True,
        max_features=50000,
    )

    matrix = vectorizer.fit_transform(texts)

    _keyword_docs = docs
    _keyword_vectorizer = vectorizer
    _keyword_matrix = matrix

    print(f"[RAG] KEYWORD INDEX DOC COUNT: {len(docs)}")

    return _keyword_docs, _keyword_vectorizer, _keyword_matrix

def keyword_search(query: str, k: int = 20):
    """
    TF-IDF 기반 keyword search.
    반환값: [(Document, score), ...]
    """
    docs, vectorizer, matrix = get_keyword_index()

    query_vector = vectorizer.transform([query])
    scores = cosine_similarity(query_vector, matrix).flatten()

    top_indices = scores.argsort()[::-1][:k]

    results = []
    for idx in top_indices:
        if scores[idx] <= 0:
            continue
        results.append((docs[idx], float(scores[idx])))

    return results

def get_doc_key(doc: Document) -> str:
    """
    dense search 결과와 keyword search 결과의 중복 제거용 key.
    """
    source = doc.metadata.get("source", "")
    clause = doc.metadata.get("Clause", "")
    term = doc.metadata.get("term", "")
    preview = doc.page_content[:120]

    return f"{source}|{clause}|{term}|{preview}"

def reciprocal_rank_fusion(result_lists, top_k: int = 20, rrf_k: int = 60):
    """
    Dense search 결과와 keyword search 결과를 rank 기반으로 합친다.
    점수 스케일이 달라도 합치기 쉬워서 일차 구현에 적합함.
    """
    fused_scores = {}
    doc_map = {}

    for results in result_lists:
        for rank, doc in enumerate(results, start=1):
            key = get_doc_key(doc)

            if key not in doc_map:
                doc_map[key] = doc

            fused_scores[key] = fused_scores.get(key, 0.0) + 1.0 / (rrf_k + rank)

    sorted_keys = sorted(
        fused_scores.keys(),
        key=lambda key: fused_scores[key],
        reverse=True,
    )

    return [doc_map[key] for key in sorted_keys[:top_k]]

def hybrid_search_documents(query: str, translated_query: str, k: int = 20):
    """
    Vector search + keyword search를 합친 hybrid search.
    """
    vector_store = get_vector_store()

    dense_k = getattr(Settings, "HYBRID_DENSE_K", k)
    keyword_k = getattr(Settings, "HYBRID_KEYWORD_K", k)
    rrf_k = getattr(Settings, "HYBRID_RRF_K", 60)

    # 1. Dense vector search
    dense_docs = vector_store.similarity_search(translated_query, k=dense_k)

    # 2. Keyword search
    # 영어 번역 쿼리 + 원래 한국어 질문을 같이 넣음
    keyword_query = f"{translated_query} {query}"
    keyword_results = keyword_search(keyword_query, k=keyword_k)
    keyword_docs = [doc for doc, score in keyword_results]

    # 3. RRF로 합치기
    fused_docs = reciprocal_rank_fusion(
        [dense_docs, keyword_docs],
        top_k=k,
        rrf_k=rrf_k,
    )

    return fused_docs

def get_translator():
    global _translator

    if _translator is None:
        _translator = ChatOpenAI(
            model=Settings.OPENAI_MODEL,
            temperature=0,
        )

    return _translator

def translate_query(query: str) -> str:
    translator = get_translator()

    response = translator.invoke(
        f"""
Translate the following Korean question into English as a natural search query
for FIA Formula 1 regulation documents.

Keep F1 technical terms in English.
Return only the translated search query.

Question:
{query}
"""
    )

    return response.content.strip()

def format_docs(docs) -> str:
    chunks = []

    for i, doc in enumerate(docs, start=1):
        source = doc.metadata.get("source", "")
        doc_type = doc.metadata.get("doc_type", "")
        clause = doc.metadata.get("Clause", "")
        term = doc.metadata.get("term", "")

        chunks.append(
            f"[문서 {i}]\n"
            f"source: {source}\n"
            f"doc_type: {doc_type}\n"
            f"clause: {clause}\n"
            f"term: {term}\n"
            f"content:\n{doc.page_content}"
        )

    return "\n\n".join(chunks)

# 리랭커
def get_reranker():
    global _reranker
    
    if _reranker is None and Settings.USE_RERANKER:
        print(f"[RAG] 리랭커 로딩: {Settings.RERANKER_MODEL}")
        _reranker = CrossEncoder(Settings.RERANKER_MODEL)
    
    return _reranker

def search_regulations_with_debug(query: str, k: int = 10) -> dict:
    vector_store = get_vector_store()
    translated_query = translate_query(query)

    # 리랭커 사용 여부에 따라 후보 문서 수를 넉넉하게 가져옴
    initial_k = k * 3 if Settings.USE_RERANKER else k

    # 하이브리드 검색 적용
    if getattr(Settings, "USE_HYBRID_SEARCH", True):
        docs = hybrid_search_documents(
            query=query,
            translated_query=translated_query,
            k=initial_k,
        )
        retrieval_mode = "hybrid"
    else:
        docs = vector_store.similarity_search(translated_query, k=initial_k)
        retrieval_mode = "dense"

    # 리랭커 적용
    if Settings.USE_RERANKER:
        reranker = get_reranker()
        if reranker:
            pairs = [(translated_query, doc.page_content) for doc in docs]
            scores = reranker.predict(pairs)

            doc_score_pairs = list(zip(docs, scores))
            doc_score_pairs.sort(key=lambda x: x[1], reverse=True)

            docs = [doc for doc, score in doc_score_pairs[:k]]
    else:
        docs = docs[:k]

    context = format_docs(docs)

    debug_docs = []
    for i, doc in enumerate(docs, start=1):
        debug_docs.append(
            {
                "rank": i,
                "source": doc.metadata.get("source", ""),
                "doc_type": doc.metadata.get("doc_type", ""),
                "clause": doc.metadata.get("Clause", ""),
                "term": doc.metadata.get("term", ""),
                "content_preview": doc.page_content[:700],
            }
        )

    return {
        "translated_query": translated_query,
        "retrieval_mode": retrieval_mode,
        "context": context,
        "debug_docs": debug_docs,
    }

def search_regulations(query: str, k: int = 10) -> str:
    result = search_regulations_with_debug(query, k=k)
    return result["context"]
