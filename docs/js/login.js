/**
 * 登录注册逻辑（localStorage版本）
 * Learning Tracker - Login JS
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Login page loaded');

  // DOM 元素
  const cardBox = document.getElementById('cardBox');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const registerRole = document.getElementById('registerRole');
  const inviteCodeGroup = document.getElementById('inviteCodeGroup');
  const inviteCodeInput = document.getElementById('inviteCode');

  console.log('Elements found:', { cardBox, loginForm, registerForm });

  if (!loginForm || !registerForm) {
    console.error('Forms not found');
    return;
  }

  // 初始化
  Auth.init();
  console.log('Auth initialized');
  checkLogin();

  // 切换登录/注册
  document.querySelectorAll('.link[data-type]').forEach(link => {
    link.addEventListener('click', () => {
      const type = link.dataset.type;
      if (type === 'register') {
        cardBox.classList.add('register-mode');
      } else {
        cardBox.classList.remove('register-mode');
      }
    });
  });

  // 角色选择切换
  registerRole.addEventListener('change', () => {
    if (registerRole.value === 'student') {
      inviteCodeGroup.style.display = 'block';
      inviteCodeInput.required = true;
    } else {
      inviteCodeGroup.style.display = 'none';
      inviteCodeInput.required = false;
    }
  });

  // 登录表单提交
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Login form submitted');

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    console.log('Username:', username);

    if (!username || !password) {
      showToast('请填写用户名和密码', 'error');
      return;
    }

    const result = Auth.login(username, password);
    console.log('Login result:', result);

    if (result.success) {
      showToast('登录成功', 'success');
      setTimeout(() => {
        redirectByRole(Auth.getUserRole());
      }, 500);
    } else {
      showToast(result.error, 'error');
    }
  });

  // 注册表单提交
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Register form submitted');

    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const inviteCode = document.getElementById('inviteCode').value.trim().toUpperCase();
    console.log('Register data:', { username, password, role, inviteCode });

    // 验证
    if (username.length < 3 || username.length > 15) {
      showToast('用户名需要3-15位', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('密码至少6位', 'error');
      return;
    }

    if (role === 'student' && !inviteCode) {
      showToast('学生注册需要邀请码', 'error');
      return;
    }

    // 注册
    const result = Auth.register(username, password, role, role === 'student' ? inviteCode : null);
    console.log('Register result:', result);

    if (result.success) {
      showToast('注册成功', 'success');

      // 如果是家长，显示邀请码
      if (role === 'parent' && result.inviteCode) {
        showToast(`您的邀请码是：${result.inviteCode}`, 'success');
      }

      setTimeout(() => {
        redirectByRole(role);
      }, 1000);
    } else {
      showToast(result.error, 'error');
    }
  });

  // 检查登录状态
  function checkLogin() {
    console.log('Checking login status...');
    console.log('Auth.isLoggedIn():', Auth.isLoggedIn());
    if (Auth.isLoggedIn()) {
      redirectByRole(Auth.getUserRole());
    }
  }

  // 根据角色跳转
  function redirectByRole(role) {
    console.log('Redirecting by role:', role);
    if (role === 'parent') {
      window.location.href = 'parent.html';
    } else {
      window.location.href = 'student.html';
    }
  }

  // 显示提示
  function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show';
    if (type) {
      toast.classList.add(type);
    }

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }
});