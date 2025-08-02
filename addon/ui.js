const addonInfo = {
    name: '미밐 유저 스크립트 관리자 UI',
    description: '미밐 유저 스크립트 관리자를 컨트롤 할 수 있도록 UI를 생성합니다.',
    version: '1.0.0',
    author: 'MaGyul'
};

/** @type {HTMLDivElement} */
var controlPanel;

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
    controlButton.addEventListener('click', openControlPanel);

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
    panel.className = 'fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-50';
    panel.innerHTML = `
        <div class="p-4">
            <h2 class="text-lg font-bold mb-4">미밐 유저 스크립트 관리자</h2>
            <button id="close-panel" class="bg-red-500 text-white px-4 py-2 rounded">닫기</button>
        </div>
    `;

    panel.getElementById('close-panel').addEventListener('click', () => {
        logger.log('close panel');
    });

    document.body.appendChild(panel);
    return panel;
}

function openControlPanel() {
    logger.log('open panel');
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