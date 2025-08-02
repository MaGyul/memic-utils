const addonInfo = {
    name: "미밐 페이지네이션",
    description: "미밐 게시판에 페이지 기능을 추가합니다.",
    author: "NoonDaL, MaGyul",
    version: "1.0.0"
}

addUIStyle();

function addUIStyle() {
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://raw.githubusercontent.com/MaGyul/memic-utils/refs/heads/main/style/pagination.css',
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

function onenable() {
}

function ondisable() {
}