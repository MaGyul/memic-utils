const addonInfo = {
    name: "미밐 정확한 시간 표시",
    description: "미밐 게시판에 정확한 시간 표시 기능을 추가합니다.",
    author: "NoonDaL, MaGyul",
    version: "1.0.0"
}

const formatType = {
    tgd: {
        name: '트게더 형식',
        description: '오늘 날짜는 시:분:초로 표시하고, 다른 날짜는 YY-MM-DD 형식으로 표시합니다.',
        formatFunction: formatDateTgd
    },
    normal: {
        name: '일반 형식',
        description: 'YYYY-MM-DD HH:mm:ss 형식으로 표시합니다.',
        formatFunction: formatDate
    }
}

addStyle();

function addStyle() {
    const style = document.createElement('style');
    style.textContent = `
        .fixed-time-format {
            font-size: inherit !important;
            font-family: 'SUIT', 'Apple SD Gothic Neo', 'Noto Sans KR', 'sans-serif' !important;
            white-space: nowrap;
            display: inline-block;
            text-align: right;
            min-width: 140px;
        }
    `;
    document.head.appendChild(style);
}

function change9under(i) {
    if (i <= 9) {
        i = '0' + i;
    }
    return i;
}

function formatDateTgd(createDate) {
    let currentDate = new Date();
    let year = ('' + createDate.getFullYear()).substring(2);
    let month = change9under(createDate.getMonth() + 1);
    let date = change9under(createDate.getDate());
    let hours = change9under(createDate.getHours());
    let minutes = change9under(createDate.getMinutes());
    let seconds = change9under(createDate.getSeconds());
    // 생성된 날자가 오늘일 경우
    if (currentDate.getDate() == date) {
        return `${hours}:${minutes}:${seconds}`;
    } else {
        return `${year}-${month}-${date}`;
    }
}

function formatDate(date) {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0');
}

async function updateTimestamps() {
    const articles = document.querySelectorAll('app-shelter-board-page > app-pull-to-refresh div.article-list-container > app-article-list-item:not([script-apply])');
    const selectedFormat = await addonStorage.get('timeFormat', 'normal');

    for (const article of articles) {
        const aTag = article.querySelector('& > a');
        const articleId = aTag.href.match(/\/articles\/(\d+)/)[1];

        const timeElem = article.querySelector('[itemprop="dateCreated"]');
        const originalTime = timeElem.textContent.trim();

        const formatDate = formatType[selectedFormat].formatFunction;

        if (timeElem.hasAttribute('datetime')) {
            const datetime = timeElem.getAttribute('datetime');
            const parsedDate = new Date(datetime);
            if (!isNaN(parsedDate.getTime())) {
                timeElem.textContent = formatDate(parsedDate);
                timeElem.title = originalTime;
                timeElem.classList.add('fixed-time-format');
                article.setAttribute('script-apply', 'true');
            }
        } else {
            memicUtils.api.articles.get(articleId).then(articleInfo => {
                if (articleInfo && articleInfo.createDate) {
                    const createdAt = new Date(articleInfo.createDate);
                    if (!isNaN(createdAt.getTime())) {
                        timeElem.textContent = formatDate(createdAt);
                        timeElem.title = originalTime;
                        timeElem.classList.add('fixed-time-format');
                        article.setAttribute('script-apply', 'true');
                    }
                }
            });
        }
    }
}

const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldUpdate = true;
        }
    });

    if (shouldUpdate) {
        setTimeout(updateTimestamps, 100);
    }
});

function onfocus() {
    setTimeout(updateTimestamps, 500);
}

function refreshRender() {
    const articles = document.querySelectorAll('app-shelter-board-page > app-pull-to-refresh div.article-list-container > app-article-list-item[script-apply]');

    for (const article of articles) {
        const timeElem = article.querySelector('[itemprop="dateCreated"]');
        if (timeElem) {
            timeElem.classList.remove('fixed-time-format');
            timeElem.textContent = timeElem.title; // 원래 시간으로 되돌리기
        }
        article.removeAttribute('script-apply');
    }
    updateTimestamps();
}

/**
 * @param {HTMLDivElement} modalBody
 */
function openSettings(modalBody) {
    const settingsContent = document.createElement('div');
    settingsContent.innerHTML = `
        <label for="time-format">시간 형식 선택:</label>
        <select id="time-format">
        </select>
    `;

    for (const key in formatType) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = formatType[key].name;
        option.title = formatType[key].description;
        option.style.backgroundColor = 'var(--color-surface)';
        settingsContent.querySelector('#time-format').appendChild(option);
        addonStorage.get('timeFormat', 'normal').then((selectedFormat) => {
            if (selectedFormat === key) {
                option.selected = true;
            }
        });
    }

    modalBody.appendChild(settingsContent);

    return () => {
        const selectedFormat = settingsContent.querySelector('#time-format').value;
        addonStorage.set('timeFormat', selectedFormat);
        setTimeout(refreshRender, 500);
    };
}

function onenable() {
    setTimeout(updateTimestamps, 500);

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function ondisable() {
    observer.disconnect();
    const articles = document.querySelectorAll('app-shelter-board-page > app-pull-to-refresh div.article-list-container > app-article-list-item[script-apply]');
    for (const article of articles) {
        const timeElem = article.querySelector('[itemprop="dateCreated"]');
        if (timeElem) {
            timeElem.classList.remove('fixed-time-format');
            timeElem.textContent = timeElem.title; // 원래 시간으로 되돌리기
        }
        article.removeAttribute('script-apply');
    }
}