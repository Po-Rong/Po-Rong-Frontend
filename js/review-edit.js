const API_BASE_URL = `${window.API_BASE_URL}`;

let currentReviewId = null;
let selectedRating = 0;
let selectedCongestion = '';

let uploadedImageUrl = null;
let rawImageFile = null;

document.addEventListener('DOMContentLoaded', () => {
  const loginUser = JSON.parse(localStorage.getItem('loginUser'));
  if (!loginUser) {
    alert('로그인이 만료되었습니다. 로그인 페이지로 이동합니다.');
    window.location.href = '/pages/login.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  currentReviewId = urlParams.get('reviewId');

  if (!currentReviewId) {
    alert('잘못된 접근입니다. 수정할 후기 번호가 없습니다.');
    window.location.href = '/pages/mypage.html';
    return;
  }

  initRatingInteraction();
  initCongestionInteraction();
  initFileUpload();

  // 단건 조회
  fetchOriginalReview(currentReviewId);

  const btnSubmit = document.getElementById('btn-submit-review');
  if (btnSubmit) {
    btnSubmit.addEventListener('click', () =>
      submitUpdatedReview(loginUser.userId || loginUser.id),
    );
  }
});

// 단건 리뷰 조회 API 연동
async function fetchOriginalReview(reviewId) {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`);
    if (!response.ok) {
      if (response.status === 404) {
        alert('해당 리뷰 데이터를 찾을 수 없습니다.');
      }
      throw new Error('리뷰 단건 조회 실패');
    }

    const review = await response.json();

    // 팝업 미니 카드 매핑
    if (review.popupMainImageUrl) {
      let originalPopupThumb = review.popupMainImageUrl;
      if (originalPopupThumb && originalPopupThumb.includes('localhost:8080')) {
        originalPopupThumb = originalPopupThumb.replace(
          'http://localhost:8080',
          window.BACKEND_URL,
        );
      }
      document.querySelector('.target-thumb').src = originalPopupThumb;
    }

    // 연동
    if (review.popupTitle) {
      document.querySelector('.target-title').textContent = review.popupTitle;
    }
    if (review.regionName) {
      document.querySelector('.target-location').textContent =
        review.regionName;
    }
    if (review.categoryName) {
      document.querySelector('.card-category').textContent =
        review.categoryName;
    }

    // 리뷰 본문 양식 복구
    if (review.content) {
      document.getElementById('review-textarea').value = review.content;
    }

    // 별점 및 혼잡도 계량 컴포넌트 복구
    if (review.rating) setRatingStars(Math.floor(review.rating));
    if (review.congestionLevel) setCongestionLevel(review.congestionLevel);

    // 사용자가 등록했던 후기 첨부 사진 복구 패널
    if (review.reviewImageUrl && review.reviewImageUrl !== 'NULL') {
      uploadedImageUrl = review.reviewImageUrl;

      const btnFile = document.getElementById('btn-file-dummy');
      if (btnFile) {
        const fileName = review.reviewImageUrl.split('/').pop();
        btnFile.textContent = `사진 첨부 완료 (${fileName})`;
      }
    }
  } catch (error) {
    console.error('기존 복구 데이터 수집 실패:', error);
  }
}

// 별점 제어
function initRatingInteraction() {
  const stars = document.querySelectorAll('#stars-container .star-btn');
  stars.forEach((star) => {
    star.addEventListener('click', () => {
      const val = parseInt(star.getAttribute('data-value'), 10);
      setRatingStars(val);
    });
  });
}

function setRatingStars(rating) {
  selectedRating = rating;
  document.getElementById('score-text').textContent = `${rating}.0`;

  const stars = document.querySelectorAll('#stars-container .star-btn');
  stars.forEach((star) => {
    const starVal = parseInt(star.getAttribute('data-value'), 10);
    if (starVal <= rating) {
      star.src = '/assets/images/icons/icon-star-fill.png';
    } else {
      star.src = '/assets/images/icons/icon-star-empty.png';
    }
  });
}

// 혼잡도 제어
function initCongestionInteraction() {
  const icons = document.querySelectorAll(
    '#mainCongestionIcons .btn-congestion',
  );
  icons.forEach((icon) => {
    icon.addEventListener('click', () => {
      const level = icon.getAttribute('data-level');
      setCongestionLevel(level);
    });
  });
}

function setCongestionLevel(level) {
  selectedCongestion = level;
  const txt = document.getElementById('congestion-text');

  if (level === 'LOW') {
    txt.textContent = '낮음';
    txt.className = 'status-text-blue';
  } else if (level === 'NORMAL') {
    txt.textContent = '보통';
    txt.className = 'status-text-green';
  } else if (level === 'HIGH') {
    txt.textContent = '높음';
    txt.className = 'status-text-red';
  }

  const icons = document.querySelectorAll(
    '#mainCongestionIcons .btn-congestion',
  );
  let activeThreshold = 1;
  if (level === 'NORMAL') activeThreshold = 2;
  if (level === 'HIGH') activeThreshold = 3;

  icons.forEach((icon, idx) => {
    if (idx < activeThreshold) {
      icon.src = '/assets/images/icons/icon-person-fill.png';
    } else {
      icon.src = '/assets/images/icons/icon-person-empty.png';
    }
  });
}

// 파일 업로드 설정
function initFileUpload() {
  const fileInput = document.getElementById('review-file-input');
  const btnDummy = document.getElementById('btn-file-dummy');

  if (!fileInput || !btnDummy) return;

  btnDummy.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      rawImageFile = fileInput.files[0];
      btnDummy.textContent = `사진 첨부 완료 (${rawImageFile.name})`;
    } else {
      rawImageFile = null;
      btnDummy.textContent = '눌러서 사진 올리기 (0/1)';
    }
  });
}

// 수정 데이터 전송
async function submitUpdatedReview(userId) {
  const contentText = document.getElementById('review-textarea').value.trim();

  if (selectedRating === 0) {
    alert('별점 평점을 선택해 주세요!');
    return;
  }
  if (!selectedCongestion) {
    alert('현장 혼잡도를 선택해 주세요!');
    return;
  }
  if (contentText === '') {
    alert('후기 내용을 작성해 주세요!');
    return;
  }

  const formData = new FormData();
  formData.append('userId', Number(userId));
  formData.append('content', contentText);
  formData.append('rating', Number(selectedRating));
  formData.append('congestionLevel', selectedCongestion);

  if (rawImageFile) {
    formData.append('image', rawImageFile);
  }

  const submitUrl = `${API_BASE_URL}/reviews/${currentReviewId}`;

  try {
    const response = await fetch(submitUrl, {
      method: 'PATCH',
      body: formData,
    });

    if (!response.ok) throw new Error('리뷰 수정 통신 실패');

    await response.json();

    alert('리뷰가 성공적으로 수정되었습니다.');
    window.location.href = '/pages/mypage.html';
  } catch (error) {
    console.error('수정 요청 에러:', error);
    alert('서버 통신 중 오류가 발생했습니다.');
  }
}
