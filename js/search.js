const API_URL = window.API_BASE_URL;
let searchTimer;

document.addEventListener('DOMContentLoaded', () => {
  // 최초 진입 시 추천 팝업 가동
  fetchRecommendPopups();

  // 실시간 글자 입력 이벤트 리스너 바인딩
  const searchInput = document.getElementById('popup-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const keyword = searchInput.value.trim();

      // 디바운싱 대기 - 0.3초
      clearTimeout(searchTimer);

      searchTimer = setTimeout(() => {
        if (keyword === '') {
          // 검색어를 다 지우면 즉시 추천 화면으로 복원
          showBeforeSearch();
        } else {
          // 엔터 안 쳐도 글자가 입력되면 실시간으로 서버 검색
          fetchSearchResults(keyword);
        }
      }, 300); // 0.3초 대기 시간
    });

    // 기존 키보드 엔터 유저를 위해 엔터 시 즉시 실행 리스너도 상호 보완 유지
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        clearTimeout(searchTimer); // 대기 중인 타이머 취소
        const keyword = searchInput.value.trim();
        if (keyword !== '') {
          fetchSearchResults(keyword);
        }
      }
    });
  }
});

// 추천 팝업
async function fetchRecommendPopups() {
  const scrollContainer = document.getElementById('recommend-scroll-container');
  if (!scrollContainer) return;

  // 찜 여부 확인을 위한 공통 유저 쿼리 스트링 획득
  const userQuery = getUserQuery();

  try {
    scrollContainer.innerHTML = `<p class="loading-msg" style="padding:20px; color:#888;">추천 팝업을 가져오는 중입니다...</p>`;

    // 제공해주신 찜하기 정렬 및 진행중 팝업 전용 주소 맵핑
    const response = await fetch(
      `${API_URL}/popups?status=ongoing&sort=wishlist${userQuery}`,
    );
    if (!response.ok) throw new Error('추천 데이터 로드 실패');

    const popupsData = await response.json();

    // 백엔드가 정렬해준 순서 그대로 상위 10개만 슬라이싱
    const top10Popups = popupsData.slice(0, 10);

    scrollContainer.innerHTML = '';

    if (top10Popups.length === 0) {
      scrollContainer.innerHTML = `<p class="no-data-msg" style="padding:20px; color:#999;">현재 진행 중인 인기 팝업 스토어가 없습니다.</p>`;
      return;
    }

    // 가로 스크롤 컨테이너에 카드 동적 주입
    top10Popups.forEach((popup) => {
      const cardHtml = createPopupCardHtml(popup);
      scrollContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
  } catch (error) {
    console.error('추chen 팝업 바인딩 에러:', error);
    scrollContainer.innerHTML = `<p class="error-msg" style="padding:20px; color:red;">추천 팝업을 불러오지 못했습니다.</p>`;
  }
}

// 키워드 기반 백엔드 API 검색 연동
async function fetchSearchResults(keyword) {
  const gridContainer = document.getElementById('search-grid-container');
  const viewBefore = document.getElementById('view-before-search');
  const viewAfter = document.getElementById('view-after-search');
  const resultKeywordText = document.getElementById('result-keyword-text');
  const resultCountNum = document.getElementById('result-count-num');

  if (!gridContainer) return;

  // 화면 스위칭: 추천 스크롤 숨기고 4열 그리드 결과창 노출
  viewBefore.classList.add('hidden');
  viewAfter.classList.remove('hidden');

  // 상단 연보라 가이드 뱃지 텍스트 갱신
  resultKeywordText.textContent = `‘${keyword}’`;

  try {
    gridContainer.innerHTML = `<p class="loading-msg" style="grid-column: 1/-1; text-align:center; color:#888; padding:40px 0;">검색 결과를 분석 중입니다...</p>`;

    // 키워드 쿼리 결합
    let queryString = `?keyword=${encodeURIComponent(keyword)}`;
    queryString += getUserQuery();

    const response = await fetch(`${API_URL}/popups${queryString}`);
    if (!response.ok) throw new Error('검색 결과 실패');

    const searchResults = await response.json();

    // 검색 건수 실시간 반영
    resultCountNum.textContent = searchResults.length;
    gridContainer.innerHTML = '';

    if (searchResults.length === 0) {
      gridContainer.innerHTML = `
                <div class="no-data-msg" style="grid-column: 1/-1; text-align:center; padding:60px 0; color:#999;">
                    <p style="font-size:16px; font-weight:500; margin-bottom:8px;">검색 결과가 없습니다.</p>
                    <p style="font-size:14px; color:#bbb;">단어의 철자가 틀리지 않았는지 확인해 보세요.</p>
                </div>`;
      return;
    }

    // 4열 그리드 결과 카드 렌더링
    searchResults.forEach((popup) => {
      const cardHtml = createPopupCardHtml(popup);
      gridContainer.insertAdjacentHTML('beforeend', cardHtml);
    });
  } catch (error) {
    console.error('서버 검색 연동 에러:', error);
    gridContainer.innerHTML = `<p class="error-msg" style="grid-column: 1/-1; text-align:center; color:red; padding:40px 0;">검색 중 오류가 발생했습니다.</p>`;
  }
}

// 검색어 비웠을 때 초기 화면 복원
function showBeforeSearch() {
  document.getElementById('view-before-search').classList.remove('hidden');
  document.getElementById('view-after-search').classList.add('hidden');
}

// 공통 카드 HTML
function createPopupCardHtml(popup) {
  const activeClass = popup.isWishlisted ? 'active' : '';

  // index.js 공통 날짜 포맷 함수 호출
  const formattedStartDate = formatDateString(popup.startDate);
  const formattedEndDate = formatDateString(popup.endDate);

  // 운영 상태 및 실시간 D-Day 계산 뱃지 분기
  let statusBadgeHtml = '';
  if (popup.status === 'ongoing') {
    const remainMs = new Date(popup.endDate) - new Date();
    const remainDays = Math.ceil(remainMs / (1000 * 60 * 60 * 24));
    statusBadgeHtml = `<span class="card-status is-running" style="margin-bottom: 4px; display: inline-block;">운영중</span>`;
  } else if (popup.status === 'upcoming') {
    statusBadgeHtml = `<span class="card-status is-upcoming" style="margin-bottom: 4px; display: inline-block;">오픈예정</span>`;
  } else {
    statusBadgeHtml = `<span class="card-status is-closed" style="margin-bottom: 4px; display: inline-block;">종료</span>`;
  }

  // 평균 별점 동적 아이콘 매핑
  let starsHtml = '';
  const score = Math.round(popup.avgRating || 0);
  for (let i = 1; i <= 5; i++) {
    starsHtml +=
      i <= score
        ? `<img src="/assets/images/icons/icon-star-fill.png" alt="별" style="width:14px; height:14px; object-fit:contain;">`
        : `<img src="/assets/images/icons/icon-star-empty.png" alt="빈 별" style="width:14px; height:14px; object-fit:contain;">`;
  }

  let finalThumbUrl = popup.mainImageUrl || '';
  if (finalThumbUrl && finalThumbUrl.includes('localhost:8080')) {
    finalThumbUrl = finalThumbUrl.replace(
      'http://localhost:8080',
      window.BACKEND_URL,
    );
  }

  return `
        <div class="popup-card leisure-card" data-popup-id="${popup.id}">
        <div class="card-image-wrap" onclick="location.href='/pages/popup-detail.html?id=${popup.id}'" style="cursor:pointer;">
            <img src="${finalThumbUrl}" alt="${popup.title} 썸네일" class="card-thumb" />
        </div>
            <button class="wish-btn ${activeClass}" aria-label="찜하기" onclick="toggleWish(${popup.id}, this)">
                <span class="heart-icon"></span> 찜하기
            </button>
            <div class="card-body-wrap">
                <div class="card-info">
                    ${statusBadgeHtml}
                    <h3 class="card-title" onclick="location.href='/pages/popup-detail.html?id=${popup.id}'" style="cursor:pointer;">${popup.title}</h3>
                    <p class="card-location">${popup.regionName}</p>
                    <p class="card-date">${formattedStartDate} - ${formattedEndDate}</p>
                    
                    <div class="rating-wrap" style="display:flex; align-items:center; gap:4px; margin: 4px 0 6px 0; font-size:14px;">
                        <div class="rating-stars" style="display:flex; gap:2px;">${starsHtml}</div>
                        <span class="rating-num" style="font-weight:var(--weight-semibold); color:var(--color-primary-dark); margin-left:4px;">${(popup.avgRating || 0).toFixed(1)}</span>
                        <span class="rating-max" style="color:var(--color-text-secondary);">/ 5.0</span>
                    </div>

                    <span class="card-category">${popup.categoryName}</span>
                </div>
            </div>
        </div>
    `;
}
