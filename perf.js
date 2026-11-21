/* ============================================================================
 * perf.js —— 性能 / 兼容 / 交互补丁（四站通用，放在 </body> 之前加载）
 * 1) 下拉菜单互斥：点开一个自动收起另一个（修复"两个菜单重叠"）
 * 2) 低配设备/手机自动加 .low-perf 类，配合 perf.css 关掉最耗性能的效果
 * 3) 图片懒加载：自动补 loading="lazy" decoding="async"
 * 4) 手机减少星空粒子数量
 * 5) 退出登录改为立即跳转（不再卡在 setTimeout / 大弹窗动画上）
 * ========================================================================== */
(function () {
  'use strict';

  var LOGIN_PAGE = 'https://cqxjw-class7-2020.pages.dev/login.html';

  function byId(id) { return document.getElementById(id); }
  function addClass(cls) { document.documentElement.classList.add(cls); }

  /* ---------- 1. 设备能力检测 ---------- */
  try {
    var isMobile = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(navigator.userAgent) || window.innerWidth <= 820;
    var cpu = navigator.hardwareConcurrency || 8;
    var mem = navigator.deviceMemory || 8;
    var saveData = navigator.connection && navigator.connection.saveData;
    if (isMobile) addClass('is-mobile');
    if (isMobile || cpu <= 4 || mem <= 4 || saveData) addClass('low-perf');
  } catch (e) {}

  /* ---------- 2. 下拉菜单互斥 + 点击外部收起 ---------- */
  function closeDropdown(id) {
    var el = byId(id);
    if (el) el.classList.remove('show');
  }
  function restoreScroll() {
    try { document.body.style.overflow = ''; } catch (e) {}
  }
  function inClosest(target, selector) {
    try { return !!(target && target.closest && target.closest(selector)); } catch (e) { return false; }
  }
  function hideMobileMenu() {
    var menu = byId('navMenu');
    if (menu && menu.style && menu.style.display === 'flex') menu.style.display = '';
  }

  // 捕获阶段先处理：点语言切换时收起"更多"，点"更多"时收起语言下拉
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (inClosest(t, '#langSwitch')) {
      closeDropdown('moreDropdown');
      restoreScroll();
    } else if (inClosest(t, '#navMore')) {
      closeDropdown('langDropdown');
    }
    // 移动端菜单：点菜单里的链接后收起
    if (inClosest(t, '#navMenu a, #navMenu .nav-item')) hideMobileMenu();
  }, true);

  // 冒泡阶段：点空白处收起所有下拉
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (inClosest(t, '#langSwitch, #langDropdown, #navMore, #moreDropdown, #navUser, #bgmToggleBtn')) return;
    closeDropdown('langDropdown');
    closeDropdown('moreDropdown');
    restoreScroll();
    if (!inClosest(t, '#navMenu') && !inClosest(t, '.nav-mobile-btn') && !inClosest(t, '.nav-toggle')) hideMobileMenu();
  });

  // Esc 关闭
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      closeDropdown('langDropdown');
      closeDropdown('moreDropdown');
      restoreScroll();
      hideMobileMenu();
    }
  });

  /* ---------- 3. 图片懒加载 ---------- */
  function lazyImages(root) {
    var imgs = (root || document).querySelectorAll ? (root || document).querySelectorAll('img') : [];
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      try {
        if (!img.getAttribute('loading')) img.setAttribute('loading', 'lazy');
        if (!img.getAttribute('decoding')) img.setAttribute('decoding', 'async');
      } catch (e) {}
    }
  }
  function deferredLazy(root) {
    if (window.requestAnimationFrame) {
      requestAnimationFrame(function () { lazyImages(root); });
    } else {
      setTimeout(function () { lazyImages(root); }, 50);
    }
  }

  /* ---------- 4. 手机减少星空粒子 ---------- */
  function trimStars() {
    if (!document.documentElement.classList.contains('low-perf')) return;
    var box = byId('stars');
    if (!box) return;
    var kids = box.children;
    for (var i = kids.length - 1; i >= 10; i--) {
      try { box.removeChild(kids[i]); } catch (e) {}
    }
  }

  /* ---------- 5. 退出登录：立即跳转，避免卡顿 ---------- */
  function fastLogout() {
    try {
      var keys = ['sb_session', 'sb_admin', 'sb_user', 'logged_in', 'login_expire', 'is_admin',
        'visitor_verified', 'mode', 'visitor_from_login', 'bgm_state', 'bgm_muted', 'bgm_played',
        'last_register_submit', 'last_ticket_submit'];
      for (var i = 0; i < keys.length; i++) { try { localStorage.removeItem(keys[i]); } catch (e) {} }
      for (var j = localStorage.length - 1; j >= 0; j--) {
        var k = localStorage.key(j);
        if (k && (k.indexOf('sb_') === 0 || k.indexOf('user_') === 0 || k.indexOf('auth_') === 0 || k.indexOf('token_') === 0)) {
          localStorage.removeItem(k);
        }
      }
      var v = null;
      try { v = sessionStorage.getItem('_v'); } catch (e) {}
      try { sessionStorage.clear(); if (v) sessionStorage.setItem('_v', v); } catch (e) {}
      if (window.BGM && typeof BGM.clearAllState === 'function') {
        try { BGM.clearAllState(); } catch (e) {}
      }
    } catch (e) {}
    try { location.replace(LOGIN_PAGE); } catch (e) { location.href = LOGIN_PAGE; }
  }
  // 页面自己的 logout 都定义在正文内联脚本里，这里最后覆盖，保证点了立刻走
  try { window.logout = fastLogout; } catch (e) {}
  try { window.fastLogout = fastLogout; } catch (e) {}

  /* ---------- 启动 ---------- */
  function boot() {
    lazyImages(document);
    trimStars();
    // 宫格图片是脚本动态插入的，监听一下增量
    try {
      if (window.MutationObserver) {
        var mo = new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) {
            if (muts[i].addedNodes && muts[i].addedNodes.length) { deferredLazy(document); return; }
          }
        });
        mo.observe(document.body, { childList: true, subtree: true });
      }
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  window.addEventListener('load', function () { lazyImages(document); });
})();
