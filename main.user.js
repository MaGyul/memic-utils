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

    document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init) : init();
    async function init() {
        await memicUtils.loadUIAddon();
        await memicUtils.loadAddons();
        memicUtils.enableAddons();
    }
})();