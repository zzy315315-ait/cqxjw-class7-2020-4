// ============================================================
// 二次验证模块 - 重要操作前需要验证超级管理员身份
// 使用方式：SecondVerify.verify(function(){ // 执行敏感操作 })
// ============================================================

var SecondVerify = (function(){
  var SUPABASE_URL = "https://ekfntkpjqzmkibdimtru.supabase.co";
  var ANON_KEY = "sb_publishable_Z3wpxD9ZRbXm9-gPPQOGZg_KKhr_yIs";
  var SUPER_ADMIN_EMAIL = "zzy0605-666@qq.com";
  var verified = false;
  var verifyTimeout = null;

  // 创建验证弹窗
  function createModal(callback){
    // 移除已存在的弹窗
    removeModal();

    var overlay = document.createElement('div');
    overlay.id = 'second-verify-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:20px;padding:32px;max-width:420px;width:100%;border:1px solid rgba(198,107,255,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);position:relative;';

    modal.innerHTML =
      '<div style="text-align:center;margin-bottom:24px;">' +
        '<div style="font-size:48px;margin-bottom:12px;">🔐</div>' +
        '<h3 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px;">二次验证</h3>' +
        '<p style="color:#8892b0;font-size:13px;margin:0;">此操作需要超级管理员身份验证</p>' +
      '</div>' +
      '<div style="margin-bottom:16px;">' +
        '<label style="display:block;color:#8892b0;font-size:12px;margin-bottom:6px;font-weight:600;">管理员邮箱</label>' +
        '<input type="email" id="verify-email" placeholder="请输入超级管理员邮箱" style="width:100%;padding:12px 16px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:14px;outline:none;transition:border-color .2s;" onfocus="this.style.borderColor=\'rgba(198,107,255,0.5)\'" onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'">' +
      '</div>' +
      '<div style="margin-bottom:20px;">' +
        '<label style="display:block;color:#8892b0;font-size:12px;margin-bottom:6px;font-weight:600;">密码</label>' +
        '<input type="password" id="verify-password" placeholder="请输入密码" style="width:100%;padding:12px 16px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#fff;font-size:14px;outline:none;transition:border-color .2s;" onfocus="this.style.borderColor=\'rgba(198,107,255,0.5)\'" onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'">' +
      '</div>' +
      '<div id="verify-error" style="color:#ff6b6b;font-size:12px;margin-bottom:16px;display:none;text-align:center;"></div>' +
      '<div style="display:flex;gap:10px;">' +
        '<button id="verify-cancel" style="flex:1;padding:12px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#8892b0;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;">取消</button>' +
        '<button id="verify-confirm" style="flex:1;padding:12px;border-radius:10px;background:linear-gradient(135deg,#c66bff,#8b5cf6);border:none;color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;">验证</button>' +
      '</div>';

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // 事件绑定
    document.getElementById('verify-cancel').addEventListener('click', function(){
      removeModal();
      if(callback) callback(false);
    });

    document.getElementById('verify-confirm').addEventListener('click', function(){
      doVerify(callback);
    });

    document.getElementById('verify-password').addEventListener('keypress', function(e){
      if(e.key === 'Enter') doVerify(callback);
    });

    overlay.addEventListener('click', function(e){
      if(e.target === overlay){
        removeModal();
        if(callback) callback(false);
      }
    });

    // 自动聚焦邮箱输入框
    setTimeout(function(){
      document.getElementById('verify-email').focus();
    }, 100);
  }

  // 执行验证
  function doVerify(callback){
    var email = document.getElementById('verify-email').value.trim();
    var password = document.getElementById('verify-password').value;
    var errorEl = document.getElementById('verify-error');
    var confirmBtn = document.getElementById('verify-confirm');

    if(!email || !password){
      showError('请输入邮箱和密码');
      return;
    }

    confirmBtn.textContent = '验证中...';
    confirmBtn.disabled = true;

    // 调用Supabase Auth登录验证
    var url = SUPABASE_URL + "/auth/v1/token?grant_type=password";
    var body = JSON.stringify({ email: email, password: password });
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("apikey", ANON_KEY);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function(){
      confirmBtn.textContent = '验证';
      confirmBtn.disabled = false;
      if(xhr.status >= 200 && xhr.status < 300){
        try{
          var data = JSON.parse(xhr.responseText);
          // 验证是否是超级管理员邮箱
          if(email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()){
            verified = true;
            // 30分钟后过期
            if(verifyTimeout) clearTimeout(verifyTimeout);
            verifyTimeout = setTimeout(function(){ verified = false; }, 30 * 60 * 1000);
            removeModal();
            if(callback) callback(true);
          }else{
            showError('此邮箱不是超级管理员，无权执行此操作');
          }
        }catch(e){
          showError('验证失败，请重试');
        }
      }else{
        try{
          var err = JSON.parse(xhr.responseText);
          showError(err.msg || err.error_description || '邮箱或密码错误');
        }catch(e){
          showError('邮箱或密码错误');
        }
      }
    };
    xhr.onerror = function(){
      confirmBtn.textContent = '验证';
      confirmBtn.disabled = false;
      showError('网络错误，请重试');
    };
    xhr.send(body);
  }

  function showError(msg){
    var errorEl = document.getElementById('verify-error');
    if(errorEl){
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }

  function removeModal(){
    var overlay = document.getElementById('second-verify-overlay');
    if(overlay) overlay.remove();
    document.body.style.overflow = '';
  }

  // 对外接口
  return {
    // 验证，成功后执行回调
    verify: function(callback){
      if(verified){
        if(callback) callback(true);
        return;
      }
      createModal(callback);
    },
    // 检查是否已验证
    isVerified: function(){ return verified; },
    // 重置验证状态
    reset: function(){
      verified = false;
      if(verifyTimeout) clearTimeout(verifyTimeout);
    }
  };
})();
