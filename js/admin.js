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
                popupList.innerHTML = "<p>등록한 팝업스토어가 없습니다.</p>";
                return;
            }
            data.forEach((popup) => {
                const div = document.createElement("div");
                div.className = "popup-card";
                div.innerHTML = `
                    <img src="http://localhost:8080${popup.mainImageUrl}" style="width:150px;height:150px;object-fit:cover;" />
                    <p>${getStatusText(popup.status)}</p>
                    <button onclick="location.href='/pages/popup-edit.html?id=${popup.id}'">수정</button>
                    <button onclick="deletePopup(${popup.id})">삭제</button>
                    <p>${popup.title}</p>
                    <p>${popup.regionName}</p>
                    <p>${formatDate(popup.startDate)} ~ ${formatDate(popup.endDate)}</p>
                    <p>${popup.categoryName}</p>
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
                reviewList.innerHTML = "<p>달린 후기가 없습니다.</p>";
                return;
            }
            data.forEach((review) => {
                const div = document.createElement("div");
                div.className = "review-card";
                div.innerHTML = `
                    <p>⭐ ${review.rating}</p>
                    <p>${review.content}</p>
                    <p>${review.congestionLevel}</p>
                    <p>${review.createdAt}</p>
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
                reservationList.innerHTML = "<p>예약자가 없습니다.</p>";
                return;
            }
            data.forEach((reservation) => {
                const div = document.createElement("div");
                div.className = "reservation-card";
                div.innerHTML = `
                    <p>${reservation.userName}</p>
                    <p>${reservation.reserveDate}</p>
                    <p>${reservation.status}</p>
                `;
                reservationList.appendChild(div);
            });
        });
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

// 페이지 로드될 때 실행
loadPopupList();
loadReviewList();
loadReservationList();
