// ============================================================
// 认证检测模块 - 后台自动检测登录状态 + 防直连检测
// 使用方式：在页面中引入 <script src="auth-check.js"></script>
// ============================================================

var AuthCheck = (function(){
  var CHECK_INTERVAL = 30 * 1000; // 每30秒检测一次
  var checkTimer = null;

  // 本地存储的直连记录
  function getDirectAccessRecords(){
    try{
      return JSON.parse(localStorage.getItem('direct_access_records') || '{}');
    }catch(e){
      return {};
    }
  }

  function saveDirectAccessRecords(records){
    localStorage.setItem('direct_access_records', JSON.stringify(records));
  }

  // 获取当前页面路径
  function getCurrentPage(){
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  // 检查是否是需要登录的页面
  function isProtectedPage(){
    var page = getCurrentPage();
    var protectedPages = [
      'a3x7k2m9p4q8r3t6w1y5u0i2o4.html', // 用户主页
      'admin-main.html', // 管理员主页
      'admin-settings.html', // 管理员设置
      'settings.html', // 个人设置
      'change-password.html' // 修改密码
    ];
    return protectedPages.indexOf(page) >= 0;
  }

  // 检查是否已登录
  function isLoggedIn(){
    var hasSession = localStorage.getItem('sb_session') || localStorage.getItem('sb_admin') || sessionStorage.getItem('sb_session') || sessionStorage.getItem('sb_admin');
    var hasLoginFlag = sessionStorage.getItem('logged_in') || localStorage.getItem('logged_in');
    return !!(hasSession || hasLoginFlag);
  }

  // 检查登录是否过期
  function isLoginExpired(){
    if(localStorage.getItem('logged_in')){
      var exp = parseInt(localStorage.getItem('login_expire') || '0');
      if(Date.now() > exp){
        // 过期了，清除所有登录状态`r`n        clearAllLoginState();
        return true;
      }
    }
    return false;
  }

  // 防直连检测
  function checkDirectAccess(){
    var page = getCurrentPage();
    if(!isProtectedPage()) return; // 公开页面不需要检测

    // 已登录用户不算直连
    if(isLoggedIn()) return;

    // 检查是否有合法的登录来源标记
    var hasValidSource = sessionStorage.getItem('login_source') === 'valid';
    var hasFromLogin = sessionStorage.getItem('from_login') === '1';

    if(!hasValidSource && !hasFromLogin){
      // 直连访问，记录IP（用localStorage模拟）
      var records = getDirectAccessRecords();
      var today = new Date().toDateString();
      var record = records[today] || { count: 0, blocked: false, blockTime: 0 };

      // 检查是否被封禁
      if(record.blocked){
        var blockExpire = record.blockTime + 24 * 60 * 60 * 1000; // 封禁一天
        if(Date.now() < blockExpire){
          // 还在封禁期，显示封禁页面
          showBlockedPage(Math.ceil((blockExpire - Date.now()) / (60 * 60 * 1000)));
          return;
        }else{
          // 封禁过期，重置
          record.blocked = false;
          record.count = 0;
        }
      }

      record.count++;
      if(record.count >= 2){
        // 第二次直连，封禁一天
        record.blocked = true;
        record.blockTime = Date.now();
        records[today] = record;
        saveDirectAccessRecords(records);
        showBlockedPage(24);
        return;
      }

      // 第一次直连，警告
      records[today] = record;
      saveDirectAccessRecords(records);
      showDirectAccessWarning();
    }
  }

  // 显示直连警告
  function showDirectAccessWarning(){
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML =
      '<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:20px;padding:32px;max-width:450px;width:100%;border:1px solid rgba(255,200,80,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;">' +
        '<div style="font-size:48px;margin-bottom:16px;">⚠️</div>' +
        '<h3 style="color:#ffc850;font-size:20px;font-weight:700;margin:0 0 12px;">检测到直接访问</h3>' +
        '<p style="color:#c8d4f0;font-size:14px;line-height:1.8;margin-bottom:20px;">' +
          '检测到您直接通过地址访问此页面。<br>' +
          '为了网站安全，请从登录页面正常登录后访问。<br>' +
          '<span style="color:#f87171;font-weight:600;">如果再次直接访问，您的IP将被封禁一天。</span>' +
        '</p>' +
        '<button onclick="this.closest(\'div\').parentElement.remove();location.href=\'login.html\'" style="padding:12px 32px;border-radius:10px;background:linear-gradient(135deg,#4a90ff,#6b5bff);border:none;color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:all .25s;">前往登录页</button>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  // 显示封禁页面
  function showBlockedPage(hours){
    document.body.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#0a0a1a,#1a0a0a);padding:20px;">' +
        '<div style="text-align:center;max-width:500px;">' +
          '<div style="font-size:80px;margin-bottom:24px;">🚫</div>' +
          '<h1 style="color:#f87171;font-size:32px;font-weight:800;margin:0 0 16px;">IP已被封禁</h1>' +
          '<p style="color:#c8d4f0;font-size:16px;line-height:1.8;margin-bottom:24px;">' +
            '由于多次直接访问受保护页面，您的IP已被临时封禁。<br>' +
            '封禁时间：<span style="color:#ffc850;font-weight:700;">' + hours + '小时</span><br>' +
            '请从登录页面正常登录后访问。' +
          '</p>' +
          '<p style="color:#5a6890;font-size:13px;">如有疑问，请联系管理员。</p>' +
        '</div>' +
      '</div>';
  }

  // 后台检测登录状态
  function backgroundCheck(){
    if(isLoginExpired()){
      // 登录过期，跳转到登录页
      if(isProtectedPage()){
        showToast('登录已过期，请重新登录', 'error');
        setTimeout(function(){ location.href = 'login.html'; }, 1500);
      }
      return;
    }

    if(isProtectedPage() && !isLoggedIn()){
      // 未登录，跳转到登录页
      location.href = 'login.html';
    }
  }

  // 简单的Toast提示
  function showToast(msg, type){
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-20px);padding:12px 24px;border-radius:10px;font-size:14px;font-weight:500;z-index:99999;opacity:0;transition:all .3s;pointer-events:none;backdrop-filter:blur(12px);';
    if(type === 'error'){
      t.style.background = 'rgba(239,68,68,0.9)';
      t.style.border = '1px solid rgba(248,113,113,0.3)';
    }else{
      t.style.background = 'rgba(59,130,246,0.9)';
      t.style.border = '1px solid rgba(96,165,250,0.3)';
    }
    t.style.color = '#fff';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; }, 10);
    setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(-20px)'; }, 2500);
    setTimeout(function(){ t.remove(); }, 3000);
  }

  // 启动后台检测
  function start(){
    // 页面加载时先检测一次
    checkDirectAccess();
    backgroundCheck();

    // 每分钟检测一次
    if(checkTimer) clearInterval(checkTimer);
    checkTimer = setInterval(backgroundCheck, CHECK_INTERVAL);
  }

  // 设置登录来源标记（登录成功后调用）
  function setLoginSource(){
    sessionStorage.setItem('login_source', 'valid');
  }

  return {
    start: start,
    setLoginSource: setLoginSource,
    isLoggedIn: isLoggedIn,
    isLoginExpired: isLoginExpired
  };
})();

// 页面加载完成后自动启动
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){ AuthCheck.start(); });
}else{
  AuthCheck.start();
}
