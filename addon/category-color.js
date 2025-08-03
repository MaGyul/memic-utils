const addonInfo = {
    name: "미밐 카테고리 색상 강조",
    description: "미밐 카테고리 색상을 강조합니다.",
    author: "NoonDaL",
    version: "1.1",
    link: "https://github.com/NoonDaL/memic-utils"
};

// Color definition
const categoryColors = {
    '공지': '#FF5C5C',
    '자유': '#4FC3F7',
    '후방주의': '#FF8A80',
    '소식': '#9575CD',
    '창작': '#FFB74D',
    '질문': '#4DB6AC',
    '공략': '#81C784',
    '애니': '#BA68C8',
    '스포/유출': '#F06292',
    '굿즈/후기': '#A1887F',
    '대리가챠': '#90A4AE',
    '컨텐츠 추천': '#7986CB',
    '클립': '#64B5F6',
    '이벤트': '#FFD54F'
};

for (const key in categoryColors) {
    categoryColors[key] = addonStorage.get(key, categoryColors[key]);
}

// Apply post tags color
function colorizePostPrefixes(off = false) {
    const postLinks = document.querySelectorAll('a.border-b-on-background-variant2');

    postLinks.forEach(link => {
        const prefix = link.querySelector('span');
        if (!prefix) return;

        const text = prefix.textContent.trim();
        const color = categoryColors[text];
        if (color) {
            if (off) {
                prefix.style.color = '';
                prefix.style.fontWeight = '';
            } else {
                prefix.style.color = color;
                prefix.style.fontWeight = 'bold';
            }
        }
    });
}

// Apply sidebar categories color
function colorizeSidebarCategories(off = false) {
    const anchors = document.querySelectorAll('a.truncate');

    anchors.forEach(a => {
        const span = a.querySelector('span');
        if (!span) return;

        const text = span.textContent.trim();

        if (categoryColors[text]) {
            if (off) {
                span.style.color = '';
                span.style.fontWeight = '';
            } else {
                span.style.color = categoryColors[text];
                span.style.fontWeight = 'bold';
            }
        }
    });
}

// 게시글의 span.bg-background 말머리에도 색상 배경 적용
function colorizePostSpanTags(off = false) {
    const spans = document.querySelectorAll('span.bg-background');
    spans.forEach(span => {
        const text = span.textContent.trim();
        const color = categoryColors[text];
        if (color) {
            if (off) {
                span.style.backgroundColor = '';
                span.style.color = '';
                span.style.fontWeight = '';
            } else {
                span.style.backgroundColor = color;
                span.style.color = '#ffffff';
                span.style.fontWeight = 'bold';
            }
        }
    });
}

function applyAll(off = false) {
    colorizePostSpanTags(off);
    colorizePostPrefixes(off);
    colorizeSidebarCategories(off);
}

const observer = new MutationObserver(() => {
    applyAll();
});

function openSettings(modalBody) {
    const settingsContent = document.createElement('div');
    settingsContent.innerHTML = `
        <label for="category-colors">카테고리 색상 설정:</label>
        <div id="category-colors"></div>
    `;

    const colorsContainer = settingsContent.querySelector('#category-colors');

    const colorInputs = {};

    for (const key in categoryColors) {
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = categoryColors[key];
        colorInputs[key] = colorInput;

        const label = document.createElement('label');
        label.textContent = key;
        label.appendChild(colorInput);
        colorsContainer.appendChild(label);
    }

    modalBody.appendChild(settingsContent);

    return () => {
        // 설정 저장
        for (const key in colorInputs) {
            categoryColors[key] = colorInputs[key].value;
            addonStorage.set(key, categoryColors[key]);
        }
        applyAll();
    }
}

function onenable() {
    setTimeout(applyAll, 500);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function ondisable() {
    observer.disconnect();
    applyAll(true);
}