/**
 * 二次验证模块
 * 支持两种验证方式：长按验证、滑动滑块验证
 * 每次随机选择一种
 */
(function(){
"use strict";

var _callbacks = {};

// 长按验证
function _longPress(onSuccess, onFail){
var _mask = document.createElement("div");
_mask.style.cssText = "position:fixed;inset:0;z-index:999999;background:rgba(10,14,26,.97);display:flex;align-items:center;justify-content:center;padding:20px;";
var _card = document.createElement("div");
_card.style.cssText = "background:#0f1a2e;border-radius:16px;padding:28px;max-width:360px;width:100%;border:1px solid rgba(74,144,255,.15);box-shadow:0 16px 48px rgba(0,0,0,.5);text-align:center;";
_card.innerHTML = '<div style="font-size:36px;margin-bottom:14px;">🔐</div>' +
'<div style="font-size:17px;font-weight:600;color:#c5d5f0;margin-bottom:6px;">安全验证</div>' +
'<div style="font-size:12px;color:#6b8ab5;margin-bottom:20px;line-height:1.6;">请长按下方按钮完成验证</div>' +
'<button id="_lpBtn" style="width:100%;height:56px;border-radius:10px;background:rgba(74,144,255,.06);border:1px solid rgba(74,144,255,.2);color:#7bc0ff;font-size:14px;font-weight:500;cursor:pointer;position:relative;overflow:hidden;touch-action:manipulation;">' +
'<div id="_lpFill" style="position:absolute;left:0;top:0;height:100%;background:rgba(74,144,255,.12);width:0%;transition:width .1s;"></div>' +
'<span style="position:relative;z-index:1;">长按按钮验证</span></button>' +
'<div id="_lpErr" style="color:#f87171;font-size:11px;margin-top:10px;min-height:14px;"></div>';
_mask.appendChild(_card);
document.body.appendChild(_mask);

var _btn = _card.querySelector("#_lpBtn");
var _fill = _card.querySelector("#_lpFill");
var _err = _card.querySelector("#_lpErr");
var _pressing = false, _startT = 0, _int = null, _need = 2000;

function _start(e){
e.preventDefault();
_pressing = true; _startT = Date.now(); _err.textContent = "";
_int = setInterval(function(){
var _el = Date.now()-_startT;
_fill.style.width = Math.min(_el/_need*100,100)+"%";
if(_el >= _need){
clearInterval(_int); _pressing = false;
document.body.removeChild(_mask);
if(onSuccess) onSuccess();
}
},50);
}
function _end(){
if(!_pressing) return;
_pressing = false; clearInterval(_int);
if(Date.now()-_startT < _need){
_fill.style.width = "0%"; _err.textContent = "长按时间不足，请重试";
if(onFail) onFail();
}
}
_btn.addEventListener("mousedown",_start);
_btn.addEventListener("mouseup",_end);
_btn.addEventListener("mouseleave",_end);
_btn.addEventListener("touchstart",_start,{passive:false});
_btn.addEventListener("touchend",_end);
}

// 滑动滑块验证
function _slideVerify(onSuccess, onFail){
var _mask = document.createElement("div");
_mask.style.cssText = "position:fixed;inset:0;z-index:999999;background:rgba(10,14,26,.97);display:flex;align-items:center;justify-content:center;padding:20px;";
var _card = document.createElement("div");
_card.style.cssText = "background:#0f1a2e;border-radius:16px;padding:28px;max-width:360px;width:100%;border:1px solid rgba(74,144,255,.15);box-shadow:0 16px 48px rgba(0,0,0,.5);text-align:center;";
_card.innerHTML = '<div style="font-size:36px;margin-bottom:14px;">🔐</div>' +
'<div style="font-size:17px;font-weight:600;color:#c5d5f0;margin-bottom:6px;">安全验证</div>' +
'<div style="font-size:12px;color:#6b8ab5;margin-bottom:20px;line-height:1.6;">请滑动滑块到最右端完成验证</div>' +
'<div id="_slideTrack" style="width:100%;height:48px;background:rgba(74,144,255,.06);border:1px solid rgba(74,144,255,.15);border-radius:10px;position:relative;overflow:hidden;">' +
'<div id="_slideFill" style="position:absolute;left:0;top:0;height:100%;background:rgba(74,144,255,.12);width:0%;"></div>' +
'<div id="_slideText" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#5a7aa5;font-size:13px;pointer-events:none;">向右滑动验证</div>' +
'<div id="_slideBtn" style="position:absolute;left:0;top:0;width:48px;height:48px;background:#4a90ff;border-radius:10px;cursor:grab;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;box-shadow:0 2px 8px rgba(74,144,255,.3);user-select:none;touch-action:none;">→</div></div>' +
'<div id="_slideErr" style="color:#f87171;font-size:11px;margin-top:10px;min-height:14px;"></div>';
_mask.appendChild(_card);
document.body.appendChild(_mask);

var _track = _card.querySelector("#_slideTrack");
var _fill = _card.querySelector("#_slideFill");
var _text = _card.querySelector("#_slideText");
var _btn = _card.querySelector("#_slideBtn");
var _err = _card.querySelector("#_slideErr");
var _dragging = false, _startX = 0, _currentX = 0, _maxX = 0;

function _updatePos(){
var _w = _track.clientWidth - _btn.clientWidth;
_maxX = _w;
_btn.style.left = _currentX + "px";
_fill.style.width = (_currentX + _btn.clientWidth) + "px";
if(_currentX >= _maxX * 0.95){
_text.style.opacity = "0";
}else{
_text.style.opacity = "1";
}
}

function _onDown(e){
_dragging = true;
_startX = (e.touches ? e.touches[0].clientX : e.clientX) - _currentX;
_btn.style.cursor = "grabbing";
_err.textContent = "";
e.preventDefault();
}
function _onMove(e){
if(!_dragging) return;
var _x = (e.touches ? e.touches[0].clientX : e.clientX) - _startX;
_currentX = Math.max(0, Math.min(_x, _maxX));
_updatePos();
e.preventDefault();
}
function _onUp(){
if(!_dragging) return;
_dragging = false;
_btn.style.cursor = "grab";
if(_currentX >= _maxX * 0.95){
_currentX = _maxX;
_updatePos();
_btn.style.background = "#4ade80";
setTimeout(function(){
document.body.removeChild(_mask);
if(onSuccess) onSuccess();
},300);
}else{
_currentX = 0;
_updatePos();
_err.textContent = "请滑动到最右端";
if(onFail) onFail();
}
}

_btn.addEventListener("mousedown",_onDown);
document.addEventListener("mousemove",_onMove);
document.addEventListener("mouseup",_onUp);
_btn.addEventListener("touchstart",_onDown,{passive:false});
document.addEventListener("touchmove",_onMove,{passive:false});
document.addEventListener("touchend",_onUp);

setTimeout(_updatePos,100);
}

// 公开API：随机选择一种验证方式
window.CaptchaVerify = {
// 随机验证（50%长按，50%滑块）
verify: function(onSuccess, onFail){
if(Math.random() < 0.5){
_longPress(onSuccess, onFail);
}else{
_slideVerify(onSuccess, onFail);
}
},
// 长按验证
longPress: _longPress,
// 滑块验证
slide: _slideVerify
};
})();
