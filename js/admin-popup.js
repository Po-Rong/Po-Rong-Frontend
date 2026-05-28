// 관리자 팝업 등록 JS
const POPUP_API = "http://localhost:8080/api/popups";

// admin-popup.js 맨 위에
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

checkAdmin(); // 관리자 여부 체크
loadCategories();
loadRegions();

const tags = []; // 태그 목록

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

    // 미리보기
    const reader = new FileReader();
    reader.onload = (e) => {
        const preview = document.getElementById("mainImagePreview");
        preview.innerHTML = "";

        const div = document.createElement("div");
        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "100px";
        img.style.height = "100px";
        img.style.objectFit = "cover";

        const btn = document.createElement("button");
        btn.textContent = "X";
        btn.onclick = () => removeMainImage();

        div.appendChild(img);
        div.appendChild(btn);
        preview.appendChild(div);
    };
    reader.readAsDataURL(file);
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

    // 3개 초과 체크
    if (detailImageFiles.length + files.length > 3) {
        alert("상세 이미지는 최대 3장까지 등록 가능합니다.");
        return;
    }

    files.forEach((file) => detailImageFiles.push(file));

    // 카운트 업데이트
    document.getElementById("detailImageCount").textContent =
        detailImageFiles.length;

    // 미리보기
    renderDetailImagePreview();
}

// 상세 이미지 미리보기
function renderDetailImagePreview() {
    const preview = document.getElementById("detailImagePreview");
    preview.innerHTML = "";

    detailImageFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement("div");
            const img = document.createElement("img");
            img.src = e.target.result;
            img.style.width = "100px";
            img.style.height = "100px";
            img.style.objectFit = "cover";

            const btn = document.createElement("button");
            btn.textContent = "X";
            btn.onclick = () => removeDetailImage(index);

            div.appendChild(img);
            div.appendChild(btn);
            preview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
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
    console.log("registerPopup 실행됨"); // 이 줄 추가
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

    // 필수값 체크
    if (
        !title ||
        !categoryId ||
        !regionId ||
        !address ||
        !startDate ||
        !endDate
    ) {
        showMsg("popupRegisterMsg", "필수 항목을 입력해주세요.", false);
        return;
    }

    // 메인 이미지 필수 체크
    if (!mainImageFile) {
        showMsg("popupRegisterMsg", "대표 이미지는 필수입니다.", false);
        return;
    }

    // FormData 생성
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
                showMsg("popupRegisterMsg", data.message, true);
                setTimeout(() => {
                    location.href = "/pages/admin.html";
                }, 1500);
            } else {
                showMsg("popupRegisterMsg", data.message, false);
            }
        })
        .catch(() => showMsg("popupRegisterMsg", "서버 오류", false));
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
    fetch(`${API}/popups/${id}`)
        .then((res) => res.json())
        .then((data) => {
            existingData = data;
            existingMainImageUrl = data.mainImageUrl;

            document.getElementById("popupTitle").value = data.title;
            document.getElementById("popupAddress").value = data.address;
            document.getElementById("startDate").value = data.startDate;
            document.getElementById("endDate").value = data.endDate;
            if (data.reservationStartDate)
                document.getElementById("reservationStartDate").value =
                    data.reservationStartDate;
            if (data.reservationEndDate)
                document.getElementById("reservationEndDate").value =
                    data.reservationEndDate;
            if (data.benefit)
                document.getElementById("popupBenefit").value = data.benefit;
            if (data.notice)
                document.getElementById("popupNotice").value = data.notice;
            if (data.info)
                document.getElementById("popupInfo").value = data.info;
            if (data.snsUrl)
                document.getElementById("popupSNS").value = data.snsUrl;

            // 메인 이미지 미리보기
            // 메인 이미지 미리보기
            if (data.mainImageUrl) {
                document.getElementById("mainImageCount").textContent = 1;
                const preview = document.getElementById("mainImagePreview");
                preview.innerHTML = "";
                const div = document.createElement("div");
                const img = document.createElement("img");
                img.src = `http://localhost:8080${data.mainImageUrl}`;
                img.style.width = "100px";
                img.style.height = "100px";
                img.style.objectFit = "cover";

                const btn = document.createElement("button");
                btn.textContent = "X";
                btn.onclick = () => removeMainImage();

                div.appendChild(img);
                div.appendChild(btn);
                preview.appendChild(div);
            }

            // 상세 이미지 미리보기
            if (data.detailImages && data.detailImages.length > 0) {
                document.getElementById("detailImageCount").textContent =
                    data.detailImages.length;
                const preview = document.getElementById("detailImagePreview");
                preview.innerHTML = "";
                data.detailImages.forEach((imageUrl, index) => {
                    const div = document.createElement("div");
                    const img = document.createElement("img");
                    img.src = `http://localhost:8080${imageUrl}`;
                    img.style.width = "100px";
                    img.style.height = "100px";
                    img.style.objectFit = "cover";

                    const btn = document.createElement("button");
                    btn.textContent = "X";
                    btn.onclick = () => {
                        div.remove();
                        document.getElementById(
                            "detailImageCount",
                        ).textContent =
                            document.getElementById(
                                "detailImagePreview",
                            ).children.length;
                    };

                    div.appendChild(img);
                    div.appendChild(btn);
                    preview.appendChild(div);
                });
            }

            // 태그 불러오기
            data.tags.forEach((tag) => {
                tags.push(tag);
            });
            renderTags();
        });
}

// 팝업 수정
function editPopup() {
    const title = document.getElementById("popupTitle").value.trim();
    const address = document.getElementById("popupAddress").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const categoryId = document.getElementById("selectedCategory").value;
    const regionId = document.getElementById("selectedRegion").value;

    // 필수값 체크
    if (!title) {
        showMsg("popupRegisterMsg", "팝업 이름은 필수입니다.", false);
        return;
    }
    if (!address) {
        showMsg("popupRegisterMsg", "주소는 필수입니다.", false);
        return;
    }
    if (!startDate) {
        showMsg("popupRegisterMsg", "시작일은 필수입니다.", false);
        return;
    }
    if (!endDate) {
        showMsg("popupRegisterMsg", "종료일은 필수입니다.", false);
        return;
    }
    if (!mainImageFile && !existingMainImageUrl) {
        showMsg("popupRegisterMsg", "대표 이미지는 필수입니다.", false);
        return;
    }

    const user = JSON.parse(localStorage.getItem("loginUser"));
    const reservationStartDate = document.getElementById(
        "reservationStartDate",
    ).value;
    const reservationEndDate =
        document.getElementById("reservationEndDate").value;
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
                showMsg("popupRegisterMsg", data.message, true);
                setTimeout(() => {
                    location.href = "/pages/admin.html";
                }, 1500);
            } else {
                showMsg("popupRegisterMsg", data.message, false);
            }
        })
        .catch(() => showMsg("popupRegisterMsg", "서버 오류", false));
}
