// ============================================================
// 站点统一配置文件
// 包含所有站点地址和跳转工具函数
// ============================================================

var SITE_CONFIG = {
  // 三个主站地址
  mainSite1: 'https://cqxjw-class7-2020.pages.dev',      // 主站一（登录页）
  mainSite2: 'https://cqxjw-class7-2020-2.pages.dev',    // 主站二（主页）
  mainSite3: 'https://cqxjw-class7-2020-3.pages.dev',    // 主站三（更多功能）
  
  // 小游戏相关地址
  hub: 'https://my-website-8a7.pages.dev',               // 中转站
  quizGame: 'https://minigame1-b5d.pages.dev',           // 选择题小游戏
  brickGame: 'https://minigame2-ddh.pages.dev',          // 炫彩打砖块小游戏
  
  // 本地开发模式检测
  isLocal: function(){
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
  }
};

// 页面所属站点映射
var PAGE_SITE = {
  // 主站一（登录页）
  'index.html': 'mainSite1',
  'login.html': 'mainSite1',
  'internal-login.html': 'mainSite1',
  'admin-login.html': 'mainSite1',
  'other-login.html': 'mainSite1',
  'register.html': 'mainSite1',
  
  // 主站二（主页）
  'a3x7k2m9p4q8r3t6w1y5u0i2o4.html': 'mainSite2',
  'visitor.html': 'mainSite2',
  'about.html': 'mainSite2',
  'classmates.html': 'mainSite2',
  'developers.html': 'mainSite2',
  
  // 主站三（更多功能）
  'message.html': 'mainSite3',
  'gallery.html': 'mainSite3',
  'videos.html': 'mainSite3',
  'classwall.html': 'mainSite3',
  'contact-admin.html': 'mainSite3',
  'conversation.html': 'mainSite3',
  'settings.html': 'mainSite3',
  'change-password.html': 'mainSite3',
  'ppt-show.html': 'mainSite3',
  'ppt-viewer.html': 'mainSite3',
  'admin-main.html': 'mainSite3',
  'admin-settings.html': 'mainSite3',
  'admin-feedback.html': 'mainSite3',
  'admin-leaderboard.html': 'mainSite3'
};

// 获取页面所属站点的完整URL
function getPageUrl(pageName){
  var siteKey = PAGE_SITE[pageName];
  if(siteKey && SITE_CONFIG[siteKey]){
    return SITE_CONFIG[siteKey] + '/' + pageName;
  }
  return pageName;
}

// 简单加密用户数据
function encryptUserData(data){
  try{
    var json = JSON.stringify(data);
    var key = 'cxjw2020class7star';
    var xor = '';
    for(var i = 0; i < json.length; i++){
      xor += String.fromCharCode(json.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(unescape(encodeURIComponent(xor)));
  }catch(e){
    return '';
  }
}

// 解密用户数据
function decryptUserData(encoded){
  try{
    var key = 'cxjw2020class7star';
    var xor = decodeURIComponent(escape(atob(encoded)));
    var json = '';
    for(var i = 0; i < xor.length; i++){
      json += String.fromCharCode(xor.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return JSON.parse(json);
  }catch(e){
    return null;
  }
}

// 获取当前用户数据（用于跨站点传递）
function getCurrentUserData(){
  try{
    var sess = JSON.parse(localStorage.getItem('sb_session') || sessionStorage.getItem('sb_session') || 'null');
    var adm = JSON.parse(localStorage.getItem('sb_admin') || sessionStorage.getItem('sb_admin') || 'null');
    var user = sess || adm;
    if(user){
      return {
        uid: user.uid || '',
        name: user.name || '',
        role: user.role || 'student',
        email: user.email || '',
        student_id: user.student_id || '',
        timestamp: Date.now()
      };
    }
    if(sessionStorage.getItem('mode') === 'visitor' || sessionStorage.getItem('visitor_verified')){
      return { is_guest: true, name: '访客', timestamp: Date.now() };
    }
  }catch(e){}
  return null;
}

// 带用户身份验证的跳转（加密传递用户信息）
function navigateTo(pageName){
  var url = getPageUrl(pageName);
  
  var currentPage = window.location.pathname.split('/').pop();
  var currentSite = PAGE_SITE[currentPage];
  var targetSite = PAGE_SITE[pageName];
  
  if(currentSite && targetSite && currentSite !== targetSite){
    var userData = getCurrentUserData();
    if(userData){
      var encoded = encryptUserData(userData);
      url += (url.indexOf('?') >= 0 ? '&' : '?') + 'auth=' + encodeURIComponent(encoded);
    }
  }
  
  window.location.href = url;
}

// 从URL接收用户身份验证
function receiveAuthFromUrl(){
  try{
    var urlParams = new URLSearchParams(window.location.search);
    var encoded = urlParams.get('auth');
    if(encoded){
      var data = decryptUserData(encoded);
      if(data){
        sessionStorage.setItem('cross_site_user', JSON.stringify(data));
        return data;
      }
    }
    var saved = sessionStorage.getItem('cross_site_user');
    if(saved){
      return JSON.parse(saved);
    }
  }catch(e){}
  return null;
}
