document.addEventListener("DOMContentLoaded", function () {

    const BASE_URL = "http://localhost:8080/api";

    // 필요에 따라 아래처럼 세부 도메인별로 쪼개서 관리하면 더 직관적입니다.
    const POPUP_API = `${BASE_URL}/popups`;
    const RESERVE_API = `${BASE_URL}/reservations`;

    // URL에서 파라미터 추출 (?id=106?reservation_id=108 또는 ?id=106&reservation_id=108 지원)
    const queryString = window.location.search;
    let popupId = null;
    let reservationId = null;

    if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        popupId = urlParams.get('id');
        reservationId = urlParams.get('reservation_id');

        // ?id=106?reservation_id=108 형태 대응
        if (!reservationId && popupId && popupId.includes('?')) {
            const parts = popupId.split('?');
            popupId = parts[0];
            const secondaryParams = new URLSearchParams('?' + parts[1]);
            reservationId = secondaryParams.get('reservation_id');
        }
    }

    let selectedDateStr = "";
    let selectedTimeStr = "";

    async function initPage() {
        if (!popupId) {
            alert("잘못된 접근입니다.");
            location.href = "/index.html";
            return;
        }

        try {
            // 변수로 선언해 둔 POPUP_API 주소를 활용하여 호출합니다.
            const response = await fetch(`${POPUP_API}/${popupId}`);
            const popupData = await response.json();

            renderSummary(popupData);
            renderTimeSlots();
            setupEventListeners();

            if (reservationId) {
                await loadAndPreFillReservation();
            }
        } catch (error) {
            console.error("데이터 로드 실패:", error);
        }
    }

    async function loadAndPreFillReservation() {
        const reserveBtn = document.getElementById("btn-final-reserve");
        if (reserveBtn) {
            reserveBtn.textContent = "예약 수정하기";
        }

        let reservation = null;
        const loginUserStr = localStorage.getItem("loginUser");

        if (loginUserStr) {
            const loginUser = JSON.parse(loginUserStr);
            const currentUserId = loginUser.userId || loginUser.id;
            try {
                // 단일 조회 API가 없으므로 본인 예약 목록 조회에서 검색
                const res = await fetch(`${RESERVE_API}/me?user_id=${currentUserId}`);
                if (res.ok) {
                    const list = await res.json();
                    reservation = list.find(item => String(item.id) === String(reservationId));
                }
            } catch (err) {
                console.error("예약 목록 조회 실패:", err);
            }
        }

        if (!reservation) {
            alert("예약 정보를 불러오는데 실패했습니다.");
            return;
        }

        // 폼 필드 채우기
        const visitorNameInput = document.getElementById("visitor-name");
        const visitorPhoneInput = document.getElementById("visitor-phone");
        const dateInput = document.getElementById("reserve-date-input");

        if (visitorNameInput) visitorNameInput.value = reservation.userName || "";
        if (visitorPhoneInput) visitorPhoneInput.value = reservation.userPhone || "";

        if (reservation.reserveDate) {
            const parts = reservation.reserveDate.split(" ");
            const datePart = parts[0]; // e.g. YYYY-MM-DD
            if (dateInput) {
                if (dateInput._flatpickr) {
                    dateInput._flatpickr.setDate(datePart);
                } else {
                    dateInput.value = datePart;
                }
                selectedDateStr = datePart;
            }

            if (parts[1]) {
                const timePart = parts[1].substring(0, 5); // e.g. HH:mm
                selectedTimeStr = timePart;

                // 시간 슬롯 버튼 선택 처리
                const timeButtons = document.querySelectorAll(".btn-time-slot");
                timeButtons.forEach(btn => {
                    if (btn.textContent.trim() === timePart) {
                        btn.classList.add("selected");
                    } else {
                        btn.classList.remove("selected");
                    }
                });
            }
        }
    }

    // 팝업 요약 정보 화면 렌더링 함수
    function renderSummary(data) {
        const posterImg = document.getElementById("reserve-main-thumb");
        if (posterImg && data.mainImageUrl) {
            posterImg.src = data.mainImageUrl.startsWith("/")
                ? `http://localhost:8080${data.mainImageUrl}`
                : data.mainImageUrl;
        }

        // 상태값 가져오기
        const statusInfo = getPopupStatus(data);

        const summaryBox = document.getElementById("popup-summary-container");
        if (summaryBox) {
            summaryBox.innerHTML = `
            <span class="card-status ${statusInfo.className}">${statusInfo.label}</span>
            <h1 class="popup-title">${data.title}</h1>
            <span class="badge-category">${data.categoryName}</span>
            <p class="popup-location-text">${data.regionName}</p>
            <p class="popup-period-text">${data.startDate.split('T')[0]} ~ ${data.endDate.split('T')[0]}</p>
            <p class="popup-desc-text">${data.notice || "공지사항이 없습니다."}</p>
        `;
        }
    }
    function getPopupStatus(data) {
        const now = new Date();
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        if (now < start) {
            // 오늘이 시작일 이전
            return { className: 'is-upcoming', label: '운영 예정' };
        } else if (now >= start && now <= end) {
            // 오늘이 기간 내 포함
            return { className: 'is-running', label: '운영중' };
        } else {
            // 오늘이 종료일 이후
            return { className: 'is-closed', label: '운영 마감' };
        }
    }

    // 시간 버튼 생성 함수
    function renderTimeSlots() {
        const morningGrid = document.getElementById("morning-slots-grid");
        const afternoonGrid = document.getElementById("afternoon-slots-grid");

        const morningTimes = ["10:00", "10:30", "11:00", "11:30"];
        const afternoonTimes = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30"];

        if (morningGrid) morningGrid.innerHTML = morningTimes.map(t => `<button type="button" class="btn-time-slot">${t}</button>`).join("");
        if (afternoonGrid) afternoonGrid.innerHTML = afternoonTimes.map(t => `<button type="button" class="btn-time-slot">${t}</button>`).join("");

        document.querySelectorAll(".btn-time-slot").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".btn-time-slot").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                selectedTimeStr = btn.textContent;
            });
        });
    }

    function setupEventListeners() {
        const dateInput = document.getElementById("reserve-date-input");
        if (dateInput) {
            // flatpickr 날짜 인풋 초기화
            const fp = flatpickr("#reserve-date-input", {
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "Y년 m월 d일",
                locale: "ko",
                allowInput: true,
                defaultDate: dateInput.value || "2026-05-29",
                onChange: function(selectedDates, dateStr) {
                    selectedDateStr = dateStr;
                }
            });
            selectedDateStr = fp.selectedDates[0] ? fp.formatDate(fp.selectedDates[0], "Y-m-d") : (dateInput.value || "2026-05-29");
        }

        const reserveBtn = document.getElementById("btn-final-reserve");
        if (reserveBtn) {
            reserveBtn.addEventListener("click", async function () {
                const userName = document.getElementById("visitor-name").value.trim();
                const userPhone = document.getElementById("visitor-phone").value.trim();

                if (!userName || !userPhone || !selectedDateStr || !selectedTimeStr) {
                    alert("모든 예약 정보를 입력하고 날짜와 시간을 선택해주세요.");
                    return;
                }

                const loginUserStr = localStorage.getItem("loginUser");
                const loginUser = loginUserStr ? JSON.parse(loginUserStr) : null;
                const currentUserId = loginUser ? (loginUser.userId || loginUser.id) : 1;

                if (reservationId) {
                    // 수정 모드 (PATCH)
                    const payload = {
                        userId: currentUserId,
                        reserveDate: `${selectedDateStr} ${selectedTimeStr}:00`, // 백엔드 DTO 매핑용 (SQL reserve_date 컬럼 대응)
                        reservedDate: `${selectedDateStr} ${selectedTimeStr}:00`, // 노션 명세 문서 준수용
                        userName: userName,
                        userPhone: userPhone
                    };

                    try {
                        const response = await fetch(`${RESERVE_API}/${reservationId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                            alert("예약이 수정되었습니다!");
                            location.href = "/pages/mypage.html";
                        } else {
                            alert("예약 수정에 실패했습니다. 입력 정보를 확인해주세요.");
                        }
                    } catch (error) {
                        console.error("네트워크 전송 오류:", error);
                        alert("서버 통신 중 오류가 발생했습니다.");
                    }
                } else {
                    // 신규 예약 등록 모드 (POST)
                    const payload = {
                        userId: currentUserId,
                        reserveDate: `${selectedDateStr} ${selectedTimeStr}:00`,
                        userName: userName,
                        userPhone: userPhone
                    };

                    try {
                        const response = await fetch(`${RESERVE_API}/popups/${popupId}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });

                        if (response.ok) {
                            alert("예약이 완료되었습니다!");
                            location.href = "/pages/mypage.html";
                        } else {
                            alert("예약에 실패했습니다. 입력 정보를 확인해주세요.");
                        }
                    } catch (error) {
                        console.error("네트워크 전송 오류:", error);
                        alert("서버 통신 중 오류가 발생했습니다.");
                    }
                }
            });
        }
    }

    initPage();
});