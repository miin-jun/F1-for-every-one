import sys
import pandas as pd
from pathlib import Path
import json
import numpy as np
from sklearn.metrics import ndcg_score
from langchain_core.documents import Document

current_file = Path(__file__).resolve()
model_server_dir = current_file.parent.parent.parent
sys.path.insert(0, str(model_server_dir))

from retriever import search_regulations_with_debug
from config import Settings

# ============ 설정 ============
RERANKER_MODELS = [
    "cross-encoder/ms-marco-MiniLM-L-12-v2",
    "cross-encoder/mmarco-mMiniLMv2-L12-H384-v1", 
    "BAAI/bge-reranker-v2-m3",
]

# ============ 헬퍼 함수 ============
def convert_debug_to_docs(debug_docs):
    """debug_docs를 Document 객체로 변환 (기존 평가 코드와 호환)"""
    documents = []
    for doc_info in debug_docs:
        doc = Document(
            page_content=doc_info["content_preview"],
            metadata={
                "source": doc_info["source"],
                "doc_type": doc_info["doc_type"],
                "Clause": doc_info["clause"],
                "term": doc_info["term"]
            }
        )
        documents.append(doc)
    return documents


# ============ 검색 함수 (실제 프로덕션 코드 사용) ============
def search_baseline(query, k=10):
    """Baseline: 실제 retriever.py 사용 (리랭커 OFF)"""
    # 설정 백업
    original_use_reranker = Settings.USE_RERANKER
    
    # 리랭커 비활성화
    Settings.USE_RERANKER = False
    
    try:
        result = search_regulations_with_debug(query, k=k)
        return convert_debug_to_docs(result["debug_docs"])
    finally:
        # 설정 복원
        Settings.USE_RERANKER = original_use_reranker


def search_with_reranker(query, reranker_model, k=10, top_n=5):
    """리랭커 적용: 실제 retriever.py 사용"""
    # 설정 백업
    original_use_reranker = Settings.USE_RERANKER
    original_reranker_model = Settings.RERANKER_MODEL
    
    # 리랭커 활성화 및 모델 변경
    Settings.USE_RERANKER = True
    Settings.RERANKER_MODEL = reranker_model
    
    # retriever.py의 캐시된 리랭커를 초기화 (모델 변경시 필요)
    from retriever import _reranker
    import retriever as retriever_module
    retriever_module._reranker = None
    
    try:
        result = search_regulations_with_debug(query, k=top_n)
        return convert_debug_to_docs(result["debug_docs"])
    finally:
        # 설정 복원
        Settings.USE_RERANKER = original_use_reranker
        Settings.RERANKER_MODEL = original_reranker_model
        # 리랭커 캐시 초기화 (원래 모델로 돌아갈 수 있도록)
        retriever_module._reranker = None


# ============ 평가 지표 계산 ============
def compute_metrics(retrieved_docs, answer_docs, k=5):
    """NDCG@k, MRR, MAP 계산"""
    retrieved_sources = [doc.metadata.get("source", "") for doc in retrieved_docs[:k]]
    
    hits = []
    relevance_scores = []
    
    for source in retrieved_sources:
        is_relevant = any(
            answer_doc.replace(".md", "") in source 
            for answer_doc in answer_docs
        )
        hits.append(is_relevant)
        relevance_scores.append(1 if is_relevant else 0)
    
    # 1. MRR
    mrr = 0
    for idx, is_hit in enumerate(hits):
        if is_hit:
            mrr = 1 / (idx + 1)
            break
    
    # 2. MAP
    num_correct = 0
    precisions = []
    for idx, is_hit in enumerate(hits):
        if is_hit:
            num_correct += 1
            precisions.append(num_correct / (idx + 1))
    map_score = np.mean(precisions) if precisions else 0.0
    
    # 3. NDCG@k
    if sum(relevance_scores) == 0:
        ndcg = 0.0
    else:
        true_relevance = np.array([relevance_scores])
        predicted_scores = np.array([list(range(k, 0, -1))])
        ndcg = ndcg_score(true_relevance, predicted_scores)
    
    return {
        'ndcg': ndcg,
        'mrr': mrr,
        'map': map_score
    }


def evaluate_method(questions, search_func, method_name, k=5):
    """특정 검색 방법 평가"""
    ndcg_list, mrr_list, map_list = [], [], []
    
    print(f"\n[{method_name}] 평가 중... (질문 {len(questions)}개)")
    
    for i, q in enumerate(questions, 1):
        if i % 10 == 0:
            print(f"  진행: {i}/{len(questions)}")
        
        retrieved_docs = search_func(q["question"])
        metrics = compute_metrics(retrieved_docs, q["answer_docs"], k=k)
        
        ndcg_list.append(metrics['ndcg'])
        mrr_list.append(metrics['mrr'])
        map_list.append(metrics['map'])
    
    return {
        'NDCG@5': np.mean(ndcg_list),
        'MRR': np.mean(mrr_list),
        'MAP': np.mean(map_list),
    }


# ============ 메인 실행 ============
def main():
    print("="*60)
    print("RAG 리랭커 비교 평가 (실제 프로덕션 코드 사용)")
    print("="*60)
    
    # 현재 설정 출력
    print(f"\n현재 설정:")
    print(f"  USE_RERANKER: {Settings.USE_RERANKER}")
    print(f"  RERANKER_MODEL: {Settings.RERANKER_MODEL}")
    
    # 평가 질문 로드
    current_dir = Path(__file__).resolve().parent
    json_path = current_dir.parent.parent / "data" / "evaluation_questions.json"
    
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    questions = data["questions"]
    print(f"\n평가 질문 수: {len(questions)}개")
    print(f"평가 지표: NDCG@5, MRR, MAP\n")
    
    results = {}
    
    # Baseline 평가
    print("\n" + "="*60)
    print("[1/4] Baseline (리랭커 없음)")
    print("="*60)
    
    baseline_func = lambda q: search_baseline(q, k=5)
    results["Baseline"] = evaluate_method(questions, baseline_func, "Baseline", k=5)
    
    print(f"\n결과:")
    print(f"  NDCG@5: {results['Baseline']['NDCG@5']:.3f}")
    print(f"  MRR:    {results['Baseline']['MRR']:.3f}")
    print(f"  MAP:    {results['Baseline']['MAP']:.3f}")
    
    # 리랭커 평가
    for i, model in enumerate(RERANKER_MODELS, start=2):
        model_short = model.split("/")[-1]
        
        print("\n" + "="*60)
        print(f"[{i}/4] {model_short}")
        print("="*60)
        
        reranker_func = lambda q, m=model: search_with_reranker(q, m, k=10, top_n=5)
        results[model_short] = evaluate_method(questions, reranker_func, model_short, k=5)
        
        print(f"\n결과:")
        print(f"  NDCG@5: {results[model_short]['NDCG@5']:.3f}")
        print(f"  MRR:    {results[model_short]['MRR']:.3f}")
        print(f"  MAP:    {results[model_short]['MAP']:.3f}")
    
    # 최종 결과 출력
    print("\n" + "="*60)
    print("최종 비교 결과")
    print("="*60)
    
    df = pd.DataFrame(results).T
    df = df.round(3)
    df = df[['NDCG@5', 'MRR', 'MAP']]
    df = df.sort_values('NDCG@5', ascending=False)
    
    print(df)
    print("\n")
    
    best_model = df.index[0]
    best_ndcg = df.iloc[0]['NDCG@5']
    print(f"🏆 최고 성능: {best_model} (NDCG@5: {best_ndcg:.3f})")
    
    print(f"\n📊 지표별 최고 성능:")
    print(f"  NDCG@5: {df['NDCG@5'].idxmax()} ({df['NDCG@5'].max():.3f})")
    print(f"  MRR:    {df['MRR'].idxmax()} ({df['MRR'].max():.3f})")
    print(f"  MAP:    {df['MAP'].idxmax()} ({df['MAP'].max():.3f})")
    print()


if __name__ == "__main__":
    main()