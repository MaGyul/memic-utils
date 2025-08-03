const addonInfo = {
    name: "미밐 페이지네이션",
    description: "미밐 게시판에 페이지 기능을 추가합니다.",
    author: "NoonDaL, MaGyul",
    version: "1.0.0",
    link: "https://github.com/NoonDaL/memic-utils"
}

const shelter_id_pattern = /shelter\.id\/([^?]+)/;
const memic_at_pattern = /memic\.at\/([^?]+)/;

var isBoard = '';
var currentUrl = location.href;
var personalId = getPersonalId();
var article_per_page = await addonStorage.get('article-per-page', 100);
var max_pages = await addonStorage.get('max-pages', 10);
/** @type {HTMLDivElement} */
var container = null, 
    currentPage = Number(sessionStorage.getItem('current-page') || 0),
    currentPageGroup = Number(sessionStorage.getItem('current-page-group') || 1),
    /** @type {ArticleInfo[]} */
    articleList = [], 
    scrollPosition = 0;

if (isNaN(currentPage) || currentPage < 0) {
    currentPage = 0;
}
if (isNaN(currentPageGroup) || currentPageGroup < 1) {
    currentPageGroup = 1;
}

addStyle();

function addStyle() {
    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://mu.magyul.kr/style/pagination.css',
        onload: function(response) {
            if (response.status === 200) {
                const style = document.createElement('style');
                style.textContent = response.responseText;
                document.head.appendChild(style);
                logger.log('스타일이 성공적으로 추가되었습니다.');
            } else {
                console.error('스타일을 불러오는 데 실패했습니다:', response.statusText);
            }
        },
    });
}

function updateData() {
    sessionStorage.setItem('current-page', currentPage);
    sessionStorage.setItem('current-page-group', currentPageGroup);
}

function getPersonalId(url = currentUrl) {
    let match = url.match(shelter_id_pattern);
    if (match) {
        return match[1];
    }
    match = url.match(memic_at_pattern);
    if (match) {
        return match[1];
    }
    return null;
}

async function getShelterId(pId = personalId) {
    if (pId === 'articles') return null;
    if (!isNaN(Number(pId))) return null;
    try {
        const info = await memicUtils.api.personal.getShelter(pId);
        return info.id;
    } catch (error) {
        return null;
    }
}

// boardId parameter check in url
function hasBoardIdInUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('boardId');
}

function getBoardIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('boardId');
}

// page script activation check
function shouldRunPagination() {
    return !hasBoardIdInUrl();
}


// Organize all Page script related elements
function cleanupPagination() {
    logger.log('페이지네이션 정리 시작');

    // page bar delete
    clearPaginationBars();

    // delete class related w.page in container
    if (container) {
        container.classList.remove('app-shelter-board-paging-star-inserted');

        // Remove user script-generated elements
        container.querySelectorAll('[data-userscript-generated="true"]').forEach(el => el.remove());
    }

    // delete custom style
    document.querySelectorAll('style').forEach(style => {
        if (style.textContent.includes('app-shelter-board-paging-star-inserted')) {
            style.remove();
        }
    });

    // initialize script state
    container = null;
    currentPage = 0;
    articleList = [];
    updateData();

    logger.log('페이지네이션 정리 완료');
}

// restoreoriginalpage (one time)
function restoreOriginalPage() {
    cleanupPagination();
    location.reload();
}

async function fetchArticles(offsetId = null) {
    logger.error(new Error());
    try {
        let page;
        if (hasBoardIdInUrl()) {
            const boardId = getBoardIdFromUrl();
            page = await memicUtils.api.articles.getListByBoard(
                boardId,
                false,
                article_per_page,
                offsetId
            );
        } else {
            const shelterId = await getShelterId();
            if (shelterId === null) return [];
            page = await memicUtils.api.articles.getList(
                shelterId,
                false,
                article_per_page,
                offsetId
            );
        }
        return page.list || [];
    } catch (error) {
        logger.error('게시글을 가져오는 데 실패했습니다.', error);
        return [];
    }
}

function isArticleToday(article) {
    if (!article.createDate) return false;
    const today = new Date();
    const articleDate = new Date(article.createDate);

    const betweenTime = Math.floor((today.getTime() - articleDate.getTime()) / 1000 / 60);
    if (betweenTime < 1) return true; // 방금 전
    if (betweenTime < 60) return true; // 분 전

    const betweenTimeHour = Math.floor(betweenTime / 60);
    if (betweenTimeHour < 24) return true; // 시간 전

    return false; // 하루 이상 전
}

function calcTime(date) {
    const today = new Date();
    const timeValue = new Date(date);

    const betweenTime = Math.floor((today.getTime() - timeValue.getTime()) / 1000 / 60);
    if (betweenTime < 1) return '방금 전';
    if (betweenTime < 60) {
        return `${betweenTime}분 전`;
    }

    const betweenTimeHour = Math.floor(betweenTime / 60);
    if (betweenTimeHour < 24) {
        return `${betweenTimeHour}시간 전`;
    }

    const betweenTimeDay = Math.floor(betweenTime / 60 / 24);
    if (betweenTimeDay < 365) {
        if (betweenTimeDay === 1) {
            return '어제';
        }
        if (betweenTimeDay === 2) {
            return '그저께';
        }
        return `${betweenTimeDay}일 전`;
    }

    return `${Math.floor(betweenTimeDay / 365)}년 전`;
}

/**
 * @param {HTMLDivElement} container 
 * @param {ArticleInfo[]} articles 
 */
function renderArticles(container, articles) {
    articleList = articles;
    container.innerHTML = ''; // Clear existing articles

    articles.forEach(async article => {
        const boardName = article.board?.name;
        const headerText = boardName || 'N/A';
        const headerColor = article.board?.color || '#90A4AE';
        const created = article.createDate ? calcTime(article.createDate) : 'N/A';

        const viewed = await addonStorage.get(`viewed-${article.id}`, null);
        const isRead = !!viewed;

        const elem = document.createElement('app-article-list-item');
        elem.setAttribute('itemscope', '');
        elem.setAttribute('itemtype', 'https://schema.org/Article');
        elem.className = 'grid grid-cols-subgrid col-[1/-1] ng-star-inserted';
        elem.setAttribute('data-userscript-generated', 'true');

        elem.innerHTML = `
        <a class="border-b-on-background-variant2 col-[1/-1] grid grid-cols-subgrid border-b ${isRead ? 'opacity-60' : ''}" href="/articles/${article.id}">
            <div class="article-list-item-container col-[1/-1] grid size-full grid-cols-subgrid py-4">
                <div class="areaTitle flex w-full items-center truncate">
                    <span class="text-on-surface-variant bg-surface typo-body-sm mr-2 flex items-center rounded-sm px-1.5 py-0.5 whitespace-nowrap ng-star-inserted" style="color: ${headerColor}">${headerText}</span>
                    <span itemprop="name" class="text-on-surface mr-1 truncate typo-body-md ng-star-inserted">${article.title}</span>
                    <span itemprop="commentCount" class="typo-label-sm text-primary mr-2 ng-star-inserted" content="${article.commentCount}"> [${article.commentCount}] </span>
                    ${isArticleToday(article) ? `
                    <app-new-icon class="items-center justify-center mr-1 inline-flex ng-star-inserted">
                        <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14" class="block">
                            <rect width="14" height="14" rx="4" class="fill-primary dark:fill-secondary"></rect>
                            <path d="M4 4H5.53268L8.42224 7.67105V4H10V10H8.46732L5.57776 6.32895V10H4V4Z" class="dark:fill-surface-variant fill-white"></path>
                        </svg>
                    </app-new-icon>` : ``}
                    ${article.isHaveImage ? `  
                    <i class="ri-image-2-fill icon-md text-on-surface-variant2 mr-1 min-w-4 ng-star-inserted"></i>` : ''}
                    ${article.isHaveVideo ? `
                    <i class="ri-video-chat-fill icon-md text-on-surface-variant2 mr-1 min-w-4 ng-star-inserted"></i>` : ''}
                </div>
                <div class="areaOwner flex items-center truncate leading-none cursor-pointer ng-star-inserted">
                    <app-user-thumbnail size="xxs" class="inline-flex items-center mr-1">
                        <div class="relative flex items-center justify-center">
                            <div class="profile-circle min-size-4.5 size-4.5 border-1 p-0.25">
                                <img alt="userThumbnail" itemprop="image" width="18" height="18" loading="lazy" fetchpriority="auto" ng-img="true" src="${article.owner.image?.url || 'https://cdn.memic.at/assets/defaultProfile.avif'}" class="ng-star-inserted">
                            </div>
                        </div>
                    </app-user-thumbnail>
                    <span class="typo-body-sm dd:typo-body-md ownerName mr-0.5 truncate">${article.owner.name}</span>
                </div>
                <div itemprop="interactionStatistic" itemscope="" itemtype="https://schema.org/InteractionCounter" class="areaViewCount flex items-center gap-1 ng-star-inserted">
                    <meta itemprop="interactionType" content="https://schema.org/WatchAction">
                    <i class="ri-eye-line icon-md text-on-surface-variant2 min-size-4"></i>
                    <span itemprop="userInteractionCount" class="typo-body-sm dd:typo-body-md text-on-surface-variant" content="${article.viewCount}">${article.viewCount}</span>
                </div>
                <div itemprop="interactionStatistic" itemscope="" itemtype="https://schema.org/InteractionCounter" class="areaLikeCount flex items-center gap-1 ng-star-inserted">
                    <meta itemprop="interactionType" content="https://schema.org/LikeAction">
                    <i class="ri-thumb-up-line icon-md text-on-surface-variant2 min-size-4 -translate-y-px"></i>
                    <span itemprop="userInteractionCount" class="typo-body-sm dd:typo-body-md text-on-surface-variant" content="${article.likeCount}">${article.likeCount}</span>
                </div>
                <time itemprop="dateCreated" class="areaDate typo-body-sm dd:typo-body-md text-on-surface-variant flex items-center justify-end leading-none whitespace-nowrap ng-star-inserted fixed-time-format" datetime="${article.createDate}">${created}</time>
            </div>
        </a>
        `;

        const a = elem.querySelector('& > a');
        a.addEventListener('click', (e) => {
            e.preventDefault();
            addonStorage.set(`viewed-${article.id}`, Date.now());

            a.classList.add('opacity-60');

            scrollPosition = window.scrollY;
            sessionStorage.setItem('pagination-last-page', currentPage);
            sessionStorage.setItem('pagination-last-scroll', scrollPosition);

            history.pushState(null, '', a.href);
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        container.appendChild(elem);
    });
}

/**
 * 페이지를 순차적으로 로드합니다.
 * @param {number} idx 
 * @returns {Promise<ArticleInfo[]>}
 */
async function loadPagesSequentially(idx) {
    logger.error(new Error());
    let last = null, res = [];
    for (let i = 0; i <= idx; i++) {
        const page = await fetchArticles(last);
        if (!page.length) break;
        res = page;
        last = page.at(-1).id;
    }
    return res;
}

function clearPaginationBars() {
    const paginationBars = document.querySelectorAll('.userscript-pagination');
    paginationBars.forEach(bar => bar.remove());
}

function clearArticles(c) {
    c.querySelectorAll('app-article-list-item, div[data-userscript-generated]').forEach(item => {
        if (item.querySelector('.ri-megaphone-fill')) return; // Skip if it's a notification item
        item.remove();
    });
}

function cloneBarEvents(bar, clone) {
    clone.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') {
            bar.querySelector(`#${e.target.id}`)?.click(); // Trigger the same button click on the original bar
        }
    });
}

function createPaginationBar() {
    const bar = document.createElement('div');
    bar.setAttribute('data-userscript-generated', 'true');
    bar.classList.add('userscript-pagination');

    let btn, prevBtn, nextBtn;

    prevBtn = document.createElement('button');
    prevBtn.textContent = '←';
    prevBtn.disabled = currentPageGroup === 1; // Disable if already at the first group
    prevBtn.id = 'prev-page-btn';
    prevBtn.dataset.page = 'prev';
    bar.appendChild(prevBtn);

    for (let i = 0; i < max_pages; i++) {
        btn = document.createElement('button');
        btn.id = "page-btn-" + i;
        btn.classList.add('page-btn');
        if (currentPageGroup > 1) {
            i = (currentPageGroup - 1) * max_pages + i;
        }
        btn.textContent = i + 1;
        btn.dataset.page = i;
        if (i === currentPage) {
            btn.classList.add('active');
        }
        bar.appendChild(btn);
    }

    nextBtn = document.createElement('button');
    nextBtn.textContent = '→';
    nextBtn.dataset.page = 'next';
    nextBtn.id = 'next-page-btn';
    bar.appendChild(nextBtn);

    bar.addEventListener('click', async e => {
        if (e.target.tagName === 'BUTTON') {
            if (e.target.classList.contains('active')) return; // Ignore if already active
            const pageS = e.target.dataset.page;
            if (pageS === 'prev') {
                if (currentPageGroup == 1) {
                    prevBtn.disabled = true; // Disable if already at the first group
                } else {
                    currentPageGroup--;
                }
            } else if (pageS === 'next') {
                prevBtn.disabled = false; // Enable previous button
                currentPageGroup++;
            }
            let idx = parseInt(pageS);
            if (isNaN(idx)) {
                for (let i = 0; i < max_pages; i++) {
                    const btn = bar.querySelector(`#page-btn-${i}`);
                    if (btn) {
                        btn.textContent = ((currentPageGroup - 1) * max_pages + i) + 1;
                        btn.dataset.page = (currentPageGroup - 1) * max_pages + i;
                    }
                }
                idx = (currentPageGroup - 1) * max_pages; // Reset to the first page of the current group
                if (container.parentElement) {
                    container.parentElement.querySelector('#clone-pagination-bar')?.remove(); // Remove cloned pagination bar if exists
                    const clone = bar.cloneNode(true);
                    clone.id = 'clone-pagination-bar';
                    cloneBarEvents(bar, clone);
                    container.parentElement.appendChild(clone);
                }
            }
            currentPage = idx;
            const items = await loadPagesSequentially(idx);
            if (items.length === 0) return;
            if (currentPageGroup * max_pages >= items.length) {
                nextBtn.disabled = true; // Disable if no more pages
            } else {
                nextBtn.disabled = false;
            }
            clearArticles(container);
            renderArticles(container, items);
            syncPaginationBars();
            updateData();
        }
    });
    return bar;
}

function syncPaginationBars() {
    document.querySelectorAll('.userscript-pagination').forEach(bar => {
        bar.querySelectorAll('button').forEach((btn) => {
            const pageS = btn.dataset.page;
            const idx = parseInt(pageS);
            if (isNaN(idx)) return; // Skip if not a valid page number
            btn.classList.toggle('active', idx === currentPage);
        });
    });
}

async function findContainer(retryCount = 0) {
    const container = document.querySelector('app-shelter-board-page > app-pull-to-refresh div.article-list-container');
    if (container) {
        return container;
    } else if (retryCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return findContainer(retryCount + 1);
    } else {
        logger.error('컨테이너를 찾을 수 없습니다.');
        return null;
    }

}

async function clearReadHistory() {
    const keys = await addonStorage.keys();
    keys.forEach(key => {
        if (key.startsWith('viewed-')) {
            addonStorage.remove(key);
        }
    });
    location.reload();
}

function markAllAsRead() {
    articleList.forEach(article => {
        const key = `viewed-${article.id}`;
        addonStorage.set(key, Date.now());
    });
    location.reload();
}

/**
 * @param {PopStateEvent} e 
 * @returns 
 */
async function onpopstate(e) {
    if (!container) return;

    const savedPage = sessionStorage.getItem('pagination-last-page');
    const savedScroll = sessionStorage.getItem('pagination-last-scroll');

    if (savedPage) {
        const sPage = parseInt(savedPage);
        if (sPage == currentPage) return;
        currentPage = sPage;
        const list = await loadPagesSequentially(currentPage);
        if (list.length === 0) return; // No articles to render
        clearArticles(container);
        renderArticles(container, list);
        updateData();

        clearPaginationBars();
        const bar = createPaginationBar();

        if (container.parentElement) {
            container.parentElement.insertBefore(bar, container);
            let clone = bar.cloneNode(true);
            clone.id = 'clone-pagination-bar';
            cloneBarEvents(bar, clone);
            container.parentElement.appendChild(clone);
        }

        if (savedScroll) {
            setTimeout(() => {
                window.scrollTo(0, parseInt(savedScroll));
            }, 100);
        }
    }
}

/**
 * @param {KeyboardEvent} e 
 */
function onkeydown(e) {
    // Ctrl + R: Initialize read status
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        if (confirm('모든 읽음 상태를 초기화하시겠습니까?')) {
            clearReadHistory();
        }
    }

    // Ctrl + M: Mark all posts as read
    if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        if (confirm('현재 페이지의 모든 게시글을 읽음으로 표시하시겠습니까?')) {
            markAllAsRead();
        }
    }
}

/**
 * * 페이지가 로드되었을 때 호출되는 이벤트 핸들러
 * * 페이지가 캐시에서 복원되었을 때도 호출됩니다.
 * @param {PageTransitionEvent} e 
 */
function onpageshow(e) {
    if (e.persisted) {
        // 페이지가 캐시에서 복원된 경우 애드온 재시작
        ondisable();
        onenable();
    }
}

const removeOriginal = new MutationObserver(muts => {
    if (currentUrl !== location.href) {
        // 현재 URL이 변경되었으므로 personalId와 currentUrl을 업데이트
        const pId = getPersonalId(location.href);
        getShelterId(pId).then(sId => {
            if (sId) {
                personalId = pId;
                currentUrl = location.href;
            }
        });
    }
    if (hasBoardIdInUrl()) {
        const currentBoardId = getBoardIdFromUrl();
        if (isBoard != currentBoardId) {
            isBoard = currentBoardId;
            currentPage = 0;
            currentPageGroup = 1;
            updateData();
            document.querySelectorAll('div.data-userscript-generated > .page-btn').forEach(btn => {
                btn.textContent = btn.id.replace('page-btn-', '');
                btn.classList.remove('active');
            });
            document.querySelectorAll('#page-btn-0').forEach(btn => {
                btn.classList.add('active');
            });
            loadPagesSequentially(currentPage).then(list => {
                if (list.length === 0) return; // No articles to render
                clearArticles(container);
                renderArticles(container, list);
            });
        }
        return;
    } else if (isBoard) {
        isBoard = '';
        currentPage = 0;
        currentPageGroup = 1;
        updateData();
        document.querySelectorAll('div.data-userscript-generated > .page-btn').forEach(btn => {
            btn.textContent = btn.id.replace('page-btn-', '');
            btn.classList.remove('active');
        });
        document.querySelectorAll('#page-btn-0').forEach(btn => {
            btn.classList.add('active');
        });
        loadPagesSequentially(currentPage).then(list => {
            if (list.length === 0) return; // No articles to render
            clearArticles(container);
            renderArticles(container, list);
        });
    }

    muts.forEach(m => {
        if (m.addedNodes.length && container) {
            // Remove only the original post elements (except those created by the user script)
            const originalPosts = container.querySelectorAll('app-article-list-item:not([data-userscript-generated])');
            originalPosts.forEach(el => {
                if (el.querySelector('.ri-megaphone-fill')) return; // Skip if it's a notification item
                el.remove();
            });
        }
    });
});

/**
 * @param {HTMLDivElement} modalBody 
 */
function openSettings(modalBody) {
    const settingsHtml = `
        <div class="settings-container" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="setting-item" style="display: flex; flex-direction: row; gap: 8px; align-items: center;">
                <label for="article-per-page">
                    페이지당 게시글 수:
                    <input type="number" id="article-per-page" class="border rounded-sm ml-1" value="${article_per_page}" min="1" max="100">
                </label>
                <button class="reset-button" id="reset-article-per-page" class="flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap border border-on-surface-variant2 text-on-surface">초기화</button>
            </div>
            <div class="setting-item" style="display: flex; flex-direction: row; gap: 8px; align-items: center;">
                <label for="max-pages">
                    최대 페이지 수:
                    <input type="number" id="max-pages" class="border rounded-sm ml-1" value="${max_pages}" min="1" max="10">
                </label>
                <button class="reset-button" id="reset-max-pages" class="flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap border border-on-surface-variant2 text-on-surface">초기화</button>
            </div>
        </div>
    `;

    modalBody.innerHTML = settingsHtml;

    /** @type {HTMLInputElement} */
    const articlePerPageInput = modalBody.querySelector('#article-per-page');
    articlePerPageInput.addEventListener('change', () => {
        let value = parseInt(articlePerPageInput.value);
        if (isNaN(value)) {
            if (value < articlePerPageInput.min) {
                value = articlePerPageInput.min; // 최소값 1
            } else if (value > articlePerPageInput.max) {
                value = articlePerPageInput.max; // 최대값 100
            }
        }
        articlePerPageInput.value = value;
    });
    articlePerPageInput.addEventListener('wheel', (e) => {
        e.preventDefault();
        let value = parseInt(articlePerPageInput.value);
        if (e.deltaY < 0) {
            articlePerPageInput.value = Math.min(value + 1, 100);
        } else {
            articlePerPageInput.value = Math.max(value - 1, 1);
        }
        articlePerPageInput.dispatchEvent(new Event('change')); // Trigger change event
    });

    /** @type {HTMLInputElement} */
    const maxPagesInput = modalBody.querySelector('#max-pages');
    maxPagesInput.addEventListener('change', () => {
        let value = parseInt(maxPagesInput.value);
        if (isNaN(value)) {
            if (value < maxPagesInput.min) {
                value = maxPagesInput.min; // 최소값 1
            } else if (value > maxPagesInput.max) {
                value = maxPagesInput.max; // 최대값 10
            }
        }
        maxPagesInput.value = value;
    });
    maxPagesInput.addEventListener('wheel', (e) => {
        e.preventDefault();
        let value = parseInt(maxPagesInput.value);
        if (e.deltaY < 0) {
            maxPagesInput.value = Math.min(value + 1, 10);
        } else {
            maxPagesInput.value = Math.max(value - 1, 1);
        }
        maxPagesInput.dispatchEvent(new Event('change')); // Trigger change event
    });

    const resetArticlePerPageBtn = modalBody.querySelector('#reset-article-per-page');
    resetArticlePerPageBtn.className = 'flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap border border-on-surface-variant2 text-on-surface';
    resetArticlePerPageBtn.addEventListener('click', () => {
        const defaultArticlePerPage = 100;
        modalBody.querySelector('#article-per-page').value = defaultArticlePerPage;
        logger.log(`페이지당 게시글 수가 ${defaultArticlePerPage}로 초기화되었습니다.`);
    });

    const resetMaxPagesBtn = modalBody.querySelector('#reset-max-pages');
    resetMaxPagesBtn.className = 'flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap border border-on-surface-variant2 text-on-surface';
    resetMaxPagesBtn.addEventListener('click', () => {
        const defaultMaxPages = 10;
        modalBody.querySelector('#max-pages').value = defaultMaxPages;
        logger.log(`최대 페이지 수가 ${defaultMaxPages}로 초기화되었습니다.`);
    });

    return () => {
        const newArticlePerPage = parseInt(modalBody.querySelector('#article-per-page').value);
        const newMaxPages = parseInt(modalBody.querySelector('#max-pages').value);

        if (!isNaN(newArticlePerPage) && !isNaN(newMaxPages)) {
            article_per_page = newArticlePerPage;
            max_pages = newMaxPages;

            addonStorage.set('article-per-page', article_per_page);
            addonStorage.set('max-pages', max_pages);

            // 변경 사항 적용을 위해 애드온 재활성화
            ondisable();
            onenable();
        }
    };
}

async function onenable() {
    container = await findContainer();
    if (!container) {
        logger.error('컨테이너를 찾을 수 없습니다. 페이지네이션을 활성화할 수 없습니다.');
        memicUtils.disableAddon(addonKey);
        return;
    }

    const list = await loadPagesSequentially(currentPage);
    if (list.length > 0) {
        clearArticles(container);
        renderArticles(container, list);
    }

    clearPaginationBars();
    const bar = createPaginationBar();

    if (container.parentElement) {
        container.parentElement.insertBefore(bar, container);
        let clone = bar.cloneNode(true);
        clone.id = 'clone-pagination-bar';
        cloneBarEvents(bar, clone);
        container.parentElement.appendChild(clone);
    }

    removeOriginal.observe(document.body, { childList: true, subtree: true });

    const savedScroll = sessionStorage.getItem('pagination-last-scroll');
    if (savedScroll) {
        setTimeout(() => {
            window.scrollTo(0, parseInt(savedScroll));
        }, 100);
    }

    window.addEventListener('popstate', onpopstate);
    document.addEventListener('keydown', onkeydown);
    window.addEventListener('pageshow', onpageshow);
}

function ondisable() {
    clearPaginationBars();
    removeOriginal.disconnect();
    window.removeEventListener('popstate', onpopstate);
    document.removeEventListener('keydown', onkeydown);
    window.removeEventListener('pageshow', onpageshow);

    restoreOriginalPage();
}