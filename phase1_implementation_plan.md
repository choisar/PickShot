# Phase 1 구현 계획: AI Hard Filter 고도화, pHash 2차 클러스터링 및 SSE E2E 연동

Phase 1 로드맵에 따라 핵심 AI 필터링, EXIF 누락 사진 클러스터링, 프론트-백엔드 실시간 SSE 파이프라인을 완전하게 구현합니다.

---

## User Review Required

> [!IMPORTANT]
> - **MediaPipe FaceLandmarker**: 모델 파일(`face_landmarker.task`)을 백엔드 asset 디렉토리에 캐싱하고, 이미지 처리 시 눈 깜빡임(Blendshapes `eyeBlinkLeft`/`eyeBlinkRight` & EAR) 및 다인원 바운딩 박스 가중치 계산을 적용합니다.
> - **Docker 의존성 보강**: `libegl1`, `libgles2` 시스템 패키지를 Dockerfile에 추가하여 컨테이너 환경에서 MediaPipe Task API C 바인딩이 완벽하게 구동되도록 합니다.
> - **pHash / dHash 2차 클러스터링**: EXIF 타임스탬프가 없는 사진(카카오톡, SNS 다운로드 등)도 시각적 유사도(Perceptual Hash / Color Histogram)를 기반으로 썸네일 생성 시점에 해시를 계산하고 2차 클러스터링을 수행합니다.
> - **SSE 점진적 렌더링 & 페이로드 제어**: 썸네일 그룹 전송 시 10MB 한도를 엄격히 준수하고, 백엔드 분석 결과가 실시간 SSE로 푸시되어 프론트엔드 그리드 및 카드에 점진적으로 반영되도록 파이프라인을 연결합니다.

---

## Proposed Changes

### 1. 백엔드 시스템 및 AI Hard Filter (§3.2)

#### [MODIFY] [Dockerfile.dev](file:///c:/d/PickShot/backend/Dockerfile.dev) / [Dockerfile](file:///c:/d/PickShot/backend/Dockerfile)
- `apt-get install`에 `libegl1`, `libgles2` 추가하여 MediaPipe Task API C-bindings 지원.

#### [NEW] [face_mesh.py](file:///c:/d/PickShot/backend/app/services/face_mesh.py)
- MediaPipe FaceLandmarker 래퍼 서비스 구현.
- Blendshapes (`eyeBlinkLeft`, `eyeBlinkRight`) 및 눈 랜드마크 기반 눈 뜸 점수 산출.
- 다인원 감지 시 얼굴 바운딩 박스 면적(Area) 기준 상위 1~2명 주요 피사체 가중치 적용 (Primary 60%, Secondary/기타 40%).
- `face_score` (0.0 ~ 1.0) 및 `is_eyes_closed` 판별.

#### [MODIFY] [hard_filter.py](file:///c:/d/PickShot/backend/app/services/hard_filter.py)
- OpenCV Laplacian Variance (블러 감지) + MediaPipe Face Mesh 결합.
- `evaluate_image()`에서 눈 감음 및 블러 필터링 결과와 구체적인 `filter_reason` 반환.

#### [MODIFY] [evaluation_pipeline.py](file:///c:/d/PickShot/backend/app/services/evaluation_pipeline.py)
- Hard Filter 결과를 반영한 가중 점수 산출 (`face_score` + `sharpness` + `pref_score`).
- Hard Filter 탈락 시 `total_score` 감점 및 `isHardFiltered` 플래그 설정.

---

### 2. 프론트엔드 pHash 2차 클러스터링 (§3.1)

#### [NEW] [phash.ts](file:///c:/d/PickShot/frontend/src/utils/phash.ts)
- 캔버스/픽셀 데이터 기반 고속 dHash (Difference Hash) 및 컬러 히스토그램 시그니처 추출 함수.
- 두 이미지 해시 간 Hamming Distance 및 시각적 유사도(0.0~1.0) 계산 함수.

#### [MODIFY] [thumbnail.worker.ts](file:///c:/d/PickShot/frontend/src/workers/thumbnail.worker.ts)
- 썸네일 생성 시 오프스크린 캔버스를 이용해 64비트 pHash/dHash 시그니처를 워커 스레드에서 동시에 산출하여 메인 스레드 UI 지연 방지.

#### [MODIFY] [useClustering.ts](file:///c:/d/PickShot/frontend/src/hooks/useClustering.ts)
- EXIF 타임스탬프 유무에 따라:
  1. EXIF 타임스탬프가 있는 경우: 1차 시간차 기반 클러스터링.
  2. EXIF 타임스탬프가 누락되었거나 동일 시간인 경우: pHash Hamming 거리 기반 2차 시각적 클러스터링 수행.

---

### 3. 프론트-백엔드 실시간 SSE & 10MB 페이로드 파이프라인 (§2, §5)

#### [MODIFY] [HomePage.tsx](file:///c:/d/PickShot/frontend/src/pages/HomePage.tsx) / [useCurationStore.ts](file:///c:/d/PickShot/frontend/src/stores/curationStore.ts)
- 업로드 및 클러스터링 완료 후, 그룹별 썸네일을 10MB 이하 청크로 분할 패키징하여 `/api/v1/curate`로 비동기 발송.
- 발송 전 페이로드 바이트 크기 검증 로직 추가.

#### [MODIFY] [ImageCard.tsx](file:///c:/d/PickShot/frontend/src/components/viewer/ImageCard.tsx)
- 필터링된 사진에 "눈 감음 감지" 또는 "흔들림 감지" 경고 태그 표시.
- AI 점수 세부 정보(선명도, 표정/눈뜸 점수) 툴팁 및 시각적 피드백 제공.

---

## Verification Plan

### Automated Tests
- 백엔드 테스트:
  - MediaPipe FaceLandmarker 눈 감음 / 뜸 감지 단위 테스트 (`tests/test_hard_filter.py`).
  - 10MB 페이로드 및 큐레이션 API 엔드포인트 테스트 (`tests/test_curate.py`).
- 프론트엔드 빌드 및 타입 체크:
  - `npm run build`로 TypeScript 컴파일 및 린트 검증.

### E2E / Manual Verification
- 브라우저 서브에이전트 또는 로컬 테스트를 통해:
  1. EXIF 메타데이터가 있는 사진 및 누락된 사진 업로드 테스트.
  2. pHash 2차 클러스터링 동작 확인.
  3. 백엔드 SSE 스트리밍을 통한 그룹별 베스트 샷 및 점수 실시간 반영 확인.
