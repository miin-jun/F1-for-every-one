from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import ChatOpenAI
from config import Settings
from sentence_transformers import CrossEncoder

_embedding_model = None
_vector_store = None
_translator = None
_reranker = None

def get_embedding_model():
    global _embedding_model

    if _embedding_model is None:
        _embedding_model = HuggingFaceEmbeddings(
            model_name="intfloat/multilingual-e5-large",
            model_kwargs={"device": "cpu"},
            encode_kwargs={
                "normalize_embeddings": True,
                "prompt": "passage: ",
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

# 기존 search_regulations_with_debug 함수 수정
def search_regulations_with_debug(query: str, k: int = 10) -> dict:
    vector_store = get_vector_store()
    translated_query = translate_query(query)
    search_query = "query: " + translated_query

    # 리랭커 사용 여부에 따라 k 조정
    initial_k = k * 2 if Settings.USE_RERANKER else k  # 리랭커 쓰면 20개 검색
    docs = vector_store.similarity_search(search_query, k=initial_k)
    
    # 리랭커 적용 🆕
    if Settings.USE_RERANKER:
        reranker = get_reranker()
        if reranker:
            pairs = [(translated_query, doc.page_content) for doc in docs]
            scores = reranker.predict(pairs)
            
            # 점수 높은 순으로 재정렬
            doc_score_pairs = list(zip(docs, scores))
            doc_score_pairs.sort(key=lambda x: x[1], reverse=True)
            
            # Top-k만 선택
            docs = [doc for doc, score in doc_score_pairs[:k]]

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
        "context": context,
        "debug_docs": debug_docs,
    }

def search_regulations(query: str, k: int = 10) -> str:
    result = search_regulations_with_debug(query, k=k)
    return result["context"]
