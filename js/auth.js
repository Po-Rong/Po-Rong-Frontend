// 이미 로그인된 상태면 메인으로 이동
const user = JSON.parse(localStorage.getItem('loginUser'));
if (user) {
  location.href = '/index.html';
}

// 로그인, 회원가입 JS
const AUTH_API = `${window.API_BASE_URL}/auth`;

// 로그인
function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw = document.getElementById('loginPw').value.trim();

  if (!email || !pw) {
    showMsg('loginMsg', '이메일과 비밀번호를 입력해주세요.', false);
    return;
  }

  fetch(`${AUTH_API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: pw }),
  })
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        localStorage.setItem(
          'loginUser',
          JSON.stringify({
            userId: data.id,
            nickname: data.nickname,
            role: data.role,
          }),
        );
        showMsg('loginMsg', `${data.nickname}님 환영합니다!`, true);
        setTimeout(() => {
          location.href = '/index.html';
        }, 1500);
      } else {
        showMsg('loginMsg', data.message, false);
        document.getElementById('loginEmail').classList.add('input-error');
        document.getElementById('loginPw').classList.add('input-error');
      }
    })
    .catch(() => showMsg('loginMsg', '서버 오류', false));
}

// role 선택
function selectRole(role) {
  document.getElementById('selectedRole').value = role;
  document.getElementById('btnUser').classList.remove('active');
  document.getElementById('btnSeller').classList.remove('active');

  if (role === 'user') {
    document.getElementById('btnUser').classList.add('active');
  } else {
    document.getElementById('btnSeller').classList.add('active');
  }
}

// 회원가입
function register() {
  const email = document.getElementById('regEmail').value.trim();
  const pw = document.getElementById('regPw').value.trim();
  const nickname = document.getElementById('regNickname').value.trim();
  const role = document.getElementById('selectedRole').value;

  if (!email || !pw || !nickname) {
    showMsg('registerMsg', '모든 항목을 입력해주세요.', false);
    return;
  }

  fetch(`${AUTH_API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw, nickname, role }),
  })
    .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
    .then(({ ok, data }) => {
      if (ok) {
        showMsg('registerMsg', data.message, true);
        setTimeout(() => {
          location.href = '/pages/login.html';
        }, 1500);
      } else {
        showMsg('registerMsg', data.message, false);
      }
    })
    .catch(() => showMsg('registerMsg', '서버 오류', false));
}

function selectRole(role) {
  document.getElementById('selectedRole').value = role;

  // 두 버튼 다 active 제거
  document.getElementById('btnUser').classList.remove('active');
  document.getElementById('btnSeller').classList.remove('active');

  // 클릭한 버튼에 active 추가
  if (role === 'user') {
    document.getElementById('btnUser').classList.add('active');
  } else {
    document.getElementById('btnSeller').classList.add('active');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const loginEmailInput = document.getElementById('loginEmail');
  const loginPwInput = document.getElementById('loginPw');

  if (loginEmailInput) {
    loginEmailInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        login();
      }
    });
  }

  if (loginPwInput) {
    loginPwInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        login();
      }
    });
  }
});
