import sys
from pathlib import Path

current_file = Path(__file__).resolve()
model_server_dir = current_file.parent.parent.parent  # rag -> src -> model_server
sys.path.insert(0, str(model_server_dir))

import json
from sentence_transformers import CrossEncoder
import numpy as np
from retriever import search_regulations_with_debug, get_vector_store, translate_query
import pandas as pd
from config import Settings
 
# ============ 설정 ============
RERANKER_MODELS = [
    "cross-encoder/ms-marco-MiniLM-L-12-v2",
    "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1", 
    "BAAI/bge-reranker-v2-m3",
]
 
# 리랭커 캐싱
_reranker_cache = {}
 
def get_reranker(model_name):
    """리랭커 모델 로드 및 캐싱"""
    if model_name not in _reranker_cache:
        print(f"  리랭커 모델 로딩: {model_name}")
        _reranker_cache[model_name] = CrossEncoder(model_name)
    return _reranker_cache[model_name]
 
 
# ============ 검색 함수 ============
def search_baseline(query, k=10):
    """Baseline: 리랭커 없이 Vector Search만"""
    vector_store = get_vector_store()
    translated_query = translate_query(query)
    search_query = "query: " + translated_query
    
    docs = vector_store.similarity_search(search_query, k=k)
    return docs
 
 
def search_with_reranker(query, reranker_model, k=10, top_n=5):
    """리랭커 적용 검색"""
    vector_store = get_vector_store()
    translated_query = translate_query(query)
    search_query = "query: " + translated_query
    
    # 1. Vector Search로 Top-k
    docs = vector_store.similarity_search(search_query, k=k)
    
    # 2. 리랭커로 재정렬
    reranker = get_reranker(reranker_model)
    pairs = [(translated_query, doc.page_content) for doc in docs]
    scores = reranker.predict(pairs)
    
    # 3. 점수 높은 순으로 정렬
    doc_score_pairs = list(zip(docs, scores))
    doc_score_pairs.sort(key=lambda x: x[1], reverse=True)
    
    # 4. Top-n만 반환
    reranked_docs = [doc for doc, score in doc_score_pairs[:top_n]]
    
    return reranked_docs
 
 
# ============ 평가 지표 계산 ============
def compute_metrics(retrieved_docs, answer_docs, k=5):
    """
    P@k, R@k, MRR, AP 계산
    
    Args:
        retrieved_docs: 검색된 Document 객체 리스트
        answer_docs: 정답 문서명 리스트 (예: ["section_b.md"])
        k: 평가할 상위 k개
    
    Returns:
        tuple: (precision, recall, rr, ap)
    """
    # 검색된 문서의 source 추출
    retrieved_sources = [doc.metadata.get("source", "") for doc in retrieved_docs[:k]]
    
    # 정답 체크 (부분 매칭)
    hits = []
    for i, source in enumerate(retrieved_sources):
        is_relevant = any(
            answer_doc.replace(".md", "") in source 
            for answer_doc in answer_docs
        )
        hits.append(is_relevant)
    
    # Precision@k
    precision = sum(hits) / k if k > 0 else 0
    
    # Recall@k (정답 문서를 찾았는지 0 or 1)
    recall = 1.0 if sum(hits) > 0 else 0.0
    
    # MRR (첫 정답 문서의 역순위)
    rr = 0
    for idx, is_hit in enumerate(hits):
        if is_hit:
            rr = 1 / (idx + 1)
            break
    
    # AP (Average Precision)
    num_correct = 0
    precisions = []
    for idx, is_hit in enumerate(hits):
        if is_hit:
            num_correct += 1
            precisions.append(num_correct / (idx + 1))
    ap = np.mean(precisions) if precisions else 0.0
    
    return precision, recall, rr, ap
 
 
# ============ 평가 함수 ============
def evaluate_method(questions, search_func, method_name, k=5):
    """
    특정 검색 방법 평가
    
    Args:
        questions: 평가 질문 리스트
        search_func: 검색 함수 (query를 받아 docs 반환)
        method_name: 방법 이름 (출력용)
        k: 평가할 상위 k개
    
    Returns:
        dict: 평가 지표
    """
    prec_list, rec_list, rr_list, ap_list = [], [], [], []
    
    print(f"\n[{method_name}] 평가 중... (질문 {len(questions)}개)")
    
    for i, q in enumerate(questions, 1):
        if i % 10 == 0:
            print(f"  진행: {i}/{len(questions)}")
        
        # 검색 실행
        retrieved_docs = search_func(q["question"])
        
        # 지표 계산
        p, r, rr, ap = compute_metrics(retrieved_docs, q["answer_docs"], k=k)
        
        prec_list.append(p)
        rec_list.append(r)
        rr_list.append(rr)
        ap_list.append(ap)
    
    return {
        'P@5': np.mean(prec_list),
        'R@5': np.mean(rec_list),
        'MRR': np.mean(rr_list),
        'MAP': np.mean(ap_list),
    }
 
 
# ============ 메인 실행 ============
def main():
    print("="*60)
    print("RAG 리랭커 비교 평가")
    print("="*60)
    
    # 1. 평가 질문 로드 (경로 수정!)
    current_dir = Path(__file__).resolve().parent  # src/rag
    json_path = current_dir.parent.parent / "data" / "evaluation_questions.json"
    
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    questions = data["questions"]
    print(f"\n평가 질문 수: {len(questions)}개")
    print(f"평가 지표: P@5, R@5, MRR, MAP\n")
    
    results = {}
    
    # 2. Baseline 평가
    print("\n" + "="*60)
    print("[1/4] Baseline (리랭커 없음)")
    print("="*60)
    
    baseline_func = lambda q: search_baseline(q, k=5)
    results["Baseline"] = evaluate_method(questions, baseline_func, "Baseline", k=5)
    
    print(f"\n결과:")
    print(f"  P@5: {results['Baseline']['P@5']:.3f}")
    print(f"  R@5: {results['Baseline']['R@5']:.3f}")
    print(f"  MRR: {results['Baseline']['MRR']:.3f}")
    print(f"  MAP: {results['Baseline']['MAP']:.3f}")
    
    # 3. 리랭커 평가
    for i, model in enumerate(RERANKER_MODELS, start=2):
        model_short = model.split("/")[-1]
        
        print("\n" + "="*60)
        print(f"[{i}/4] {model_short}")
        print("="*60)
        
        reranker_func = lambda q, m=model: search_with_reranker(q, m, k=10, top_n=5)
        results[model_short] = evaluate_method(questions, reranker_func, model_short, k=5)
        
        print(f"\n결과:")
        print(f"  P@5: {results[model_short]['P@5']:.3f}")
        print(f"  R@5: {results[model_short]['R@5']:.3f}")
        print(f"  MRR: {results[model_short]['MRR']:.3f}")
        print(f"  MAP: {results[model_short]['MAP']:.3f}")
    
    # 4. 최종 결과 출력
    print("\n" + "="*60)
    print("최종 비교 결과")
    print("="*60)
    print(f"{'방법':<35} {'P@5':<8} {'R@5':<8} {'MRR':<8} {'MAP':<8}")
    print("-"*60)
    
    for method, metrics in results.items():
        print(f"{method:<35} {metrics['P@5']:<8.3f} {metrics['R@5']:<8.3f} {metrics['MRR']:<8.3f} {metrics['MAP']:<8.3f}")
    
    # 4. 최종 결과 출력
    print("\n" + "="*60)
    print("최종 비교 결과")
    print("="*60)
    
    # DataFrame으로 변환
    import pandas as pd
    
    df = pd.DataFrame(results).T  # Transpose
    df = df.round(3)  # 소수점 3자리
    
    print(df)
    print("\n")

if __name__ == "__main__":
    main()