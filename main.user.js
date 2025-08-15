// ==UserScript==
// @name         미밐 유저 스크립트 관리자
// @namespace    https://mu.magyul.kr/
// @version      1.0.1
// @description  미밐의 불편함을 유저 스크립트로 제작해서 관리하던걸 하나로 통합
// @author       MaGyul
// @author       isnoa
// @author       NoonDaL
// @license      GPL-3.0
// @homepageURL  https://mu.magyul.kr/
// @match        *://memic.at/*
// @match        *://shelter.id/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=memic.at
// @require      https://unpkg.com/@babel/standalone@7.28.2/babel.min.js
// @require      https://unpkg.com/localforage@1.10.0/dist/localforage.min.js
// @require      https://mu.magyul.kr/memic-utils.js?v=1
// @updateURL    https://mu.magyul.kr/main.user.js
// @downloadURL  https://mu.magyul.kr/main.user.js
// @connect      mu.magyul.kr
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    
    // WScript로 실행했을 때, 브라우저로 리다이렉트
    if (typeof WScript !== 'undefined') {
        try {
            var shell = new ActiveXObject("WScript.Shell");
            shell.Run("https://mu.magyul.kr", 1, false);
        } catch(e) {
            // ActiveXObject 실패시
            WScript.Echo("경고: 이 파일은 유저 스크립트입니다!\n\n올바른 설치 방법은 브라우저에서 https://mu.magyul.kr/을 방문하세요.");
        }
        WScript.Quit(1);
        return;
    }

    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
    function init() {
        memicUtils.loadUIAddon().then(function() {
            memicUtils.loadAddons().then(function() {
                memicUtils.enableAddons();
            });
        });
    }
})();