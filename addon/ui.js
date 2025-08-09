const addonInfo = {
    name: '미밐 유저 스크립트 관리자 UI',
    description: '미밐 유저 스크립트 관리자를 컨트롤 할 수 있도록 UI를 생성합니다.',
    version: '1.0.0',
    author: 'MaGyul',
    funcs: {
        openModal,
        closeModal,
    }
};

/** @type {HTMLDivElement} */
var controlPanel;
/** @type {HTMLDivElement} */
var modalPanel;

addUIStyle();

function addUIStyle() {
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://mu.magyul.kr/style/ui.css',
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

function mobileAndTabletCheck() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

function addControlButton(retryCount = 0) {
    const header = mobileAndTabletCheck() ?
        document.querySelector('app-mobile-header-buttons > div') :
        document.querySelector('a[data-tooltip="탐색"]')?.parentElement;

    if (!header) {
        if (retryCount < 10) {
            setTimeout(() => addControlButton(retryCount + 1), 1000);
        } else {
            logger.error('탐색 버튼을 찾을 수 없습니다.');
        }
        return;
    }

    const controlButton = document.createElement('a');
    controlButton.className = 'relative flex h-8 w-8 items-center justify-center panel-button';
    controlButton.id = 'memic-utils-control-button';
    controlButton.innerHTML = '<i class="ri-edit-box-line icon-2xl"></i>';
    if (!mobileAndTabletCheck()) { // 모바일 및 태블릿에서는 툴팁을 사용하지 않음
        controlButton.setAttribute('data-tooltip', '미밐 유저 스크립트 컨트롤 패널');
    }
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
    div.id = `${addon.addonKey}-control`;
    div.style.borderBottom = '1px solid var(--color-surface-variant)';
    div.style.paddingBottom = '4px';
    div.innerHTML = `
        <div class="addon-control">
            <div class="addon-info-container">
                <span class="addon-name">${addon.addonInfo.name}</span>
                <a id="addon-info" class="relative flex h-8 w-8 items-center justify-center">
                    <i class="ri-information-line icon-2xl"></i>
                </a>
                ${typeof addon.openSettings === 'function' ?
                    `<a id="open-settings" data-tooltip="설정" class="relative flex h-8 w-8 items-center justify-center">
                        <i class="ri-settings-2-line icon-2xl"></i>
                    </a>` : ''
                }
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
    div.querySelector(`#${addon.addonKey}-switch`).checked = memicUtils.enabledAddons.includes(addon.addonKey);

    div.querySelector('#open-settings')?.addEventListener('click', () => {
        if (typeof addon.openSettings === 'function') {
            const modalBody = modalPanel.querySelector('#modal-body');
            modalBody.innerHTML = ''; // 기존 내용 제거
            const confirmFunc = addon.openSettings(modalBody);
            if (typeof confirmFunc === 'function') {
                modalPanel.querySelector('#modal-confirm').onclick = () => {
                    confirmFunc();
                    closeModal();
                };
            }
            openModal(`${addon.addonInfo.name} 설정`, 'medium');
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
                <button onclick="memicUtils.disableAddons()" class="flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap border border-on-surface-variant2 text-on-surface">모두 끄기</button>
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

function createModalPanel() {
    const modalPanel = document.createElement('div');
    modalPanel.innerHTML = `
        <div id="modal-panel">
            <div class="modal-header">
                <h3 class="modal-title" id="modal-title">제목</h3>
                <button class="modal-close" id="modal-close">×</button>
            </div>
            <div class="modal-body" id="modal-body">
                내용
            </div>
            <div class="modal-footer">
                <button id="modal-cancel" class="flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap border border-on-surface-variant2 text-on-surface">취소</button>
                <button id="modal-confirm" class="flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap bg-primary text-primary-variant">확인</button>
            </div>
        </div>
    `;
    modalPanel.className = 'modal-overlay';

    modalPanel.querySelector('#modal-close').addEventListener('click', () => {
        closeModal();
    });
    modalPanel.querySelector('#modal-cancel').addEventListener('click', () => { 
        closeModal();
    });
    
    document.body.appendChild(modalPanel);
    return modalPanel;
}

function openModal(title, size = 'medium') {
    modalPanel.querySelector('#modal-title').textContent = title;
    modalPanel.querySelector('#modal-panel').className = `modal ${size}`;
    modalPanel.classList.add('show');

    modalPanel.onclick = (event) => {
        const mPanel = modalPanel.querySelector('#modal-panel');
        if (!mPanel.contains(event.target)) {
            // 모달 패널 외부 클릭 시 모달 닫기
            closeModal();
        }
    }
}

function closeModal() {
    modalPanel.classList.remove('show');
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
    const isInsideModal = modalPanel.contains(event.target);

    // 둘 다 아니면 패널 닫기
    if (!isButton && !isInsidePanel && !isInsideModal) {
        // 패널 외부 클릭 시 닫기
        closeControlPanel();
    }
}

function onaddonsLoaded() {
    const content = controlPanel.querySelector('#addon-content');

    for (const addonKey in memicUtils.addons) {
        if (content.querySelector(`#${addonKey}-control`)) {
            // 이미 추가된 애드온은 건너뜀
            logger.warn(`애드온 ${addonKey}은(는) 이미 추가되었습니다.`);
            continue;
        }
        const addonElement = createAddonElement(memicUtils.addons[addonKey]);
        content.appendChild(addonElement);
        logger.log(`애드온 ${addonKey}이(가) 추가되었습니다.`);
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
    modalPanel = createModalPanel();
    addControlButton();
    window.addEventListener('resize', onresize);
    document.addEventListener('click', ondocumentClick);
    memicUtils.addEventListener('addonsLoaded', onaddonsLoaded);
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
    if (modalPanel) {
        modalPanel.remove();
        modalPanel = null;
    }
    window.removeEventListener('resize', onresize);
    document.removeEventListener('click', ondocumentClick);
    memicUtils.removeEventListener('addonsLoaded', onaddonsLoaded);
    memicUtils.removeEventListener('addonsEnabled', onaddonsEnabled);
    memicUtils.removeEventListener('addonsDisabled', onaddonsDisabled);
    memicUtils.removeEventListener('addonEnabled', onaddonEnabled);
    memicUtils.removeEventListener('addonDisabled', onaddonDisabled);
}