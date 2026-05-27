// 공통된 JS파일을 넣는 파일입니다.
// 로그인이나 따로 분리가 가능한 기능들은 따로 js파일을 만들어 주세요
const API = "http://localhost:8080/api";

// 헤더 로그인 상태 업데이트
function updateHeader() {
    // 로그인/회원가입 페이지에서는 실행 안 함
    if (
        window.location.pathname.includes("login") ||
        window.location.pathname.includes("register")
    )
        return;

    const user = JSON.parse(localStorage.getItem("loginUser"));
    const loginLink = document.querySelector(".login-link");

    if (user) {
        // 로그인 상태
        loginLink.textContent = `${user.nickname}님, 반가워요!`;
        loginLink.href = "#";
    } else {
        // 비로그인 상태
        loginLink.textContent = "로그인";
        loginLink.href = "/pages/login.html";
    }
}

// 페이지 로드될 때 실행
updateHeader();

// 카테고리 목록 불러오기
function loadCategories() {
    const categoryList = document.getElementById("categoryList");
    if (!categoryList) return;

    fetch(`${API}/categories`)
        .then((res) => res.json())
        .then((data) => {
            data.forEach((category) => {
                const btn = document.createElement("button");
                btn.textContent = category.categoryName;
                btn.onclick = () => selectCategory(category.id, btn);
                categoryList.appendChild(btn);
            });
        });
}

// 카테고리 선택
function selectCategory(id, btn) {
    document.getElementById("selectedCategory").value = id;
    document
        .querySelectorAll(".category-group button")
        .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
}

// 지역 목록 불러오기
function loadRegions() {
    const regionList = document.getElementById("regionList");
    if (!regionList) return;

    fetch(`${API}/regions`)
        .then((res) => res.json())
        .then((data) => {
            data.forEach((region) => {
                const btn = document.createElement("button");
                btn.textContent = region.regionName;
                btn.onclick = () => selectRegion(region.id, btn);
                regionList.appendChild(btn);
            });
        });
}

// 지역 선택
function selectRegion(id, btn) {
    document.getElementById("selectedRegion").value = id;
    document
        .querySelectorAll(".region-group button")
        .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
}

function showMsg(id, text, ok) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = "msg" + (ok ? "ok" : "fail");
}
