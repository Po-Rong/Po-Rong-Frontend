// 관리자 메인 페이지 JS
const user = JSON.parse(localStorage.getItem("loginUser"));

// 관리자 접근 제한
if (!user || user.role !== "seller") {
    alert("판매자만 접근 가능합니다.");
    location.href = "/index.html";
}

// 팝업 목록 불러오기
function loadPopupList() {
    fetch(`${API}/popups?seller_id=${user.userId}`)
        .then((res) => res.json())
        .then((data) => {
            const popupList = document.getElementById("popupList");
            if (data.length === 0) {
                popupList.innerHTML =
                    '<p class="empty-msg">등록한 팝업스토어가 없습니다.</p>';
                return;
            }
            data.forEach((popup) => {
                const div = document.createElement("div");
                div.className = "popup-card";
                div.style.cursor = "pointer";
                div.onclick = () =>
                    (location.href = `/pages/detail.html?id=${popup.id}`);
                div.innerHTML = `
                    <div class="card-image-wrap">
                        <img src="http://localhost:8080${popup.mainImageUrl}" alt="${popup.title}" class="card-thumb" />
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
        });
}

// 팝업 삭제
function deletePopup(popupId) {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    fetch(`${API}/popups/${popupId}?seller_id=${user.userId}`, {
        method: "DELETE",
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
        .catch(() => alert("서버 오류"));
}

// 후기 목록 불러오기
function loadReviewList() {
    fetch(`${API}/admin/reviews?seller_id=${user.userId}`)
        .then((res) => res.json())
        .then((data) => {
            const reviewList = document.getElementById("reviewList");
            if (data.length === 0) {
                reviewList.innerHTML =
                    '<p class="empty-msg">달린 후기가 없습니다.</p>';
                return;
            }
            data.forEach((review) => {
                const div = document.createElement("div");
                div.className = "review-card";
                div.innerHTML = `
                    <div class="review-card-header">
                        <span class="reviewer-name">${review.nickname || "이름"}</span>
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
                        <img src="http://localhost:8080${review.reviewImageUrl}" alt="리뷰 첨부 사진" class="review-attached-img" />
                    </div>`
                            : ""
                    }
                    <div class="review-target-popup">
                        <div class="target-thumb-wrap">
                            <img src="http://localhost:8080${review.popupMainImageUrl || ""}" alt="${review.popupTitle}" class="target-thumb" />
                        </div>
                        <div class="target-info-wrap">
                            <div class="target-tags">
                                <span class="card-category">${review.categoryName || ""}</span>
                            </div>
                            <h4 class="target-title">${review.popupTitle || ""}</h4>
                        </div>
                    </div>
                `;

                // 별점 혼잡도 렌더링
                renderStars(div.querySelector(".rating-stars"), review.rating);
                renderCongestion(
                    div.querySelector(".congestion-icons"),
                    review.congestionLevel,
                );

                reviewList.appendChild(div);
            });
        });
}

function getCongestionText(level) {
    if (level === "LOW") return "낮음";
    if (level === "NORMAL") return "보통";
    if (level === "HIGH") return "높음";
    return level;
}

function getCongestionText(level) {
    if (level === "LOW") return "낮음";
    if (level === "NORMAL") return "보통";
    if (level === "HIGH") return "높음";
    return level;
}

// 예약 목록 불러오기
let reservationPage = 0;
let reservationHasNext = false;

function loadReservationList(page = 0) {
    fetch(
        `http://localhost:8080/api/reservations?seller_id=${user.userId}&page=${page}&size=2`,
    )
        .then((res) => res.json())
        .then((data) => {
            const reservationList = document.getElementById("reservationList");

            if (page === 0) reservationList.innerHTML = ""; // 첫 페이지면 초기화

            if (data.content.length === 0 && page === 0) {
                reservationList.innerHTML =
                    '<p class="empty-msg">예약자가 없습니다.</p>';
                return;
            }

            data.content.forEach(({ date, reservations }) => {
                const group = document.createElement("div");
                group.className = "reservation-date-group";
                group.innerHTML = `<p class="date-label">${formatFullDate(date)}</p>`;

                const grid = document.createElement("div");
                grid.className = "reservation-grid";

                reservations.forEach((reservation) => {
                    const card = document.createElement("div");
                    card.className = "reservation-card";
                    card.innerHTML = `
                                        <div class="reservation-card-header">
                                            <p class="reserver-name">${reservation.userName} 님</p>
                                            <span class="reservation-badge ${reservation.status === "CONFIRMED" ? "badge-confirmed" : "badge-canceled"}">
                                                ${reservation.status === "CONFIRMED" ? "예약" : "취소"}
                                            </span>
                                        </div>
                                        <p class="reserve-time">${formatTime(reservation.reserveDate)} 예약</p>
                                    `;
                    card.onclick = () => openReservationModal(reservation);
                    grid.appendChild(card);
                });
                group.appendChild(grid);
                reservationList.appendChild(group);
            });

            // 더보기 버튼 처리
            reservationHasNext = data.hasNext;
            const existingBtn = document.getElementById("loadMoreBtn");
            if (existingBtn) existingBtn.remove();

            if (data.hasNext) {
                const btn = document.createElement("button");
                btn.id = "loadMoreBtn";
                btn.className = "btn-load-more";
                btn.textContent = "더보기";
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
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
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
            <button class="btn-cancel-reservation" 
                onclick="cancelReservation(${reservation.id}, this)"
                ${reservation.status === "CANCELED" ? "disabled" : ""}>
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
    if (!confirm("예약을 취소하시겠습니까?")) return;

    fetch(
        `${API}/reservations/${reservationId}/seller-cancel?seller_id=${user.userId}`,
        {
            method: "PATCH",
        },
    )
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
            if (ok) {
                alert(data.message);
                btn.closest(".modal-overlay").remove();
                reservationPage = 0;
                loadReservationList(0);
            } else {
                alert(data.message);
            }
        })
        .catch(() => alert("서버 오류"));
}

function getStatusClass(status) {
    if (status === "upcoming") return "is-upcoming";
    if (status === "ongoing") return "is-running";
    if (status === "closed") return "is-closed";
    return "";
}

function getStatusText(status) {
    if (status === "upcoming") return "운영예정";
    if (status === "ongoing") return "운영중";
    if (status === "closed") return "운영마감";
    return status;
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
}

function formatFullDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const mm = String(date.getMonth() + 1);
    const dd = String(date.getDate());
    return `${mm}.${dd}`;
}

function formatTime(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const ampm = date.getHours() < 12 ? "오전" : "오후";
    const h = date.getHours() % 12 || 12;
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${ampm} ${h}:${mm}`;
}

function renderStars(container, score) {
    const filled = Math.floor(parseFloat(score));
    let html = "";
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
    let html = "";
    for (let i = 1; i <= 3; i++) {
        html +=
            i <= fillCount
                ? `<img src="/assets/images/icons/icon-person-fill.png" alt="사람 채움">`
                : `<img src="/assets/images/icons/icon-person-empty.png" alt="사람 비움">`;
    }
    container.innerHTML = html;
}

loadPopupList();
loadReviewList();
loadReservationList();
