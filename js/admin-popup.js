// 관리자 팝업 등록 JS
const POPUP_API = "http://localhost:8080/api/popups";

function checkAdmin() {
    const user = JSON.parse(localStorage.getItem("loginUser"));
    if (!user) {
        location.href = "/pages/login.html";
        return;
    }
    if (user.role !== "seller") {
        alert("판매자만 접근 가능합니다.");
        location.href = "/index.html";
    }
}

checkAdmin();
loadCategories();
loadRegions();

// flatpickr 날짜 인풋 초기화 (30분 단위)
const flatpickrConfig = {
    enableTime: true,
    dateFormat: "Y-m-dTH:i:S",
    altInput: true,
    altFormat: "Y년 m월 d일 h:i K",
    time_24hr: false,
    minuteIncrement: 30,
    locale: "ko",
    allowInput: true,
};

flatpickr("#startDate", flatpickrConfig);
flatpickr("#endDate", flatpickrConfig);
flatpickr("#reservationStartDate", flatpickrConfig);
flatpickr("#reservationEndDate", flatpickrConfig);

const tags = [];

// 에러 표시
function showError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.classList.add("input-error");

    const existing = input.parentElement.querySelector(".error-msg");
    if (existing) existing.remove();

    const msg = document.createElement("p");
    msg.className = "error-msg";
    msg.textContent = message;
    input.insertAdjacentElement("afterend", msg);
}

// 에러 초기화
function clearErrors() {
    document
        .querySelectorAll(".input-error")
        .forEach((el) => el.classList.remove("input-error"));
    document.querySelectorAll(".error-msg").forEach((el) => el.remove());
}

// 태그 추가
function addTag() {
    const input = document.getElementById("popupTag");
    const tag = input.value.trim();

    if (!tag) return;
    if (tags.includes(tag)) {
        alert("이미 추가된 태그예요!");
        return;
    }

    tags.push(tag);
    input.value = "";
    renderTags();
}

// 태그 삭제
function removeTag(tag) {
    const index = tags.indexOf(tag);
    tags.splice(index, 1);
    renderTags();
}

// 태그 목록 렌더링
function renderTags() {
    const tagList = document.getElementById("tagList");
    tagList.innerHTML = "";
    tags.forEach((tag) => {
        const span = document.createElement("span");
        span.textContent = tag;
        const btn = document.createElement("button");
        btn.textContent = "X";
        btn.onclick = () => removeTag(tag);
        span.appendChild(btn);
        tagList.appendChild(span);
    });
}

let mainImageFile = null;

// 대표 이미지 처리
function handleMainImage(input) {
    const file = input.files[0];
    if (!file) return;

    mainImageFile = file;
    document.getElementById("mainImageCount").textContent = 1;

    const reader = new FileReader();
    reader.onload = (e) => {
        renderMainImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 대표 이미지 미리보기 렌더링
function renderMainImagePreview(src) {
    const preview = document.getElementById("mainImagePreview");
    preview.innerHTML = "";

    const div = document.createElement("div");
    div.className = "image-preview-wrap";
    const img = document.createElement("img");
    img.src = src;

    const btn = document.createElement("button");
    btn.textContent = "X";
    btn.onclick = () => removeMainImage();

    div.appendChild(img);
    div.appendChild(btn);
    preview.appendChild(div);
}

// 대표 이미지 삭제
function removeMainImage() {
    mainImageFile = null;
    existingMainImageUrl = null;
    document.getElementById("mainImageCount").textContent = 0;
    document.getElementById("mainImagePreview").innerHTML = "";
    document.getElementById("mainImage").value = "";
}

const detailImageFiles = [];

// 상세 이미지 처리
function handleDetailImages(input) {
    const files = Array.from(input.files);

    if (detailImageFiles.length + files.length > 3) {
        alert("상세 이미지는 최대 3장까지 등록 가능합니다.");
        return;
    }

    files.forEach((file) => detailImageFiles.push(file));
    document.getElementById("detailImageCount").textContent =
        detailImageFiles.length;
    renderDetailImagePreview();
}

// 상세 이미지 미리보기 렌더링
function renderDetailImagePreview() {
    const preview = document.getElementById("detailImagePreview");
    preview.innerHTML = "";

    const promises = detailImageFiles.map((file, index) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ src: e.target.result, index });
            reader.readAsDataURL(file);
        });
    });

    Promise.all(promises).then((results) => {
        results.sort((a, b) => a.index - b.index);
        results.forEach(({ src }, index) => {
            const div = createDetailImageDiv(src, index);
            preview.appendChild(div);
        });
    });
}

// 상세 이미지 div 생성
function createDetailImageDiv(src, index) {
    const div = document.createElement("div");
    div.className = "detail-image-preview-wrap";
    div.draggable = true;
    div.dataset.index = index;

    // 순서 번호 추가
    const order = document.createElement("span");
    order.className = "detail-image-order";
    order.textContent = index + 1;
    div.appendChild(order);

    div.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", index);
        div.classList.add("dragging");
    });

    div.addEventListener("dragend", () => {
        div.classList.remove("dragging");
    });

    div.addEventListener("dragover", (e) => {
        e.preventDefault();
        div.classList.add("drag-over");
    });

    div.addEventListener("dragleave", () => {
        div.classList.remove("drag-over");
    });

    div.addEventListener("drop", (e) => {
        e.preventDefault();
        div.classList.remove("drag-over");
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
        const toIndex = parseInt(div.dataset.index);
        if (fromIndex === toIndex) return;

        const moved = detailImageFiles.splice(fromIndex, 1)[0];
        detailImageFiles.splice(toIndex, 0, moved);
        renderDetailImagePreview();
    });

    const img = document.createElement("img");
    img.src = src;

    const btn = document.createElement("button");
    btn.textContent = "X";
    btn.onclick = () => removeDetailImage(index);

    div.appendChild(img);
    div.appendChild(btn);
    return div;
}

// 상세 이미지 삭제
function removeDetailImage(index) {
    detailImageFiles.splice(index, 1);
    document.getElementById("detailImageCount").textContent =
        detailImageFiles.length;
    renderDetailImagePreview();
}

// 팝업 등록
function registerPopup() {
    clearErrors();
    let hasError = false;

    const user = JSON.parse(localStorage.getItem("loginUser"));
    const title = document.getElementById("popupTitle").value.trim();
    const categoryId = document.getElementById("selectedCategory").value;
    const regionId = document.getElementById("selectedRegion").value;
    const address = document.getElementById("popupAddress").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const reservationStartDate = document.getElementById(
        "reservationStartDate",
    ).value;
    const reservationEndDate =
        document.getElementById("reservationEndDate").value;
    const benefit = document.getElementById("popupBenefit").value.trim();
    const notice = document.getElementById("popupNotice").value.trim();
    const info = document.getElementById("popupInfo").value.trim();
    const snsUrl = document.getElementById("popupSNS").value.trim();

    if (!title) {
        showError("popupTitle", "팝업 이름은 필수입니다.");
        hasError = true;
    }
    if (!categoryId) {
        const formGroup = document
            .getElementById("categoryList")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "카테고리를 선택해주세요.";
        formGroup.appendChild(msg);
        hasError = true;
    }

    if (!regionId) {
        const formGroup = document
            .getElementById("regionList")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "지역을 선택해주세요.";
        formGroup.appendChild(msg);
        hasError = true;
    }
    if (!address) {
        showError("popupAddress", "주소는 필수입니다.");
        hasError = true;
    }
    if (!startDate || !endDate) {
        const formGroup = document
            .getElementById("startDate")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "일정을 입력해주세요.";
        formGroup.appendChild(msg); // afterend → appendChild
        hasError = true;
    }

    if (!reservationStartDate || !reservationEndDate) {
        const formGroup = document
            .getElementById("reservationStartDate")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "예약 일정을 입력해주세요.";
        formGroup.appendChild(msg);
        hasError = true;
    }

    if (reservationEndDate && endDate && reservationEndDate > endDate) {
        const formGroup = document
            .getElementById("reservationEndDate")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "예약 종료일은 팝업 종료일보다 늦을 수 없습니다.";
        formGroup.appendChild(msg);
        hasError = true;
    }

    if (!mainImageFile) {
        const btn = document.querySelector(
            ".form-group > button[type='button']",
        );
        btn.style.borderColor = "#e05c5c";
        btn.style.color = "#e05c5c";
        btn.classList.add("input-error");
        hasError = true;
    }

    if (hasError) {
        const firstError = document.querySelector(".input-error, .error-msg");
        if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
    }

    const formData = new FormData();
    formData.append("sellerId", user.userId);
    formData.append("title", title);
    formData.append("categoryId", categoryId);
    formData.append("regionId", regionId);
    formData.append("address", address);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    if (reservationStartDate)
        formData.append("reservationStartDate", reservationStartDate);
    if (reservationEndDate)
        formData.append("reservationEndDate", reservationEndDate);
    if (benefit) formData.append("benefit", benefit);
    if (notice) formData.append("notice", notice);
    if (info) formData.append("info", info);
    if (snsUrl) formData.append("snsUrl", snsUrl);
    formData.append("mainImage", mainImageFile);
    detailImageFiles.forEach((file) => formData.append("detailImages", file));
    tags.forEach((tag) => formData.append("tags", tag));

    fetch(`${POPUP_API}`, {
        method: "POST",
        body: formData,
    })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
            if (ok) {
                alert(data.message);
                location.href = "/pages/admin.html";
            } else {
                alert(data.message);
                document
                    .querySelector(".date-group")
                    .scrollIntoView({ behavior: "smooth", block: "center" });
            }
        })
        .catch(() => {
            showMsg("popupRegisterMsg", "서버 오류가 발생했습니다.", false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
}

// 페이지 로드될 때 기존 팝업 데이터 불러오기
const urlParams = new URLSearchParams(window.location.search);
const popupId = urlParams.get("id");

if (popupId) {
    loadPopupDetail(popupId);
}

let existingMainImageUrl = null;
let existingData = null;

// 팝업 상세 데이터 불러오기
function loadPopupDetail(id) {
    fetch(`${POPUP_API}/${id}`)
        .then((res) => res.json())
        .then((data) => {
            existingData = data;
            existingMainImageUrl = data.mainImageUrl;

            document.getElementById("popupTitle").value = data.title;
            document.getElementById("popupAddress").value = data.address;

            document
                .getElementById("startDate")
                ._flatpickr.setDate(data.startDate);
            document.getElementById("endDate")._flatpickr.setDate(data.endDate);
            if (data.reservationStartDate)
                document
                    .getElementById("reservationStartDate")
                    ._flatpickr.setDate(data.reservationStartDate);
            if (data.reservationEndDate)
                document
                    .getElementById("reservationEndDate")
                    ._flatpickr.setDate(data.reservationEndDate);

            if (data.benefit)
                document.getElementById("popupBenefit").value = data.benefit;
            if (data.notice)
                document.getElementById("popupNotice").value = data.notice;
            if (data.info)
                document.getElementById("popupInfo").value = data.info;

            // 기존 데이터에 맞게 textarea 높이 자동 조절
            ["popupBenefit", "popupNotice", "popupInfo"].forEach((id) => {
                const textarea = document.getElementById(id);
                if (!textarea || !textarea.value) return;
                textarea.style.height = "48px";
                textarea.style.height = textarea.scrollHeight + "px";
            });

            if (data.snsUrl)
                document.getElementById("popupSNS").value = data.snsUrl;

            // 카테고리 active 처리
            if (data.categoryName) {
                setTimeout(() => {
                    const categoryBtn = Array.from(
                        document.querySelectorAll("#categoryList button"),
                    ).find((btn) => btn.textContent === data.categoryName);
                    if (categoryBtn) {
                        categoryBtn.classList.add("active");
                        document.getElementById("selectedCategory").value =
                            categoryBtn.dataset.id;
                    }
                }, 1000);
            }

            // 지역 active 처리
            if (data.regionName) {
                setTimeout(() => {
                    const regionBtn = Array.from(
                        document.querySelectorAll("#regionList button"),
                    ).find((btn) => btn.textContent === data.regionName);
                    if (regionBtn) {
                        regionBtn.classList.add("active");
                        document.getElementById("selectedRegion").value =
                            regionBtn.dataset.id;
                    }
                }, 1000);
            }

            // 메인 이미지 미리보기
            if (data.mainImageUrl) {
                document.getElementById("mainImageCount").textContent = 1;
                const mainImageUrl = data.mainImageUrl?.startsWith("http")
                    ? data.mainImageUrl
                    : `http://localhost:8080${data.mainImageUrl}`;
                renderMainImagePreview(`${mainImageUrl}`);
            }

            // 상세 이미지 미리보기
            if (data.detailImages && data.detailImages.length > 0) {
                document.getElementById("detailImageCount").textContent =
                    data.detailImages.length;

                Promise.all(
                    data.detailImages.map((imageUrl) => {
                        const fullUrl = imageUrl.startsWith("http")
                            ? imageUrl
                            : `http://localhost:8080${imageUrl}`;
                        return fetch(fullUrl)
                            .then((res) => res.blob())
                            .then(
                                (blob) =>
                                    new File(
                                        [blob],
                                        imageUrl.split("/").pop(),
                                        { type: blob.type },
                                    ),
                            );
                    }),
                ).then((files) => {
                    files.forEach((file) => detailImageFiles.push(file));
                    renderDetailImagePreview();
                });
            }

            // 태그 불러오기
            data.tags.forEach((tag) => tags.push(tag));
            renderTags();
        });
}

// 팝업 수정
function editPopup() {
    clearErrors();
    let hasError = false;

    const title = document.getElementById("popupTitle").value.trim();
    const address = document.getElementById("popupAddress").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const categoryId = document.getElementById("selectedCategory").value;
    const regionId = document.getElementById("selectedRegion").value;
    const reservationStartDate = document.getElementById(
        "reservationStartDate",
    ).value;
    const reservationEndDate =
        document.getElementById("reservationEndDate").value;

    if (!title) {
        showError("popupTitle", "팝업 이름은 필수입니다.");
        hasError = true;
    }
    if (!address) {
        showError("popupAddress", "주소는 필수입니다.");
        hasError = true;
    }
    if (!categoryId) {
        const formGroup = document
            .getElementById("categoryList")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "카테고리를 선택해주세요.";
        formGroup.appendChild(msg);
        hasError = true;
    }
    if (!regionId) {
        const formGroup = document
            .getElementById("regionList")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "지역을 선택해주세요.";
        formGroup.appendChild(msg);
        hasError = true;
    }
    if (!startDate || !endDate) {
        const formGroup = document
            .getElementById("startDate")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "일정을 입력해주세요.";
        formGroup.appendChild(msg); // afterend → appendChild
        hasError = true;
    }
    if (!reservationStartDate || !reservationEndDate) {
        const formGroup = document
            .getElementById("reservationStartDate")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "예약 일정을 입력해주세요.";
        formGroup.appendChild(msg);
        hasError = true;
    }

    if (reservationEndDate && endDate && reservationEndDate > endDate) {
        const formGroup = document
            .getElementById("reservationEndDate")
            .closest(".form-group");
        const msg = document.createElement("p");
        msg.className = "error-msg";
        msg.textContent = "예약 종료일은 팝업 종료일보다 늦을 수 없습니다.";
        formGroup.appendChild(msg);
        hasError = true;
    }
    if (!mainImageFile && !existingMainImageUrl) {
        const btn = document.querySelector(
            ".form-group > button[type='button']",
        );
        btn.style.borderColor = "#e05c5c";
        btn.style.color = "#e05c5c";
        btn.classList.add("input-error");
        hasError = true;
    }
    if (hasError) {
        const firstError = document.querySelector(".input-error, .error-msg");
        if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
    }

    const user = JSON.parse(localStorage.getItem("loginUser"));
    const benefit = document.getElementById("popupBenefit").value.trim();
    const notice = document.getElementById("popupNotice").value.trim();
    const info = document.getElementById("popupInfo").value.trim();
    const snsUrl = document.getElementById("popupSNS").value.trim();

    const formData = new FormData();
    formData.append("sellerId", user.userId);
    if (title) formData.append("title", title);
    if (categoryId) formData.append("categoryId", categoryId);
    if (regionId) formData.append("regionId", regionId);
    if (address) formData.append("address", address);
    if (startDate) formData.append("startDate", startDate);
    if (endDate) formData.append("endDate", endDate);
    if (reservationStartDate)
        formData.append("reservationStartDate", reservationStartDate);
    if (reservationEndDate)
        formData.append("reservationEndDate", reservationEndDate);
    if (benefit) formData.append("benefit", benefit);
    if (notice) formData.append("notice", notice);
    if (info) formData.append("info", info);
    if (snsUrl) formData.append("snsUrl", snsUrl);
    if (mainImageFile) formData.append("mainImage", mainImageFile);
    detailImageFiles.forEach((file) => formData.append("detailImages", file));
    tags.forEach((tag) => formData.append("tags", tag));

    fetch(`${POPUP_API}/${popupId}`, {
        method: "PUT",
        body: formData,
    })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
            if (ok) {
                alert(data.message);
                location.href = "/pages/admin.html";
            } else {
                alert(data.message);
                document
                    .querySelector(".date-group")
                    .scrollIntoView({ behavior: "smooth", block: "center" });
            }
        })
        .catch(() => {
            showMsg("popupRegisterMsg", "서버 오류가 발생했습니다.", false);
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
}

/* 입력 시 에러 제거 */

// 제목 입력 시 에러 제거
document.getElementById("popupTitle").addEventListener("input", () => {
    clearError("popupTitle");
});

// 대표 이미지 선택 시 에러 제거
document.getElementById("mainImage").addEventListener("change", () => {
    const btn = document.querySelector(".form-group > button[type='button']");
    if (btn) {
        btn.style.borderColor = "";
        btn.style.color = "";
        btn.classList.remove("input-error");
    }
});

// 일정 입력 시 에러 제거
document.getElementById("startDate").addEventListener("change", () => {
    const formGroup = document
        .getElementById("startDate")
        .closest(".form-group");
    const msg = formGroup.querySelector(".error-msg");
    if (msg) msg.remove();
});

document.getElementById("endDate").addEventListener("change", () => {
    const formGroup = document
        .getElementById("startDate")
        .closest(".form-group");
    const msg = formGroup.querySelector(".error-msg");
    if (msg) msg.remove();
});

document
    .getElementById("reservationStartDate")
    .addEventListener("change", () => {
        const formGroup = document
            .getElementById("reservationStartDate")
            .closest(".form-group");
        const msg = formGroup.querySelector(".error-msg");
        if (msg) msg.remove();
    });

document.getElementById("reservationEndDate").addEventListener("change", () => {
    const formGroup = document
        .getElementById("reservationStartDate")
        .closest(".form-group");
    const msg = formGroup.querySelector(".error-msg");
    if (msg) msg.remove();
});

// 카테고리 선택 시 에러 제거
document.getElementById("categoryList").addEventListener("click", () => {
    const formGroup = document
        .getElementById("categoryList")
        .closest(".form-group");
    const msg = formGroup.querySelector(".error-msg");
    if (msg) msg.remove();
});

// 지역 선택 시 에러 제거
document.getElementById("regionList").addEventListener("click", () => {
    const formGroup = document
        .getElementById("regionList")
        .closest(".form-group");
    const msg = formGroup.querySelector(".error-msg");
    if (msg) msg.remove();
});

// 주소 입력시 에러 제거
document.getElementById("popupAddress").addEventListener("input", () => {
    clearError("popupAddress");
});

function clearError(id) {
    const input = document.getElementById(id);
    if (input) {
        input.classList.remove("input-error");
        const msg = input.parentElement.querySelector(".error-msg");
        if (msg) msg.remove();
    }
}

// textarea 자동 높이 조절
["popupBenefit", "popupNotice", "popupInfo"].forEach((id) => {
    const textarea = document.getElementById(id);
    if (!textarea) return;
    textarea.addEventListener("input", () => {
        textarea.style.height = "48px"; // 초기화
        textarea.style.height = textarea.scrollHeight + "px"; // 내용에 맞게 늘리기
    });
});
