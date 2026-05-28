/* ==========================================================================
   1. DOM 로드 완료 후 초기 실행 및 상태 변수 정의
   ========================================================================== */
let selectedRating = 0;
let selectedCongestion = '';
let currentPopupId = null;
let currentUserId = 1;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentPopupId = urlParams.get('popupId') || 11;

    const initialRating = urlParams.get('rating');
    if (initialRating) {
        selectedRating = parseInt(initialRating);
    }

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

        const thumbImg = document.getElementById('popup-thumb');
        const titleText = document.querySelector('.popup-title-text');
        const regionText = document.querySelector('.popup-region-text');

        // 📍 추가 연동: 카테고리 텍스트 변경을 위한 셀렉터 (HTML 구조 기준)
        const categoryBadge = document.getElementById('popup-category');

        // 📍 핵심 수정: 백엔드 JSON 규격인 mainImageUrl로 매핑 표기법 변경
        if (thumbImg && popupData.mainImageUrl) {
            if (popupData.mainImageUrl.startsWith("/")) {
                thumbImg.src = `http://localhost:8080${popupData.mainImageUrl}`;
            } else {
                thumbImg.src = popupData.mainImageUrl;
            }
        }

        if (titleText && popupData.title) titleText.textContent = popupData.title;

        // 📍 백엔드 데이터(regionName, categoryName) 기반으로 상단 요약 정보 동적 변경
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
    if (!container || !scoreText) return;

    const stars = container.querySelectorAll('.star-btn');

    updateStars(selectedRating);

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const hoverValue = parseInt(star.getAttribute('data-value'));
            stars.forEach((s, idx) => {
                s.classList.toggle('is-active', idx < hoverValue);
            });
        });

        star.addEventListener('click', () => {
            selectedRating = parseInt(star.getAttribute('data-value'));
            updateStars(selectedRating);
        });
    });

    container.addEventListener('mouseleave', () => {
        updateStars(selectedRating);
    });

    function updateStars(rating) {
        stars.forEach((s, idx) => {
            s.classList.toggle('is-active', idx < rating);
        });
        scoreText.textContent = rating.toFixed(1);
    }
}

/* ==========================================================================
   4. 혼잡도 토글 및 축적 선택 인터랙션 제어
   ========================================================================== */
function initCongestionInteraction() {
    const congestionText = document.getElementById('congestion-text');
    const buttons = Array.from(document.querySelectorAll('.btn-congestion'));
    const rowContainer = document.querySelector('.congestion-icons-row');
    if (!congestionText || buttons.length === 0) return;

    buttons.forEach(btn => btn.classList.remove('active'));
    congestionText.textContent = '-';
    if (rowContainer) rowContainer.removeAttribute('data-confirmed-idx');

    buttons.forEach((button, clickedIdx) => {
        button.addEventListener('mouseenter', () => {
            buttons.forEach((btn, idx) => {
                btn.classList.toggle('active', idx <= clickedIdx);
            });
        });

        button.addEventListener('click', () => {
            const statusAttr = button.getAttribute('data-status');
            if (statusAttr === 'smooth') {
                selectedCongestion = 'LOW';
                congestionText.textContent = '여유';
            } else if (statusAttr === 'normal') {
                selectedCongestion = 'NORMAL';
                congestionText.textContent = '보통';
            } else if (statusAttr === 'crowded') {
                selectedCongestion = 'HIGH';
                congestionText.textContent = '혼잡';
            }
            if (rowContainer) rowContainer.setAttribute('data-confirmed-idx', clickedIdx);
        });
    });

    if (rowContainer) {
        rowContainer.addEventListener('mouseleave', () => {
            const confirmedIdxAttr = rowContainer.getAttribute('data-confirmed-idx');

            if (confirmedIdxAttr !== null) {
                const confirmedIdx = parseInt(confirmedIdxAttr);
                buttons.forEach((btn, idx) => {
                    btn.classList.toggle('active', idx <= confirmedIdx);
                });
            } else {
                buttons.forEach(btn => btn.classList.remove('active'));
            }
        });
    }
}

/* ==========================================================================
   5. 커스텀 파일 이미지 첨부 트리거 제어
   ========================================================================== */
function initFileUpload() {
    const fileInput = document.getElementById('review-file-input');
    const fileDummyBtn = document.getElementById('btn-file-dummy');
    if (!fileInput || !fileDummyBtn) return;

    fileDummyBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            const fileName = fileInput.files[0].name;
            fileDummyBtn.textContent = `사진 첨부 완료 (${fileName})`;
        } else {
            fileDummyBtn.textContent = '눌러서 사진 올리기 (0/1)';
        }
    });
}

/* ==========================================================================
   6. 후기 데이터 유효성 검사 및 전송
   ========================================================================== */
function initSubmitEvent() {
    const submitBtn = document.getElementById('btn-submit-review');
    const textarea = document.getElementById('review-textarea');
    if (!submitBtn || !textarea) return;

    submitBtn.addEventListener('click', async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const currentReservationId = urlParams.get('reservationId');

        // 📍 1. 예약 번호 유효성 검증 규칙 세분화 및 차단
        const parsedReservationId = Number(currentReservationId);
        if (!currentReservationId || isNaN(parsedReservationId) || parsedReservationId <= 0) {
            alert('유효한 예약 정보가 없습니다. 마이페이지의 예약 내역을 통해 다시 접근해 주세요!');
            return;
        }

        const textContent = textarea.value.trim();

        if (selectedRating === 0) {
            alert('별점을 선택해 주세요!');
            return;
        }
        if (!selectedCongestion) {
            alert('혼잡도를 선택해 주세요!');
            return;
        }
        if (!textContent) {
            alert('리뷰 본문 내용을 입력해 주세요!');
            textarea.focus();
            return;
        }

        // 📍 2. 핵심 수정: 백엔드 DTO 규격에 맞게 reservationId 파라미터 안전하게 추가
        const reviewDto = {
            rating: selectedRating,
            congestionLevel: selectedCongestion,
            content: textContent,
            reviewImageUrl: null,
            userId: currentUserId,
            reservationId: parsedReservationId
        };

        const apiUrl = `http://localhost:8080/api/popups/${currentPopupId}/reviews`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reviewDto)
            });

            if (!response.ok) {
                throw new Error('리뷰 등록 중 서버 오류가 발생했습니다.');
            }

            alert('후기가 성공적으로 등록되었습니다! 🎁');
            window.location.href = `/pages/review.html?popupId=${currentPopupId}`;

        } catch (error) {
            console.error('리뷰 등록 실패:', error);
            alert('리뷰를 저장하지 못했습니다. 서비스 상태를 확인해 주세요.');
        }
    });
}