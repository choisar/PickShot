# [프로젝트 개요 및 AI/개발 요구사항 명세서 v2.0]

## 1. 프로젝트 개요 (Overview)

- **프로젝트명:** 동일 구도 연사 베스트 샷 자동 선별 및 데이터셋 수집 플랫폼 (가칭: PickShot)
    
      
    
- **목적:**
    
      
    - 사용자가 대량(수백~수천 장)으로 업로드한 연속 촬영/동일 구도 사진 중 최적의 1장(베스트 컷)을 추천·추려주는 웹 유틸리티 제공.
        
          
        
    - 사용자 인터랙션(최종 선택 결과 및 **줌인/포커스 영역**)을 Pairwise 랭킹 데이터로 자동 변환·적재하여 지속 학습(Continuous Learning) 가능한 데이터 플라이휠 구축.
        
          
        
- **핵심 전략 (Updated):**
    
      
    - **Edge-Cloud 하이브리드 & Zero-Egress:** 원본 파일의 서버 전송을 배제하고, 브라우저 File System API를 활용하여 인프라 비용 최소화.
        
          
        
    - **OOM 방어 및 스트리밍 처리:** 청크 단위 병렬 처리와 SSE(Server-Sent Events)를 통해 대량 이미지 처리 시 브라우저 크래시 및 네트워크 차단 원천 봉쇄.
        
          
        
    - **Stateful 복원력:** IndexedDB를 통한 상태 캐싱으로 새로고침 시에도 작업 내역 유지.
        
          
        

## 2. 시스템 아키텍처 및 데이터 흐름

**[사용자 브라우저 (React/Client)]**

  

1. **대량 파일 로딩:** 이미지 드래그 & 드롭 -> 메모리 폭발 방지를 위해 청크 단위(예: 50장) 슬라이딩 윈도우 방식으로 읽기.
    
      
    
2. **안전장치:** `beforeunload` 이벤트 등록 및 진행 상태 IndexedDB 실시간 체크포인트 저장.
    
      
    
3. **클러스터링 & 썸네일:**
    
      
    - EXIF 타임스탬프 기준 그룹화. (누락 시 WebAssembly 기반 pHash 또는 컬러 히스토그램 보조 클러스터링)
        
          
        
    - Web Worker + OffscreenCanvas를 통해 썸네일(1080px WebP) 추출 후 원본 참조 즉시 해제(`URL.revokeObjectURL`).
        
          
        
4. **청크 전송:** 썸네일을 그룹 단위(예: 최대 10MB 이하)로 잘라 서버로 비동기 POST 전송.
    
    │
    
    ▼
    
    **[AI 백엔드 서버 (FastAPI)]**
    
      
    
5. **스트리밍 수신 및 분석 (SSE):** 요청받은 그룹부터 즉시 1/2차 평가 파이프라인(Hard Filter -> Preference Ranker) 실행.
    
      
    
6. **다인원 가중치 적용:** 단체 사진의 경우 Bounding Box 면적이 가장 큰 1~2인(주요 피사체)을 기준으로 표정/눈 감음 감점 룰셋 적용.
    
      
    
7. **실시간 응답:** 분석이 완료된 그룹의 베스트 컷 인덱스를 SSE를 통해 클라이언트로 실시간 스트리밍(Push).
    
    │
    
    ▼
    
    **[사용자 브라우저 (UI/UX)]**
    
      
    
8. **점진적 렌더링:** SSE 응답이 오는 대로 화면에 그룹별 추천 컷 순차 표시. 사용자가 확인 및 최종 컷 확정.
    
      
    
9. **Zero-Egress 저장:** **File System Access API**를 사용해 사용자가 지정한 로컬 디렉토리에 선택된 '고화질 원본'만 즉시 직접 저장 (JSZip 압축으로 인한 OOM 방지).
    
      
    
10. **풍부한 피드백 전송:** 확정 데이터(Winner vs Losers) 및 비교 시 확대한 영역(Zoom 좌표)을 백엔드로 비동기 전송 -> DB 적재.
    
      
    

## 3. 세부 기능 요구사항 (Functional Requirements)

### 3.1. 프론트엔드 (Client-side)

- **대량 파일 로더 및 OOM 방어:**
    
      
    - 1,000장 이상의 이미지 업로드 시 UI 프리징 및 탭 크래시 방지를 위한 Web Worker 슬라이딩 윈도우(청크) 파이프라인.
        
          
        
- **상태 휘발성 통제 (복원력):**
    
      
    - 업로드 시작 시나리오부터 IndexedDB에 파일 메타데이터와 진행 상태(체크포인트) 기록.
        
          
        
    - 실수로 새로고침/뒤로 가기 발생 시, 다시 접근했을 때 로컬 경로 재연결을 통해 이전 작업 상태 100% 복구 지원.
        
          
        
- **클라이언트 단 고속 클러스터링:**
    
      
    - EXIF `DateTimeOriginal` 파싱 1차 클러스터링.
        
          
        
    - WASM(WebAssembly) 기반의 경량 pHash 연산 또는 컬러 히스토그램 비교를 통한 속도 저하 없는 2차 클러스터링.
        
          
        
- **뷰어 인터페이스 및 Attention 트래킹:**
    
      
    - 그룹별 썸네일 그리드 뷰 및 동일 피사체 동시 줌인 비교 모달 지원.
        
          
        
    - **[New]** 줌인 모달 사용 시 확대된 중심 좌표(x, y)와 배율을 로깅하여 향후 AI 학습 힌트로 활용.
        
          
        
- **Zero-Egress 파일 처리:**
    
      
    - `showDirectoryPicker()` 등 File System Access API를 활용해 선택된 베스트 원본 파일만 유저 로컬 스토리지에 직접 Write.
        
          
        

### 3.2. 백엔드 & AI 파이프라인 (Server-side)

- **API 인터페이스:**
    
      
    - `POST /api/v1/curate`: 페이로드 한계(413 Error)를 피하기 위해 그룹 단위 청크 수신.
        
          
        
    - `GET /api/v1/stream`: SSE(Server-Sent Events)를 통해 분석이 끝난 그룹의 결과를 클라이언트에 실시간 푸시.
        
          
        
    - `POST /api/v1/feedback`: 최종 선택 결과, 썸네일 및 **사용자 줌인 좌표(Attention Hint)** 영구 적재.
        
          
        
- **AI 평가 엔진 (2-Track):**
    
      
    - **Hard Filter:** MediaPipe Face Mesh 및 OpenCV Laplacian Variance. (다인원 탐지 시 Bounding Box 기반 상위 2명에게만 가중치 적용)
        
          
        
    - **Preference Ranker:** CLIP/DINO 기반 특징 추출 및 Pairwise Ranking Head를 통한 미세 감성 점수 도출.
        
          
        

## 4. 데이터셋 구축 및 스토리지 규격

- **저장 데이터 대상:** 원본 배제, 1080px WebP 썸네일 + Pairwise 메타데이터만 저장 (용량 최적화).
    
      
    
- **DB 스키마 구조 (Supabase/PostgreSQL 기반 예시):**
    
      
    

| **Table**       | **Columns**                                                                                                                | **설명**                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Groups**      | `id`, `user_id`, `created_at`                                                                                              | 클러스터링된 연사 그룹 메타데이터                                             |
| **Images**      | `id`, `group_id`, `storage_path`, `face_score`                                                                             | 썸네일 경로 및 1차 필터 스코어                                             |
| **Preferences** | `id`, `group_id`, `winner_image_id`, `loser_image_ids`, `is_user_modified`, **`zoom_attention_x`**, **`zoom_attention_y`** | 승패 데이터 및 하드 네거티브 판별 플래그. 유저가 줌인한 좌표를 함께 저장하여 Attention 데이터 확보. |

## 5. 비기능 및 보안 요구사항 (Non-Functional Requirements)

- **성능 및 안정성:**
    
      
    - 단일 HTTP 요청 페이로드는 10MB를 초과하지 않도록 프론트엔드에서 강제 제어.
        
          
        
    - JSZip 등 메모리를 점유하는 라이브러리 사용 금지 (스트리밍 또는 직접 쓰기 원칙).
        
          
        
- **개인정보 및 약관:**
    
      
    - 업로드 전 *"서비스 품질 개선 및 AI 연구 목적의 비식별화된 데이터셋 활용"*에 대한 명시적 동의 UI 필수 배치 (수집되는 데이터는 1080px 리사이즈 썸네일임과 원본은 서버로 전송되지 않음을 강조).