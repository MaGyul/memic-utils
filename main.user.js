// ==UserScript==
// @name         �̓H ���� ��ũ��Ʈ ������
// @namespace    https://mu.magyul.kr/
// @version      1.0.1
// @description  �̓H�� �������� ���� ��ũ��Ʈ�� �����ؼ� �����ϴ��� �ϳ��� ����
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
    
    // WScript�� �������� ��, �������� �����̷�Ʈ
    if (typeof WScript !== 'undefined') {
        try {
            var shell = new ActiveXObject("WScript.Shell");
            shell.Run("https://mu.magyul.kr", 1, false);
        } catch(e) {
            // ActiveXObject ���н�
            WScript.Echo("���: �� ������ ���� ��ũ��Ʈ�Դϴ�!\n\n�ùٸ� ��ġ ����� ���������� https://mu.magyul.kr/�� �湮�ϼ���.");
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