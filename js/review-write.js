/* ==========================================================================
   1. 상태 변수 정의
   ========================================================================== */
let selectedRating = 0;
let selectedCongestion = '';
let currentPopupId = null;
const loginUser = JSON.parse(localStorage.getItem('loginUser'));
let currentUserId = loginUser ? loginUser.userId : null;

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
  const apiUrl = `${window.API_BASE_URL}/popups/${popupId}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error('팝업 정보를 불러오지 못했습니다.');

    const popupData = await response.json();

    // HTML 클래스/ID 선택자 정밀 정정 (기존 popup-thumb 아이디는 HTML에 없으므로 클래스로 획득)
    const thumbImg = document.querySelector('.target-thumb');
    const titleText = document.querySelector('.target-title');
    const regionText = document.querySelector('.target-location');
    const tagRow = document.querySelector('.tag-row');

    // 대표 이미지 채우기 (외부 unsplash URL 대응 완벽 지원)
    if (thumbImg && popupData.mainImageUrl) {
      thumbImg.src = popupData.mainImageUrl.startsWith('/')
        ? `${window.BACKEND_URL}${popupData.mainImageUrl}`
        : popupData.mainImageUrl;
    }
    if (titleText && popupData.title) titleText.textContent = popupData.title;
    if (regionText && popupData.regionName)
      regionText.textContent = popupData.regionName;

    // [중요 개선] 카테고리, 운영 상태, 그리고 커스텀 태그까지 한번에 동적으로 매핑하여 노출
    if (tagRow) {
      tagRow.innerHTML = ''; // 기존 정적인 뱃지 제거 후 완전 동적 주입

      // 1. 카테고리 뱃지 추가
      if (popupData.categoryName) {
        const catSpan = document.createElement('span');
        catSpan.className = 'card-category';
        catSpan.textContent = popupData.categoryName;
        tagRow.appendChild(catSpan);
      }

      // 2. 운영 상태 뱃지 추가 (ongoing, upcoming, closed 분기 및 한글 전환)
      if (popupData.status) {
        const statusSpan = document.createElement('span');
        let statusText = '운영중';
        let statusClass = 'is-running';

        if (
          popupData.status === 'upcoming' ||
          popupData.status === '오픈 예정'
        ) {
          statusText = '운영 예정';
          statusClass = 'is-upcoming';
        } else if (
          popupData.status === 'closed' ||
          popupData.status === '종료'
        ) {
          statusText = '운영 마감';
          statusClass = 'is-closed';
        }

        statusSpan.className = `card-status ${statusClass}`;
        statusSpan.textContent = statusText;
        tagRow.appendChild(statusSpan);
      }
    }
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
      s.src =
        idx < rating
          ? '/assets/images/icons/icon-star-fill.png'
          : '/assets/images/icons/icon-star-empty.png';
    });
    if (scoreText) scoreText.textContent = rating.toFixed(1);
  }

  stars.forEach((star) => {
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
        const labels = { LOW: '여유', NORMAL: '보통', HIGH: '혼잡' };
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
    fileDummyBtn.textContent =
      fileInput.files.length > 0
        ? `사진 첨부 완료 (${fileInput.files[0].name})`
        : '눌러서 사진 올리기 (0/1)';
  });
}

/* ==========================================================================
   6. 후기 등록 제어
   ========================================================================== */
function initSubmitEvent() {
  const submitBtn = document.getElementById('btn-submit-review');
  const textarea = document.getElementById('review-textarea');
  const imageInput = document.getElementById('review-file-input');

  submitBtn.addEventListener('click', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reservationId = Number(urlParams.get('reservationId'));

    if (!reservationId || reservationId <= 0) {
      alert('유효한 예약 정보가 없습니다.');
      return;
    }

    if (selectedRating === 0) {
      alert('별점을 선택해 주세요!');
      return;
    }
    if (!selectedCongestion) {
      alert('혼잡도를 선택해 주세요!');
      return;
    }
    if (!textarea.value.trim()) {
      alert('후기를 입력해 주세요!');
      return;
    }

    // FormData 구성 (개별 필드로 append)
    const formData = new FormData();
    formData.append('userId', currentUserId);
    formData.append('content', textarea.value.trim());
    formData.append('rating', selectedRating);
    formData.append('congestionLevel', selectedCongestion);
    formData.append('reservationId', reservationId);

    // 이미지 파트 (파일이 있을 때만 추가)
    if (imageInput && imageInput.files[0]) {
      formData.append('image', imageInput.files[0]);
    }

    try {
      const response = await fetch(
        `${window.API_BASE_URL}/popups/${currentPopupId}/reviews`,
        {
          method: 'POST',
          body: formData,
        },
      );

      if (!response.ok) throw new Error('서버 오류 발생');
      alert('후기가 등록되었습니다!');
      window.location.href = `/pages/review.html?popupId=${currentPopupId}`;
    } catch (error) {
      console.error(error);
      alert('저장에 실패했습니다.');
    }
  });
}
