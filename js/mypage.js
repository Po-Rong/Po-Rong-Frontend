document.addEventListener('DOMContentLoaded', function () {

    const loginUserStr = localStorage.getItem('loginUser');

    if (!loginUserStr) {
        alert('잘못된 접근입니다. 로그인을 먼저 해주세요.');
        window.location.href = '/pages/login.html';
        return;
    }

    const loginUser = JSON.parse(loginUserStr);

    const profileDisplayName = document.getElementById('profile-display-name');
    const bioDisplayName = document.getElementById('bio-display-name');

    if (profileDisplayName) {
        profileDisplayName.textContent = loginUser.nickname + '님, 반가워요!';
    }
    if (bioDisplayName) {
        bioDisplayName.textContent = loginUser.nickname;
    }

    const currentUserId = loginUser.userId || loginUser.id;

    fetchMyWishlist(currentUserId);
    fetchMyReviews(currentUserId);
    fetchMyReservations(currentUserId);
    fetchMyKeyrings(currentUserId);

    const tabWishlist = document.getElementById('tab-wishlist');
    const tabReviews = document.getElementById('tab-reviews');
    const wishlistGrid = document.getElementById('wishlist-grid');
    const reviewsGrid = document.getElementById('reviews-grid');
    const section = document.getElementById('wishlist-section');

    if (tabWishlist && tabReviews && wishlistGrid && reviewsGrid) {
        tabWishlist.addEventListener('click', function () {
            tabWishlist.classList.add('active');
            tabReviews.classList.remove('active');
            wishlistGrid.style.display = 'grid';
            reviewsGrid.style.display = 'none';
        });

        tabReviews.addEventListener('click', function () {
            tabReviews.classList.add('active');
            tabWishlist.classList.remove('active');
            wishlistGrid.style.display = 'none';
            reviewsGrid.style.display = 'grid';
        });
    }

    const btnScrollWishlist = document.getElementById('btn-scroll-wishlist');
    const btnScrollReviews = document.getElementById('btn-scroll-reviews');

    if (btnScrollWishlist) {
        btnScrollWishlist.addEventListener('click', function (e) {
            e.preventDefault();
            tabWishlist.click();
            section?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (btnScrollReviews) {
        btnScrollReviews.addEventListener('click', function (e) {
            e.preventDefault();
            tabReviews.click();
            section?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    const nicknameModal = document.getElementById('nickname-modal');
    const btnOpenModal = document.getElementById('btn-open-nickname-modal');
    const btnCloseModal = document.getElementById('btn-close-nickname-modal');
    const btnSaveNickname = document.getElementById('btn-save-nickname');
    const inputNicknameField = document.getElementById('input-nickname-field');

    if (btnOpenModal) {
        btnOpenModal.addEventListener('click', function () {
            nicknameModal.classList.add('active');
            inputNicknameField.focus();
        });
    }

    function closeModal() {
        if (nicknameModal && inputNicknameField) {
            nicknameModal.classList.remove('active');
            inputNicknameField.value = '';
        }
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', closeModal);
    }

    if (nicknameModal) {
        nicknameModal.addEventListener('click', function (e) {
            if (e.target === nicknameModal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nicknameModal && nicknameModal.classList.contains('active')) {
            closeModal();
        }
    });

    async function saveNickname() {
        const newNickname = inputNicknameField.value.trim();

        if (newNickname === '') {
            alert('닉네임을 입력해 주세요!');
            inputNicknameField.focus();
            return;
        }

        const apiUrl = `http://localhost:8080/api/users/${loginUser.userId}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nickname: newNickname
                })
            });

            if (!response.ok) {
                throw new Error('닉네임 변경 요청이 실패했습니다.');
            }

            if (profileDisplayName) {
                profileDisplayName.textContent = newNickname + '님, 반가워요!';
            }
            if (bioDisplayName) {
                bioDisplayName.textContent = newNickname;
            }

            loginUser.nickname = newNickname;
            localStorage.setItem('loginUser', JSON.stringify(loginUser));

            if (typeof updateHeader === 'function') {
                updateHeader();
            }

            alert('닉네임이 변경되었습니다.');
            closeModal();

        } catch (error) {
            console.error(error);
            alert('닉네임 변경 중 오류가 발생했습니다. 다시 시도해 주세요.');
        }
    }

    if (btnSaveNickname) {
        btnSaveNickname.addEventListener('click', saveNickname);
    }

    if (inputNicknameField) {
        inputNicknameField.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                saveNickname();
            }
        });
    }
    const reservationModal = document.getElementById('reservation-modal');
    const btnCloseResModal = document.getElementById('btn-close-reservation-modal');

    if (btnCloseResModal) {
        btnCloseResModal.addEventListener('click', () => {
            reservationModal.classList.remove('active');
        });
    }
});

async function fetchMyWishlist(userId) {
    const apiUrl = `http://localhost:8080/api/wishlists/me?user_id=${userId}`;
    const countEl = document.getElementById('count-wishlist');

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error();

        const dataList = await response.json();

        if (countEl) countEl.textContent = dataList.length;
        renderWishlist(dataList);
    } catch (error) {
        if (countEl) countEl.textContent = '0';
        const grid = document.getElementById('wishlist-grid');
        if (grid) {
            grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; padding:40px; color:#999;">찜한 팝업스토어가 없습니다.</p>`;
        }
    }
}

function renderWishlist(dataList) {
    const grid = document.getElementById('wishlist-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!dataList || dataList.length === 0) {
        grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; padding:40px; color:#999;">찜한 팝업스토어가 없습니다.</p>`;
        return;
    }

    dataList.forEach(item => {
        let statusClass = 'is-running';
        let statusText = '운영중';
        if (item.status === 'upcoming') { statusClass = 'is-upcoming'; statusText = '운영예정'; }
        else if (item.status === 'closed') { statusClass = 'is-closed'; statusText = '운영마감'; }

        let imageUrl = item.mainImageUrl || item.main_image_url || '/assets/images/dummies/thumb-dummy01.png';
        if (imageUrl.startsWith("/")) imageUrl = `http://localhost:8080${imageUrl}`;

        const cardHtml = `
            <div class="popup-card leisure-card" onclick="location.href='/pages/popup-detail.html?id=${item.popupId || item.id}'" style="cursor: pointer;">
                <div class="card-image-wrap">
                    <img src="${imageUrl}" alt="팝업 썸네일" class="card-thumb" />
                </div>
                <div class="card-body-wrap">
                    <div class="card-info">
                        <span class="card-status ${statusClass}">${statusText}</span>
                        <h3 class="card-title">${item.title || '제목 없음'}</h3>
                        <p class="card-location">${item.regionName || '지역 없음'}</p>
                        <p class="card-date">${item.startDate ? item.startDate.split('T')[0] : ''} - ${item.endDate ? item.endDate.split('T')[0] : ''}</p>
                        <span class="card-category">${item.categoryName || '카테고리'}</span>
                    </div>
                </div>
            </div>
        `;
        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

async function fetchMyReviews(userId) {
    const apiUrl = `http://localhost:8080/api/reviews/me?user_id=${userId}`;
    const countEl = document.getElementById('count-reviews');

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error();

        const dataList = await response.json();

        if (countEl) countEl.textContent = dataList.length;
        renderMyReviews(dataList);
    } catch (error) {
        if (countEl) countEl.textContent = '0';
        const grid = document.getElementById('reviews-grid');
        if (grid) {
            grid.innerHTML = `<p style="text-align:center; grid-column:1/-1; padding:40px; color:#999;">작성한 후기가 없습니다.</p>`;
        }
    }
}

// 나의 리뷰 렌더링
function renderMyReviews(dataList) {
    const reviewGridContainer = document.getElementById('reviews-grid');
    if (!reviewGridContainer) return;
    reviewGridContainer.innerHTML = "";

    if (!dataList || dataList.length === 0) {
        reviewGridContainer.innerHTML = `<p class="no-data-msg" style="grid-column:1/-1; text-align:center; padding:40px; color:#999;">작성한 후기가 없습니다.</p>`;
        return;
    }

    dataList.forEach((review) => {
        const formattedReviewDate = review.createdAt || "날짜 없음";

        // 별점 계산
        let starsHtml = "";
        const score = Math.floor(review.rating || 0);
        for (let i = 1; i <= 5; i++) {
            starsHtml += i <= score
                ? `<img src="/assets/images/icons/icon-star-fill.png" alt="별">`
                : `<img src="/assets/images/icons/icon-star-empty.png" alt="빈 별">`;
        }

        // 혼잡도 뱃지 계산 및 사람 아이콘 이식
        let fillCount = 1;
        let congestionText = "낮음";
        if (review.congestionLevel === "NORMAL") { fillCount = 2; congestionText = "보통"; }
        if (review.congestionLevel === "HIGH") { fillCount = 3; congestionText = "높음"; }

        let peopleHtml = "";
        for (let i = 1; i <= 3; i++) {
            peopleHtml += i <= fillCount
                ? `<img src="/assets/images/icons/icon-person-fill.png" alt="사람 채움">`
                : `<img src="/assets/images/icons/icon-person-empty.png" alt="사람 비움">`;
        }

        let attachBoxHtml = "";
        let noImageClass = "";
        if (review.reviewImageUrl && review.reviewImageUrl !== "NULL") {
            attachBoxHtml = `
                <div class="review-attach-box">
                    <img src="${review.reviewImageUrl}" alt="리뷰 첨부 사진" class="review-attached-img" />
                </div>
            `;
        } else {
            noImageClass = "has-no-image";
        }

        // 팝업스토어 상태 값 테마 클래스 스위치
        let statusBadgeClass = "is-running";
        if (review.popupStatus === "오픈 예정" || review.popupStatus === "upcoming") statusBadgeClass = "is-upcoming";
        if (review.popupStatus === "운영 마감" || review.popupStatus === "종료" || review.popupStatus === "closed") statusBadgeClass = "is-closed";
        const displayStatusText = review.popupStatus || "운영중";

        const reviewHtml = `
            <div class="review-card ${noImageClass}" data-review-id="${review.reviewId}" onclick="location.href='/pages/popup-detail.html?id=${review.popupId}'" style="cursor:pointer;">
                
                <div class="review-card-header">
                    <div class="review-header-left">
                        <span class="reviewer-name">${review.nickname || '나'}</span>
                        <span class="review-date">${formattedReviewDate} 방문</span>
                    </div>
                    
                    <div class="review-more-menu-wrap" onclick="event.stopPropagation();">
                        <button class="btn-review-more" onclick="event.stopPropagation(); toggleReviewMenu(this)">•••</button>
                        <div class="review-menu-dropdown">
                            <button class="menu-edit-btn" onclick="location.href='/pages/review-edit.html?reviewId=${review.reviewId}'">리뷰 수정하기</button>
                        </div>
                    </div>
                </div>
                
                <div class="review-stats-row">
                    <div class="rating-wrap" style="display:flex; align-items:center;">
                        <div class="rating-stars">${starsHtml}</div>
                        <span class="rating-num" style="margin-left:6px;">${parseFloat(review.rating).toFixed(1)}</span>
                        <span style="margin:0 2px;">/</span>
                        <span class="rating-max">5.0</span>
                    </div>
                    <div class="congestion-wrap" style="display:flex; align-items:center; margin-top:4px;">
                        <div class="congestion-icons">${peopleHtml}</div>
                        <span class="congestion-text" style="margin-left:6px;">혼잡도</span>
                        <span class="congestion-strong" style="margin-left:4px;">${congestionText}</span>
                    </div>
                </div>
                
                <div class="review-content">
                    <p>${review.content}</p>
                </div>
                ${attachBoxHtml} 
                <div class="review-target-popup">
                    <div class="target-thumb-wrap">
                        <img src="${review.popupMainImageUrl || '/assets/images/dummies/thumb-dummy01.png'}" alt="팝업 미니 썸네일" class="target-thumb" />
                    </div>
                    <div class="target-info-wrap">
                        <div class="target-tags">
                            <span class="card-category" style="padding:2px 6px; font-size:11px;">${review.categoryName || '기타'}</span>
                            <span class="card-status ${statusBadgeClass}" style="padding:2px 6px; font-size:11px;">${displayStatusText}</span>
                        </div>
                        <h4 class="target-title">${review.popupTitle}</h4>
                        <p class="target-location">${review.regionName || '지역 정보 없음'}</p>
                    </div>
                </div>
            </div>
        `;
        reviewGridContainer.insertAdjacentHTML("beforeend", reviewHtml);
    });
}

// ... 버튼 드롭다운 함수
function toggleReviewMenu(button) {
    // 모든 드롭다운 일단 다 닫기 처리
    document.querySelectorAll('.review-menu-dropdown').forEach(menu => {
        if (menu !== button.nextElementSibling) menu.classList.remove('show');
    });
    // 현재 누른 버튼의 드롭다운만 토글
    const currentMenu = button.nextElementSibling;
    if (currentMenu) {
        currentMenu.classList.toggle('show');
    }
}

// 화면 아무데나 누르면 열려있던 드롭다운 부드럽게 닫기
document.addEventListener('click', () => {
    document.querySelectorAll('.review-menu-dropdown').forEach(menu => menu.classList.remove('show'));
});

async function fetchMyReservations(userId) {
    const apiUrl = `http://localhost:8080/api/reservations/me?user_id=${userId}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error();

        const dataList = await response.json();
        renderMyReservations(dataList);
    } catch (error) {
        const container = document.getElementById('reservation-timeline-container');
        if (container) {
            container.innerHTML = `<p style="text-align: center; color: #999; padding: 20px;">예약 내역이 없습니다.</p>`;
        }
    }
}

function renderMyReservations(dataList) {
    const container = document.getElementById('reservation-timeline-container');
    if (!container) return;
    container.innerHTML = '';

    if (!dataList || dataList.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: #999; padding: 20px;">예약 내역이 없습니다.</p>`;
        return;
    }

    dataList.forEach(item => {
        let dateBadge = '날짜 미정';
        let dateStr = '';
        let timeStr = '';

        if (item.reserveDate) {
            const parts = item.reserveDate.split(' ');
            dateStr = parts[0];

            if (parts[1]) {
                const timeParts = parts[1].split(':');
                let hour = parseInt(timeParts[0], 10);
                const ampm = hour >= 12 ? '오후' : '오전';
                if (hour > 12) hour -= 12;
                if (hour === 0) hour = 12;
                timeStr = `${ampm} ${hour}:${timeParts[1]}`;
            }

            const dateObj = new Date(dateStr);
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            dateBadge = `${dateObj.getMonth() + 1}.${dateObj.getDate()} ${days[dateObj.getDay()]}`;
        }

        let actionButtonHtml = '';
        if (item.status === 'CANCELED') {
            actionButtonHtml = `<button class="btn-reservation-action" disabled>예약 취소됨</button>`;
        } else {
            let isPassed = false;
            if (item.reserveDate) {
                const reserveTime = new Date(item.reserveDate.replace(' ', 'T'));
                const now = new Date();
                isPassed = reserveTime < now;
            }

            if (isPassed) {
                actionButtonHtml = `<button class="btn-reservation-action" onclick="location.href='/pages/review-write.html?popupId=${item.popupId}&reservationId=${item.id}'">후기 쓰기</button>`;
            } else {
                actionButtonHtml = `<button class="btn-reservation-action" onclick="openReservationModal(${JSON.stringify(item).replace(/"/g, '&quot;')})">예약 확인하기</button>`;
            }
        }

        const html = `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-date">${dateBadge}</div>
                <div class="timeline-card">
                    <h4 class="timeline-card-title">${item.popupTitle || '산리오 팝업스토어'}</h4>
                    <p class="timeline-card-time">${dateStr} | ${timeStr} 예약</p>
                    ${actionButtonHtml}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

async function fetchMyKeyrings(userId) {
    const apiUrl = `http://localhost:8080/api/collections/me?user_id=${userId}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error();

        const dataList = await response.json();
        renderMyKeyrings(dataList);
    } catch (error) {
        console.error(error);
    }
}

function renderMyKeyrings(dataList) {
    const grid = document.querySelector('.keyring-grid');
    if (!grid) return;

    // 슬롯 규격 선언
    const keyringSlots = [
        { id: 1, tag: '팝업 새내기', desc: '리뷰 1회 작성' },
        { id: 2, tag: '팝업 기록자', desc: '리뷰 2회 작성' },
        { id: 3, tag: '취향 수집가', desc: '리뷰 3회 작성' },
        { id: 4, tag: '팝업 탐험가', desc: '리뷰 4회 작성' },
        { id: 5, tag: '팝업 요정', desc: '리뷰 5회 작성' }
    ];

    grid.innerHTML = '';

    keyringSlots.forEach((slot) => {
        const earnedKeyring = dataList && Array.isArray(dataList)
            ? dataList.find(item => Number(item.keyringId) === slot.id)
            : null;

        let cardHtml = '';

        if (earnedKeyring) {
            let imageUrl = earnedKeyring.keyringImageUrl;

            if (imageUrl && imageUrl.startsWith("/assets/")) {
                imageUrl = imageUrl;
            } else if (imageUrl && imageUrl.startsWith("/")) {
                imageUrl = `http://localhost:8080${imageUrl}`;
            }

            // 획득한 키링 카드 출력
            cardHtml = `
                <div class="keyring-card">
                    <div class="keyring-img-box" style="width: 140px; height: 140px; display: flex; justify-content: center; align-items: center; margin: 0 auto;">
                        <img src="${imageUrl}" alt="${slot.tag} 키링" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
                    </div>
                    <div class="keyring-text-group">
                        <span class="keyring-tag" style="border-color: #9C8CF2; color: #4C4C4C;">${slot.tag}</span>
                        <span class="keyring-desc" style="color: #4C4C4C;">${slot.desc}</span>
                    </div>
                </div>
            `;
        } else {
            // 아직 획득하지 못한 잠금 슬롯 상태 유지
            cardHtml = `
                <div class="keyring-card locked">
                    <div class="keyring-circle empty-state"></div>
                    <div class="keyring-text-group">
                        <span class="keyring-tag">${slot.tag}</span>
                        <span class="keyring-desc">${slot.desc}</span>
                    </div>
                </div>
            `;
        }

        grid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function openReservationModal(item) {
    const detailInfo = document.getElementById('reservation-detail-info');
    const thumbUrl = item.mainImageUrl || '/assets/images/dummies/thumb-dummy01.png';
    const currentUser = JSON.parse(localStorage.getItem('loginUser'));
    const userId = currentUser ? currentUser.userId : null;

    detailInfo.innerHTML = `
        <div class="popup-info-box">
            <img src="${thumbUrl}" alt="팝업 이미지" class="popup-thumb" />
            <span class="popup-title">${item.popupTitle}</span>
        </div>
        <div class="reservation-info">
            <p><strong>${item.userName || '이름 없음'} 님</strong></p>
            <p>전화번호: ${item.userPhone || '번호 없음'}</p>
            <p>예약한 시간: ${item.reserveDate}</p>
        </div>
        
        <div class="modal-actions">
            <button class="btn-edit" onclick="location.href='/pages/reservation.html?id=${item.popupId}?reservation_id=${item.id}'">예약 수정하기</button>
            <button class="btn-cancel" onclick="cancelReservation(${item.id}, ${userId})">예약 취소하기</button>
        </div>
    `;

    document.getElementById('reservation-modal').classList.add('active');
}

async function cancelReservation(reservationId, userId) {
    if (!confirm('정말 예약을 취소하시겠습니까?')) return;

    const apiUrl = `http://localhost:8080/api/reservations/${reservationId}/cancel`;

    try {
        const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId // 로그인한 사용자의 ID 전달
            })
        });

        if (response.ok) {
            alert('예약이 성공적으로 취소되었습니다.');
            location.reload(); // 페이지를 새로고침하여 상태 업데이트
        } else {
            alert('예약 취소에 실패했습니다. 다시 시도해 주세요.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('서버 오류가 발생했습니다.');
    }
}