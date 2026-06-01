/* ==========================================================================
   1. DOM 로드 완료 후 초기 실행
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPopupId = urlParams.get('popupId') || 11;

    fetchReviewsData(currentPopupId);
    initImageModal();
    initRatingPrompt(currentPopupId);
});

/* ==========================================================================
   2. API 비동기 통신 함수
   ========================================================================== */
let currentPopupDetails = null;

async function fetchReviewsData(popupId) {
    const reviewsApiUrl = `http://localhost:8080/api/popups/${popupId}/reviews?sort=rating_high`;
    const popupDetailUrl = `http://localhost:8080/api/popups/${popupId}`
    const congestionApiUrl = `http://localhost:8080/api/popups/${popupId}/congestion`;

    try {
        const [reviewsRes, popupRes, congestionRes] = await Promise.all([
            fetch(reviewsApiUrl),
            fetch(popupDetailUrl),
            fetch(congestionApiUrl)
        ]);

        const reviewsList = await reviewsRes.json();
        currentPopupDetails = await popupRes.json(); // 팝업 정보 저장
        const congestionData = await congestionRes.json();

        renderUpperDashboard(reviewsList, congestionData);
        renderReviews(reviewsList); // 이제 렌더링 시 currentPopupDetails 사용 가능

    } catch (error) {
        console.error("데이터 로드 오류:", error);
    }
}

/* ==========================================================================
   3. 상단 대시보드 실시간 통계 계산 및 동적 주입 함수
   ========================================================================== */
function renderUpperDashboard(dataList, congestionStats) {
    const avgScoreDisplay = document.getElementById('avgScoreDisplay');
    const avgStarsGroup = document.getElementById('avgStarsGroup');
    const mainCongestionText = document.getElementById('mainCongestionText');
    const mainCongestionIcons = document.getElementById('mainCongestionIcons');

    if (!dataList || dataList.length === 0) return;

    // 점수 계산
    const totalScore = dataList.reduce((acc, item) => acc + (item.rating ? parseInt(item.rating) : 0), 0);
    const avgScore = totalScore / dataList.length;

    if (avgScoreDisplay) avgScoreDisplay.textContent = avgScore.toFixed(1);

    // 상단 평균 별점 렌더링
    if (avgStarsGroup) {
        const roundedAvg = Math.round(avgScore);
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const src = i <= roundedAvg ? '/assets/images/icons/icon-star-fill.png' : '/assets/images/icons/icon-star-empty.png';
            starsHtml += `<img src="${src}" class="star-icon" alt="별점" />`;
        }
        avgStarsGroup.innerHTML = starsHtml;
    }

    // 상단 혼잡도 렌더링
    const congestionMap = {
        '여유': { label: '여유', count: 1 },
        '보통': { label: '보통', count: 2 },
        '혼잡': { label: '혼잡', count: 3 }
    };
    const stats = congestionMap[congestionStats.averageCongestionLevel] || { label: '-', count: 0 };

    if (mainCongestionText) mainCongestionText.textContent = stats.label;

    if (mainCongestionIcons) {
        const icons = mainCongestionIcons.querySelectorAll('.btn-congestion');
        icons.forEach((img, index) => {
            img.src = ((index + 1) <= stats.count) ?
                '/assets/images/icons/icon-person-fill.png' :
                '/assets/images/icons/icon-person-empty.png';
        });
    }
}

/* ==========================================================================
   4. 하단 후기 리스트 영역 동적 데이터 렌더러
   ========================================================================== */
function renderReviews(dataList) {
    const listGroup = document.querySelector('.reviews-list-group');
    if (!listGroup) return;

    while (listGroup.firstChild) {
        listGroup.removeChild(listGroup.firstChild);
    }

    if (dataList.length === 0) {
        listGroup.innerHTML = `<p style="text-align:center; padding: 40px; color: var(--color-text-secondary);">아직 등록된 후기가 없습니다.</p>`;
        return;
    }

    dataList.forEach(item => {
        const ratingScore = item.rating ? parseInt(item.rating) : 0;
        const userNickname = item.nickname || '포롱이';

        let formattedDate = '날짜 없음';
        if (item.reserveDate) {
            const parts = item.reserveDate.split('-');
            formattedDate = parts.length === 3 ? `${parts[0].slice(2)}.${parts[1]}.${parts[2]}` : item.reserveDate;
        }

        const congestionMap = {
            'HIGH': { label: '높음', filledCount: 3 },
            'NORMAL': { label: '보통', filledCount: 2 },
            'LOW': { label: '낮음', filledCount: 1 }
        };
        const congestionData = congestionMap[item.congestionLevel] || { label: '정보 없음', filledCount: 0 };

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const starSrc = i <= ratingScore ? '/assets/images/icons/icon-star-fill.png' : '/assets/images/icons/icon-star-empty.png';
            starsHtml += `<img src="${starSrc}" class="icon-star" alt="별" />`;
        }

        let congestionIconsHtml = '';
        for (let i = 1; i <= 3; i++) {
            const personSrc = i <= congestionData.filledCount ? '/assets/images/icons/icon-person-fill.png' : '/assets/images/icons/icon-person-empty.png';
            congestionIconsHtml += `<img src="${personSrc}" class="icon-person" alt="혼잡도" />`;
        }
        let imageContainerHtml = '';
        if (item.reviewImageUrl && item.reviewImageUrl !== 'NULL') {
            imageContainerHtml = `
                <div class="review-image-thumbnail">
                    <img src="${item.reviewImageUrl}" alt="리뷰 첨부 이미지" />
                </div>
            `;
        }
        const p = currentPopupDetails || {};
        const cardArticle = document.createElement('article');
        cardArticle.className = 'review-item-card';
        cardArticle.innerHTML = `
            <div class="review-card">
                <div class="review-card-header">
                    <span class="reviewer-name">${userNickname}</span>
                    <span class="review-date">${formattedDate}</span>
                </div>
                <div class="review-stats-row">
                    <div class="rating-wrap">
                        <div class="rating-stars">${starsHtml}</div>
                        <span class="rating-num">${ratingScore.toFixed(1)}</span><span>/</span><span class="rating-max">5.0</span>
                    </div>
                    <div class="congestion-wrap">
                        <div class="congestion-icons">${congestionIconsHtml}</div>
                        <span class="congestion-text">혼잡도</span>
                        <span class="congestion-strong">${congestionData.label}</span>
                    </div>
                </div>
                <div class="review-card-body">
                    <div class="review-text-content">
                        <p class="review-main-paragraph">${item.content || '내용 없음'}</p>
                        <button type="button" class="btn-toggle-expand">펼치기 ∨</button>
                    </div>
                    ${imageContainerHtml}
                </div>
                <div class="review-target-popup">
                    <div class="target-thumb-wrap">
                        <img src="${p.mainImageUrl || '/assets/images/dummies/thumb-dummy01.png'}" alt="팝업 썸네일" class="target-thumb" />
                    </div>
                    <div class="target-info-wrap">
                        <div class="target-tags">
                            <span class="card-category">${p.categoryName || '팝업'}</span>
                            <span class="card-status ${p.status === 'ongoing' ? 'is-running' : ''}">
                                ${p.status === 'ongoing' ? '운영중' : '종료'}
                            </span>
                        </div>
                        <h4 class="target-title">${p.title || '팝업 이름'}</h4>
                        <p class="target-location">${p.regionName || '위치 미정'}</p>
                    </div>
                </div>
            </div>
        `;

        // 펼치기 이벤트 연결
        const expandBtn = cardArticle.querySelector('.btn-toggle-expand');
        expandBtn.addEventListener('click', () => {
            const textContentBox = expandBtn.parentElement;
            const cardBody = textContentBox.parentElement;
            const textParagraph = expandBtn.previousElementSibling;
            const imageThumb = cardBody.querySelector('.review-image-thumbnail');

            const isExpanded = textParagraph.classList.toggle('is-expanded');
            cardBody.classList.toggle('is-expanded', isExpanded);
            if (imageThumb) imageThumb.classList.toggle('is-expanded', isExpanded);
            expandBtn.textContent = isExpanded ? '접기 ∧' : '펼치기 ∨';
        });

        listGroup.appendChild(cardArticle);
    });
}

/* ==========================================================================
   5. 이미지 대형 확대 모달 싱글톤 제어
   ========================================================================== */
function initImageModal() {
    const modal = document.getElementById('imageModal');
    const modalContent = document.getElementById('modalContent');
    const modalClose = document.getElementById('modalClose');

    if (!modal || !modalContent || !modalClose) return;

    document.addEventListener('click', (e) => {
        if (e.target.matches('.review-image-thumbnail img')) {
            modalContent.style.backgroundImage = `url('${e.target.src}')`;
            modal.classList.add('is-active');
        }
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('is-active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('is-active');
        }
    });
}

/* ==========================================================================
   6. 하단 평점 선택 및 작성 페이지 이동 인터랙션
   ========================================================================== */
function initRatingPrompt(popupId) {
    const starsContainer = document.getElementById('interactivePromptStars');
    if (!starsContainer) return;

    const stars = starsContainer.querySelectorAll('.prompt-star-btn');

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const currentLevel = parseInt(star.getAttribute('data-value'));
            stars.forEach((s, index) => {
                s.src = (index < currentLevel) ?
                    '/assets/images/icons/icon-star-fill.png' :
                    '/assets/images/icons/icon-star-empty.png';
            });
        });

        // star.addEventListener('click', () => {
        //     const selectedRating = star.getAttribute('data-value');
        //     window.location.href = `/pages/review-write.html?popupId=${popupId}&rating=${selectedRating}`;
        // });
    });
    starsContainer.addEventListener('mouseleave', () => {
        stars.forEach(s => {
            s.src = '/assets/images/icons/icon-star-empty.png';
        });
    });
}