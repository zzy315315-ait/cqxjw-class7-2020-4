/* ============================================================================
 * xauth.js —— 跨仓库登录态统一模块（四个 pages.dev 站点共用）
 * 版本：v1.0  日期：2026-11-20
 * ----------------------------------------------------------------------------
 * 背景：cqxjw-class7-2020 / -2 / -3 / -4 是四个不同域名（浏览器的不同源），
 *       localStorage / sessionStorage / cookie 都不共享。所以跨仓库跳转时
 *       必须用 URL 参数一次性传递身份：
 *         ?auth=<base64(xor(json))>   已登录用户
 *         ?guest=1                    访客
 *       目标页面在最前面加载本文件，本文件会在脚本执行时“同步”解析并落盘，
 *       之后页面里的 auth-check.js / 内联守卫才能拿到登录状态。
 * ----------------------------------------------------------------------------
 * 用法（必须放在 <head> 里，且排在 auth-check.js 之前）：
 *   <script src="xauth.js"></script>
 * ----------------------------------------------------------------------------
 * 常用 API：
 *   XAUTH.receive()                 解析 URL 上的 auth/guest 并保存（加载时已自动执行）
 *   XAUTH.getUser()                 取当前登录用户对象或 null
 *   XAUTH.isLoggedIn()              是否已登录
 *   XAUTH.isGuest()                 是否访客
 *   XAUTH.buildUrl(url)             生成带 auth/guest 参数的跳转地址
 *   XAUTH.go(url)                   带身份跳转
 *   XAUTH.guestUrl(url) / goGuest(url)   访客跳转（带 ?guest=1）
 *   XAUTH.requireLogin()            未登录则跳回登录页（返回 false）
 *   XAUTH.logout()                  清除登录态
 *   XAUTH.toast(msg, type)          顶部小提示框（不遮挡页面中心）
 *   XAUTH.SITES.login/home/others/admin    四个站点地址
 *   XAUTH.LOGIN_PAGE                登录页完整地址
 * ========================================================================== */
(function (global) {
  'use strict';

  var KEY = 'cxjw2020class7star_crossdomain';

  var SITES = {
    login: 'https://cqxjw-class7-2020.pages.dev',
    home: 'https://cqxjw-class7-2020-2.pages.dev',
    others: 'https://cqxjw-class7-2020-3.pages.dev',
    admin: 'https://cqxjw-class7-2020-4.pages.dev'
  };

  // 登录入口页（index.html 与 login.html 内容相同，统一走 login.html）
  var LOGIN_PAGE = SITES.login + '/login.html';

  /* ---------------- 编解码（XOR + base64，与旧版 CrossDomainAuth 兼容） ---------------- */
  function encrypt(data) {
    try {
      var json = JSON.stringify(data);
      var xor = '';
      for (var i = 0; i < json.length; i++) {
        xor += String.fromCharCode(json.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
      }
      return btoa(unescape(encodeURIComponent(xor)));
    } catch (e) { return ''; }
  }

  function decrypt(encoded) {
    try {
      var xor = decodeURIComponent(escape(atob(encoded)));
      var json = '';
      for (var i = 0; i < xor.length; i++) {
        json += String.fromCharCode(xor.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
      }
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  /* ---------------- 本地登录态读写 ---------------- */
  function getRawSession() {
    try {
      var s = localStorage.getItem('sb_session') || sessionStorage.getItem('sb_session') ||
              localStorage.getItem('sb_admin') || sessionStorage.getItem('sb_admin');
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  function getUser() {
    var u = getRawSession();
    if (!u || !u.uid) return null;
    return u;
  }

  function saveUser(data) {
    var u = {
      uid: data.uid || '',
      name: data.name || '',
      student_id: data.student_id || '',
      email: data.email || '',
      role: data.role || 'student',
      token: data.token || '',
      exp: data.exp || 0
    };
    var raw = JSON.stringify(u);
    try {
      localStorage.setItem('sb_session', raw);
      localStorage.setItem('logged_in', '1');
      if (u.exp) localStorage.setItem('login_expire', String(u.exp));
      if (u.role === 'admin' || u.role === 'super_admin') {
        localStorage.setItem('sb_admin', raw);
        localStorage.setItem('is_admin', '1');
      }
      sessionStorage.setItem('logged_in', '1');
      sessionStorage.setItem('sb_session', raw);
    } catch (e) {}
    return u;
  }

  function saveGuest() {
    try {
      sessionStorage.setItem('mode', 'visitor');
      sessionStorage.setItem('visitor_verified', '1');
      localStorage.setItem('mode', 'visitor');
    } catch (e) {}
  }

  function isGuest() {
    try {
      return sessionStorage.getItem('mode') === 'visitor' ||
             sessionStorage.getItem('visitor_verified') === '1' ||
             localStorage.getItem('mode') === 'visitor';
    } catch (e) { return false; }
  }

  function isLoggedIn() {
    return !!getUser();
  }

  function clearAll() {
    try {
      ['sb_session', 'sb_admin', 'logged_in', 'login_expire', 'is_admin', 'mode',
       'visitor_verified', 'visitor_from_login'].forEach(function (k) {
        localStorage.removeItem(k);
        sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }

  function logout() {
    clearAll();
    toast('已退出登录', 'success');
    setTimeout(function () { location.href = LOGIN_PAGE; }, 800);
  }

  /* ---------------- 解析 URL 上的 auth / guest ---------------- */
  function receive() {
    var changed = false;
    var search = '';
    try { search = global.location.search || ''; } catch (e) { search = ''; }
    if (!search || search.length < 2) return false;

    var q;
    try { q = new URLSearchParams(search); } catch (e) { return false; }

    var authParam = q.get('auth');
    if (authParam) {
      var data = decrypt(decodeURIComponent(authParam));
      if (data) {
        if (data.is_guest) {
          saveGuest();
        } else {
          // 登录用户：清掉访客标记，避免“访客身份覆盖登录身份”
          try {
            sessionStorage.removeItem('mode');
            sessionStorage.removeItem('visitor_verified');
            localStorage.removeItem('mode');
          } catch (e) {}
          saveUser(data);
        }
        changed = true;
      }
    }

    var guestParam = q.get('guest');
    if (guestParam === '1' || guestParam === 'true') {
      saveGuest();
      changed = true;
    }

    // 处理完就把参数从地址栏抹掉，避免刷新/分享链接时重复处理
    if (changed && global.history && global.history.replaceState) {
      try {
        q.delete('auth');
        q.delete('guest');
        var qs = q.toString();
        var clean = global.location.pathname + (qs ? '?' + qs : '') + (global.location.hash || '');
        global.history.replaceState({}, global.document.title, clean);
      } catch (e) {}
    }
    return changed;
  }

  /* ---------------- 生成跳转 URL ---------------- */
  function appendParams(base, params) {
    var url = base;
    var hashIdx = url.indexOf('#');
    var hash = '';
    if (hashIdx >= 0) { hash = url.slice(hashIdx); url = url.slice(0, hashIdx); }
    var list = [];
    for (var k in params) {
      if (Object.prototype.hasOwnProperty.call(params, k) && params[k] !== undefined && params[k] !== '') {
        list.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
      }
    }
    if (list.length) {
      url += (url.indexOf('?') >= 0 ? '&' : '?') + list.join('&');
    }
    return url + hash;
  }

  function buildUrl(base) {
    var u = getUser();
    var params = {};
    if (u) {
      params.auth = encrypt({
        is_guest: false,
        uid: u.uid,
        name: u.name,
        student_id: u.student_id,
        email: u.email,
        role: u.role,
        token: u.token || '',
        exp: u.exp || 0,
        timestamp: Date.now()
      });
    } else if (isGuest()) {
      params.guest = '1';
    }
    return appendParams(base, params);
  }

  function guestUrl(base) {
    return appendParams(base, { guest: '1' });
  }

  function go(base) {
    global.location.href = buildUrl(base);
  }

  function goGuest(base) {
    global.location.href = guestUrl(base);
  }

  function requireLogin(loginUrl) {
    if (isLoggedIn()) return true;
    var target = loginUrl || LOGIN_PAGE;
    try { global.location.replace(target); } catch (e) { global.location.href = target; }
    return false;
  }

  /* ---------------- 顶部小提示框（不遮挡页面中心） ---------------- */
  function toast(msg, type, duration) {
    type = type || 'info';
    var colors = {
      success: 'background:rgba(20,32,24,0.96);color:#4ade80;border:1px solid rgba(74,222,128,0.45);',
      error: 'background:rgba(40,18,18,0.96);color:#f87171;border:1px solid rgba(248,113,113,0.45);',
      warn: 'background:rgba(38,32,14,0.96);color:#facc15;border:1px solid rgba(250,204,21,0.45);',
      info: 'background:rgba(18,26,44,0.96);color:#93c5fd;border:1px solid rgba(96,165,250,0.45);'
    };
    var el = document.createElement('div');
    el.className = 'xauth-toast';
    el.style.cssText = 'position:fixed;top:22px;left:50%;transform:translateX(-50%) translateY(-16px);' +
      'max-width:min(88vw,460px);padding:11px 22px;border-radius:12px;font-size:14px;font-weight:600;' +
      'letter-spacing:.5px;line-height:1.5;z-index:2147483000;opacity:0;transition:all .28s ease;' +
      'pointer-events:none;text-align:center;box-shadow:0 10px 34px rgba(0,0,0,0.45);backdrop-filter:blur(12px);' +
      (colors[type] || colors.info);
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    var life = duration || 2200;
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(-16px)';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 350);
    }, life);
    return el;
  }

  var XAUTH = {
    SITES: SITES,
    LOGIN_PAGE: LOGIN_PAGE,
    KEY: KEY,
    receive: receive,
    encrypt: encrypt,
    decrypt: decrypt,
    getUser: getUser,
    isLoggedIn: isLoggedIn,
    isGuest: isGuest,
    saveUser: saveUser,
    saveGuest: saveGuest,
    buildUrl: buildUrl,
    guestUrl: guestUrl,
    go: go,
    goGuest: goGuest,
    requireLogin: requireLogin,
    logout: logout,
    clear: clearAll,
    toast: toast
  };

  global.XAUTH = XAUTH;

  // 关键：脚本一加载就同步接收 URL 上的身份，必须早于 auth-check.js 的跳转判断
  receive();
})(window);
