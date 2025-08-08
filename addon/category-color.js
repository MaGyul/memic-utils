const addonInfo = {
    name: "미밐 카테고리 색상 강조",
    description: "미밐 카테고리 색상을 강조합니다.",
    author: "NoonDaL",
    version: "1.1",
    link: "https://github.com/NoonDaL/memic-utils"
};

const defaultCategoryColors = {
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
var applyMemicColor = await addonStorage.get("apply-memic-color", false);

// Color definition
const categoryColors = {};

for (const key in defaultCategoryColors) {
    categoryColors[key] = await addonStorage.get(key, defaultCategoryColors[key]);
}

// Apply post tags color
function colorizePostPrefixes(off = false) {
    const postLinks = document.querySelectorAll('a.border-b-on-background-variant2');

    postLinks.forEach(link => {
        const prefix = link.querySelector('span');
        if (!prefix) return;

        const text = prefix.textContent.trim();
        let color = categoryColors[text];
        if (color) {
            if (applyMemicColor) {
                prefix.dataset.memicColor = prefix.style.backgroundColor;
                if (off) {
                    prefix.style.backgroundColor = prefix.dataset.memicColor || '';
                    prefix.dataset.memicColor = '';
                } else {
                    color = prefix.style.backgroundColor || color;
                    prefix.style.backgroundColor = '';
                }
            } else {
                if (off) {
                    prefix.style.backgroundColor = prefix.dataset.memicColor || '';
                    prefix.dataset.memicColor = '';
                }
            }
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
        <div style="display: flex; align-items: center; margin-bottom: 8px; gap: 8px;" data-tooltip="미밐에서 적용하는 카테고리 색상을 사용합니다.">
            <span class="switch_label">미밐 색상 적용</span>
            <div class="switch-wrapper">
                <input type="checkbox" id="apply-memic-color-switch" class="switch_input">
                <label for="apply-memic-color-switch" class="switch_label">
                    <span class="onf_btn"></span>
                </label>
            </div>
        </div>
        <label for="category-colors" style="margin-bottom: 4px;">카테고리 색상 설정</label>
        <div id="category-colors" style="display: flex; flex-direction: column; gap: 2px;"></div>
    `;

    const colorsContainer = settingsContent.querySelector('#category-colors');

    const colorInputs = {};

    for (const key in categoryColors) {
        const colorDiv = document.createElement('div');
        colorDiv.style.display = 'flex';
        colorDiv.style.alignItems = 'center';
        colorDiv.style.flexDirection = 'row';

        const colorInput = document.createElement('input');
        colorInput.id = `color-${key}`;
        colorInput.style.marginLeft = '4px';
        colorInput.type = 'color';
        colorInput.value = categoryColors[key];
        colorInputs[key] = colorInput;

        const label = document.createElement('label');
        label.textContent = key;
        label.appendChild(colorInput);
        colorDiv.appendChild(label);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap border border-on-surface-variant2 text-on-surface';
        resetBtn.textContent = '초기화';
        resetBtn.style.marginLeft = '12px';
        resetBtn.addEventListener('click', () => {
            colorInput.value = defaultCategoryColors[key];
            categoryColors[key] = defaultCategoryColors[key];
        });
        colorDiv.appendChild(resetBtn);

        colorsContainer.appendChild(colorDiv);
    }

    modalBody.appendChild(settingsContent);

    const applyMemicColorSwitch = settingsContent.querySelector('#apply-memic-color-switch');
    applyMemicColorSwitch.checked = applyMemicColor;

    return () => {
        // 설정 저장
        for (const key in colorInputs) {
            categoryColors[key] = colorInputs[key].value;
            addonStorage.set(key, categoryColors[key]);
        }

        applyMemicColor = applyMemicColorSwitch.checked;
        addonStorage.set("apply-memic-color", applyMemicColor);

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