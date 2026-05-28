// 관리자 메인 페이지 JS
const user = JSON.parse(localStorage.getItem("loginUser"));

// 관리자 접근 제한
if (!user || user.role !== "seller") {
    alert("판매자만 접근 가능합니다.");
    location.href = "/index.html";
}

// 팝업 목록 불러오기
function loadPopupList() {
    fetch(`http://localhost:8080/api/popups?seller_id=${user.userId}`)
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
                div.innerHTML = `
                    <div class="card-image-wrap">
                        <img src="http://localhost:8080${popup.mainImageUrl}" alt="${popup.title}" class="card-thumb" />
                    </div>
                    <div class="card-body-wrap">
                        <div class="card-info">
                            <div class="card-status-row">
                                <span class="card-status ${getStatusClass(popup.status)}">${getStatusText(popup.status)}</span>
                                <div class="card-actions">
                                    <button class="btn-edit" onclick="location.href='/pages/popup-edit.html?id=${popup.id}'">수정</button>
                                    <button class="btn-delete" onclick="deletePopup(${popup.id})">삭제</button>
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

    fetch(
        `http://localhost:8080/api/popups/${popupId}?seller_id=${user.userId}`,
        {
            method: "DELETE",
        },
    )
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
    fetch(`http://localhost:8080/api/admin/reviews?seller_id=${user.userId}`)
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
                    <div class="review-header">
                        <span class="reviewer-name">${review.userName || "이름"}</span>
                        <span class="review-date">${formatDate(review.createdAt)}</span>
                    </div>
                    <p class="review-rating">⭐ ${review.rating} / 5.0</p>
                    <p class="review-content">${review.content}</p>
                    ${
                        review.images && review.images.length > 0
                            ? `
                    <div class="review-images">
                        ${review.images.map((img) => `<img src="http://localhost:8080${img}" alt="후기 이미지" />`).join("")}
                    </div>`
                            : ""
                    }
                    <div class="review-popup-info">
                        <img src="http://localhost:8080${review.popupMainImageUrl || ""}" alt="${review.popupTitle}" />
                        <div class="popup-info-text">
                            <span class="popup-name">${review.popupTitle || ""}</span>
                            <span class="popup-sub">${review.categoryName || ""} · ${review.congestionLevel || ""}</span>
                        </div>
                    </div>
                `;
                reviewList.appendChild(div);
            });
        });
}

// 예약 목록 불러오기
function loadReservationList() {
    fetch(`http://localhost:8080/api/reservations?seller_id=${user.userId}`)
        .then((res) => res.json())
        .then((data) => {
            const reservationList = document.getElementById("reservationList");
            if (data.length === 0) {
                reservationList.innerHTML =
                    '<p class="empty-msg">예약자가 없습니다.</p>';
                return;
            }

            const grouped = {};
            data.forEach((reservation) => {
                const date = reservation.reserveDate.split("T")[0];
                if (!grouped[date]) grouped[date] = [];
                grouped[date].push(reservation);
            });

            Object.entries(grouped).forEach(([date, reservations]) => {
                const group = document.createElement("div");
                group.className = "reservation-date-group";
                group.innerHTML = `<p class="date-label">${formatFullDate(date)}</p>`;

                const grid = document.createElement("div");
                grid.className = "reservation-grid";

                reservations.forEach((reservation) => {
                    const card = document.createElement("div");
                    card.className = "reservation-card";
                    card.innerHTML = `
                        <p class="reserver-name">${reservation.userName} 님</p>
                        <p class="reserve-time">${formatTime(reservation.reserveDate)} 예약</p>
                    `;
                    grid.appendChild(card);
                });

                group.appendChild(grid);
                reservationList.appendChild(group);
            });
        });
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

loadPopupList();
loadReviewList();
loadReservationList();
