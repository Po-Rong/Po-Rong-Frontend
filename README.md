# 💜 팝업스토어 모음 플랫폼 PORONG
> 파편화된 정보를 한곳에 모으고, 실시간 혼잡도 공유와 게이미피케이션 요소를 결합한  
팝업스토어 통합 플랫폼 포롱(PORONG)입니다.

<img width="1920" height="910" alt="image" src="https://github.com/user-attachments/assets/e236bd4a-46a3-4993-8cef-eef8142eda4c" />

---

## 👥 팀원 소개 및 역할 분배

전 팀원이 프론트엔드와 백엔드를 담당하여 기능을 완성했습니다.

| 이주현 | 고유정 | 서지현 |
|:------:|:------:|:------:|
| <img src="https://github.com/hana03030.png" width="100%"/> | <img src="https://github.com/daenggg.png" width="100%"/> | <img src="https://github.com/jhwest-dev.png" width="100%"/> | 
| [@hana03030](https://github.com/hana03030) | [@daenggg](https://github.com/daenggg) | [@jhwest-dev](https://github.com/jhwest-dev) |
| 메인 페이지, 찾기 페이지 | 팝업 상세, 후기, 마이페이지 | 로그인/회원가입, 관리자 페이지 |
| 찜/리뷰 CRUD, 최근 리뷰 API | 도감/예약 CRUD, 혼잡도 API | 회원/팝업 CRUD, 통계 집계 API |

---

## 📌 기획 배경 및 해결책

- **Pain Point:** SNS에 흩어진 정보 탐색의 어려움, 방문 전 현장 혼잡도 파악 불가능으로 인한 시간 낭비
- **Our Solution:** 
  1. **통합 정보 제공:** 흩어진 팝업 정보를 한곳에서 스마트하게 탐색 및 필터링
  2. **사용자 참여형 데이터:** 유저들의 실제 후기를 기반으로 한 실시간 평균 혼잡도 공유
  3. **게이미피케이션:** 리뷰 작성 시 귀여운 키링 수집 유도로 유저 활동성 촉진

---

## 🌟 핵심 기능 (Core Features)

| 01. 실시간 인기도 및 랭킹 시스템 | 02. 조건별 팝업 필터링 |
| :---: | :---: |
| <img width="2560" height="1389" alt="image" src="https://github.com/user-attachments/assets/cc199119-c781-449f-8462-eb5b82d2e4d3" /> | <img width="2560" height="1399" alt="image" src="https://github.com/user-attachments/assets/93a5c194-d688-4a34-9223-44cef35e1a14" /> |
| 실시간 찜 수 데이터를 분석하여 1~10위 인기 팝업을 집계하고, 금/은/동 왕관 및 NEW 뱃지를 시각화하여 트렌드를 한눈에 제공합니다. | 카테고리, 지역, 운영 상태 결합 필터링과 Kakao Map API를 연동하여 내 주변 팝업 위치를 직관적으로 탐색합니다. |
| **03. 실시간 별점 & 혼잡도 리뷰** | **04. 키링 도감** |
| <img width="2560" height="1313" alt="image" src="https://github.com/user-attachments/assets/7b9cc55b-a6da-43d8-9f11-bbdd5b4fd460" /> | <img width="2560" height="1270" alt="image" src="https://github.com/user-attachments/assets/38b97823-6229-4f19-ae40-4713b1563656" /> |
| 이미지 바이너리 파일과 폼 데이터를 동시에 패킹하여 전송하며, 별점 및 3단계 현장 혼잡도 게이지 인터랙션을 지원합니다. | 리뷰 작성을 통해 수집한 산리오 키링을 마이페이지에서 확인하고, 미획득 아이템은 그림자 처리하여 수집 욕구를 자극합니다. |
| **05. 실시간 예약 및 후기 모니터링** | **06. 자동 좌표 변환 팝업 등록** |
| <img width="2560" height="1304" alt="image" src="https://github.com/user-attachments/assets/c39bdc23-a579-4dc6-bf2d-872ba37af2a3" /> | <img width="2560" height="1185" alt="image" src="https://github.com/user-attachments/assets/14485c36-1707-4959-8d46-ef8bb3b08a1c" /> |
| 일자별/회차별 타임테이블에 따른 실시간 예약 현황을 파악하고, 유저들이 남긴 생생한 현장 혼잡도 후기를 한눈에 모니터링합니다. | 신규 팝업스토어 등록 시, 입력한 주소 데이터를 기반으로 위경도 좌표를 자동 변환하여 Kakao Map API에 실시간 마커로 연동합니다. |

---

## 🛠️ 시스템 아키텍처 & 페이지 구조
### [ 시스템 구조 ]

- **Frontend:** HTML5, CSS3, JavaScript (kakaomap API 연동)
- **Backend:** Spring Boot, MySQL

<img width="2346" height="1660" alt="image" src="https://github.com/user-attachments/assets/e5021d21-6bb1-4050-9bf4-893576b78c6b" />

### [ 서비스 Flow ]

- **구매자(User):** 홈(랭킹) ➡️ 찾기(필터링) ➡️ 팝업 상세(예약/리뷰) ➡️ 마이페이지(키링 도감)
- **판매자(Admin):** 팝업 관리 ➡️ 팝업 등록(자동 좌표 변환) ➡️ 예약/후기 확인 및 통계 대시보드

<img width="1777" height="800" alt="image" src="https://github.com/user-attachments/assets/f7e16871-232b-4071-abf8-e153babe8c4c" />

---

## 🧩 Frontend 기술적 핵심 구현 사항

### 1. 시각적 몰입감을 높이는 UI/UX 및 인터랙션
- **동적 이미지 뱃지 시스템:** 랭킹 데이터 스펙에 맞춰 실시간 1, 2, 3위 상위에 금/은/동 왕관 오버레이를 연동하고 NEW 및 혼잡도 여유 뱃지를 조건부 렌더링했습니다.
- **가로 스크롤 레이아웃:** 수많은 팝업 카드가 배치되는 메인 랭킹 및 섹션의 스크롤 컨테이너를 설계하여 매끄러운 브라우징 인터랙션을 제공합니다.
- **수평 정렬 최적화:** 상세 페이지 내 팝업 일정 및 예약 기간 데이터 정렬 시 `align-items: flex-start` 및 `align-items: flex-end`를 구조적으로 활용하여 라벨과 내용의 텍스트 수평 높이 핏을 정교하게 맞췄습니다.

### 2. 컴포넌트 생명주기 및 폼 제어
- **실시간 사진 변경/삭제 엔진:** 후기 수정 시 기존 업로드 사진 렌더링 구조를 탈피하고, `URL.createObjectURL` 기반 로컬 가상 주소 대체 방식과 삭제(`null`) 라이프사이클을 연결했습니다.
- **인터랙티브 폼 바인딩:** 마우스 클릭에 연동되는 5단계 별점 활성화 기능과 3단계 사람 아이콘으로 구성된 현장 혼잡도 선택을 구현했습니다.
- **조건부 이미지 스위칭 기법:** 키링 도감 시스템 내에서 사용자의 미획득 아이템 목록은 파일명 규칙 기반의 잠금 그림자 접두사를 조합하여 간결한 코드로 상태 분기를 자동화했습니다.

---

## 🚀 기술적 챌린지 및 트러블슈팅

### 1. Multipart/form-data 데이터 패킹 구조 에러 해결
- **문제 상황**  
리뷰 수정 시 백엔드 컨트롤러가 `@PatchMapping` 및 `consumes = MediaType.MULTIPART_FORM_DATA_VALUE`로 선언되어 있었으나, 프론트엔드에서 일반 JSON 문자열 포맷으로 송신하여 `415 (Unsupported Media Type)` 및 `405` 통신 장애가 발생했습니다.

- **해결 방안**  
기존 `JSON.stringify` 전송 구조를 전면 폐기하고 브라우저 내장 객체인 `FormData` 빌더 구조를 적용했습니다. 데이터를 개별 쿼리 핏에 맞춰 어펜드하고, 파일 객체(`MultipartFile` 매핑용)를 단독 분리 탑재했습니다. 특히 헤더의 `Content-Type`을 의도적으로 명시하지 않고 비워둠으로써 브라우저가 멀티파트 경계선(`boundary`)을 자동으로 인코딩 지정하도록 유도하여 통신 규격을 완벽하게 동기화했습니다.

### 2. 백엔드 API 공백에 대응하는 프론트엔드 폴백(Fallback) 아키텍처 설계
- **문제 상황**  
초기 설계 당시 수정 페이지 진입 시 해당 후기의 데이터를 서버에서 한 줄만 긁어오는 단건 조회(GET) API의 부재로 인해 기존 작성 정보(Pre-fill)를 화면에 로드하지 못하는 병목 현상이 일어났습니다.

- **해결 방안**  
백엔드 리소스를 무리하게 수정하는 대신 프론트엔드 단에서 마이페이지 전체 목록 조회 API(`api/reviews/me`)를 우회 호출하는 방어벽 코드를 심었습니다. 전체 리스트 배열을 메모리에 올린 뒤, 주소창의 쿼리스트링 파라미터(`?reviewId=XX`) 고유 식별자와 완벽하게 일치하는 객체 요소를 JavaScript의 `.find()` 문법으로 실시간 매칭·적출하여 백엔드 추가 공수 없이 화면 폼을 성공적으로 복구했습니다.

---

## 📂 프론트엔드 폴더 구조 (Project Structure)

```plaintext
Po-Rong-Frontend/
├── assets/
│   ├── css/
│   │   ├── global.css          # 공통 테마 변수 및 초기화 스타일
│   │   ├── main.css            # 홈 메인 컴포넌트 및 뱃지 스타일
│   │   ├── popup-detail.css    # 정렬 구조가 개선된 상세 페이지 스타일
│   │   └── review.css          # 후기 등록/수정 전용 폼 스타일
│   └── images/
│       ├── badges/             # 금/은/동 왕관 및 테마별 상태 뱃지
│       ├── icons/              # 하트, 별점 채우기, 혼잡도 인형 아이콘
│       └── keyrings/           # 획득 키링 및 미획득 shadow- 이미지 자원
├── js/
│   ├── index.js                # 글로벌 가이드 제어 스크립트
│   ├── main.js                 # 홈 랭킹 스크롤 및 배너 제어 엔진
│   ├── popup-detail.js         # 상세 데이터 병렬 처리 및 예약 정보 매핑
│   └── review-edit.js          # 후기 수정 폼 데이터 바인딩 및 파일 컨트롤러
└── pages/
    ├── explore.html            # 팝업 통합 검색 및 필터링 페이지
    ├── popup-detail.html       # 팝업 정보 및 하단 고정 바 상세 페이지
    └── review-edit.html        # 후기 실시간 수정 폼 페이지
