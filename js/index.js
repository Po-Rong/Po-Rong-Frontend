// 공통된 JS파일을 넣는 파일입니다.
// 로그인이나 따로 분리가 가능한 기능들은 따로 js파일을 만들어 주세요
const API = "http://localhost:8080/api";

// 헤더 로그인 상태 업데이트
function updateHeader() {
    // 로그인/회원가입 페이지에서는 실행 안 함
    if (
        window.location.pathname.includes("/pages/login") ||
        window.location.pathname.includes("/pages/register")
    )
        return;

    const user = JSON.parse(localStorage.getItem("loginUser"));
    const loginLink = document.querySelector(".login-link");

    if (user) {
        // 로그인 상태
        loginLink.textContent = `${user.nickname}님, 반가워요!`;
        loginLink.href = "#";

        // role에 따라 마이포롱 링크 변경
        const mypageLink = document.querySelector(
            "a[href='/pages/mypage.html']",
        );
        if (mypageLink && user.role === "seller") {
            mypageLink.href = "/pages/admin.html";
        }
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
                btn.dataset.id = category.id;
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
                btn.dataset.id = region.id;
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

// 공통 찜하기 체크 및 토글 제어
async function toggleWish(popupId, buttonElement) {
    const user = JSON.parse(localStorage.getItem("loginUser"));

    // 비로그인 상태면 하단 통신 로직을 타기 전에 로그인 이동
    if (!user) {
        alert("로그인이 필요한 서비스입니다.\n로그인 페이지로 이동합니다.");
        window.location.href = "/pages/login.html";
        return;
    }

    // 현재 버튼이 찜이 된 상태인지 확인
    const isCurrentlyStarred = buttonElement.classList.contains("active");

    // 유저 경험을 위해 통신 중 버튼 여러 번 광클 방지 잠금
    buttonElement.disabled = true;

    try {
        // 엔드포인트로 요청 송신
        // 주소 형식: http://localhost:8080/api/wishlists/popups/{popupId}
        const response = await fetch(`${API}/wishlists/popups/${popupId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId: user.userId || user.id // 로컬스토리지 보관 방식에 맞춤 바인딩
            })
        });

        if (!response.ok) {
            throw new Error(`서버 응답 실패 상태코드: ${response.status}`);
        }

        // 백엔드 처리가 정상 완료된 경우에만 화면의 하트 불빛을 끄고 켬
        buttonElement.classList.toggle("active");

        console.log(`[찜 API 연동 성공] 팝업 ID: ${popupId} | 결과 상태: ${!isCurrentlyStarred ? "찜 등록완료" : "찜 해제완료"}`);

    } catch (error) {
        console.error("찜하기 처리 중 통신 에러 발생:", error);
        alert("찜하기 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
        // 통신이 완료되면 다시 버튼 클릭 잠금 해제
        buttonElement.disabled = false;
    }
}
