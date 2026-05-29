document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const popupId = Number(urlParams.get("id")) || 1; // 비교를 위해 숫자로 변환

    // 로컬스토리지에서 로그인 정보 가져오기
    const loginUserString = localStorage.getItem("loginUser");
    let userId = null;
    if (loginUserString) {
        try {
            const loginUser = JSON.parse(loginUserString);
            userId = loginUser.userId;
        } catch (e) {
            console.error("로컬스토리지 파싱 에러:", e);
        }
    }

    // DOM 요소 선택
    const popupMainThumb = document.getElementById("popup-main-thumb");
    const popupCategory = document.getElementById("popup-category");
    const popupTitle = document.getElementById("popup-title");
    const popupPeriod = document.getElementById("popup-period");
    const popupLocation = document.getElementById("popup-location");
    const popupHours = document.getElementById("popup-hours");
    const popupIntro = document.getElementById("popup-intro");
    const popupStars = document.getElementById("popup-stars");
    const popupRatingScore = document.getElementById("popup-rating-score");
    const popupReviewCount = document.getElementById("popup-review-count");
    const wishBtn = document.getElementById("wish-toggle-btn");
    const heartIcon = document.getElementById("heart-icon");
    const wishCountSpan = document.getElementById("wish-count");

    // 1. 하트 아이콘 업데이트 함수
    function updateHeartIcon(isWished) {
        if (!heartIcon) return;
        heartIcon.src = isWished
            ? "/assets/images/icons/icon-heart-fill.png"
            : "/assets/images/icons/icon-heart-empty.png";
    }

    // 2. 찜하기 버튼 클릭 이벤트
    if (wishBtn) {
        wishBtn.addEventListener("click", () => {
            if (!userId) {
                alert("로그인이 필요합니다.");
                return;
            }

            fetch(`http://localhost:8080/api/wishlists/popups/${popupId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: userId })
            })
                .then(res => res.json())
                .then(data => {
                    updateHeartIcon(data.isWished);

                    // 찜 개수 동기화를 위해 다시 전체 찜 목록 조회
                    return fetch(`http://localhost:8080/api/wishlists/popups/${popupId}`);
                })
                .then(res => res.json())
                .then(allWishList => {
                    if (wishCountSpan && Array.isArray(allWishList)) {
                        wishCountSpan.innerText = allWishList.length;
                    }
                })
                .catch(err => console.error("찜하기 처리 오류:", err));
        });
    }

    // 3. 팝업 상세 데이터 및 찜 상태 로드
    const fetchPromises = [
        fetch(`http://localhost:8080/api/popups/${popupId}`).then(res => res.json()),
        fetch(`http://localhost:8080/api/wishlists/popups/${popupId}`).then(res => res.json())
    ];

    // 로그인한 경우에만 내 찜 목록 추가 호출
    if (userId) {
        fetchPromises.push(
            fetch(`http://localhost:8080/api/wishlists/me?user_id=${userId}`).then(res => res.json())
        );
    }

    Promise.all(fetchPromises)
        .then(results => {
            const [popup, allWishList, myWishList] = results;

            // 상세 정보 렌더링
            if (popupMainThumb) {
                const mainUrl = popup.mainImageUrl || "";
                popupMainThumb.src = mainUrl.startsWith("/") ? `http://localhost:8080${mainUrl}` : mainUrl;
            }
            if (popupCategory) popupCategory.innerText = popup.categoryName || "미지정";
            if (popupTitle) popupTitle.innerText = popup.title;
            if (popupPeriod) popupPeriod.innerText = `${popup.startDate.split('T')[0]} ~ ${popup.endDate.split('T')[0]}`;
            if (popupLocation) popupLocation.innerText = popup.address;
            if (popupHours) popupHours.innerText = popup.operatingHours || "10:00 ~ 22:00";
            if (popupIntro) popupIntro.innerText = popup.info || "";

            // 별점 및 기타 렌더링
            if (popupStars) {
                popupStars.innerHTML = "";
                const score = Math.round(popup.avgRating || 0);
                for (let i = 1; i <= 5; i++) {
                    const img = document.createElement("img");
                    img.style.width = "20px"; img.style.height = "20px";
                    img.src = i <= score ? "/assets/images/icons/icon-star-fill.png" : "/assets/images/icons/icon-star-empty.png";
                    popupStars.appendChild(img);
                }
            }
            if (popupRatingScore) popupRatingScore.innerText = `${(popup.avgRating || 0).toFixed(1)} / 5.0`;
            if (popupReviewCount) {
                popupReviewCount.innerText = `후기 ${popup.reviewCount || 0}개`;
                popupReviewCount.href = `/pages/review.html?popupId=${popupId}`;
            }

            // 찜 카운트 표시 (전체 찜 목록 기준)
            if (wishCountSpan && Array.isArray(allWishList)) {
                wishCountSpan.innerText = allWishList.length;
            }

            // 로그인 상태일 때, 내 찜 목록에 현재 popupId가 포함되어 있는지 확인
            if (userId && Array.isArray(myWishList)) {
                const isAlreadyWished = myWishList.some(item => item.popupId === popupId);
                updateHeartIcon(isAlreadyWished);
            } else {
                updateHeartIcon(false);
            }
        })
        .catch(err => console.error("데이터 로드 실패:", err));
});