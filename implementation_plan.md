# PickShot 프로젝트 구조 생성

프로젝트 명세서(project.md)를 기반으로 프론트엔드(React/Vite) + 백엔드(FastAPI) 프로젝트의 초기 구조를 생성합니다.

## Proposed Changes

### 전체 디렉토리 구조

```
c:\d\PickShot\
├── project.md                    # (기존) 프로젝트 명세서
├── README.md                     # 프로젝트 소개 및 실행 가이드
│
├── frontend/                     # React + Vite (TypeScript)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── index.html
│   ├── public/
│   │   └── favicon.svg
│   └── src/
│       ├── main.tsx              # React 엔트리포인트
│       ├── App.tsx               # 루트 컴포넌트 + 라우팅
│       ├── index.css             # 글로벌 스타일 (디자인 시스템)
│       ├── vite-env.d.ts
│       │
│       ├── components/           # UI 컴포넌트
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   └── Layout.tsx
│       │   ├── upload/
│       │   │   ├── DropZone.tsx          # 드래그앤드롭 업로드 영역
│       │   │   └── UploadProgress.tsx    # 업로드/처리 진행률
│       │   ├── viewer/
│       │   │   ├── GroupGrid.tsx         # 그룹별 썸네일 그리드
│       │   │   ├── ImageCard.tsx         # 개별 이미지 카드
│       │   │   ├── CompareModal.tsx      # 줌인 비교 모달
│       │   │   └── BestPickBadge.tsx     # 베스트 컷 배지
│       │   └── common/
│       │       ├── Button.tsx
│       │       ├── ProgressBar.tsx
│       │       └── ConsentDialog.tsx     # 데이터 수집 동의 모달
│       │
│       ├── pages/
│       │   ├── HomePage.tsx              # 랜딩 + 업로드
│       │   ├── CurationPage.tsx          # 분석 결과 & 큐레이션
│       │   └── ResultPage.tsx            # 최종 결과 & 다운로드
│       │
│       ├── hooks/
│       │   ├── useFileLoader.ts          # 청크 단위 파일 로딩
│       │   ├── useClustering.ts          # EXIF/pHash 클러스터링
│       │   ├── useSSE.ts                 # SSE 스트리밍 수신
│       │   ├── useIndexedDB.ts           # 상태 영속화/복구
│       │   └── useZoomTracker.ts         # 줌인 좌표 트래킹
│       │
│       ├── workers/
│       │   ├── thumbnail.worker.ts       # 썸네일 생성 Web Worker
│       │   └── clustering.worker.ts      # 클러스터링 Web Worker
│       │
│       ├── services/
│       │   ├── api.ts                    # API 클라이언트 (fetch wrapper)
│       │   ├── fileSystem.ts             # File System Access API 래퍼
│       │   └── imageProcessor.ts         # 이미지 처리 유틸리티
│       │
│       ├── stores/
│       │   └── curationStore.ts          # 전역 상태 관리 (Zustand)
│       │
│       ├── types/
│       │   ├── image.ts                  # 이미지/그룹 관련 타입
│       │   ├── api.ts                    # API 요청/응답 타입
│       │   └── curation.ts              # 큐레이션 관련 타입
│       │
│       └── utils/
│           ├── exif.ts                   # EXIF 파싱 유틸리티
│           ├── chunk.ts                  # 청크 분할 유틸리티
│           └── constants.ts              # 상수 정의
│
└── backend/                      # FastAPI (Python)
    ├── requirements.txt
    ├── pyproject.toml
    ├── .env.example
    │
    ├── app/
    │   ├── __init__.py
    │   ├── main.py               # FastAPI 앱 엔트리포인트
    │   ├── config.py             # 환경 설정
    │   │
    │   ├── api/
    │   │   ├── __init__.py
    │   │   └── v1/
    │   │       ├── __init__.py
    │   │       ├── router.py             # v1 라우터 통합
    │   │       ├── curate.py             # POST /api/v1/curate
    │   │       ├── stream.py             # GET  /api/v1/stream (SSE)
    │   │       └── feedback.py           # POST /api/v1/feedback
    │   │
    │   ├── services/
    │   │   ├── __init__.py
    │   │   ├── hard_filter.py            # MediaPipe + OpenCV 필터
    │   │   ├── preference_ranker.py      # CLIP/DINO 랭커
    │   │   └── evaluation_pipeline.py    # 2-Track 파이프라인 오케스트레이션
    │   │
    │   ├── models/
    │   │   ├── __init__.py
    │   │   ├── schemas.py                # Pydantic 스키마
    │   │   └── database.py               # DB 모델 (SQLAlchemy)
    │   │
    │   └── utils/
    │       ├── __init__.py
    │       └── image_utils.py            # 서버사이드 이미지 유틸리티
    │
    └── tests/
        ├── __init__.py
        └── test_curate.py
```

---

### 프론트엔드 (React + Vite + TypeScript)

`npx create-vite`로 프로젝트를 생성한 뒤, 프로젝트 구조에 맞게 디렉토리와 스켈레톤 파일들을 배치합니다.

주요 의존성:
- **React 19** + **React Router** — SPA 라우팅
- **Zustand** — 경량 전역 상태 관리
- **exifreader** — EXIF 데이터 파싱

---

### 백엔드 (FastAPI + Python)

수동으로 디렉토리를 생성하고, 스켈레톤 코드를 배치합니다.

주요 의존성:
- **FastAPI** + **Uvicorn** — ASGI 서버
- **sse-starlette** — SSE 스트리밍
- **mediapipe** — Face Mesh (Hard Filter)
- **opencv-python-headless** — Laplacian Variance 등
- **transformers / torch** — CLIP/DINO (Preference Ranker)
- **SQLAlchemy** + **asyncpg** — PostgreSQL ORM
- **python-dotenv** — 환경변수

---

## User Review Required

> [!IMPORTANT]
> **프론트엔드 프레임워크**: React + Vite + TypeScript 조합으로 진행합니다. 다른 프레임워크(Next.js 등)를 원하시면 알려주세요.

> [!IMPORTANT]
> **상태 관리**: Zustand를 사용합니다. Redux, Jotai 등 다른 라이브러리를 선호하시면 알려주세요.

> [!IMPORTANT]  
> **이 단계에서는 프로젝트 초기화 + 스켈레톤 코드(빈 컴포넌트/API 엔드포인트) 배치까지만 수행합니다.** 각 기능의 상세 구현은 이후 단계에서 진행합니다.

## Verification Plan

### Automated Tests
- `cd frontend && npm run dev` — Vite 개발 서버 정상 기동 확인
- `cd backend && uvicorn app.main:app --reload` — FastAPI 서버 정상 기동 확인

### Manual Verification
- 브라우저에서 프론트엔드 접속 시 기본 레이아웃 렌더링 확인
- `/docs` 엔드포인트에서 Swagger UI 로드 확인
