// ============================================================
// 标签页关闭自动退出登录脚本
// 使用方式：在页面中引入 <script src="auto-logout.js"></script>
// 注意：只有非"保持登录30天"的用户才会在关闭标签页时退出登录
// 原理：利用sessionStorage的特性，关闭标签页后自动清除
// ============================================================

(function(){
  // 检查是否启用了"保持登录30天"
  var keepLogin = localStorage.getItem('keep_login') === '1' || 
                  (localStorage.getItem('login_expire') && 
                  parseInt(localStorage.getItem('login_expire') || '0') > Date.now() + 24 * 60 * 60 * 1000);
  
  // 如果启用了"保持登录30天"，则不自动退出登录
  if(keepLogin){
    return;
  }
  
  // 页面加载时检查登录状态
  window.addEventListener('load', function(){
    setTimeout(function(){
      try{
        var hasSessionStorage = sessionStorage.getItem('sb_session') || sessionStorage.getItem('sb_admin') || sessionStorage.getItem('logged_in');
        var hasLocalStorage = localStorage.getItem('sb_session') || localStorage.getItem('sb_admin');
        
        // 如果sessionStorage中有登录状态，说明是正常跳转，不清除
        if(hasSessionStorage){
          return;
        }
        
        // 如果sessionStorage中没有登录状态，但localStorage中有，说明是重新打开标签页
        // 这种情况下需要清除localStorage中的登录状态，要求重新登录
        if(hasLocalStorage && !localStorage.getItem('keep_login')){
          localStorage.removeItem('logged_in');
          localStorage.removeItem('login_expire');
          localStorage.removeItem('sb_session');
          localStorage.removeItem('sb_admin');
          localStorage.removeItem('sb_user');
          localStorage.removeItem('is_admin');
          localStorage.removeItem('keep_login');
          
          // 跳转到登录页
          if(window.location.pathname.indexOf('login.html') < 0 && 
             window.location.pathname.indexOf('index.html') < 0 &&
             window.location.pathname.indexOf('visitor.html') < 0){
            window.location.href = 'login.html';
          }
        }
      }catch(e){}
    }, 50);
  });
})();
