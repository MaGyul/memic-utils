const addonInfo = {
    name: "미밐 글 유튜브 링크",
    description: "미밐 글 유튜브에 연결된 링크 클릭시 유튜브 임베드 생성",
    author: "MaGyul",
    version: "1.0.0"
}

const youtubeReg = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/|live\/|playlist)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;

var autoplay = await addonStorage.get("autoplay", true);
var loop = await addonStorage.get("loop", false);
var nocookie = await addonStorage.get("nocookie", true);

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.dataset.scriptApply != undefined) continue; // 이미 처리된 노드
            if (node.tagName === 'A' && checkHtmlViewer(node)) {
                processATag(node);
            } else if (node.tagName === 'IFRAME' && checkHtmlViewer(node)) {
                processIFrame(node);
            } else {
                node.querySelectorAll("iframe").forEach(iframe => {
                    if (iframe.dataset.scriptApply != undefined) return; // 이미 처리된 노드
                    if (checkHtmlViewer(iframe)) {
                        processIFrame(iframe);
                    }
                });
            }
        }
    }
});

/**
 * @param {HTMLElement} tag 
 */
function checkHtmlViewer(tag) {
    for (let i = 0; i < 10; i++) {
        if (tag.classList.contains('html-viewer') && tag.hasAttribute('itemprop')) {
            return tag.parentElement.tagName === 'APP-ARTICLE-DETAIL-VIEWER';
        }
        tag = tag.parentElement;
    }
    return false;
}

/**
 * @param {string} originalUrl
 * @param {boolean} autoplay
 * @param {boolean} loop
 * @param {boolean} nocookie
 * @returns {string}
 */
function createYoutubeLink(originalUrl, autoplay, loop, nocookie) {
    const url = new URL(originalUrl);
    const videoId = url.pathname.includes('playlist') ? 'playlist' : originalUrl.match(youtubeReg)[1];
    const t = url.searchParams.get('t') ?? url.searchParams.get('start') ?? '0';
    const list = url.searchParams.get('list');
    let src = `https://www.youtube${nocookie ? '-nocookie' : ''}.com/embed/${videoId}?autoplay=${Number(autoplay)}&playsinline=1&start=${t.replace('s', '')}`;
    if (loop) {
        src += `&loop=1&playlist=${videoId}`
    }
    if (list) {
        src += `&list=${list}`;
    }
    return src;
}

function createYoutubeEmbed(originalUrl) {
    const iframe = document.createElement("iframe");
    iframe.src = createYoutubeLink(originalUrl, autoplay, loop, nocookie);
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('width', '100%');
    iframe.style.aspectRatio = '16 / 9';
    iframe.dataset.scriptApply = '';
    iframe.dataset.scriptGenerated = '';
    iframe.dataset.originalSrc = originalUrl;
    return iframe;
}

/**
 * @param {HTMLAnchorElement} a 
 */
function processATag(a) {
    const originalHref = a.href;
    if (originalHref.match(youtubeReg)) {
        a.dataset.originalHref = originalHref;
        a.dataset.scriptApply = '';
        a.onclick = (e) => {
            const iframe = createYoutubeEmbed(originalHref);
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            a.parentElement.appendChild(iframe);
            a.remove();
        };
    }
}

/**
 * @param {HTMLIFrameElement} iframe 
 */
function processIFrame(iframe) {
    if (nocookie) {
        const originalSrc = iframe.src;
        if (originalSrc.match(youtubeReg)) {
            iframe.dataset.originalSrc = originalSrc;
            iframe.src = createYoutubeLink(originalSrc, false, loop, nocookie);
            iframe.dataset.scriptApply = '';
        }
    }
}

function reApply() {
    document.querySelectorAll("a[data-script-apply]").forEach(a => {
        if (a.dataset.originalHref) {
            a.href = a.dataset.originalHref;
            delete a.dataset.scriptApply;
            a.onclick = undefined;
            processATag(a);
        }
    });
    document.querySelectorAll("iframe[data-script-apply]").forEach(iframe => {
        if (iframe.dataset.originalSrc && iframe.dataset.scriptGenerated == undefined) {
            iframe.src = iframe.dataset.originalSrc;
            delete iframe.dataset.scriptApply;
            processIFrame(iframe);
        }
    });
}

function removeApplyData() {
    document.querySelectorAll("a[data-script-apply]").forEach(a => {
        delete a.dataset.scriptApply;
        if (a.dataset.originalHref) {
            a.href = a.dataset.originalHref;
            a.onclick = undefined;

        }
    });
    document.querySelectorAll("iframe[data-script-apply]").forEach(iframe => {
        delete iframe.dataset.scriptApply;
        if (iframe.dataset.originalSrc && iframe.dataset.scriptGenerated == undefined) {
            iframe.src = iframe.dataset.originalSrc;
        }
    });
}

function openSettings(modalBody) {
    const settings = document.createElement("div");
    settings.className = 'flex flex-col gap-4';
    settings.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 8px; gap: 8px;" data-tooltip="유튜브 영상이 자동으로 재생됩니다.">
            <span class="switch_label">자동 재생</span>
            <div class="switch-wrapper">
                <input type="checkbox" id="autoplay-switch" class="switch_input">
                <label for="autoplay-switch" class="switch_label">
                    <span class="onf_btn"></span>
                </label>
            </div>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 8px; gap: 8px;" data-tooltip="유튜브 영상이 계속 반복해서 재생됩니다.">
            <span class="switch_label">자동 반복</span>
            <div class="switch-wrapper">
                <input type="checkbox" id="loop-switch" class="switch_input">
                <label for="loop-switch" class="switch_label">
                    <span class="onf_btn"></span>
                </label>
            </div>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 8px; gap: 8px;" data-tooltip="유튜브 영상에 쿠키를 사용하지 않습니다.\n유튜브에 쿠키를 남기지 않아 알고리즘에 영향을 주지 않습니다.">
            <span class="switch_label">쿠키 사용 안함</span>
            <div class="switch-wrapper">
                <input type="checkbox" id="nocookie-switch" class="switch_input">
                <label for="nocookie-switch" class="switch_label">
                    <span class="onf_btn"></span>
                </label>
            </div>
        </div>
    `;

    settings.querySelector("#autoplay-switch").checked = autoplay;
    settings.querySelector("#loop-switch").checked = loop;
    settings.querySelector("#nocookie-switch").checked = nocookie;

    modalBody.appendChild(settings);

    return () => {
        autoplay = settings.querySelector("#autoplay-switch").checked;
        loop = settings.querySelector("#loop-switch").checked;
        nocookie = settings.querySelector("#nocookie-switch").checked;
        addonStorage.set("autoplay", autoplay);
        addonStorage.set("loop", loop);
        addonStorage.set("nocookie", nocookie);
        reApply();
    };
}

function onenable() {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    document.querySelectorAll("a").forEach(processATag);
    document.querySelectorAll("iframe").forEach(processIFrame);
}

function ondisable() {
    observer.disconnect();
    removeApplyData();
}