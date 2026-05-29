// API 주소 상수 관리
const API_BASE_URL = "http://localhost:8080/api";
// 인기 급상승 팝업 주소
const API_TREND_POPUPS = `${API_BASE_URL}/popups?status=ongoing&sort=wishlist`;
// 여유로운 팝업 주소
const API_LEISURE_POPUPS = `${API_BASE_URL}/popups?status=ongoing&sort=leisurely`;
// 오픈 예정
const API_UPCOMING_POPUPS = `${API_BASE_URL}/popups?status=upcoming`;
// 최근 리뷰
const API_RECENT_REVIEWS = `${API_BASE_URL}/reviews/recent`;


// 초기화 및 메인 실행
document.addEventListener("DOMContentLoaded", () => {
    // 인기 급상승 팝업 TOP 10
    fetchTrendPopups();
    // 지금 가기 좋은 여유로운 팝업
    fetchLeisurePopups();
    // 오픈 예정 팝업
    fetchUpcomingPopups();
    // 최근 리뷰
    fetchRecentReviews();

    // 기존 학습한 정적 데이터 기반 동적 렌더링
    initStaticReviewStats();
})

// API 날짜 변환
function formatDateString(isoString) {
    if (!isoString) return "";
    // "2026-05-01T10:00" 스플릿 가공 -> ["2026", "05", "01"]
    const datePart = isoString.split("T")[0];
    const [year, month, day] = datePart.split("-");

    // 앞자리 "20"을 떼어내고 "26.05.01" 형태로 반환
    return `${year.slice(2)}.${month}.${day}`;
}

// 인기 급상승 (찜하기순) 10개
async function fetchTrendPopups() {
    const trendScrollContainer = document.querySelector(".trend-section .card-scroll-container");
    if (!trendScrollContainer) return;

    try {
        const response = await fetch(API_TREND_POPUPS);
        if (!response.ok) {
            throw new Error(`API 통신 에러 발생: ${response.status}`);
        }

        const popupsData = await response.json();

        // 예외 처리
        // 데이터가 10개보다 적을때는 적은 만큼만 그린다
        const displayData = popupsData.slice(0, 10);
        trendScrollContainer.innerHTML = "";
        // 데이터가 아예 없는 경우의 방어 코드
        if (displayData.length === 0) {
            trendScrollContainer.innerHTML = `<p class="no-data-msg">현재 집계된 인기 팝업이 없습니다.</p>`;
            return;
        }

        // 카드 생성
        displayData.forEach((popup, index) => {
            const rank = index + 1;

            // 찜하기 활성화 여부에 따른 초기 클래스 분기
            const activeClass = popup.isWishlisted ? "active" : "";

            const cardHtml = `
                <div class="popup-card trend-card" data-popup-id="${popup.id}">
                    <div class="card-image-wrap">
                        <img
                            src="${popup.mainImageUrl}"
                            alt="${popup.title} 썸네일"
                            class="card-thumb"
                        />
                        <div class="gradient-overlay"></div>
                        
                        <div class="crown-badge rank-${rank}"></div>

                        <div class="card-overlay-info">
                            <span class="trend-rank-num">${rank}</span>
                            <h3 class="trend-card-title">${popup.title}</h3>
                            <p class="trend-card-location">${popup.regionName}</p>
                        </div>
                    </div>

                    <button class="wish-btn ${activeClass}" aria-label="찜하기" onclick="toggleWish(${popup.id}, this)">
                        <span class="heart-icon"></span> 찜하기
                    </button>
                </div>
            `;

            trendScrollContainer.insertAdjacentHTML("beforeend", cardHtml);
        });
    } catch (error) {
        console.error("인기 급상승 팝업 조회 중 치명적 실패: ", error);
        trendScrollContainer.innerHTML = `<p class="error-msg">인기 팝업 정보를 불러오지 못했습니다.</p>`;
    }
}

// 지금 가기 좋은 여유로운 팝업 연동
async function fetchLeisurePopups() {
    const leisureScrollContainer = document.querySelector(".leisure-section .card-scroll-container");
    if (!leisureScrollContainer) return;

    try {
        const response = await fetch(API_LEISURE_POPUPS);
        if (!response.ok) {
            throw new Error(`API 통신 에러 발생: ${response.status}`);
        }

        const popupsData = await response.json();

        // 10개안으로 동적 커팅
        const displayData = popupsData.slice(0, 10);
        leisureScrollContainer.innerHTML = "";

        if (displayData.length === 0) {
            leisureScrollContainer.innerHTML = `<p class="no-data-msg">현재 여유로운 팝업 정보가 없습니다.</p>`
            return;
        }

        displayData.forEach((popup) => {
            const activeClass = popup.isWishlisted ? "active" : "";

            // 날짜 포멧팅
            const formattedStartDate = formatDateString(popup.startDate);
            const formattedEndDate = formatDateString(popup.endDate);

            const cardHtml = `
                <div class="popup-card leisure-card" data-popup-id="${popup.id}">
                    <div class="card-image-wrap">
                        <img
                            src="${popup.mainImageUrl}"
                            alt="${popup.title} 썸네일"
                            class="card-thumb"
                        />
                    </div>

                    <button class="wish-btn ${activeClass}" aria-label="찜하기" onclick="toggleWish(${popup.id}, this)">
                        <span class="heart-icon"></span> 찜하기
                    </button>

                    <div class="card-body-wrap">
                        <div class="card-info">
                            <h3 class="card-title">${popup.title}</h3>
                            <p class="card-location">${popup.regionName}</p>
                            <p class="card-date">${formattedStartDate} - ${formattedEndDate}</p>
                            <span class="card-category">${popup.categoryName}</span>
                        </div>
                    </div>
                </div>
            `;
            leisureScrollContainer.insertAdjacentHTML("beforeend", cardHtml);
        });
    } catch (error) {
        console.error("여유로운 팝업 조회 중 치명적 실패: ", error);
        leisureScrollContainer.innerHTML = `<p class="error-msg">팝업 정보를 불러오지 못했습니다.</p>`;
    }
}

// 오픈 예정 팝업
async function fetchUpcomingPopups() {
    const upcomingScrollContainer = document.querySelector(".upcoming-section .card-scroll-container");
    if (!upcomingScrollContainer) return;

    try {
        const response = await fetch(API_UPCOMING_POPUPS);
        if (!response.ok) {
            throw new Error(`API 통신 에러 발생: ${response.status}`);
        }

        const popupsData = await response.json();

        // 10개 아래라면 있는 만큼만, 10개를 넘어가면 10개만 출력
        const displayData = popupsData.slice(0, 10);
        upcomingScrollContainer.innerHTML = "";

        if (displayData.length === 0) {
            upcomingScrollContainer.innerHTML = `<p class="no-data-msg">오픈 예정인 팝업 정보가 없습니다.</p>`;
            return;
        }

        displayData.forEach((popup) => {
            const activeClass = popup.isWishlisted ? "active" : "";
            const formattedStartDate = formatDateString(popup.startDate);
            const formattedEndDate = formatDateString(popup.endDate);

            // 오픈 예정 팝업 카드
            const cardHtml = `
                <div class="popup-card upcoming-card" data-popup-id="${popup.id}">
                    <div class="card-image-wrap">
                        <img
                            src="${popup.mainImageUrl}"
                            alt="${popup.title} 썸네일"
                            class="card-thumb"
                        />
                        <div class="status-badge new-status"></div>
                    </div>

                    <button class="wish-btn ${activeClass}" aria-label="찜하기" onclick="toggleWish(${popup.id}, this)">
                        <span class="heart-icon"></span> 찜하기
                    </button>

                    <div class="card-body-wrap">
                        <div class="card-info">
                            <h3 class="card-title">${popup.title}</h3>
                            <p class="card-location">${popup.regionName}</p>
                            <p class="card-date">${formattedStartDate} - ${formattedEndDate}</p>
                            <span class="card-category">${popup.categoryName}</span>
                        </div>
                    </div>
                </div>
            `;
            upcomingScrollContainer.insertAdjacentHTML("beforeend", cardHtml);
        });
    } catch (error) {
        console.error("오픈 예정 팝업 조회 중 치명적 실패: ", error);
        upcomingScrollContainer.innerHTML = `<p class="error-msg">팝업 정보를 불러오지 못했습니다.</p>`;
    }
}

// 최근 올라온 리뷰 연동
async function fetchRecentReviews() {
    const reviewGridContainer = document.querySelector(".review-grid-container");
    if (!reviewGridContainer) return;

    try {
        const response = await fetch(API_RECENT_REVIEWS);
        if (!response.ok) throw new Error(`리뷰 API 통신 실패: ${response.status}`);

        const reviewsData = await response.json();
        reviewGridContainer.innerHTML = "";

        if (reviewsData.length === 0) {
            reviewGridContainer.innerHTML = `<p class="no-data-msg">등록된 최신 리뷰가 없습니다.</p>`;
            return;
        }

        reviewsData.forEach((review) => {
            // 날짜 변환
            const formattedReviewDate = review.reserveDate ? review.reserveDate.replace(/-/g, ".").slice(2) : "";

            // 별점 계산
            let starsHtml = "";
            const score = Math.floor(review.rating);
            for (let i = 1; i <= 5; i++) {
                starsHtml += i <= score
                    ? `<img src="/assets/images/icons/icon-star-fill.png" alt="별">`
                    : `<img src="/assets/images/icons/icon-star-empty.png" alt="빈 별">`;
            }

            // 영어 혼잡도를 한글과 스펙 카운트로 치환
            let fillCount = 1;
            let congestionText = "낮음";
            if (review.congestion_level === "NORMAL") { fillCount = 2; congestionText = "보통"; }
            if (review.congestion_level === "HIGH") { fillCount = 3; congestionText = "높음"; }

            let peopleHtml = "";
            for (let i = 1; i <= 3; i++) {
                peopleHtml += i <= fillCount
                    ? `<img src="/assets/images/icons/icon-person-fill.png" alt="사람 채움">`
                    : `<img src="/assets/images/icons/icon-person-empty.png" alt="사람 비움">`;
            }

            // reviewImageUrl이 있으면 그리고 null이면 지움
            let attachBoxHtml = "";
            let noImageClass = "";

            if (review.reviewImageUrl) {
                attachBoxHtml = `
                    <div class="review-attach-box">
                        <img src="${review.reviewImageUrl}" alt="리뷰 첨부 사진" class="review-attached-img" />
                    </div>
                `;
            } else {
                noImageClass = "has-no-image"; // CSS에서 본문 확장 및 말줄임 분기 처리를 위한 힌트 클래스
            }

            // 리뷰 카드
            const reviewHtml = `
                <div class="review-card ${noImageClass}" data-review-id="${review.reviewId}" onclick="location.href='/pages/explore.html?id=${review.popupId}'" style="cursor:pointer;">
                    <div class="review-card-header">
                        <span class="reviewer-name">${review.nickname}</span>
                        <span class="review-date">${formattedReviewDate} 방문</span>
                    </div>
                    <div class="review-stats-row">
                        <div class="rating-wrap">
                            <div class="rating-stars">${starsHtml}</div>
                            <span class="rating-num">${review.rating.toFixed(1)}</span>
                            <span>/</span>
                            <span class="rating-max">5.0</span>
                        </div>
                        <div class="congestion-wrap">
                            <div class="congestion-icons">${peopleHtml}</div>
                            <span class="congestion-text">혼잡도</span>
                            <span class="congestion-strong">${congestionText}</span>
                        </div>
                    </div>
                    
                    <div class="review-content">
                        <p>${review.content}</p>
                    </div>
                    
                    ${attachBoxHtml} <div class="review-target-popup">
                        <div class="target-thumb-wrap">
                            <img src="${review.popupMainImageUrl}" alt="팝업 미니 썸네일" class="target-thumb" />
                        </div>
                        <div class="target-info-wrap">
                            <div class="target-tags">
                                <span class="card-category" style="padding:2px 6px; font-size:11px;">애니/캐릭터</span>
                                <span class="card-status is-running" style="padding:2px 6px; font-size:11px;">운영중</span>
                            </div>
                            <h4 class="target-title">${review.popupTitle}</h4>
                            <p class="target-location">방문 시간: ${review.reserveTime}</p>
                        </div>
                    </div>
                </div>
            `;
            reviewGridContainer.insertAdjacentHTML("beforeend", reviewHtml);
        });

    } catch (error) {
        console.error("최근 리뷰 리스트업 실패: ", error);
        reviewGridContainer.innerHTML = `<p class="error-msg">리뷰 정보를 불러오지 못했습니다.</p>`;
    }
}

// 가로 스크롤 container - 스크롤 적용
document.addEventListener("DOMContentLoaded", () => {
    // 페이지 내 모든 가로 스크롤 컨테이너들을 가져옴
    const scrollContainers = document.querySelectorAll(".card-scroll-container");

    scrollContainers.forEach((container) => {
        let isDown = false;
        let startX;
        let scrollLeft;

        // 마우스 버튼을 누른 순간
        container.addEventListener("mousedown", (e) => {
            isDown = true;
            container.classList.add("active");
            // 클릭한 절대 좌표에서 이미 스크롤된 만큼을 계산
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;

            // 드래그 중 텍스트나 이미지가 블록 지정되는 현상 방지
            container.style.cursor = "grabbing";
            container.style.userSelect = "none";
        });

        // 마우스가 스크롤 영역 밖으로 벗어났을 때
        container.addEventListener("mouseleave", () => {
            isDown = false;
            container.style.cursor = "grab";
        });

        // 마우스 버튼을 뗐을 때
        container.addEventListener("mouseup", () => {
            isDown = false;
            container.style.cursor = "grab";
        });

        // 마우스를 움직이는(드래그) 동안
        container.addEventListener("mousemove", (e) => {
            if (!isDown) return; // 마우스가 눌린 상태가 아니라면 함수 종료
            e.preventDefault();

            const x = e.pageX - container.offsetLeft;
            // 드래그 속도 조절 (숫자가 높을수록 빠르게 스크롤됨)
            const walk = (x - startX) * 1.5;
            container.scrollLeft = scrollLeft - walk;
        });

        // 초기 마우스 커서 모양을 잡기 편하게 손모양(grab)으로 지정
        container.style.cursor = "grab";
    });
});