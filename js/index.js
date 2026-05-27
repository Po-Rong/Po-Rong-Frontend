// 공통된 JS파일을 넣는 파일입니다.
// 로그인이나 따로 분리가 가능한 기능들은 따로 js파일을 만들어 주세요

// 헤더 로그인 상태 업데이트
function updateHeader() {
    const user = JSON.parse(localStorage.getItem("loginUser"));
    const loginLink = document.querySelector(".login-link");

    if (user) {
        // 로그인 상태
        loginLink.textContent = `${user.nickname}님, 반가워요!`;
        loginLink.href = "/pages/mypage.html";
    } else {
        // 비로그인 상태
        loginLink.textContent = "로그인";
        loginLink.href = "/pages/login.html";
    }
}

// 페이지 로드될 때 실행
updateHeader();
