const addonInfo = {
    name: "미밐 정확한 시간 표시",
    description: "미밐 게시판에 정확한 시간 표시 기능을 추가합니다.",
    author: "NoonDaL, MaGyul",
    version: "1.0.0"
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

function formatDate(date) {
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0');
}

function updateTimestamps() {
    const articles = document.querySelectorAll('app-shelter-board-page > app-pull-to-refresh div.article-list-container > app-article-list-item:not([script-apply])');
    
    for (const article of articles) {
        const aTag = article.querySelector('& > a');
        const articleId = aTag.href.match(/\/articles\/(\d+)/)[1];

        const timeElem = article.querySelector('[itemprop="dateCreated"]');
        const originalTime = timeElem.textContent.trim();

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