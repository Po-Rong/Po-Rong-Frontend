// API 주소 판단
// 현재 브라우저 주소창이 로컬환경인지 배포환경인지 감지
const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// 다른 모든 JS 파일에서 사용할 전역 변수 설정
window.API_BASE_URL = 'https://po-rong-backend.onrender.com/api'; // 추후에 입력

// 이미지 경로 연결용 주소
window.BACKEND_URL = 'https://po-rong-backend.onrender.com';

const API = window.API_BASE_URL;

// 실시간으로 로컬스토리지에서 최신 유저 쿼리를 만들어주는 공통 함수
// 홈페이지, 찾기 페이지 등에서 팝업이 찜하기가 되어있는지 판단할 때 호출
function getUserQuery() {
  const loginUser = JSON.parse(localStorage.getItem('loginUser'));
  if (!loginUser) return '';

  const currentUserId = loginUser.userId || loginUser.id;
  // 백엔드가 컨트롤러에서 받는 이름(user_id)으로 매핑
  return currentUserId ? `&user_id=${currentUserId}` : '';
}

// 날짜 변환 함수
function formatDateString(isoString) {
  if (!isoString) return '';
  const datePart = isoString.split('T')[0];
  const [year, month, day] = datePart.split('-');
  return `${year.slice(2)}.${month}.${day}`;
}

// 헤더 로그인 상태 업데이트
function updateHeader() {
  // 로그인/회원가입 페이지에서는 실행 안 함
  if (
    window.location.pathname.includes('/pages/login') ||
    window.location.pathname.includes('/pages/register')
  )
    return;

  const user = JSON.parse(localStorage.getItem('loginUser'));
  const loginLink = document.querySelector('.login-link');

  if (user) {
    // 로그인 상태
    loginLink.textContent = `${user.nickname}님, 반가워요!`;
    loginLink.href = '#';
    loginLink.style.pointerEvents = 'none';

    // role에 따라 마이포롱 링크 변경
    const mypageLink = document.querySelector("a[href='/pages/mypage.html']");
    if (mypageLink && user.role === 'seller') {
      mypageLink.href = '/pages/admin.html';
      mypageLink.textContent = '팝업 관리';
    }
  } else {
    // 비로그인 상태
    loginLink.textContent = '로그인';
    loginLink.href = '/pages/login.html';
  }
}

// 로그아웃
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', function () {
    localStorage.removeItem('loginUser');
    alert('로그아웃 되었습니다.');
    window.location.href = '/index.html';
  });
}

// 페이지 로드될 때 실행
updateHeader();

// 카테고리 목록 불러오기
function loadCategories() {
  const categoryList = document.getElementById('categoryList');
  if (!categoryList) return;

  fetch(`${API}/categories`)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((category) => {
        const btn = document.createElement('button');
        btn.textContent = category.categoryName;
        btn.dataset.id = category.id;
        btn.onclick = () => selectCategory(category.id, btn);
        categoryList.appendChild(btn);
      });
    });
}

// 카테고리 선택
function selectCategory(id, btn) {
  document.getElementById('selectedCategory').value = id;
  document
    .querySelectorAll('.category-group button')
    .forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
}

// 지역 목록 불러오기
function loadRegions() {
  const regionList = document.getElementById('regionList');
  if (!regionList) return;

  fetch(`${API}/regions`)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((region) => {
        const btn = document.createElement('button');
        btn.textContent = region.regionName;
        btn.dataset.id = region.id;
        btn.onclick = () => selectRegion(region.id, btn);
        regionList.appendChild(btn);
      });
    });
}

// 지역 선택
function selectRegion(id, btn) {
  document.getElementById('selectedRegion').value = id;
  document
    .querySelectorAll('.region-group button')
    .forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
}

function showMsg(id, text, ok) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'msg' + (ok ? 'ok' : 'fail');
}

// 공통 찜하기 체크 및 토글 제어
async function toggleWish(popupId, buttonElement) {
  const user = JSON.parse(localStorage.getItem('loginUser'));

  // 비로그인 상태면 하단 통신 로직을 타기 전에 로그인 이동
  if (!user) {
    alert('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동합니다.');
    window.location.href = '/pages/login.html';
    return;
  }

  // 광클 방지 + 동일한 popupId를 가진 모든 찜 버튼을 제어하기 위함
  const siblingButtons = document.querySelectorAll(
    `.wish-btn[onclick*="toggleWish(${popupId},"]`,
  );

  // 현재 버튼이 찜이 된 상태인지 확인
  const isCurrentlyStarred = buttonElement.classList.contains('active');

  // 수집된 모든 동일 팝업 찜 버튼 잠금
  siblingButtons.forEach((btn) => (btn.disabled = true));

  try {
    // 엔드포인트로 요청 송신
    const response = await fetch(`${API}/wishlists/popups/${popupId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.userId || user.id, // 로컬스토리지 보관 방식에 맞춤 바인딩
      }),
    });

    if (!response.ok) {
      throw new Error(`서버 응답 실패 상태코드: ${response.status}`);
    }

    // 단일 버튼 대신 화면에 노출된 동일 popupId 카드 버튼 전체를 동시에 제어
    siblingButtons.forEach((btn) => {
      if (!isCurrentlyStarred) {
        btn.classList.add('active'); // 동시에 하트 불빛 켜기
      } else {
        btn.classList.remove('active'); // 동시에 하트 불빛 끄기
      }
    });

    console.log(
      `[찜 API 연동 성공] 팝업 ID: ${popupId} | 결과 상태: ${!isCurrentlyStarred ? '찜 등록완료' : '찜 해제완료'}`,
    );
  } catch (error) {
    console.error('찜하기 처리 중 통신 에러 발생:', error);
    alert('찜하기 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
  } finally {
    // 통신 마감 후 모든 버튼 잠금 해제
    siblingButtons.forEach((btn) => (btn.disabled = false));
  }
}

// 리뷰 데이터를 가져와서 렌더링
async function renderReviews(apiEndpoint, containerSelector) {
  const reviewGridContainer = document.querySelector(containerSelector);
  if (!reviewGridContainer) return;

  try {
    const response = await fetch(apiEndpoint);
    if (!response.ok) throw new Error(`리뷰 API 통신 실패: ${response.status}`);

    const reviewsData = await response.json();
    reviewGridContainer.innerHTML = '';

    if (reviewsData.length === 0) {
      reviewGridContainer.innerHTML = `<p class="no-data-msg">등록된 최신 리뷰가 없습니다.</p>`;
      return;
    }

    reviewsData.forEach((review) => {
      // 날짜 변환
      const formattedReviewDate = review.reserveDate
        ? review.reserveDate.replace(/-/g, '.').slice(2)
        : '';

      // 별점 계산
      let starsHtml = '';
      const score = Math.floor(review.rating);
      for (let i = 1; i <= 5; i++) {
        starsHtml +=
          i <= score
            ? `<img src="/assets/images/icons/icon-star-fill.png" alt="별">`
            : `<img src="/assets/images/icons/icon-star-empty.png" alt="빈 별">`;
      }

      // 혼잡도 계산
      let fillCount = 1;
      let congestionText = '낮음';
      if (review.congestion_level === 'NORMAL') {
        fillCount = 2;
        congestionText = '보통';
      }
      if (review.congestion_level === 'HIGH') {
        fillCount = 3;
        congestionText = '높음';
      }

      let peopleHtml = '';
      for (let i = 1; i <= 3; i++) {
        peopleHtml +=
          i <= fillCount
            ? `<img src="/assets/images/icons/icon-person-fill.png" alt="사람 채움">`
            : `<img src="/assets/images/icons/icon-person-empty.png" alt="사람 비움">`;
      }

      // 이미지 유무 처리
      let attachBoxHtml = '';
      let noImageClass = '';
      if (review.reviewImageUrl) {
        attachBoxHtml = `
                    <div class="review-attach-box">
                        <img src="${review.reviewImageUrl}" alt="리뷰 첨부 사진" class="review-attached-img" />
                    </div>
                `;
      } else {
        noImageClass = 'has-no-image';
      }

      let rawPopupThumb =
        review.popupImageUrl ||
        review.popupMainImageUrl ||
        review.popupThumbnailUrl ||
        '';

      let finalPopupThumbUrl = rawPopupThumb;
      if (finalPopupThumbUrl && finalPopupThumbUrl.includes('localhost:8080')) {
        finalPopupThumbUrl = finalPopupThumbUrl.replace(
          'http://localhost:8080',
          window.BACKEND_URL,
        );
      }

      // 리뷰 카드 HTML 생성
      const reviewHtml = `
                <div class="review-card ${noImageClass}" data-review-id="${review.reviewId}" onclick="location.href='/pages/explore.html?id=${review.popupId}'" style="cursor:pointer;">
                    <div class="review-card-header">
                        <span class="reviewer-name">${review.nickname}</span>
                        <span class="review-date">${formattedReviewDate} 방문</span>
                    </div>
                    <div class="review-stats-row">
                        <div class="rating-wrap">
                            <div class="rating-stars">${starsHtml}</div>
                            <span class="rating-num">${review.rating.toFixed(1)}</span>
                            <span>/</span>
                            <span class="rating-max">5.0</span>
                        </div>
                        <div class="congestion-wrap">
                            <div class="congestion-icons">${peopleHtml}</div>
                            <span class="congestion-text">혼잡도</span>
                            <span class="congestion-strong">${congestionText}</span>
                        </div>
                    </div>
                    <div class="review-content">
                        <p>${review.content}</p>
                    </div>
                    ${attachBoxHtml} 
                    <div class="review-target-popup">
                        <div class="target-thumb-wrap">
                            <img src="${finalPopupThumbUrl}" alt="팝업 미니 썸네일" class="target-thumb" />
                        </div>
                        <div class="target-info-wrap">
                            <div class="target-tags">
                                <span class="card-category" style="padding:2px 6px; font-size:11px;">애니/캐릭터</span>
                                <span class="card-status is-running" style="padding:2px 6px; font-size:11px;">운영중</span>
                            </div>
                            <h4 class="target-title">${review.popupTitle}</h4>
                            <p class="target-location">방문 시간: ${review.reserveTime}</p>
                        </div>
                    </div>
                </div>
            `;
      reviewGridContainer.insertAdjacentHTML('beforeend', reviewHtml);
    });
  } catch (error) {
    console.error('리뷰 리스트업 실패: ', error);
    reviewGridContainer.innerHTML = `<p class="error-msg">리뷰 정보를 불러오지 못했습니다.</p>`;
  }
}

// DOMContentLoaded 통합 제어
// 어떤 페이지든 클래스명이 card-scroll-container이기만 하면 자동으로 드래그 스크롤이 됨
document.addEventListener('DOMContentLoaded', () => {
  const scrollContainers = document.querySelectorAll('.card-scroll-container');

  scrollContainers.forEach((container) => {
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
      isDown = true;
      container.classList.add('active');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;

      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    });

    container.addEventListener('mouseleave', () => {
      isDown = false;
      container.style.cursor = 'grab';
    });

    container.addEventListener('mouseup', () => {
      isDown = false;
      container.style.cursor = 'grab';
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();

      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5; // 스크롤 감도 조절
      container.scrollLeft = scrollLeft - walk;
    });

    container.style.cursor = 'grab';
  });
});
