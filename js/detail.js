document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const popupId = urlParams.get("id") || 1;
    const TEST_USER_ID = 1;

    const popupMainThumb = document.getElementById("popup-main-thumb");
    const popupCategory = document.getElementById("popup-category");
    const popupTitle = document.getElementById("popup-title");
    const popupPeriod = document.getElementById("popup-period");
    const popupLocation = document.getElementById("popup-location");
    const popupHours = document.getElementById("popup-hours");
    const popupIntro = document.getElementById("popup-intro");
    const longImageWrapper = document.querySelector(".long-image-wrapper");
    const timetableSlots = document.getElementById("timetable-slots");

    // 1. 공지사항 및 혜택 엘리먼트 선택자 추가
    const popupNotice = document.getElementById("popup-notice");
    const popupBenefit = document.getElementById("popup-benefit");

    fetch(`http://localhost:8080/api/popups/${popupId}`)
        .then(response => {
            if (!response.ok) throw new Error("팝업 상세 데이터를 가져오는데 실패했습니다.");
            return response.json();
        })
        .then(popup => {
            if (popupMainThumb) popupMainThumb.src = popup.mainImageUrl || "";
            if (popupCategory) popupCategory.innerText = popup.categoryName || "미지정";
            if (popupTitle) popupTitle.innerText = popup.title;
            if (popupPeriod) popupPeriod.innerText = `${popup.startDate.split('T')[0]} ~ ${popup.endDate.split('T')[0]}`;
            if (popupLocation) popupLocation.innerText = popup.address;
            if (popupHours) popupHours.innerText = popup.operatingHours || "10:00 ~ 22:00";
            if (popupIntro) popupIntro.innerText = popup.info || "";

            // 2. 공지사항 및 혜택 데이터 화면에 매핑하는 로직 추가
            if (popupNotice) popupNotice.innerText = popup.notice || "등록된 공지사항이 없습니다.";
            if (popupBenefit) popupBenefit.innerText = popup.benefit || "진행 중인 혜택이 없습니다.";

            if (longImageWrapper && popup.detailImages && popup.detailImages.length > 0) {
                longImageWrapper.innerHTML = "";
                popup.detailImages.forEach(imgUrl => {
                    const img = document.createElement("img");

                    if (imgUrl.startsWith("/")) {
                        img.src = `http://localhost:8080${imgUrl}`;
                    } else {
                        img.src = imgUrl;
                    }

                    img.alt = "상세 안내 포스터 이미지";
                    longImageWrapper.appendChild(img);
                });
            }

            if (popup.timeSlots && popup.timeSlots.length > 0) {
                renderTimetable(popup.timeSlots);
            }
        })
        .catch(error => {
            console.error("데이터 로드 에러:", error);
        });

    // ... 아래 renderTimetable 및 bindReserveEvents 함수 코드는 동일합니다 ...
});