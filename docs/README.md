# SK네트웍스 Family AI 캠프 24기 4차 프로젝트
## 🏎️ F1을 쉽게！For every1

<p align="center">  
  <img src="https://github.com/user-attachments/assets/ca9539ed-dded-4755-b088-43c4e4bcb944" width="500" height="300" alt="image" />
</p>

## 1. 팀 소개 
  > F1에 익숙한 시선 1개와 낯선 시선 4개가 만나, 어렵고 복잡한 정보를 쉽고 친절하게 🔃새로고침하는 팀 **F5** 입니다❗
  
<table>
  <tr>
    <th width="200">김민준</th>
    <th width="200">김유진</th>
    <th width="200">박영훈</th>
    <th width="200">전윤우</th>
    <th width="200">최현진</th>
  </tr>
  <tr>
    <td align="center" width="200">
      <img src="./assets/images/mj.png" width="180" height="180" alt="mj" />
    </td>
    <td align="center" width="200">
      <img src="./assets/images/yj.png" width="180" height="180" alt="yj" />
    </td>
    <td align="center" width="200">
      <img src="./assets/images/yh.png" width="180" height="180" alt="yh" />
    </td>
    <td align="center" width="200">
      <img src="./assets/images/yw.png" width="180" height="180" alt="yw" />
    </td>
    <td align="center" width="200">
      <img src="./assets/images/hj.png" width="180" height="180" alt="hj" />
    </td>
  </tr>
<tr>
    <td align="center" width="200">
      <a href="https://github.com/miin-jun"><img src="https://img.shields.io/badge/miin--jun-181717?style=for-the-badge&logo=github&logoColor=white"></a>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/shortcut-2"><img src="https://img.shields.io/badge/youjin-181717?style=for-the-badge&logo=github&logoColor=white"></a>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/aprkaos56"><img src="https://img.shields.io/badge/aprkaos56-181717?style=for-the-badge&logo=github&logoColor=white"></a>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/Yunu-Jeon"><img src="https://img.shields.io/badge/Yunu--Jeon-181717?style=for-the-badge&logo=github&logoColor=white"></a>
    </td>
    <td align="center" width="200">
      <a href="https://github.com/lifeisgoodlg"><img src="https://img.shields.io/badge/lifeisgoodlg-181717?style=for-the-badge&logo=github&logoColor=white"></a>
    </td>
  </tr>
</table>

---

# 2. 프로젝트 개요

## 2-1. 프로젝트 명

- Forevery1 (For every One)

## 2-2. 프로젝트 소개

> F1 입문자를 위해 어려운 용어와 복잡한 규정을 쉽게 설명해주는 **한국어 기반 F1 전문 챗봇**입니다. 사용자의 질문 의도에 따라 규정집, 용어집, 과거 기록, 라운드별 경기 정보 등을 바탕으로 적절한 답변을 제공할 수 있도록 LLM 챗봇을 구현했습니다.
> 

## 2-3. 프로젝트 필요성(배경)

> 최근 국내에서 F1 경기에 대한 관심과 팬 유입이 증가하고 있지만, 입문자가 처음 접하기에는 F1의 용어와 규정이 매우 어렵고 복잡합니다.
> 
> 
> 특히, 규정은 매년 개정되기 때문에 단순 검색만으로는 정확한 정보를 이해하기 어렵습니다.
> 
> 쿠팡플레이의 윤재수 F1 해설위원 또한 "국내엔 체계적으로 설명해 주는 자료나 교육 프로그램이 거의 없어 진입장벽이 높다"고 지적한 바 있습니다. ([출처](https://v.daum.net/v/xKESU0PKEy))
> 
> F1에 대한 국내 관심과 시장 성장 가능성 역시 인천시의 F1 그랑프리 유치 추진을 통해 확인할 수 있습니다. 인천시는 대회 개최 시 관광수익 약 5,800억 원과 대규모 국내외 관광객 유입을 예상하고 있으며, 이는 F1이 국내에서도 스포츠를 넘어 관광·도시 브랜딩·엔터테인먼트 콘텐츠로 확장될 가능성이 있음을 보여줍니다. ([출처](https://www.segye.com/newsView/20260416525704?OutUrl=naver))
> 
> 이에 따라, 입문자도 쉽고 빠르게 F1 정보를 이해할 수 있도록 돕는 챗봇의 필요성을 느껴 본 프로젝트를 기획하게 되었습니다.

# 3. 기술 스택

### 🛠️ Backend

| Category | Stack |
| --- | --- |
| Language | Python |
| Framework | Django |
| STT / TTS | OpenAI Whisper, gTTS |
| Deployment | AWS EC2 |
| DataBase | AWS RDS MySQL |
| Version Control | Git, GitHub |

### 🖥️ Frontend

| Category | Stack |
| --- | --- |
| Language | JavaScript |
| Markup / Style | HTML, CSS |
| UI Design | Figma |

### 🧠 AI / Model Server

| Category | Stack |
| --- | --- |
| Server | FastAPI, Runpod |
| LLM API | OpenAI gpt-4.1-nano |
| RAG Framework | LangChain |
| Embedding | intfloat/multilingual-e5-large |
| Vector DB | ChromaDB |
| Advanced RAG | Hybrid Search |
| Library | PyMuPDF, Pydantic |
| F1 Data API | OpenF1 API, Jolpica API |

# 4. 모델 개선

![모델 아키텍처.png](%EB%AA%A8%EB%8D%B8_%EC%95%84%ED%82%A4%ED%85%8D%EC%B2%98.png)

> 
> 
> 
> 기존 플로우차트는 GPT-4o-mini 모델이 에이전트 역할을 하여 규정 문서 기반 RAG와 경기 기록 조회 중 하나를 선택하는 구조였습니다. 문서가 영어로 되어 있어 한국어 번역 후 Reranker Model을 거쳐 sLM으로 답변을 생성하였으나, 이 구조가 비효율적이라고 판단하여 개선하였습니다.
> 

> 기존 플로우 차트 대비 답변 생성 모델은 sLM에서 GPT-4.1-nano로 교체하였으며, 비용에 비해 유사하거나 그보다 더 좋은 품질의 답변을 얻을 수 있었습니다. 또한 벡터 기반 유사도 검색만 사용할 경우 핵심 키워드 검색이 미흡한 문제가 있어, 키워드 검색과 벡터 검색을 결합한 Hybrid Search를 도입하였습니다.
> 

# 5. ERD 및 시스템 구성도

## 5-1. 시스템 구성도

> 모델 서버는 FastAPI를 이용하여 RunPod 추론 서버를 구축하였습니다. 백엔드는 Django Framework를 기반으로 Gunicorn을 앱 서버로 사용하였으며, STT/TTS 연동 과정에서 NGINX를 대신해 Ngrok을 웹 서버로 활용하였습니다. 최종적으로 AWS를 이용하여 배포하였습니다.
> 

![image.png](image.png)

## 5-2. ERD

> 사용자와 채팅목록은 사용자 식별 번호를 PK로 하고, 채팅 식별 번호를 FK로 하는 비식별 관계로 설정하였고, 채팅목록과 상세 채팅은 사용자 식별 번호를 PK로, 메시지 식별 번호와 채팅 식별 번호를 복합키로 적용하는 식별 관계로 설정하였습니다.
> 

![member.png](member.png)

# 6. 요구사항 정의서

> 요구사항 정의서는 크게 사용자 정보와 챗봇으로 나눠서 작성하였습니다. 사용자 정보는 로그인/로그아웃 등록, 조회, 삭제 등이 해당하는 사용자 개인정보 핸들링, 챗봇에서는 채팅과 히스토리로 다시 구분하여 작성하였습니다.
> 
- 요구사항 정의서
    
    ![요구사항명세서_pages-to-jpg-0001.jpg](%EC%9A%94%EA%B5%AC%EC%82%AC%ED%95%AD%EB%AA%85%EC%84%B8%EC%84%9C_pages-to-jpg-0001.jpg)
    
    [요구사항명세서.pdf](%EC%9A%94%EA%B5%AC%EC%82%AC%ED%95%AD%EB%AA%85%EC%84%B8%EC%84%9C.pdf)
    

# 7. 화면설계서

![image.png](image%201.png)

![image.png](image%202.png)

# 8. WBS

![image.png](image%203.png)

# 9. 테스트 계획 및 결과 보고서

> 챗봇의 원활한 서비스 제공을 위해 요구사항 명세서를 기반으로 단위 테스트를 진행하였습니다. 테스트는 총 3인이 참여하였으며, 3인의 결과가 모두 Pass인 경우 테스트를 완료로 처리하였습니다. 한 명이라도 실패할 경우 오류를 수정한 후 테스트를 다시 진행하였으며, 3인 모두에게서 Pass가 나올 때까지 이 과정을 반복하였습니다.
> 
- 테스트 개요 및 계획
    
    ![image.png](image%204.png)
    
- 테스트 수행
    
    ![image.png](image%205.png)
    
- 테스트
    
    ![4차 단위 프로젝트(문서) - Google Sheets_page-0001.jpg](4%EC%B0%A8_%EB%8B%A8%EC%9C%84_%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8(%EB%AC%B8%EC%84%9C)_-_Google_Sheets_page-0001.jpg)
    
- 결과
    
    ![image.png](image%206.png)
    

[테스트 계획 및 결과 보고서.pdf](%ED%85%8C%EC%8A%A4%ED%8A%B8_%EA%B3%84%ED%9A%8D_%EB%B0%8F_%EA%B2%B0%EA%B3%BC_%EB%B3%B4%EA%B3%A0%EC%84%9C.pdf)

# 10. 수행결과(테스트/시연 페이지)

> [https://sniff-tubby-trustful.ngrok-free.dev/](https://sniff-tubby-trustful.ngrok-free.dev/)
> 

# 11. 기대효과 및 개선점

## 11-1. 기대효과

> F1이 초보인 시청자에게는 복잡하고 어려운 규정을 쉽게 설명해주고, 연 단위로 바뀌는 규정에 대해 빠르게 반영해서 설명해주는 역할을 한
> 

## 12-2. 개선점

# 11. 한 줄 회고

시트에 써 놓으면 제가 옮겨두겠습니다~!
