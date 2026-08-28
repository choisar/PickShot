# PickShot 프로젝트 초기 구조 생성 완료 (TypeScript)

[project.md](file:///c:/d/PickShot/project.md) 명세서의 요구사항(Edge-Cloud Hybrid, Zero-Egress, OOM 방어, Stateful 복원력, Attention 트래킹)을 충족하는 **TypeScript 기반 프론트엔드 + FastAPI 백엔드** 전체 프로젝트 구조가 성공적으로 구성되었습니다.

---

## 📁 생성된 구조 요약

### 1. 프론트엔드 (`frontend/` - React 19 + TypeScript + Vite)
- **설정 파일**: [package.json](file:///c:/d/PickShot/frontend/package.json), [tsconfig.json](file:///c:/d/PickShot/frontend/tsconfig.json), [tsconfig.app.json](file:///c:/d/PickShot/frontend/tsconfig.app.json), [tsconfig.node.json](file:///c:/d/PickShot/frontend/tsconfig.node.json), [vite.config.ts](file:///c:/d/PickShot/frontend/vite.config.ts), [index.html](file:///c:/d/PickShot/frontend/index.html)
- **디자인 시스템**: [index.css](file:///c:/d/PickShot/frontend/src/index.css) (다크 모드, 글래스모피즘, 그라디언트, 디자인 토큰)
- **도메인 & API 타입**: [image.ts](file:///c:/d/PickShot/frontend/src/types/image.ts), [api.ts](file:///c:/d/PickShot/frontend/src/types/api.ts), [curation.ts](file:///c:/d/PickShot/frontend/src/types/curation.ts)
- **상태 관리 (Zustand)**: [curationStore.ts](file:///c:/d/PickShot/frontend/src/stores/curationStore.ts)
- **커스텀 훅 (TS)**:
  - [useFileLoader.ts](file:///c:/d/PickShot/frontend/src/hooks/useFileLoader.ts) — 슬라이딩 윈도우 파일 로딩
  - [useClustering.ts](file:///c:/d/PickShot/frontend/src/hooks/useClustering.ts) — EXIF 타임스탬프 기반 연사 그룹화
  - [useSSE.ts](file:///c:/d/PickShot/frontend/src/hooks/useSSE.ts) — AI 분석 스트리밍 실시간 수신
  - [useIndexedDB.ts](file:///c:/d/PickShot/frontend/src/hooks/useIndexedDB.ts) — 새로고침 복원용 체크포인트 캐싱
  - [useZoomTracker.ts](file:///c:/d/PickShot/frontend/src/hooks/useZoomTracker.ts) — 줌인 비교 좌표 Attention 트래킹
- **Web Workers**:
  - [thumbnail.worker.ts](file:///c:/d/PickShot/frontend/src/workers/thumbnail.worker.ts) — OffscreenCanvas 기반 WebP 리사이징
  - [clustering.worker.ts](file:///c:/d/PickShot/frontend/src/workers/clustering.worker.ts) — 시각적 해시 및 클러스터링
- **서비스 계층**:
  - [fileSystem.ts](file:///c:/d/PickShot/frontend/src/services/fileSystem.ts) — Zero-Egress `showDirectoryPicker` 로컬 직접 저장
  - [api.ts](file:///c:/d/PickShot/frontend/src/services/api.ts) — API 통신 및 SSE 연결
  - [imageProcessor.ts](file:///c:/d/PickShot/frontend/src/services/imageProcessor.ts) — 클라이언트 사이드 이미지 처리
- **UI 컴포넌트 & 페이지**:
  - [DropZone.tsx](file:///c:/d/PickShot/frontend/src/components/upload/DropZone.tsx), [UploadProgress.tsx](file:///c:/d/PickShot/frontend/src/components/upload/UploadProgress.tsx)
  - [GroupGrid.tsx](file:///c:/d/PickShot/frontend/src/components/viewer/GroupGrid.tsx), [ImageCard.tsx](file:///c:/d/PickShot/frontend/src/components/viewer/ImageCard.tsx), [CompareModal.tsx](file:///c:/d/PickShot/frontend/src/components/viewer/CompareModal.tsx), [BestPickBadge.tsx](file:///c:/d/PickShot/frontend/src/components/viewer/BestPickBadge.tsx)
  - [ConsentDialog.tsx](file:///c:/d/PickShot/frontend/src/components/common/ConsentDialog.tsx), [Button.tsx](file:///c:/d/PickShot/frontend/src/components/common/Button.tsx), [ProgressBar.tsx](file:///c:/d/PickShot/frontend/src/components/common/ProgressBar.tsx)
  - [HomePage.tsx](file:///c:/d/PickShot/frontend/src/pages/HomePage.tsx), [CurationPage.tsx](file:///c:/d/PickShot/frontend/src/pages/CurationPage.tsx), [ResultPage.tsx](file:///c:/d/PickShot/frontend/src/pages/ResultPage.tsx)

---

### 2. 백엔드 (`backend/` - FastAPI + Python)
- **설정 및 명세**: [requirements.txt](file:///c:/d/PickShot/backend/requirements.txt), [pyproject.toml](file:///c:/d/PickShot/backend/pyproject.toml), [.env.example](file:///c:/d/PickShot/backend/.env.example)
- **앱 엔트리 & 설정**: [main.py](file:///c:/d/PickShot/backend/app/main.py), [config.py](file:///c:/d/PickShot/backend/app/config.py)
- **API v1 엔드포인트**:
  - `POST /api/v1/curate` ([curate.py](file:///c:/d/PickShot/backend/app/api/v1/curate.py)) — 청크 단위 썸네일 수신
  - `GET /api/v1/stream` ([stream.py](file:///c:/d/PickShot/backend/app/api/v1/stream.py)) — SSE 스트리밍 푸시
  - `POST /api/v1/feedback` ([feedback.py](file:///c:/d/PickShot/backend/app/api/v1/feedback.py)) — Pairwise 피드백 및 Attention 좌표 적재
- **2-Track 평가 엔진**:
  - [hard_filter.py](file:///c:/d/PickShot/backend/app/services/hard_filter.py) — Laplacian Variance 및 Face Mesh 필터
  - [preference_ranker.py](file:///c:/d/PickShot/backend/app/services/preference_ranker.py) — CLIP/DINO 기반 랭킹
  - [evaluation_pipeline.py](file:///c:/d/PickShot/backend/app/services/evaluation_pipeline.py) — 2-Track 통합 파이프라인
- **데이터 모델**: [schemas.py](file:///c:/d/PickShot/backend/app/models/schemas.py), [database.py](file:///c:/d/PickShot/backend/app/models/database.py) (SQLAlchemy Groups, Images, Preferences)
- **테스트**: [test_curate.py](file:///c:/d/PickShot/backend/tests/test_curate.py)
