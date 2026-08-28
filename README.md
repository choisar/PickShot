# PickShot (동일 구도 연사 베스트 샷 자동 선별 & 데이터셋 수집 플랫폼)

대량의 연속 촬영/동일 구도 사진 중 AI 기반으로 최적의 1장(베스트 컷)을 추천하고, 사용자의 선택 및 줌인 Attention 데이터를 Pairwise 랭킹 데이터셋으로 수집하는 웹 플랫폼입니다.

## 🚀 주요 특징 (Key Features)

1. **Edge-Cloud 하이브리드 & Zero-Egress**
   - 원본 사진은 브라우저에서 로컬 File System Access API를 통해 직접 관리
   - 서버로는 분석용 1080px WebP 썸네일만 전송하여 네트워크 대역폭 및 개인정보 보호 극대화
2. **대용량 OOM 방어 및 슬라이딩 윈도우**
   - Web Worker + OffscreenCanvas 기반 청크 단위 비동기 썸네일 생성 및 EXIF/pHash 클러스터링
   - `URL.revokeObjectURL`을 통한 즉각적인 메모리 해제
3. **실시간 AI 스트리밍 평가 (SSE)**
   - **Hard Filter**: MediaPipe Face Mesh & OpenCV Laplacian Variance (다인원 주요 피사체 가중치)
   - **Preference Ranker**: CLIP / DINO 기반 Pairwise 랭킹
   - SSE(Server-Sent Events)를 통해 처리된 그룹 순차 렌더링
4. **Stateful 복원력**
   - IndexedDB 기반 체크포인트 캐싱으로 새로고침 시 작업 상태 100% 복구 지원
5. **Attention 트래킹 데이터 플라이휠**
   - 뷰어 내 줌인 비교 시 확대 좌표(x, y) 및 배율을 로깅하여 향후 AI 학습 데이터 확보

---

## 📁 프로젝트 구조 (Project Structure)

```
PickShot/
├── frontend/             # React 19 + TypeScript + Vite 클라이언트
│   ├── src/
│   │   ├── components/   # UI 컴포넌트 (layout, upload, viewer, common)
│   │   ├── pages/        # 페이지 (HomePage, CurationPage, ResultPage)
│   │   ├── hooks/        # 커스텀 훅 (FileLoader, Clustering, SSE, IndexedDB, ZoomTracker)
│   │   ├── workers/      # Web Workers (Thumbnail, Clustering)
│   │   ├── services/     # API, FileSystem, ImageProcessor
│   │   ├── stores/       # Zustand 상태 관리
│   │   ├── types/        # TypeScript 타입 정의
│   │   └── utils/        # 유틸리티 함수
├── backend/              # FastAPI 백엔드 (Python)
│   ├── app/
│   │   ├── api/v1/       # REST API & SSE 엔드포인트
│   │   ├── models/       # Pydantic Schemas & DB Models
│   │   ├── services/     # Hard Filter, Preference Ranker, Evaluation Pipeline
│   │   └── utils/        # 이미지 분석 유틸리티
│   └── tests/            # 백엔드 테스트 코드
└── project.md            # 세부 요구사항 명세서
```

---

## 🛠️ 시작하기 (Getting Started)

### 프론트엔드 (Frontend)
```bash
cd frontend
npm install
npm run dev
```

### 백엔드 (Backend)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Docker 실행 (Docker Compose)
전체 스택(Frontend + Backend + PostgreSQL)을 한 번에 실행:
```bash
docker compose up --build
```
- 프론트엔드: `http://localhost:3000`
- 백엔드 API & Docs: `http://localhost:8000/docs`

