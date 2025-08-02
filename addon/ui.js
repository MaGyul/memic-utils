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
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://raw.githubusercontent.com/MaGyul/memic-utils/refs/heads/main/style/ui.style';
    link.type = 'text/css';
    link.onload = () => {
        logger.log('UI 스타일이 성공적으로 추가되었습니다.');
    };
    link.onerror = () => {
        logger.error('UI 스타일을 추가하는데 실패했습니다.');
    };
    document.head.appendChild(link);
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
    controlButton.className = 'relative flex h-8 w-8 items-center justify-center';
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

function createControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'memic-utils-control-panel';
    panel.innerHTML = `
        <div class="p-4">
            <h2 class="text-lg font-bold mb-4">미밐 유저 스크립트 관리자</h2>
            <button id="close-panel" class="bg-red-500 text-white px-4 py-2 rounded">닫기</button>
        </div>
    `;

    panel.querySelector('#close-panel').addEventListener('click', () => {
        closeControlPanel();
    });

    document.body.appendChild(panel);
    return panel;
}

/**
 * 
 * @param {HTMLAnchorElement} button 
 */
function toggleControlPanel(button) {
    const rect = button.getBoundingClientRect();
            
    // 패널 위치 계산 (버튼 바로 아래)
    let left = rect.left;
    let top = rect.bottom + 5;
    
    // 화면을 벗어나지 않도록 조정
    const panelWidth = controlPanel.offsetWidth;
    const panelHeight = controlPanel.offsetHeight;
    
    // 오른쪽으로 벗어나는 경우
    if (left + panelWidth > window.innerWidth) {
        left = window.innerWidth - panelWidth - 10;
    }
    
    // 왼쪽으로 벗어나는 경우
    if (left < 10) {
        left = 10;
    }
    
    // 아래로 벗어나는 경우 (버튼 위쪽에 표시)
    if (top + panelHeight > window.innerHeight) {
        top = rect.top - panelHeight - 5;
    }
    
    // 패널 위치 설정
    controlPanel.style.left = left + 'px';
    controlPanel.style.top = top + 'px';

    controlPanel.classList.toggle('show');
}

function closeControlPanel() {
    controlPanel.classList.remove('show');
}

function onresize() {
    if (controlPanel && controlPanel.classList.contains('show')) {
        // 패널이 화면을 벗어나면 닫기
        const rect = controlPanel.getBoundingClientRect();
        if (rect.left + 360 > window.innerWidth || rect.top + 460 > window.innerHeight) {
            closeControlPanel();
            logger.log('패널이 화면을 벗어나 닫혔습니다.');
        }
    }
}

function onenable() {
    controlPanel = createControlPanel();
    addControlButton();
}

function ondisable() {
    removeControlButton();
    if (controlPanel) {
        controlPanel.remove();
        controlPanel = null;
    }
}