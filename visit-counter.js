(function(){
  var URL = (window.CONFIG && CONFIG.SUPABASE_URL) || "https://ekfntkpjqzmkibdimtru.supabase.co";
  var KEY = (window.CONFIG && CONFIG.ANON_KEY) || "sb_publishable_Z3wpxD9ZRbXm9-gPPQOGZg_KKhr_yIs";

  function todayIso(){
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  function injectBar(){
    if(document.querySelector('.visit-counter')) return;
    var bar = document.createElement('div');
    bar.className = 'visit-counter';
    bar.innerHTML = '今日网站已被访问 <b class="today-visits-count">--</b> 次';
    document.body.appendChild(bar);
  }

  function injectStyle(){
    if(document.getElementById('visit-counter-style')) return;
    var st = document.createElement('style');
    st.id = 'visit-counter-style';
    st.textContent =
      '.visit-counter{position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:90;' +
      'font-size:12px;color:#9aa8d0;letter-spacing:1px;padding:7px 14px;border-radius:10px;' +
      'background:rgba(20,25,50,0.35);border:1px solid rgba(255,255,255,0.1);' +
      'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);' +
      'white-space:nowrap;pointer-events:none;max-width:92vw;text-align:center}' +
      '.visit-counter b{color:#7bc0ff;font-weight:700}' +
      '@media(max-width:480px){.visit-counter{font-size:11px;bottom:8px;padding:6px 12px}}' +
      '@media(max-height:480px) and (orientation:landscape){.visit-counter{font-size:11px;bottom:6px;padding:5px 10px}}';
    document.head.appendChild(st);
  }

  function report(){
    try{
      var path = location.pathname || '/';
      var dedupKey = '_vc_' + path;
      if(sessionStorage.getItem(dedupKey)) return;
      sessionStorage.setItem(dedupKey, '1');
      fetch(URL + '/rest/v1/site_visits', {
        method: 'POST',
        headers: {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal'},
        body: JSON.stringify({path: path})
      }).catch(function(){});
    }catch(e){}
  }

  function loadCount(){
    try{
      fetch(URL + '/rest/v1/site_visits?select=id&created_at=gte.' + todayIso(), {
        headers: {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}
      }).then(function(r){ return r.json(); }).then(function(data){
        var n = Array.isArray(data) ? data.length : 0;
        var els = document.querySelectorAll('.today-visits-count');
        for(var i = 0; i < els.length; i++){ els[i].textContent = n; }
      }).catch(function(){});
    }catch(e){}
  }

  function init(){
    injectStyle();
    injectBar();
    report();
    loadCount();
  }

  if(document.readyState !== 'loading'){ init(); }
  else{ document.addEventListener('DOMContentLoaded', init); }
})();
