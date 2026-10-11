// ============================================================
// 背景音乐控制模块（最终修复版）
// 功能：只在非登录页面播放、静音控制、记住用户设置、断点续传
// ============================================================

var BGM = (function(){
  var audio = null;
  var isMuted = false;
  var isPlaying = false;
  var hasInteracted = false;
  var STORAGE_KEY = 'bgm_state';
  var wasPlaying = false;
  
  // 不应该播放音乐的页面（登录相关页面）
  var NO_MUSIC_PAGES = [
    'login.html', 'index.html', 'internal-login.html', 
    'admin-login.html', 'register.html', 'change-password.html'
  ];
  
  // 检测当前页面是否应该播放音乐
  function shouldPlayMusic(){
    var path = window.location.pathname.toLowerCase();
    var filename = path.substring(path.lastIndexOf('/') + 1);
    // 如果是登录相关页面，不播放音乐
    for(var i = 0; i < NO_MUSIC_PAGES.length; i++){
      if(filename === NO_MUSIC_PAGES[i] || filename === ''){
        return false;
      }
    }
    return true;
  }
  
  // 暂停音乐（不清除状态，用于登录页面）
  function pauseOnly(){
    if(audio){
      audio.pause();
    }
    isPlaying = false;
    // 移除控制按钮
    var btn = document.getElementById('bgmToggleBtn');
    if(btn && btn.parentNode) btn.parentNode.removeChild(btn);
  }
  
  // 清除所有音乐状态（退出登录时调用）
  function clearAllState(){
    try{
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('bgm_muted');
      localStorage.removeItem('bgm_played');
      sessionStorage.removeItem('bgm_interacted');
    }catch(e){}
    if(audio){
      audio.pause();
      audio.currentTime = 0;
    }
    isPlaying = false;
    isMuted = false;
    // 移除控制按钮
    var btn = document.getElementById('bgmToggleBtn');
    if(btn && btn.parentNode) btn.parentNode.removeChild(btn);
  }
  
  // 保存播放状态到localStorage
  function saveState(){
    if(!shouldPlayMusic()) return;
    var state = {
      currentTime: audio ? audio.currentTime : 0,
      isMuted: isMuted,
      isPlaying: isPlaying,
      timestamp: Date.now()
    };
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }catch(e){}
  }
  
  // 从localStorage恢复播放状态
  function restoreState(){
    try{
      var saved = localStorage.getItem(STORAGE_KEY);
      if(saved){
        var state = JSON.parse(saved);
        // 如果距离上次保存不超过30分钟，恢复播放位置
        if(Date.now() - state.timestamp < 30 * 60 * 1000){
          wasPlaying = state.isPlaying || false;
          isMuted = state.isMuted || false;
          return state;
        }
      }
    }catch(e){}
    return null;
  }
  
  // 初始化
  function init(){
    // 如果是登录相关页面，只暂停音乐，不清除状态（保留断点续传）
    if(!shouldPlayMusic()){
      pauseOnly();
      return;
    }
    
    // 恢复状态
    var savedState = restoreState();
    
    // 创建音频元素
    audio = new Audio('bgm.mp3');
    audio.loop = true;
    audio.volume = 0.4;
    
    // 读取用户静音设置
    var savedMuted = localStorage.getItem('bgm_muted');
    if(savedMuted === '1'){
      isMuted = true;
      audio.muted = true;
    }
    
    // 音频加载完成后恢复播放位置（断点续传）
    audio.addEventListener('loadedmetadata', function(){
      try{
        if(savedState && savedState.currentTime && savedState.currentTime > 0){
          if(savedState.currentTime < audio.duration){
            audio.currentTime = savedState.currentTime;
          }
        }
      }catch(e){}
    });
    
    // 监听播放事件，保存状态
    audio.addEventListener('play', function(){
      isPlaying = true;
      saveState();
      updateUI();
    });
    audio.addEventListener('pause', function(){
      isPlaying = false;
      saveState();
      updateUI();
    });
    audio.addEventListener('timeupdate', function(){
      // 每5秒保存一次播放位置
      if(Math.floor(audio.currentTime) % 5 === 0){
        saveState();
      }
    });
    
    // 页面卸载时保存状态
    window.addEventListener('beforeunload', saveState);
    window.addEventListener('pagehide', saveState);
    
    // 监听用户首次交互（解决浏览器自动播放限制）
    var startOnInteract = function(){
      if(hasInteracted) return;
      hasInteracted = true;
      if(!isMuted){
        play();
      }
      // 移除事件监听
      document.removeEventListener('click', startOnInteract);
      document.removeEventListener('keydown', startOnInteract);
      document.removeEventListener('touchstart', startOnInteract);
    };
    document.addEventListener('click', startOnInteract);
    document.addEventListener('keydown', startOnInteract);
    document.addEventListener('touchstart', startOnInteract);
    
    // 尝试自动播放（可能被浏览器阻止）
    if(!isMuted && (wasPlaying || !localStorage.getItem('bgm_played'))){
      audio.play().then(function(){
        isPlaying = true;
        localStorage.setItem('bgm_played', '1');
      }).catch(function(){
        isPlaying = false;
      });
    }
    
    // 创建控制按钮
    createControlButton();
  }
  
  // 播放
  function play(){
    if(!audio || !shouldPlayMusic()) return;
    audio.play().then(function(){
      isPlaying = true;
      saveState();
      updateUI();
    }).catch(function(e){
      console.log('播放失败:', e);
    });
  }
  
  // 暂停
  function pause(){
    if(!audio) return;
    audio.pause();
    isPlaying = false;
    saveState();
    updateUI();
  }
  
  // 切换播放/暂停
  function toggle(){
    if(isPlaying){
      pause();
    }else{
      play();
    }
  }
  
  // 静音/取消静音
  function toggleMute(){
    isMuted = !isMuted;
    if(audio) audio.muted = isMuted;
    localStorage.setItem('bgm_muted', isMuted ? '1' : '0');
    saveState();
    updateUI();
    return isMuted;
  }
  
  // 设置静音
  function setMuted(muted){
    isMuted = muted;
    if(audio) audio.muted = isMuted;
    localStorage.setItem('bgm_muted', isMuted ? '1' : '0');
    saveState();
    updateUI();
  }
  
  // 更新UI（如果有控制按钮）
  function updateUI(){
    var btn = document.getElementById('bgmToggleBtn');
    if(btn){
      if(isMuted){
        btn.innerHTML = '🔇';
        btn.title = '点击开启声音';
      }else if(isPlaying){
        btn.innerHTML = '🔊';
        btn.title = '点击静音';
      }else{
        btn.innerHTML = '🎵';
        btn.title = '点击播放';
      }
    }
  }
  
  // 创建控制按钮（固定在右上角，不会到处乱窜）
  function createControlButton(){
    if(document.getElementById('bgmToggleBtn')) return;
    if(!shouldPlayMusic()) return;
    
    var btn = document.createElement('button');
    btn.id = 'bgmToggleBtn';
    btn.style.cssText = 'position:fixed;top:70px;right:110px;width:40px;height:40px;border-radius:50%;background:rgba(20,24,44,0.85);border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:18px;cursor:pointer;z-index:9999;display:flex;align-items:center;justify-content:center;transition:all .25s;backdrop-filter:blur(10px);';
    btn.onmouseover = function(){ this.style.background = 'rgba(30,35,60,0.95)'; this.style.transform = 'scale(1.1)'; };
    btn.onmouseout = function(){ this.style.background = 'rgba(20,24,44,0.85)'; this.style.transform = 'scale(1)'; };
    btn.onclick = function(e){
      e.stopPropagation();
      toggleMute();
    };
    document.body.appendChild(btn);
    updateUI();
  }
  
  // 防止扰民提示：仅在用户第一次完整浏览主页后显示
  function showAnnoyanceTip(){
    if(!shouldPlayMusic()) return;
    if(localStorage.getItem('bgm_tip_shown')) return;
    // 延迟5秒后显示
    setTimeout(function(){
      var tip = document.createElement('div');
      tip.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(20,24,44,0.95);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:12px 20px;color:#e8efff;font-size:13px;z-index:200;backdrop-filter:blur(10px);box-shadow:0 8px 32px rgba(0,0,0,0.3);';
      tip.innerHTML = '💡 如果觉得音乐扰民，可以在右上角把它关掉';
      document.body.appendChild(tip);
      localStorage.setItem('bgm_tip_shown', '1');
      setTimeout(function(){
        if(tip.parentNode) tip.parentNode.removeChild(tip);
      }, 5000);
    }, 5000);
  }
  
  // 页面加载完成后初始化
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      init();
      showAnnoyanceTip();
    });
  }else{
    init();
    showAnnoyanceTip();
  }
  
  // 暴露公共方法
  return {
    play: play,
    pause: pause,
    toggle: toggle,
    toggleMute: toggleMute,
    setMuted: setMuted,
    clearAllState: clearAllState,
    isPlaying: function(){ return isPlaying; },
    isMuted: function(){ return isMuted; }
  };
})();
