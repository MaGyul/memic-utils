const addonInfo = {
    name: "미밐 글 편집기 버튼",
    description: "글 편집기에서 하단에 존재하는 사진, 동영상, 링크 버튼을 상단으로 이동시킵니다.",
    author: "MaGyul",
    version: "1.0.0",
    link: "https://github.com/MaGyul/memic-utils"
}

addStyle();

function addStyle() {
    const style = document.createElement('style');
    style.textContent = `
    app-emoticon-popup.script-moved {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 99;
        background-color: var(--color-background);
        border-radius: 20px;
        border: 1px solid var(--color-on-background);
    }

    app-vote-form.script-moved {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 99;
        min-width: 500px;
    }
    `;
    style.id = 'addon-editor-btn-style';
    document.head.appendChild(style);
}

function movingButtons() {
    const editorHeader = document.querySelector('div[id^="editor_"]');
    const toolbar = editorHeader.querySelector('& > div');
    const froalaEditor = document.querySelector('#froalaEditor');

    if (!editorHeader || !froalaEditor || !toolbar) return;

    if (toolbar.firstChild.classList.contains('script-moved')) {
        // 이미 버튼이 이동 됬지만 맨 앞에 있는 경우, 맨 뒤로 이동
        toolbar.appendChild(toolbar.firstChild);
        return;
    }

    if (editorHeader.querySelector('.script-moved')) {
        // 이미 버튼이 이동된 경우, 다시 이동하지 않음
        return;
    }

    if (froalaEditor.parentElement) {
        const btnElem = froalaEditor.parentElement.querySelector('& > div:nth-child(2) > div');
        if (btnElem) {
            toolbar.appendChild(btnElem);
            btnElem.classList.add('script-moved');
        }
    }
}

const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('script-moved')) {
                        // 이미 스타일이 적용된 노드는 무시
                        continue;
                    }
                    if (node.nodeName === 'APP-EMOTICON-POPUP') {
                        // 이모티콘 팝업이 추가된 경우, 스타일을 적용
                        node.classList.add('script-moved');
                    }
                    if (node.nodeName === 'APP-VOTE-FORM') {
                        const froalaEditor = document.querySelector('#froalaEditor');
                        if (froalaEditor && froalaEditor.parentElement) {
                            // 투표 폼이 추가된 경우, 스타일을 적용
                            node.classList.add('script-moved');
                            // 투표 폼을 에디터 안으로 이동
                            froalaEditor.parentElement.appendChild(node);
                        }
                    }
                }
            }
            movingButtons();
        }
    }
});

function onenable() {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function ondisable() {
    observer.disconnect();
}