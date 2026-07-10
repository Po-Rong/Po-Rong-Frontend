// 관리자 메인 페이지 JS
const user = JSON.parse(localStorage.getItem('loginUser'));

// 관리자 접근 제한
if (!user || user.role !== 'seller') {
  alert('판매자만 접근 가능합니다.');
  location.href = '/index.html';
}

// 팝업 목록 불러오기
function loadPopupList() {
  fetch(`${API}/popups?seller_id=${user.userId}`)
    .then((res) => res.json())
    .then((data) => {
      const popupList = document.getElementById('popupList');
      popupList.innerHTML = '';

      // 기존 힌트 제거
      const wrapper = popupList.closest('.admin-section');
      wrapper.querySelectorAll('.scroll-hint').forEach((el) => el.remove());

      if (data.length === 0) {
        popupList.innerHTML =
          '<p class="empty-msg">등록한 팝업스토어가 없습니다.</p>';
        return;
      }
      data.forEach((popup) => {
        const div = document.createElement('div');

        let imageUrl = popup.mainImageUrl || '';
        if (imageUrl && imageUrl.includes('localhost:8080')) {
          imageUrl = imageUrl.replace(
            'http://localhost:8080',
            window.BACKEND_URL,
          );
        } else if (!imageUrl.startsWith('http')) {
          imageUrl = `${window.BACKEND_URL}${imageUrl}`;
        }

        div.className = 'popup-card';
        div.style.cursor = 'pointer';
        div.onclick = () =>
          (location.href = `/pages/popup-detail.html?id=${popup.id}`);
        div.innerHTML = `
                    <div class="card-image-wrap">
                        <img src="${imageUrl}" alt="${popup.title}" class="card-thumb" />
                    </div>
                    <div class="card-body-wrap">
                        <div class="card-info">
                            <div class="card-status-row">
                                <span class="card-status ${getStatusClass(popup.status)}">${getStatusText(popup.status)}</span>
                                <div class="card-actions">
                                    <button class="btn-edit" onclick="event.stopPropagation(); location.href='/pages/popup-edit.html?id=${popup.id}'">수정</button>
                                    <button class="btn-delete" onclick="event.stopPropagation(); deletePopup(${popup.id})">삭제</button>
                                </div>
                            </div>
                            <h3 class="card-title">${popup.title}</h3>
                            <p class="card-location">${popup.regionName}</p>
                            <p class="card-date">${formatDate(popup.startDate)} ~ ${formatDate(popup.endDate)}</p>
                            <span class="card-category">${popup.categoryName}</span>
                        </div>
                    </div>
                `;
        popupList.appendChild(div);
      });

      addScrollHint('popupList');
      initDragScroll('popupList');
    });
}

// 팝업 삭제
function deletePopup(popupId) {
  if (!confirm('정말 삭제하시겠습니까?')) return;

  fetch(`${API}/popups/${popupId}?seller_id=${user.userId}`, {
    method: 'DELETE',
  })
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        alert(data.message);
        loadPopupList();
      } else {
        alert(data.message);
      }
    })
    .catch(() => alert('서버 오류'));
}

// 후기 목록 불러오기
function loadReviewList() {
  fetch(`${API}/admin/reviews?seller_id=${user.userId}`)
    .then((res) => res.json())
    .then((data) => {
      const reviewList = document.getElementById('reviewList');
      reviewList.innerHTML = '';

      if (data.length === 0) {
        reviewList.innerHTML = '<p class="empty-msg">달린 후기가 없습니다.</p>';
        return;
      }

      // 팝업별로 그룹화
      const grouped = {};
      data.forEach((review) => {
        const key = review.popupTitle;
        if (!grouped[key]) {
          grouped[key] = {
            popupTitle: review.popupTitle,
            popupMainImageUrl: review.popupMainImageUrl,
            popupStatus: review.popupStatus,
            categoryName: review.categoryName,
            regionName: review.regionName,
            reviews: [],
          };
        }
        grouped[key].reviews.push(review);
      });

      const groups = Object.values(grouped);

      // 탭 컨테이너
      const tabContainer = document.createElement('div');
      tabContainer.className = 'review-tab-container';

      // 후기 컨테이너
      const reviewContainer = document.createElement('div');
      reviewContainer.className = 'review-tab-content';
      reviewContainer.id = 'reviewTabContent';

      // 전체 탭 먼저 추가
      const allTab = document.createElement('button');
      allTab.className = 'review-tab-btn active';
      allTab.textContent = `전체 (${data.length})`;
      allTab.addEventListener('click', () => {
        document
          .querySelectorAll('.review-tab-btn')
          .forEach((t) => t.classList.remove('active'));
        allTab.classList.add('active');
        renderReviewCards(data, 'all');
      });
      tabContainer.appendChild(allTab);

      // 팝업별 탭
      groups.forEach((group, groupIndex) => {
        const tab = document.createElement('button');
        tab.className = 'review-tab-btn';
        tab.textContent = `${group.popupTitle} (${group.reviews.length})`;
        tab.addEventListener('click', () => {
          document
            .querySelectorAll('.review-tab-btn')
            .forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          renderReviewCards(group.reviews, groupIndex);
        });
        tabContainer.appendChild(tab);
      });

      // 탭 드래그 스크롤
      let isDown = false;
      let startX;
      let scrollLeft;

      tabContainer.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - tabContainer.offsetLeft;
        scrollLeft = tabContainer.scrollLeft;
        tabContainer.style.cursor = 'grabbing';
      });

      tabContainer.addEventListener('mouseleave', () => {
        isDown = false;
        tabContainer.style.cursor = 'grab';
      });

      tabContainer.addEventListener('mouseup', () => {
        isDown = false;
        tabContainer.style.cursor = 'grab';
      });

      tabContainer.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - tabContainer.offsetLeft;
        const walk = (x - startX) * 1.5;
        tabContainer.scrollLeft = scrollLeft - walk;
      });

      tabContainer.style.cursor = 'grab';

      reviewList.appendChild(tabContainer);
      reviewList.appendChild(reviewContainer);

      // 기본 전체 탭 렌더링
      renderReviewCards(data, 'all');

      function renderReviewCards(reviews, groupIndex) {
        const reviewContainer = document.getElementById('reviewTabContent');
        reviewContainer.innerHTML = '';

        const scrollBox = document.createElement('div');
        const scrollId = `reviewGroup_${groupIndex}`;
        scrollBox.id = scrollId;
        scrollBox.className = 'scroll-container card-scroll-container';
        reviewContainer.appendChild(scrollBox);

        reviews.forEach((review) => {
          const div = document.createElement('div');

          let reviewImageUrl = review.reviewImageUrl || '';
          if (reviewImageUrl && reviewImageUrl.includes('localhost:8080')) {
            reviewImageUrl = reviewImageUrl.replace(
              'http://localhost:8080',
              window.BACKEND_URL,
            );
          } else if (reviewImageUrl && !reviewImageUrl.startsWith('http')) {
            reviewImageUrl = `${window.BACKEND_URL}${reviewImageUrl}`;
          }

          let popupImageUrl = review.popupMainImageUrl || '';
          if (popupImageUrl && popupImageUrl.includes('localhost:8080')) {
            popupImageUrl = popupImageUrl.replace(
              'http://localhost:8080',
              window.BACKEND_URL,
            );
          } else if (popupImageUrl && !popupImageUrl.startsWith('http')) {
            popupImageUrl = `${window.BACKEND_URL}${popupImageUrl}`;
          }

          div.className = 'review-card';
          div.innerHTML = `
                        <div class="review-card-header">
                            <span class="reviewer-name">${review.nickname || '이름'}</span>
                            <span class="review-date">${formatDate(review.createdAt)}</span>
                        </div>
                        <div class="review-stats-row">
                            <div class="rating-wrap">
                                <div class="rating-stars"></div>
                                <span class="rating-num">${review.rating}.0</span>
                                <span>/</span>
                                <span class="rating-max">5.0</span>
                            </div>
                            <div class="congestion-wrap">
                                <div class="congestion-icons"></div>
                                <span class="congestion-text">혼잡도</span>
                                <span class="congestion-strong">${getCongestionText(review.congestionLevel)}</span>
                            </div>
                        </div>
                        <div class="review-content">
                            <p>${review.content}</p>
                        </div>
                        ${
                          review.reviewImageUrl
                            ? `
                        <div class="review-attach-box">
                            <img src="${reviewImageUrl}" alt="리뷰 첨부 사진" class="review-attached-img" />
                        </div>`
                            : ''
                        }
                        <div class="review-target-popup">
                            <div class="target-thumb-wrap">
                                <img src="${popupImageUrl || ''}" alt="${review.popupTitle}" class="target-thumb" />
                            </div>
                            <div class="target-info-wrap">
                                <div class="target-tags">
                                    <span class="card-category">${review.categoryName || ''}</span>
                                    <span class="card-status ${getStatusClass(review.popupStatus)}">${getStatusText(review.popupStatus)}</span>
                                </div>
                                <h4 class="target-title">${review.popupTitle || ''}</h4>
                                <p class="target-location">${review.regionName || ''}</p>
                            </div>
                        </div>
                    `;

          renderStars(div.querySelector('.rating-stars'), review.rating);
          renderCongestion(
            div.querySelector('.congestion-icons'),
            review.congestionLevel,
          );
          div.style.cursor = 'pointer';
          div.onclick = () => openReviewModal(review);
          scrollBox.appendChild(div);
        });

        addScrollHint(scrollId);
        initDragScroll(scrollId);
      }
    });
}
// 리뷰 모달
function openReviewModal(review) {
  const modal = document.createElement('div');

  let reviewImageUrl = review.reviewImageUrl || '';
  if (reviewImageUrl && reviewImageUrl.includes('localhost:8080')) {
    reviewImageUrl = reviewImageUrl.replace(
      'http://localhost:8080',
      window.BACKEND_URL,
    );
  } else if (reviewImageUrl && !reviewImageUrl.startsWith('http')) {
    reviewImageUrl = `${window.BACKEND_URL}${reviewImageUrl}`;
  }

  let popupImageUrl = review.popupMainImageUrl || '';
  if (popupImageUrl && popupImageUrl.includes('localhost:8080')) {
    popupImageUrl = popupImageUrl.replace(
      'http://localhost:8080',
      window.BACKEND_URL,
    );
  } else if (popupImageUrl && !popupImageUrl.startsWith('http')) {
    popupImageUrl = `${window.BACKEND_URL}${popupImageUrl}`;
  }

  modal.className = 'modal-overlay';
  modal.innerHTML = `
        <div class="modal-review-box">
            <div class="modal-header">
                <div>
                    <p class="reviewer-name">${review.nickname || '이름'}</p>
                    <div class="review-stats-row">
                        <div class="rating-wrap">
                            <div class="rating-stars"></div>
                            <span class="rating-num">${review.rating}.0</span>
                            <span>/</span>
                            <span class="rating-max">5.0</span>
                        </div>
                        <div class="congestion-wrap">
                            <div class="congestion-icons"></div>
                            <span class="congestion-text">혼잡도</span>
                            <span class="congestion-strong">${getCongestionText(review.congestionLevel)}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-header-right">
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    <span class="review-date">${formatDate(review.createdAt)} | ${formatTime(review.createdAt)} 방문</span>
                </div>
            </div>
            <div class="modal-body">
                <p>${review.content}</p>
            </div>
            <div class="review-bottom">
                ${
                  review.reviewImageUrl
                    ? `
                <div class="review-attach-box">
                    <img src="${reviewImageUrl}" alt="리뷰 첨부 사진" class="review-attached-img" />
                </div>`
                    : ''
                }
                <div class="review-target-popup">
                    <div class="target-thumb-wrap">
                        <img src="${popupImageUrl || ''}" alt="${review.popupTitle}" class="target-thumb" />
                    </div>
                    <div class="target-info-wrap">
                        <div class="target-tags">
                            <span class="card-category">${review.categoryName || ''}</span>
                            <span class="card-status ${getStatusClass(review.popupStatus)}">${getStatusText(review.popupStatus)}</span>
                        </div>
                        <h4 class="target-title">${review.popupTitle || ''}</h4>
                        <p class="target-location">${review.regionName || ''}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  renderStars(modal.querySelector('.rating-stars'), review.rating);
  renderCongestion(
    modal.querySelector('.congestion-icons'),
    review.congestionLevel,
  );

  document.body.appendChild(modal);
}

function getCongestionText(level) {
  if (level === 'LOW') return '낮음';
  if (level === 'NORMAL') return '보통';
  if (level === 'HIGH') return '높음';
  return level;
}

// 예약 목록 불러오기
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth() + 1;
let reservationPage = 0;

function initReservationFilter() {
  const section = document.getElementById('reservationSection');

  // 필터 UI 삽입 (h3 아래)
  const filterHtml = `
        <div class="reservation-filter">
            <select id="filterYear"></select>
            <select id="filterMonth"></select>
            <button id="btnFilterApply">조회</button>
        </div>
    `;
  section.querySelector('h3').insertAdjacentHTML('afterend', filterHtml);

  // 년도: 최근 3년
  const yearSelect = document.getElementById('filterYear');
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 2; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = `${y}년`;
    if (y === selectedYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  // 월
  const monthSelect = document.getElementById('filterMonth');
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = `${m}월`;
    if (m === selectedMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  }

  document.getElementById('btnFilterApply').addEventListener('click', () => {
    selectedYear = parseInt(yearSelect.value);
    selectedMonth = parseInt(monthSelect.value);
    reservationPage = 0;
    loadReservationList(0);
  });
}

function loadReservationList(page = 0) {
  fetch(
    `${API}/reservations?seller_id=${user.userId}&year=${selectedYear}&month=${selectedMonth}&page=${page}&size=2`,
  )
    .then((res) => res.json())
    .then((data) => {
      const reservationList = document.getElementById('reservationList');

      if (page === 0) reservationList.innerHTML = '';

      if (data.content.length === 0 && page === 0) {
        reservationList.innerHTML =
          '<p class="empty-msg">예약자가 없습니다.</p>';
        return;
      }

      data.content.forEach(({ date, reservations }) => {
        const group = document.createElement('div');
        group.className = 'reservation-date-group';
        group.innerHTML = `<p class="date-label">${formatFullDate(date)}</p>`;

        const grid = document.createElement('div');
        grid.className = 'reservation-grid';

        reservations.forEach((reservation) => {
          const card = document.createElement('div');
          card.className = 'reservation-card';
          card.innerHTML = `
                                    <div class="reservation-card-header">
                                        <p class="reserver-name">${reservation.userName} 님</p>
                                        <span class="reservation-badge ${reservation.status === 'CONFIRMED' ? 'badge-confirmed' : 'badge-canceled'}">
                                            ${reservation.status === 'CONFIRMED' ? '예약' : '취소'}
                                        </span>
                                    </div>
                                    <p class="reserve-time">${formatTime(reservation.reserveDate)} 예약</p>
                                    <p class="reserve-popup-title">${reservation.popupTitle || ''}</p>
                                `;
          card.onclick = () => openReservationModal(reservation);
          grid.appendChild(card);
        });
        group.appendChild(grid);
        reservationList.appendChild(group);
      });

      reservationHasNext = data.hasNext;
      const existingBtn = document.getElementById('loadMoreBtn');
      if (existingBtn) existingBtn.remove();

      if (data.hasNext) {
        const btn = document.createElement('button');
        btn.id = 'loadMoreBtn';
        btn.className = 'btn-load-more';
        btn.textContent = '더보기';
        btn.onclick = () => {
          reservationPage++;
          loadReservationList(reservationPage);
        };
        reservationList.appendChild(btn);
      }
    });
}

// 예약 모달
function openReservationModal(reservation) {
  const modal = document.createElement('div');
  const popupImageUrl = reservation.mainImageUrl?.startsWith('http')
    ? reservation.mainImageUrl
    : `${window.BACKEND_URL}${reservation.mainImageUrl}`;
  modal.className = 'modal-overlay';
  modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-header">
                <h3>예약 조회</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <div class="modal-body">
                <p>${reservation.userName} 님</p>
                <p>전화번호 : ${reservation.userPhone}</p>
                <p>예약한 시간 : ${formatDate(reservation.reserveDate)} | ${formatTime(reservation.reserveDate)}</p>
            </div>
            <div class="review-target-popup">
                <div class="target-thumb-wrap">
                    <img src="${popupImageUrl}" alt="${reservation.popupTitle}" class="target-thumb" />
                </div>
                <div class="target-info-wrap">
                    <h4 class="target-title">${reservation.popupTitle || ''}</h4>
                </div>
            </div>
            <button class="btn-cancel-reservation"
                onclick="cancelReservation(${reservation.id}, this)"
                ${reservation.status === 'CANCELED' ? 'disabled' : ''}>
                예약 취소하기
            </button>
        </div>
    `;
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  document.body.appendChild(modal);
}

function cancelReservation(reservationId, btn) {
  if (!confirm('예약을 취소하시겠습니까?')) return;

  fetch(
    `${API}/reservations/${reservationId}/seller-cancel?seller_id=${user.userId}`,
    {
      method: 'PATCH',
    },
  )
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        alert(data.message);
        btn.closest('.modal-overlay').remove();
        reservationPage = 0;
        loadReservationList(0);
      } else {
        alert(data.message);
      }
    })
    .catch(() => alert('서버 오류'));
}

function getStatusClass(status) {
  if (status === 'upcoming') return 'is-upcoming';
  if (status === 'ongoing') return 'is-running';
  if (status === 'closed') return 'is-closed';
  return '';
}

function getStatusText(status) {
  if (status === 'upcoming') return '운영예정';
  if (status === 'ongoing') return '운영중';
  if (status === 'closed') return '운영마감';
  return status;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}.${mm}.${dd}`;
}

function formatFullDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const mm = String(date.getMonth() + 1);
  const dd = String(date.getDate());
  return `${mm}.${dd}`;
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const ampm = date.getHours() < 12 ? '오전' : '오후';
  const h = date.getHours() % 12 || 12;
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${ampm} ${h}:${mm}`;
}

function renderStars(container, score) {
  const filled = Math.floor(parseFloat(score));
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html +=
      i <= filled
        ? `<img src="/assets/images/icons/icon-star-fill.png" alt="별">`
        : `<img src="/assets/images/icons/icon-star-empty.png" alt="빈 별">`;
  }
  container.innerHTML = html;
}

function renderCongestion(container, status) {
  const map = { LOW: 1, NORMAL: 2, HIGH: 3 };
  const fillCount = map[status] || 1;
  let html = '';
  for (let i = 1; i <= 3; i++) {
    html +=
      i <= fillCount
        ? `<img src="/assets/images/icons/icon-person-fill.png" alt="사람 채움">`
        : `<img src="/assets/images/icons/icon-person-empty.png" alt="사람 비움">`;
  }
  container.innerHTML = html;
}

// 판매자 페이지 요약 데이터 불러오기
function loadSummary() {
  fetch(`${API}/admin/summary?seller_id=${user.userId}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById('statMonthlyReservation').textContent =
        data.monthlyReservationCount;
      document.getElementById('statAverageRating').textContent =
        data.averageRating;
      document.getElementById('statTotalReview').textContent =
        data.totalReviewCount;
    });
}

loadPopupList();
loadReviewList();
initReservationFilter();
loadReservationList();
loadSummary();

// 관리자 페이지 전용 드래그 스크롤 + 클릭 방지
function initDragScroll(containerId) {
  const container = document.getElementById(containerId);
  let isDown = false;
  let isDragging = false;
  let startX;
  let scrollLeft;

  container.addEventListener('mousedown', (e) => {
    isDown = true;
    isDragging = false;
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
    isDragging = true;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
  });

  container.addEventListener(
    'click',
    (e) => {
      if (isDragging) {
        e.stopPropagation();
        e.preventDefault();
        isDragging = false;
      }
    },
    true,
  );

  container.style.cursor = 'grab';
}

// 가로 스크롤 화살표 힌트
function addScrollHint(containerId) {
  const container = document.getElementById(containerId);
  const wrapper = containerId.startsWith('reviewGroup')
    ? container.closest('.review-tab-content')
    : container.closest('.admin-section');

  const isReview =
    containerId === 'reviewList' || containerId.startsWith('reviewGroup');
  const offset = isReview ? '-16px' : '0';

  const hintRight = document.createElement('div');
  hintRight.className = 'scroll-hint scroll-hint-right';
  hintRight.style.right = offset;
  wrapper.style.position = 'relative';
  wrapper.appendChild(hintRight);

  const hintLeft = document.createElement('div');
  hintLeft.className = 'scroll-hint scroll-hint-left';
  hintLeft.style.left = offset;
  hintLeft.style.opacity = '0';
  wrapper.appendChild(hintLeft);

  // 스크롤 필요 없으면 오른쪽 화살표도 숨기기
  setTimeout(() => {
    if (container.scrollWidth <= container.clientWidth) {
      hintRight.style.opacity = '0';
    }
  }, 100);

  hintRight.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
  hintLeft.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  container.addEventListener('scroll', () => {
    const isStart = container.scrollLeft === 0;
    const isEnd =
      container.scrollLeft + container.clientWidth >=
      container.scrollWidth - 10;

    hintRight.style.opacity = isEnd ? '0' : '1';
    hintLeft.style.opacity = isStart ? '0' : '1';
  });
}
