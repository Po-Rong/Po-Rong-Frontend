// 이미 로그인된 상태면 메인으로 이동
const user = JSON.parse(localStorage.getItem("loginUser"));
if (user) {
    location.href = "/index.html";
}

// 로그인, 회원가입 JS
const AUTH_API = "http://localhost:8080/api/auth";

// 로그인
function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const pw = document.getElementById("loginPw").value.trim();

    if (!email || !pw) {
        showMsg("loginMsg", "이메일과 비밀번호를 입력해주세요.", false);
        return;
    }

    fetch(`${AUTH_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: pw }),
    })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
            if (ok) {
                localStorage.setItem(
                    "loginUser",
                    JSON.stringify({
                        userId: data.id,
                        nickname: data.nickname,
                        role: data.role,
                    }),
                );
                showMsg("loginMsg", `${data.nickname}님 환영합니다!`, true);
                setTimeout(() => {
                    location.href = "/index.html";
                }, 1500);
            } else {
                showMsg("loginMsg", data.message, false);
            }
        })
        .catch(() => showMsg("loginMsg", "서버 오류", false));
}

function showMsg(id, text, ok) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = "msg" + (ok ? "ok" : "fail");
}
