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
async function fetchReviewsData(popupId) {
    const apiUrl = `http://localhost:8080/api/popups/${popupId}/reviews?sort=rating_high`;

    try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`HTTP 에러 발생! 상태 코드: ${response.status}`);
        }

        const reviewsList = await response.json();

        renderUpperDashboard(reviewsList);
        renderReviews(reviewsList);

    } catch (error) {
        console.error("백엔드 API 서버로부터 리뷰 데이터를 가져오는 중 오류가 발생했습니다:", error);

        const listGroup = document.querySelector('.reviews-list-group');
        if (listGroup) {
            listGroup.innerHTML = `<p style="text-align:center; padding: 40px; color: var(--color-text-secondary);">리뷰 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>`;
        }
    }
}

/* ==========================================================================
   3. 상단 대시보드 실시간 통계 계산 및 동적 주입 함수
   ========================================================================== */
function renderUpperDashboard(dataList) {
    const avgScoreDisplay = document.getElementById('avgScoreDisplay');
    const avgStarsGroup = document.getElementById('avgStarsGroup');
    const mainCongestionText = document.getElementById('mainCongestionText');
    const mainCongestionIcons = document.getElementById('mainCongestionIcons');

    if (!dataList || dataList.length === 0) return;

    let totalScore = 0;
    dataList.forEach(item => {
        totalScore += item.rating ? parseInt(item.rating) : 0;
    });
    const avgScore = totalScore / dataList.length;

    // 📍 정밀 보정: 다른 문자열을 덧붙이지 않고 오직 숫자만 꽂아 넣어 CSS 클래스 꼬임을 방지합니다
    if (avgScoreDisplay) {
        avgScoreDisplay.textContent = avgScore.toFixed(1);
    }

    if (avgStarsGroup) {
        const roundedAvg = Math.round(avgScore);
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<span class="star-icon ${i <= roundedAvg ? 'is-active' : ''}">★</span>`;
        }
        avgStarsGroup.innerHTML = starsHtml;
    }

    const congestionCounts = { LOW: 0, NORMAL: 0, HIGH: 0 };
    dataList.forEach(item => {
        if (item.congestionLevel && congestionCounts[item.congestionLevel] !== undefined) {
            congestionCounts[item.congestionLevel]++;
        }
    });

    let topCongestion = 'NORMAL';
    let maxCount = -1;
    for (const key in congestionCounts) {
        if (congestionCounts[key] > maxCount) {
            maxCount = congestionCounts[key];
            topCongestion = key;
        }
    }

    if (mainCongestionText) {
        if (topCongestion === 'LOW') mainCongestionText.textContent = '낮음';
        if (topCongestion === 'NORMAL') mainCongestionText.textContent = '보통';
        if (topCongestion === 'HIGH') mainCongestionText.textContent = '높음';
    }

    if (mainCongestionIcons) {
        mainCongestionIcons.querySelectorAll('.btn-congestion').forEach(btn => {
            if (btn.getAttribute('data-level') === topCongestion) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
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
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += `<span class="star-small ${i <= ratingScore ? 'active' : ''}">★</span>`;
        }

        let congestionLabel = '정보 없음';
        if (item.congestionLevel === 'HIGH') congestionLabel = '혼잡도 높음';
        if (item.congestionLevel === 'NORMAL') congestionLabel = '혼잡도 보통';
        if (item.congestionLevel === 'LOW') congestionLabel = '혼잡도 낮음';

        let imageContainerHtml = '';
        if (item.reviewImageUrl && item.reviewImageUrl !== 'NULL') {
            imageContainerHtml = `
                <div class="review-image-thumbnail">
                    <img src="${item.reviewImageUrl}" alt="리뷰 첨부 이미지" />
                </div>
            `;
        }

        let formattedDate = '날짜 정보 없음';
        if (item.reserveDate) {
            const parts = item.reserveDate.split('-');
            if (parts.length === 3) {
                const shortYear = parts[0].length === 4 ? parts[0].slice(2) : parts[0];
                const timeStr = item.reserveTime ? ` | ${item.reserveTime}` : '';
                formattedDate = `${shortYear}.${parts[1]}.${parts[2]}${timeStr} 방문`;
            } else {
                formattedDate = `${item.reserveDate} 방문`;
            }
        }

        const userNickname = item.nickname || '포롱이';

        const cardArticle = document.createElement('article');
        cardArticle.className = 'review-item-card';

        cardArticle.innerHTML = `
            <div class="review-card-header">
                <div class="user-meta-info">
                    <span class="user-name-text">${userNickname}</span>
                    <div class="card-stars-row">
                        ${starsHtml}
                        <div class="score-small-text">
                            <span class="score-num-current">${ratingScore.toFixed(1)}</span>
                            <span class="score-num-max"> / 5.0</span>
                        </div>
                    </div>
                    <div class="badge-row">
                        <span class="badge-congestion-info">${congestionLabel}</span>
                    </div>
                </div>
                <span class="review-date-text">${formattedDate}</span>
            </div>

            <div class="review-card-body">
                <div class="review-text-content">
                    <p class="review-main-paragraph">${item.content || '내용 없음'}</p>
                    <button type="button" class="btn-toggle-expand">펼치기 ∨</button>
                </div>
                ${imageContainerHtml}
            </div>

            <div class="review-target-popup-bar">
                <div class="mini-thumb"></div>
                <div class="mini-info">
                    <span class="mini-title">산리오 성수 아지트</span>
                    <span class="mini-region">성수동</span>
                </div>
            </div>
        `;

        const expandBtn = cardArticle.querySelector('.btn-toggle-expand');
        expandBtn.addEventListener('click', () => {
            const textContentBox = expandBtn.parentElement;
            const cardBody = textContentBox.parentElement;
            const textParagraph = expandBtn.previousElementSibling;
            const imageThumb = cardBody.querySelector('.review-image-thumbnail');

            const isExpanded = textParagraph.classList.toggle('is-expanded');
            cardBody.classList.toggle('is-expanded', isExpanded);

            if (imageThumb) {
                imageThumb.classList.toggle('is-expanded', isExpanded);
            }

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
                if (index < currentLevel) {
                    s.style.color = 'var(--color-primary, #B8A8FF)';
                } else {
                    s.style.color = '#EAEAEA';
                }
            });
        });

        star.addEventListener('click', () => {
            const selectedRating = star.getAttribute('data-value');
            window.location.href = `/pages/review-write.html?popupId=${popupId}&rating=${selectedRating}`;
        });
    });

    starsContainer.addEventListener('mouseleave', () => {
        stars.forEach(s => {
            s.style.color = '#EAEAEA';
        });
    });
}