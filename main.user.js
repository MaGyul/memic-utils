// ==UserScript==
// @name         미밐 유저 스크립트 관리자
// @namespace    https://mu.magyul.kr/
// @version      1.1.0
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
            WScript.Echo("\uACBD\uACE0: \uC774 \uD30C\uC77C\uC740 \uC720\uC800 \uC2A4\uD06C\uB9BD\uD2B8\uC785\uB2C8\uB2E4!\n\n\uC62C\uBC14\uB978 \uC124\uCE58 \uBC29\uBC95\uC740 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C https://mu.magyul.kr/\uC744 \uBC29\uBB38\uD558\uC138\uC694.");
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