// API 주소 상수 관리
const API_BASE_URL = "http://localhost:8080/api";

// 초기화 및 메인 실행
document.addEventListener("DOMContentLoaded", () => {
    // 인기 급상승 팝업 TOP 10
    fetchTrendPopups();
    // 지금 가기 좋은 여유로운 팝업
    fetchLeisurePopups();
    // 오픈 예정 팝업
    fetchUpcomingPopups();
    // 최근 리뷰
    renderReviews(`${API_BASE_URL}/reviews/recent`, ".review-grid-container");

    // 히어로 배너 스크롤 릴리즈 스케일 다운 효과 (Option 3)
    const heroContainer = document.querySelector(".hero-container");

    if (heroContainer) {
        function checkScroll() {
            if (window.scrollY > 80) {
                heroContainer.classList.add("shrunk");
            } else {
                heroContainer.classList.remove("shrunk");
            }
        }

        // 초기 실행 및 스크롤 이벤트 바인딩
        checkScroll();
        window.addEventListener("scroll", checkScroll, { passive: true });
    }
})

// 인기 급상승 10개
async function fetchTrendPopups() {
    const trendScrollContainer = document.querySelector(".trend-section .card-scroll-container");
    if (!trendScrollContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/popups?status=ongoing&sort=wishlist${getUserQuery()}`);
        if (!response.ok) throw new Error(`API 통신 에러 발생: ${response.status}`);

        const popupsData = await response.json();
        const displayData = popupsData.slice(0, 10);
        trendScrollContainer.innerHTML = "";

        if (displayData.length === 0) {
            trendScrollContainer.innerHTML = `<p class="no-data-msg">현재 집계된 인기 팝업이 없습니다.</p>`;
            return;
        }

        displayData.forEach((popup, index) => {
            const rank = index + 1;
            const activeClass = popup.isWishlisted ? "active" : "";

            // 1, 2, 3위에만 왕관 뱃지
            let crownHtml = "";
            if (rank === 1) crownHtml = `<div class="crown-badge rank-gold"></div>`;
            else if (rank === 2) crownHtml = `<div class="crown-badge rank-silver"></div>`;
            else if (rank === 3) crownHtml = `<div class="crown-badge rank-bronze"></div>`;

            const cardHtml = `
                <div class="popup-card trend-card" data-popup-id="${popup.id}">
                    <div class="card-image-wrap" onclick="location.href='/pages/popup-detail.html?id=${popup.id}'">
                        <img src="${popup.mainImageUrl}" alt="${popup.title} 썸네일" class="card-thumb" />
                        <div class="gradient-overlay"></div>
                        ${crownHtml} 
                        <div class="card-overlay-info">
                            <span class="trend-rank-num">${rank}</span>
                            <h3 class="trend-card-title">${popup.title}</h3>
                            <p class="trend-card-location">${popup.regionName}</p>
                        </div>
                    </div>
                    <button class="wish-btn ${activeClass}" aria-label="찜하기" onclick="toggleWish(${popup.id || popup.popupId}, this)">
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
        const response = await fetch(`${API_BASE_URL}/popups?status=ongoing&sort=leisurely${getUserQuery()}`);
        if (!response.ok) throw new Error(`API 통신 에러 발생: ${response.status}`);

        const popupsData = await response.json();
        const displayData = popupsData.slice(0, 10);
        leisureScrollContainer.innerHTML = "";

        if (displayData.length === 0) {
            leisureScrollContainer.innerHTML = `<p class="no-data-msg">현재 여유로운 팝업 정보가 없습니다.</p>`;
            return;
        }

        displayData.forEach((popup) => {
            const activeClass = popup.isWishlisted ? "active" : "";
            const formattedStartDate = formatDateString(popup.startDate);
            const formattedEndDate = formatDateString(popup.endDate);

            const cardHtml = `
                <div class="popup-card leisure-card" data-popup-id="${popup.id}">
                    <div class="card-image-wrap" onclick="location.href='/pages/popup-detail.html?id=${popup.id}'">
                        <img src="${popup.mainImageUrl}" alt="${popup.title} 썸네일" class="card-thumb" />
                        <div class="leisure-status-badge"></div>
                    </div>
                    <button class="wish-btn ${activeClass}" aria-label="찜하기" onclick="toggleWish(${popup.id || popup.popupId}, this)">
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
        const response = await fetch(`${API_BASE_URL}/popups?status=upcoming${getUserQuery()}`);
        if (!response.ok) throw new Error(`API 통신 에러 발생: ${response.status}`);

        const popupsData = await response.json();
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

            const cardHtml = `
                <div class="popup-card upcoming-card" data-popup-id="${popup.id}">
                    <div class="card-image-wrap" onclick="location.href='/pages/popup-detail.html?id=${popup.id}'">
                        <img src="${popup.mainImageUrl}" alt="${popup.title} 썸네일" class="card-thumb" />
                        <div class="status-badge new-status"></div>
                    </div>
                    <button class="wish-btn ${activeClass}" aria-label="찜하기" onclick="toggleWish(${popup.id || popup.popupId}, this)">
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

// 홈에서 카테고리 클릭 시 찾기 페이지로 이동
function navigateToExploreWithCategory(categoryName) {
    window.location.href = `/pages/explore.html?category=${encodeURIComponent(categoryName)}`;
}