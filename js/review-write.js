/* ==========================================================================
   1. 상태 변수 정의
   ========================================================================== */
let selectedRating = 0;
let selectedCongestion = '';
let currentPopupId = null;
let currentUserId = 1; // 추후 로그인 시스템과 연동 필요

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentPopupId = urlParams.get('popupId') || 11;

    // 초기 설정 실행
    fetchPopupSummary(currentPopupId);
    initStarsInteraction();
    initCongestionInteraction();
    initFileUpload();
    initSubmitEvent();
});

/* ==========================================================================
   2. 상단 팝업 스토어 요약 정보 단건 조회 (GET)
   ========================================================================== */
async function fetchPopupSummary(popupId) {
    const apiUrl = `http://localhost:8080/api/popups/${popupId}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('팝업 정보를 불러오지 못했습니다.');

        const popupData = await response.json();

        // HTML 요소 선택 (ID가 일치하는지 확인하세요)
        const thumbImg = document.getElementById('popup-thumb');
        const titleText = document.querySelector('.target-title');
        const regionText = document.querySelector('.target-location');
        const categoryBadge = document.querySelector('.card-category');

        if (thumbImg && popupData.mainImageUrl) {
            thumbImg.src = popupData.mainImageUrl.startsWith("/") ? `http://localhost:8080${popupData.mainImageUrl}` : popupData.mainImageUrl;
        }
        if (titleText && popupData.title) titleText.textContent = popupData.title;
        if (regionText && popupData.regionName) regionText.textContent = popupData.regionName;
        if (categoryBadge && popupData.categoryName) categoryBadge.textContent = popupData.categoryName;

    } catch (error) {
        console.error('팝업 요약 정보 로드 실패:', error);
    }
}

/* ==========================================================================
   3. 별점 선택 인터랙션 제어
   ========================================================================== */
function initStarsInteraction() {
    const container = document.getElementById('stars-container');
    const scoreText = document.getElementById('score-text');
    if (!container) return;

    const stars = container.querySelectorAll('.star-btn');

    // 별점 이미지 업데이트 함수
    function updateStarsDisplay(rating) {
        stars.forEach((s, idx) => {
            s.src = (idx < rating) ? '/assets/images/icons/icon-star-fill.png' : '/assets/images/icons/icon-star-empty.png';
        });
        if (scoreText) scoreText.textContent = rating.toFixed(1);
    }

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            updateStarsDisplay(parseInt(star.getAttribute('data-value')));
        });

        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-value'));
            updateStarsDisplay(selectedRating);
        });
    });

    container.addEventListener('mouseleave', () => {
        updateStarsDisplay(selectedRating);
    });
}

/* ==========================================================================
   4. 혼잡도 선택 인터랙션 제어
   ========================================================================== */
function initCongestionInteraction() {
    const congestionText = document.getElementById('congestion-text');
    const buttons = document.querySelectorAll('.btn-congestion');
    const fillImg = '/assets/images/icons/icon-person-fill.png';
    const emptyImg = '/assets/images/icons/icon-person-empty.png';

    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            selectedCongestion = button.getAttribute('data-level');

            if (congestionText) {
                const labels = { 'LOW': '여유', 'NORMAL': '보통', 'HIGH': '혼잡' };
                congestionText.textContent = labels[selectedCongestion] || '-';
            }

            buttons.forEach((btn, btnIndex) => {
                if (btnIndex <= index) {
                    btn.src = fillImg;
                } else {
                    btn.src = emptyImg;
                }
            });
        });
    });
}
/* ==========================================================================
   5. 파일 업로드 제어
   ========================================================================== */
function initFileUpload() {
    const fileInput = document.getElementById('review-file-input');
    const fileDummyBtn = document.getElementById('btn-file-dummy');
    if (!fileInput || !fileDummyBtn) return;

    fileDummyBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        fileDummyBtn.textContent = fileInput.files.length > 0 ? `사진 첨부 완료 (${fileInput.files[0].name})` : '눌러서 사진 올리기 (0/1)';
    });
}

/* ==========================================================================
   6. 후기 등록 제어
   ========================================================================== */
function initSubmitEvent() {
    const submitBtn = document.getElementById('btn-submit-review');
    const textarea = document.getElementById('review-textarea');

    submitBtn.addEventListener('click', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const reservationId = Number(urlParams.get('reservationId'));

        if (!reservationId || reservationId <= 0) {
            alert('유효한 예약 정보가 없습니다.');
            return;
        }

        if (selectedRating === 0) { alert('별점을 선택해 주세요!'); return; }
        if (!selectedCongestion) { alert('혼잡도를 선택해 주세요!'); return; }
        if (!textarea.value.trim()) { alert('후기를 입력해 주세요!'); return; }

        const reviewDto = {
            rating: selectedRating,
            congestionLevel: selectedCongestion,
            content: textarea.value.trim(),
            reviewImageUrl: null,
            userId: currentUserId,
            reservationId: reservationId
        };

        try {
            const response = await fetch(`http://localhost:8080/api/popups/${currentPopupId}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reviewDto)
            });

            if (!response.ok) throw new Error('서버 오류 발생');
            alert('후기가 등록되었습니다!');
            window.location.href = `/pages/review.html?popupId=${currentPopupId}`;
        } catch (error) {
            console.error(error);
            alert('저장에 실패했습니다.');
        }
    });
}