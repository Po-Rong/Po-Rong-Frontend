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

    // 하트 아이콘 업데이트 함수
    function updateHeartIcon(isWished) {
        if (!heartIcon) return;
        heartIcon.src = isWished
            ? "/assets/images/icons/icon-heart-fill.png"
            : "/assets/images/icons/icon-heart-empty.png";
    }

    // 찜하기 버튼 클릭 이벤트
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

    // 팝업 상세 데이터 및 찜 상태 로드
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
            const popupReservationPeriod = document.getElementById("popup-reservation-period");

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
            if (popupIntro) {
                const infoText = popup.info || "";
                popupIntro.innerText = infoText.replace(/\\n/g, "\n");
            }

            if (popupPeriod) popupPeriod.innerText = `${popup.startDate.split('T')[0]} ~ ${popup.endDate.split('T')[0]}`;

            // 예약 기간 조건부 데이터 렌더링 로직 추가
            if (popupReservationPeriod) {
                if (popup.reservationStartDate && popup.reservationEndDate) {
                    const resStart = popup.reservationStartDate.replace('T', ' ');
                    const resEnd = popup.reservationEndDate.replace('T', ' ');
                    popupReservationPeriod.innerText = `${resStart} ~ ${resEnd}`;
                } else {
                    popupReservationPeriod.innerText = "예약 일정 정보가 없습니다.";
                    popupReservationPeriod.style.color = "#999999";
                    // 정보가 없을 때 흐리게 처리
                }
            }

            // 혜택 렌더링
            const popupBenefit = document.getElementById("popup-benefit");
            if (popupBenefit) {
                const benefitText = popup.benefit || popup.benefits || "등록된 혜택이 없습니다.";
                popupBenefit.innerText = benefitText.replace(/\\n/g, "\n");
            }

            // 공지사항 렌더링
            const popupNotice = document.getElementById("popup-notice");
            if (popupNotice) {
                const noticeText = popup.notice || "등록된 공지사항이 없습니다.";
                popupNotice.innerText = noticeText.replace(/\\n/g, "\n");
            }

            // 태그 렌더링
            const popupTags = document.getElementById("popup-tags");
            if (popupTags) {
                popupTags.innerHTML = "";
                const tags = popup.tags || [];
                if (tags && tags.length > 0) {
                    tags.forEach(tag => {
                        const span = document.createElement("span");
                        span.className = "badge-category";
                        span.style.marginRight = "6px";
                        span.style.display = "inline-block";
                        span.innerText = tag.startsWith("#") ? tag : `#${tag}`;
                        popupTags.appendChild(span);
                    });
                } else {
                    popupTags.innerText = "등록된 태그가 없습니다.";
                }
            }

            // SNS 렌더링
            const popupSns = document.getElementById("popup-sns");
            if (popupSns) {
                const snsUrl = popup.snsUrl || popup.sns_url;
                if (snsUrl) {
                    popupSns.href = snsUrl;
                    popupSns.style.display = "inline-block";
                } else {
                    popupSns.style.display = "none";
                    popupSns.parentElement.innerHTML = "<span class='meta-value'>등록된 SNS가 없습니다.</span>";
                }
            }

            // 상세 이미지 렌더링
            const imageWrapper = document.querySelector(".long-image-wrapper");
            if (imageWrapper) {
                imageWrapper.innerHTML = "";
                const images = popup.detailImages || popup.popupImages || popup.images;
                if (images && images.length > 0) {
                    images.forEach(imageUrl => {
                        const src = typeof imageUrl === "string" ? imageUrl : (imageUrl.detailImageUrl || imageUrl.detail_image_url || imageUrl.imageUrl || imageUrl.url);
                        if (src) {
                            const img = document.createElement("img");
                            img.src = src.startsWith("/") ? `http://localhost:8080${src}` : src;
                            img.alt = "팝업 상세 이미지";
                            img.style.width = "100%";
                            img.style.maxWidth = "480px";
                            img.style.display = "block";
                            img.style.margin = "0 auto";
                            imageWrapper.appendChild(img);
                        }
                    });
                } else {
                    imageWrapper.innerHTML = "<p style='color: #999; text-align: center; padding: 20px;'>등록된 상세 이미지가 없습니다.</p>";
                }
            }

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
            const reservationBtn = document.querySelector('.reservation-btn');
            if (reservationBtn) {
                const now = new Date();
                const resStartDate = popup.reservationStartDate ? new Date(popup.reservationStartDate.replace(' ', 'T')) : null;
                const resEndDate = popup.reservationEndDate ? new Date(popup.reservationEndDate.replace(' ', 'T')) : null;

                // 기존 상태 초기화
                reservationBtn.classList.remove('disabled', 'ended');

                if (resStartDate && now < resStartDate) {
                    // 아직 예약 오픈 전
                    reservationBtn.removeAttribute('href');
                    reservationBtn.innerText = "예약 오픈 대기중";
                    reservationBtn.classList.add('disabled');
                } else if (resEndDate && now > resEndDate) {
                    // 예약 마감 완료
                    reservationBtn.removeAttribute('href');
                    reservationBtn.innerText = "예약 기간 마감";
                    reservationBtn.classList.add('ended');
                } else {
                    // 예약 가능
                    reservationBtn.href = `/pages/reservation.html?id=${popupId}`;
                    reservationBtn.innerText = "예약하러 가기";
                }
            }

            // 지도 초기화 함수 호출
            if (typeof initKakaoMap === "function") {
                initKakaoMap(popup);
            }
        })
        .catch(err => console.error("데이터 로드 실패:", err));
});