// 공통된 JS파일을 넣는 파일입니다.
// 로그인이나 따로 분리가 가능한 기능들은 따로 js파일을 만들어 주세요
const API = "http://localhost:8080/api";

// 헤더 로그인 상태 업데이트
function updateHeader() {
    // 로그인/회원가입 페이지에서는 실행 안 함
    if (
        window.location.pathname.includes("/pages/login") ||
        window.location.pathname.includes("/pages/register")
    )
        return;

    const user = JSON.parse(localStorage.getItem("loginUser"));
    const loginLink = document.querySelector(".login-link");

    if (user) {
        // 로그인 상태
        loginLink.textContent = `${user.nickname}님, 반가워요!`;
        loginLink.href = "#";

        // role에 따라 마이포롱 링크 변경
        const mypageLink = document.querySelector(
            "a[href='/pages/mypage.html']",
        );
        if (mypageLink && user.role === "seller") {
            mypageLink.href = "/pages/admin.html";
        }
    } else {
        // 비로그인 상태
        loginLink.textContent = "로그인";
        loginLink.href = "/pages/login.html";
    }
}

// 페이지 로드될 때 실행
updateHeader();

// 카테고리 목록 불러오기
function loadCategories() {
    const categoryList = document.getElementById("categoryList");
    if (!categoryList) return;

    fetch(`${API}/categories`)
        .then((res) => res.json())
        .then((data) => {
            data.forEach((category) => {
                const btn = document.createElement("button");
                btn.textContent = category.categoryName;
                btn.dataset.id = category.id;
                btn.onclick = () => selectCategory(category.id, btn);
                categoryList.appendChild(btn);
            });
        });
}

// 카테고리 선택
function selectCategory(id, btn) {
    document.getElementById("selectedCategory").value = id;
    document
        .querySelectorAll(".category-group button")
        .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
}

// 지역 목록 불러오기
function loadRegions() {
    const regionList = document.getElementById("regionList");
    if (!regionList) return;

    fetch(`${API}/regions`)
        .then((res) => res.json())
        .then((data) => {
            data.forEach((region) => {
                const btn = document.createElement("button");
                btn.textContent = region.regionName;
                btn.dataset.id = region.id;
                btn.onclick = () => selectRegion(region.id, btn);
                regionList.appendChild(btn);
            });
        });
}

// 지역 선택
function selectRegion(id, btn) {
    document.getElementById("selectedRegion").value = id;
    document
        .querySelectorAll(".region-group button")
        .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
}

function showMsg(id, text, ok) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = "msg" + (ok ? "ok" : "fail");
}

// 공통 찜하기 체크 및 토글 제어
async function toggleWish(popupId, buttonElement) {
    const user = JSON.parse(localStorage.getItem("loginUser"));

    // 비로그인 상태면 하단 통신 로직을 타기 전에 로그인 이동
    if (!user) {
        alert("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동합니다.");
        window.location.href = "/pages/login.html";
        return;
    }

    // 현재 버튼이 찜이 된 상태인지 확인
    const isCurrentlyStarred = buttonElement.classList.contains("active");

    // 유저 경험을 위해 통신 중 버튼 여러 번 광클 방지 잠금
    buttonElement.disabled = true;

    try {
        // 엔드포인트로 요청 송신
        // 주소 형식: http://localhost:8080/api/wishlists/popups/{popupId}
        const response = await fetch(`${API}/wishlists/popups/${popupId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: user.userId || user.id // 로컬스토리지 보관 방식에 맞춤 바인딩
            })
        });

        if (!response.ok) {
            throw new Error(`서버 응답 실패 상태코드: ${response.status}`);
        }

        // 백엔드 처리가 정상 완료된 경우에만 화면의 하트 불빛을 끄고 켬
        buttonElement.classList.toggle("active");

        console.log(`[찜 API 연동 성공] 팝업 ID: ${popupId} | 결과 상태: ${!isCurrentlyStarred ? "찜 등록완료" : "찜 해제완료"}`);

    } catch (error) {
        console.error("찜하기 처리 중 통신 에러 발생:", error);
        alert("찜하기 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
        // 통신이 완료되면 다시 버튼 클릭 잠금 해제
        buttonElement.disabled = false;
    }
}

// 리뷰 데이터를 가져와서 렌더링
async function renderReviews(apiEndpoint, containerSelector) {
    const reviewGridContainer = document.querySelector(containerSelector);
    if (!reviewGridContainer) return;

    try {
        const response = await fetch(apiEndpoint);
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

            // 혼잡도 계산
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

            // 이미지 유무 처리
            let attachBoxHtml = "";
            let noImageClass = "";
            if (review.reviewImageUrl) {
                attachBoxHtml = `
                    <div class="review-attach-box">
                        <img src="${review.reviewImageUrl}" alt="리뷰 첨부 사진" class="review-attached-img" />
                    </div>
                `;
            } else {
                noImageClass = "has-no-image";
            }

            // 리뷰 카드 HTML 생성
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
                    ${attachBoxHtml} 
                    <div class="review-target-popup">
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
        console.error("리뷰 리스트업 실패: ", error);
        reviewGridContainer.innerHTML = `<p class="error-msg">리뷰 정보를 불러오지 못했습니다.</p>`;
    }
}