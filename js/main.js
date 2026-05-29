// API 주소 상수 관리
const API_BASE_URL = "http://localhost:8080/api";

// 실시간으로 로컬스토리지에서 최신 유저 쿼리를 만들어주는 함수
function getUserQuery() {
    const loginUser = JSON.parse(localStorage.getItem("loginUser"));
    if (!loginUser) return "";

    const currentUserId = loginUser.userId || loginUser.id;
    // 백엔드가 컨트롤러에서 받는 이름(user_id)으로 매핑
    return currentUserId ? `&user_id=${currentUserId}` : "";
}

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
})

// API 날짜 변환
function formatDateString(isoString) {
    if (!isoString) return "";
    const datePart = isoString.split("T")[0];
    const [year, month, day] = datePart.split("-");
    return `${year.slice(2)}.${month}.${day}`;
}

// 인기 급상승 10개
async function fetchTrendPopups() {
    const trendScrollContainer = document.querySelector(".trend-section .card-scroll-container");
    if (!trendScrollContainer) return;

    try {
        // 호출하는 시점의 최신 유저 ID 쿼리를 붙임
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

            const cardHtml = `
                <div class="popup-card trend-card" data-popup-id="${popup.id}">
                    <div class="card-image-wrap">
                        <img src="${popup.mainImageUrl}" alt="${popup.title} 썸네일" class="card-thumb" />
                        <div class="gradient-overlay"></div>
                        <div class="crown-badge rank-${rank}"></div>
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
        // 호출하는 시점의 최신 유저 ID 쿼리를 붙임
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
                    <div class="card-image-wrap">
                        <img src="${popup.mainImageUrl}" alt="${popup.title} 썸네일" class="card-thumb" />
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
        // 호출하는 시점의 최신 유저 ID 쿼리를 붙임
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
                    <div class="card-image-wrap">
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