const addonInfo = {
    name: '미밐 유저 스크립트 관리자 UI',
    description: '미밐 유저 스크립트 관리자를 컨트롤 할 수 있도록 UI를 생성합니다.',
    version: '1.0.0',
    author: 'MaGyul'
};

/** @type {HTMLDivElement} */
var controlPanel;

addUIStyle();

function addUIStyle() {
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://raw.githubusercontent.com/MaGyul/memic-utils/refs/heads/main/style/ui.css',
        onload: function(response) {
            if (response.status === 200) {
                const style = document.createElement('style');
                style.textContent = response.responseText;
                document.head.appendChild(style);
                logger.log('UI 스타일이 성공적으로 추가되었습니다.');
            } else {
                console.error('UI 스타일을 불러오는 데 실패했습니다:', response.statusText);
            }
        },
    });
}

function addControlButton(retryCount = 0) {
    const header = document.querySelector('a[data-tooltip="탐색"]')?.parentElement;

    if (!header) {
        if (retryCount < 10) {
            setTimeout(() => addControlButton(retryCount + 1), 1000);
        } else {
            console.error('탐색 버튼을 찾을 수 없습니다.');
        }
        return;
    }

    const controlButton = document.createElement('a');
    controlButton.className = 'relative flex h-8 w-8 items-center justify-center panel-button';
    controlButton.id = 'memic-utils-control-button';
    controlButton.innerHTML = '<i class="ri-edit-box-line icon-2xl"></i>';
    controlButton.setAttribute('data-tooltip', '미밐 유저 스크립트 컨트롤 패널');
    controlButton.addEventListener('click', () => {
        toggleControlPanel(controlButton);
    });

    header.appendChild(controlButton);
}

function removeControlButton(retryCount = 0) {
    const controlButton = document.getElementById('memic-utils-control-button');

    if (controlButton) {
        controlButton.remove();
        return;
    }

    if (retryCount < 10) {
        setTimeout(() => removeControlButton(retryCount + 1), 1000);
    } else {
        console.error('컨트롤 버튼을 찾을 수 없습니다.');
    }
}

/**
 * 
 * @param {Addon} addon 
 * @returns 
 */
function createAddonElement(addon) {
    const div = document.createElement('div');
    div.style.borderBottom = '1px solid var(--color-surface-variant)';
    div.style.paddingBottom = '4px';
    div.innerHTML = `
        <div class="addon-control">
            <div class="addon-info-container">
                <span class="addon-name">${addon.addonInfo.name}</span>
                <a id="addon-info" class="relative flex h-8 w-8 items-center justify-center">
                    <i class="ri-information-line icon-2xl"></i>
                </a>
                ${addon.addonInfo.link ? 
                    `<a href="${addon.addonInfo.link}" data-tooltip="GitHub" target="_blank" class="relative flex h-8 w-8 items-center justify-center">
                        <i class="ri-github-fill icon-2xl"></i>
                    </a>` : ''
                }
            </div>
            <div class="switch-wrapper">
                <input type="checkbox" id="${addon.addonKey}-switch" class="switch_input">
                <label for="${addon.addonKey}-switch" class="switch_label">
                    <span class="onf_btn"></span>
                </label>
            </div>
        </div>
    `;

    div.querySelector('#addon-info').setAttribute('data-tooltip', `버전: ${addon.addonInfo.version}\n제작자: ${addon.addonInfo.author}\n설명: ${addon.addonInfo.description}`);

    div.querySelector(`#${addon.addonKey}-switch`).addEventListener('change', () => {
        if (memicUtils.enabledAddons.includes(addon.addonKey)) {
            memicUtils.disableAddon(addon.addonKey);
        } else {
            memicUtils.enableAddon(addon.addonKey);
        }
    });

    return div;
}

function createControlPanel() {
    const addon = memicUtils.uiAddon;
    const panel = document.createElement('div');
    panel.id = 'memic-utils-control-panel';
    panel.innerHTML = `
        <div class="p-2">
            <div style="display: flex;">
                <h2 class="text-lg font-bold mb-4" style="font-size: larger;">미밐 추가 기능 제어판</h2>
                <a id="ui-addon-info" class="relative flex h-8 w-8 items-center justify-center">
                    <i class="ri-information-line icon-2xl"></i>
                </a>
                <a href="${addon.addonInfo.link}" data-tooltip="GitHub" target="_blank" style="padding-bottom: calc(var(--spacing) * 1.5);" class="relative flex h-8 w-8 items-center justify-center">
                    <i class="ri-github-fill icon-2xl"></i>
                </a>
            </div>
            <a id="close-panel" data-tooltip="닫기">
                <i class="ri-close-line icon-2xl"></i>
            </a>
            <div id="addon-content"></div>
            <div class="addon-bottom">
                <button onclick="memicUtils.enableAddons(true)" class="flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap bg-primary text-primary-variant">모두 켜기</button>
                <button onclick="memicUtils.disableAddons()" class="flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap bg-primary text-primary-variant">모두 끄기</button>
            </div>
        </div>
    `;

    panel.querySelector('#ui-addon-info').setAttribute('data-tooltip', `버전: ${addon.addonInfo.version}\n제작자: ${addon.addonInfo.author}\n설명: ${addon.addonInfo.description}`);

    const content = panel.querySelector('#addon-content');

    for (const addonKey in memicUtils.addons) {
        const addon = memicUtils.addons[addonKey];
        const addonElement = createAddonElement(addon);
        content.appendChild(addonElement);
    }

    panel.querySelector('#close-panel').addEventListener('click', () => {
        closeControlPanel();
    });

    document.body.appendChild(panel);
    return panel;
}

function setPanelLocation(rect) {
    // 화면을 벗어나지 않도록 조정
    const panelWidth = controlPanel.offsetWidth;
    const panelHeight = controlPanel.offsetHeight;
            
    // 버튼 중앙에 패널 중앙이 오도록 계산
    const buttonCenter = rect.left + rect.width / 2;
    let left = buttonCenter - panelWidth / 2;
    let top = rect.bottom + 5;
    
    // 화면을 벗어나지 않도록 조정
    // 오른쪽으로 벗어나는 경우
    if (left + panelWidth > window.innerWidth - 10) {
        left = window.innerWidth - panelWidth - 10;
    }
    
    // 왼쪽으로 벗어나는 경우
    if (left < 10) {
        left = 10;
    }
    
    // 아래로 벗어나는 경우 (버튼 위쪽에 표시)
    if (top + panelHeight > window.innerHeight - 10) {
        top = rect.top - panelHeight - 5;
    }
    
    // 패널 위치 설정
    controlPanel.style.left = left + 'px';
    controlPanel.style.top = top + 'px';
}

/**
 * 
 * @param {HTMLAnchorElement} button 
 */
function toggleControlPanel(button) {
    const rect = button.getBoundingClientRect();
    setPanelLocation(rect);

    controlPanel.classList.toggle('show');
}

function closeControlPanel() {
    controlPanel.classList.remove('show');
}

function onresize() {
    if (controlPanel && controlPanel.classList.contains('show')) {
        const controlButton = document.getElementById('memic-utils-control-button');
        if (controlButton) {
            const rect = controlButton.getBoundingClientRect();
            setPanelLocation(rect);
        }
    }
}

function ondocumentClick(event) {
    // 패널이 열려있는지 확인
    if (!controlPanel.classList.contains('show')) return;

    // 버튼 클릭인지 확인
    const isButton = event.target.classList.contains('panel-button') || 
                   event.target.closest('.panel-button');
    
    // 패널 내부 클릭인지 확인
    const isInsidePanel = controlPanel.contains(event.target);

    // 둘 다 아니면 패널 닫기
    if (!isButton && !isInsidePanel) {
        // 패널 외부 클릭 시 닫기
        closeControlPanel();
    }
}

function onaddonsEnabled(event) {
    const enabledAddons = event.detail;
    for (const addonKey of enabledAddons) {
        const checkbox = document.querySelector(`#${addonKey}-switch`);
        if (checkbox) {
            checkbox.checked = true;
        }
    }
}

function onaddonsDisabled(event) {
    const disabledAddons = event.detail;
    for (const addonKey of disabledAddons) {
        const checkbox = document.querySelector(`#${addonKey}-switch`);
        if (checkbox) {
            checkbox.checked = false;
        }
    }
}

function onaddonEnabled(event) {
    const addonKey = event.detail;
    const checkbox = document.querySelector(`#${addonKey}-switch`);
    if (checkbox) {
        checkbox.checked = true;
    }
}

function onaddonDisabled(event) {
    const addonKey = event.detail;
    const checkbox = document.querySelector(`#${addonKey}-switch`);
    if (checkbox) {
        checkbox.checked = false;
    }
}

function onenable() {
    controlPanel = createControlPanel();
    addControlButton();
    window.addEventListener('resize', onresize);
    document.addEventListener('click', ondocumentClick);
    memicUtils.addEventListener('addonsEnabled', onaddonsEnabled);
    memicUtils.addEventListener('addonsDisabled', onaddonsDisabled);
    memicUtils.addEventListener('addonEnabled', onaddonEnabled);
    memicUtils.addEventListener('addonDisabled', onaddonDisabled);
}

function ondisable() {
    removeControlButton();
    if (controlPanel) {
        controlPanel.remove();
        controlPanel = null;
    }
    window.removeEventListener('resize', onresize);
    document.removeEventListener('click', ondocumentClick);
    memicUtils.removeEventListener('addonsEnabled', onaddonsEnabled);
    memicUtils.removeEventListener('addonsDisabled', onaddonsDisabled);
    memicUtils.removeEventListener('addonEnabled', onaddonEnabled);
    memicUtils.removeEventListener('addonDisabled', onaddonDisabled);
}