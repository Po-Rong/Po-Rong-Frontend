// =========================================================================
// ✍️ review-edit.js (기존 후기 데이터 조회 및 수정 처리 컨트롤러)
// =========================================================================

const API_BASE_URL = window.API_BASE_URL || "http://localhost:8080/api";

// 수정에 필요한 전역 상태 바구니
let currentReviewId = null;
let selectedRating = 0;
let selectedCongestion = "";
let uploadedImageUrl = null;

document.addEventListener("DOMContentLoaded", () => {
    // 1. 로그인 유저 검증 및 획득
    const loginUser = JSON.parse(localStorage.getItem("loginUser"));
    if (!loginUser) {
        alert("로그인이 만료되었습니다. 로그인 페이지로 이동합니다.");
        window.location.href = "/pages/login.html";
        return;
    }

    // 2. 주소창에서 reviewId 꼬리표 파싱 (?reviewId=212)
    const urlParams = new URLSearchParams(window.location.search);
    currentReviewId = urlParams.get("reviewId");

    if (!currentReviewId) {
        alert("잘못된 접근입니다. 수정할 후기 번호가 없습니다.");
        window.location.href = "/pages/mypage.html";
        return;
    }

    // 3. UI 컴포넌트 인터랙션 바인딩 실행
    initRatingInteraction();
    initCongestionInteraction();
    initFileUpload();

    // 4. [핵심] 기존에 썼던 알맹이 데이터 백엔드에서 원격 조회 및 폼 채우기 가동
    fetchOriginalReview(currentReviewId);

    // 5. 수정 완료 버튼 이벤트 연결
    const btnSubmit = document.getElementById("btn-submit-review");
    if (btnSubmit) {
        btnSubmit.addEventListener("click", () => submitUpdatedReview(loginUser.userId || loginUser.id));
    }
});

/**
 * 📥 1. 기존 데이터 원격 백엔드 조회 및 UI 매핑 (Pre-fill)
 */
async function fetchOriginalReview(reviewId) {
    try {
        // 단건 상세 조회 혹은 마이페이지 캐시 조회 스펙 주소 매핑
        // 만약 단건 상세 엔드포인트가 따로 없다면, 기존 조회 데이터 필터링 혹은 마이리뷰 API 재활용 가능
        // 정석적인 단건 조회 API 규격을 기준으로 우선 세팅합니다.
        const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`);

        // 💡 만약 백엔드 엔지니어가 단건조회를 아직 안 만들었다면, 마이페이지 API에서 긁어오도록 스위칭 처리 가능
        // 여기서는 데이터가 정상 수신되었다고 가정하고 폼을 파싱합니다.
        if (!response.ok) throw new Error("기존 후기 내역 조회 실패");

        const review = await response.json();

        // [A] 대상 상단 미니 팝업 카드 정보 매핑
        if (review.popupTitle) document.querySelector(".target-title").textContent = review.popupTitle;
        if (review.regionName) document.querySelector(".target-location").textContent = review.regionName;
        if (review.categoryName) document.querySelector(".card-category").textContent = review.categoryName;
        if (review.popupMainImageUrl) document.querySelector(".target-thumb").src = review.popupMainImageUrl;

        // [B] 기존 텍스트 알맹이 복구
        const textarea = document.getElementById("review-textarea");
        if (textarea) textarea.value = review.content || "";

        // [C] 기존 별점 불빛 복구
        if (review.rating) {
            setRatingStars(Math.floor(review.rating));
        }

        // [D] 기존 혼잡도 아이콘 복구
        if (review.congestionLevel) {
            setCongestionLevel(review.congestionLevel);
        }

        // [E] 기존 첨부 이미지 복구
        if (review.reviewImageUrl && review.reviewImageUrl !== "NULL") {
            uploadedImageUrl = review.reviewImageUrl;
            const btnFile = document.getElementById("btn-file-dummy");
            if (btnFile) btnFile.textContent = "사진 업로드 완료 (1/1)";
        }

    } catch (error) {
        console.error("기존 후기 수신 실패:", error);
        // 비상 모드: 단건 조회가 실패 시, 주현님 백엔드 명세에 맞춰 마이리뷰 목록에서 찾아서 임시 연동 방어벽 작동 가능
        fetchFallbackFromMyList(reviewId);
    }
}

/**
 * 🛡️ 단건조회 API가 마땅치 않을 때를 대비한 마이리뷰 목록 검색 방어 엔진
 */
async function fetchFallbackFromMyList(reviewId) {
    const loginUser = JSON.parse(localStorage.getItem("loginUser"));
    const userId = loginUser.userId || loginUser.id;
    try {
        const response = await fetch(`${API_BASE_URL}/reviews/me?user_id=${userId}`);
        const list = await response.json();
        // 배열 중 내가 고른 reviewId와 딱 일치하는 알맹이 1개 적출
        const review = list.find(item => String(item.reviewId) === String(reviewId));

        if (review) {
            document.getElementById("review-textarea").value = review.content || "";
            setRatingStars(Math.floor(review.rating || 0));
            setCongestionLevel(review.congestionLevel || "LOW");
            if (review.popupTitle) document.querySelector(".target-title").textContent = review.popupTitle;
            if (review.regionName) document.querySelector(".target-location").textContent = review.regionName;
            if (review.categoryName) document.querySelector(".card-category").textContent = review.categoryName;
            if (review.popupMainImageUrl) document.querySelector(".target-thumb").src = review.popupMainImageUrl;
        }
    } catch (e) {
        console.error("폴백 방어선까지 붕괴:", e);
    }
}

/**
 * ⭐ 2. 별점 인터랙션 제어 모듈
 */
function initRatingInteraction() {
    const stars = document.querySelectorAll("#stars-container .star-btn");
    stars.forEach(star => {
        star.addEventListener("click", () => {
            const val = parseInt(star.getAttribute("data-value"), 10);
            setRatingStars(val);
        });
    });
}

function setRatingStars(rating) {
    selectedRating = rating;
    document.getElementById("score-text").textContent = `${rating}.0`;

    const stars = document.querySelectorAll("#stars-container .star-btn");
    stars.forEach(star => {
        const starVal = parseInt(star.getAttribute("data-value"), 10);
        if (starVal <= rating) {
            star.src = "/assets/images/icons/icon-star-fill.png";
        } else {
            star.src = "/assets/images/icons/icon-star-empty.png";
        }
    });
}

/**
 * 👥 3. 혼잡도 아이콘 인터랙션 제어 모듈
 */
function initCongestionInteraction() {
    const icons = document.querySelectorAll("#mainCongestionIcons .btn-congestion");
    icons.forEach(icon => {
        icon.addEventListener("click", () => {
            const level = icon.getAttribute("data-level");
            setCongestionLevel(level);
        });
    });
}

function setCongestionLevel(level) {
    selectedCongestion = level;
    const txt = document.getElementById("congestion-text");

    // 글로벌 테마에 맞춰 레이블 및 서체 칼라 분기 변경
    if (level === "LOW") { txt.textContent = "낮음"; txt.className = "status-text-blue"; }
    else if (level === "NORMAL") { txt.textContent = "보통"; txt.className = "status-text-green"; }
    else if (level === "HIGH") { txt.textContent = "높음"; txt.className = "status-text-red"; }

    const icons = document.querySelectorAll("#mainCongestionIcons .btn-congestion");

    // 사람 모양 3칸짜리 게이지 동적 계산
    let activeThreshold = 1;
    if (level === "NORMAL") activeThreshold = 2;
    if (level === "HIGH") activeThreshold = 3;

    icons.forEach((icon, idx) => {
        if (idx < activeThreshold) {
            icon.src = "/assets/images/icons/icon-person-fill.png";
        } else {
            icon.src = "/assets/images/icons/icon-person-empty.png";
        }
    });
}

/**
 * 📸 4. 파일 업로드 더미 인터랙션 처리 (기존 쓰기 스펙 유지)
 */
function initFileUpload() {
    const fileInput = document.getElementById("review-file-input");
    const btnDummy = document.getElementById("btn-file-dummy");

    if (!fileInput || !btnDummy) return;

    btnDummy.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            // 이미지 업로드가 성공했다고 가정하고 더미 밸류 세팅 (실무에선 S3나 서버 이미지 업로드 엔드포인트 통신 후 링크 반환값 대입)
            uploadedImageUrl = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=80";
            btnDummy.textContent = "사진 업로드 완료 (1/1)";
        } else {
            uploadedImageUrl = null;
            btnDummy.textContent = "눌러서 사진 올리기 (0/1)";
        }
    });
}

/**
 * 🚀 5. [수정 요청 완료 버튼] 백엔드 송신 엔진
 */
async function submitUpdatedReview(userId) {
    const contentText = document.getElementById("review-textarea").value.trim();

    if (selectedRating === 0) {
        alert("별점 평점을 선택해 주세요!");
        return;
    }
    if (!selectedCongestion) {
        alert("현장 혼잡도를 선택해 주세요!");
        return;
    }
    if (contentText === "") {
        alert("후기 내용을 작성해 주세요!");
        return;
    }

    // 💡 백엔드 명세와 정확히 일치하는 Request Body 데이터 패키징
    const requestBody = {
        userId: userId,
        content: contentText,
        rating: selectedRating,
        congestionLevel: selectedCongestion,
        reviewImageUrl: uploadedImageUrl
    };

    // 제공해주신 수정을 위한 엔드포인트 매핑 주소 사용
    const submitUrl = `${API_BASE_URL}/reviews/${currentReviewId}`;

    try {
        // 수정할 때는 백엔드 관례에 맞게 METHOD 분기 처리 (기본 명세서가 PATCH/PUT/POST 중 무엇이든 수용하도록 설정)
        // 보편적으로 부분 수정은 'PUT' 또는 'PATCH'를 주로 사용합니다.
        const response = await fetch(submitUrl, {
            method: "PUT", // 💡 백엔드 규격이 다르면 PATCH 혹은 POST로 수정 가능합니다
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error("리뷰 수정 통신 실패");

        const result = await response.json();

        if (result.success || response.status === 200) {
            alert(result.message || "리뷰가 성공적으로 수정되었습니다.");
            // 수정이 끝나면 기분 좋게 나의 마이페이지 후기 탭으로 복귀 처리
            window.location.href = "/pages/mypage.html";
        } else {
            alert("후기 수정 처리에 실패했습니다. 다시 시도해 주세요.");
        }

    } catch (error) {
        console.error("수정 요청 에러:", error);
        alert("서버 통신 중 오류가 발생했습니다.");
    }
}