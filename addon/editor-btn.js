const addonInfo = {
    name: "미밐 글 편집기 버튼",
    description: "글 편집기에서 하단에 존재하는 사진, 동영상, 링크 버튼을 상단으로 이동시킵니다.",
    author: "MaGyul",
    version: "1.0.0",
    link: "https://github.com/MaGyul/memic-utils"
}

function movingButtons() {
    const editorHeader = document.querySelector('div[id^="editor_"]');
    const froalaEditor = document.querySelector('#froalaEditor');

    if (!editorHeader || !froalaEditor) return;

    if (editorHeader.querySelector('.script-moved')) {
        // 이미 버튼이 이동된 경우, 다시 이동하지 않음
        return;
    }

    if (froalaEditor.parentElement) {
        const btnElem = froalaEditor.parentElement.querySelector('& > div:nth-child(2) > div');
        const btnLast = editorHeader.querySelector('div:nth-child(5)');
        if (btnElem && btnLast) {
            editorHeader.querySelector('& > div').insertBefore(btnElem, btnLast);
            btnElem.classList.add('script-moved');
        }
    }
}

const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
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