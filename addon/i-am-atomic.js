const addonInfo = {
    name: "I AM ATOMIC",
    description: "I AM ATOMIC 게시글을 찾거나 만듭니다.",
    author: "MaGyul",
    version: "1.0.0",
    link: "https://github.com/MaGyul/memic-utils",
}

const defaultAtomicTemplate = {
    title: "-----------------------",
    content: "I AM ATOMIC",
};

const atomicTemplate = {...defaultAtomicTemplate};
var findMaxPage = 10;

const shelter_id_pattern = /shelter\.id\/([^?]+)/;
const memic_at_pattern = /memic\.at\/([^?]+)/;

/** @type {HTMLDivElement} 게시글 컨테이너 */
let container = null;
/** @type {HTMLDivElement} 게시글 전체 */
let h_full = null;
/** @type {HTMLDivElement} 게시글 버튼들 */
let articleButtons = null;
/** @type {HTMLButtonElement} I AM ATOMIC 버튼 */
let i_am_atomicButton = null;
/** @type {HTMLDivElement} 게시글 찾는 중... 패널 */
let findingPanel;

addonStorage.get("atomic-template", atomicTemplate).then((template) => {
    if (template) {
        atomicTemplate.title = template.title || defaultAtomicTemplate.title;
        atomicTemplate.content = template.content || defaultAtomicTemplate.content;
    }
});
addonStorage.get("find-max-page", findMaxPage).then((maxPage) => {
    if (maxPage) {
        findMaxPage = maxPage;
    }
});

function isAllDashes(str) {
    return /^-*$/.test(str);
}

function clickRefreshButton() {
    const url = window.location.href;
    const validUrl =
        url.includes("memic.at") || (url.includes("shelter.id") && url.includes("?type=community"));

    if (!validUrl || document.hidden) return;

    const btn =
        document.querySelector(
            "button.flex.items-center.justify-center.size-6.ng-star-inserted[style='']"
        ) ||
        document.querySelectorAll(
            "button.flex.items-center.justify-center.size-6.ng-star-inserted[style='']"
        )[0];

    if (btn) {
        btn.click();
    }
}

function getPersonalId(url = location.href) {
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

async function getShelterId(pId = getPersonalId()) {
    if (pId === 'articles') return null;
    if (!isNaN(Number(pId))) return null;
    try {
        const info = await memicUtils.api.personal.getShelter(pId);
        return info.id;
    } catch (error) {
        return null;
    }
}

function createFindingPanel() {
    const container = document.createElement("div");
    container.className = "flex items-center justify-center py-4 ng-star-inserted";
    container.style.display = "none";
    const content = document.createElement("div");
    content.className = "btn btn-tonal btn-lg w-1/2";
    content.textContent = "게시글 찾는 중...";
    container.appendChild(content);

    return container;
}

async function findArticleButtons(retryCount = 0) {
    const refreshBtn = document.querySelector('app-shelter-board-page div.flex > app-refresh-button');
    if (!refreshBtn) {
        if (retryCount < 10) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return findArticleButtons(retryCount + 1);
        }
        return null;
    }
    return refreshBtn.parentElement;
}

function cloneAndCreateIAA() {
    const selectArticleButton = articleButtons.querySelector('& > button') || articleButtons.lastChild;
    const iaaButton = document.createElement("button");
    iaaButton.type = "button";
    iaaButton.dataset.tooltip = "I AM ATOMIC";
    iaaButton.className = "bg-on-background-variant2 text-on-surface-variant dd:flex hidden items-center justify-center gap-1 rounded-lg px-2 py-1 whitespace-nowrap ng-star-inserted";
    iaaButton.innerHTML = '<i class="ri-tools-line icon-lg"></i><span class="typo-label-md">I AM ATOMIC</span>';
    iaaButton.id = "i-am-atomic-button";
    articleButtons.insertBefore(iaaButton, selectArticleButton);

    return iaaButton;
}

function onclickIAmAtomicButton() {
    const modalPanel = document.querySelector('#modal-panel');
    const modalBody = modalPanel.querySelector('#modal-body');
    modalBody.innerHTML = ""; // 기존 내용 제거

    const optionsContainer = document.createElement("div");
    optionsContainer.className = "flex flex-col gap-2";
    
    const findContainer = document.createElement("div");
    findContainer.dataset.tooltip = "I AM ATOMIC 게시글을 찾고 그 위치로 이동합니다.";
    const findLabel = document.createElement("label");
    findLabel.textContent = "I AM ATOMIC 게시글 찾기";
    findLabel.className = "ml-2";
    findLabel.setAttribute("for", "find-atomic");
    const findInput = document.createElement("input");
    findInput.type = "radio";
    findInput.checked = true; // 기본값으로 찾기 선택
    findInput.id = "find-atomic";
    findInput.addEventListener("change", () => {
        if (findInput.checked) {
            createInput.checked = false; // 찾기 선택 시 만들기 해제
        }
    });
    findContainer.appendChild(findInput);
    findContainer.appendChild(findLabel);

    const createContainer = document.createElement("div");
    createContainer.dataset.tooltip = "I AM ATOMIC 게시글을 만듭니다.\n게시글 제목과 내용은 설정에서 변경할 수 있습니다.";
    const createLabel = document.createElement("label");
    createLabel.textContent = "I AM ATOMIC 게시글 만들기";
    createLabel.className = "ml-2";
    createLabel.setAttribute("for", "create-atomic");
    const createInput = document.createElement("input");
    createInput.type = "radio";
    createInput.checked = false; // 기본값으로 만들기 해제
    createInput.id = "create-atomic";
    createInput.addEventListener("change", () => {
        if (createInput.checked) {
            findInput.checked = false; // 만들기 선택 시 찾기 해제
        }
    });
    createContainer.appendChild(createInput);
    createContainer.appendChild(createLabel);

    optionsContainer.appendChild(findContainer);
    optionsContainer.appendChild(createContainer);

    modalBody.appendChild(optionsContainer);

    modalPanel.querySelector('#modal-confirm').onclick = () => {
        const find = findInput.checked;
        const create = createInput.checked;

        if (find) {
            processIAA(true);
        } else if (create) {
            processIAA(false);
        }

        memicUtils.uiAddon.addonInfo.funcs.closeModal();
    };

    memicUtils.uiAddon.addonInfo.funcs.openModal('I AM ATOMIC 옵션');

}

/** @param {boolean} find */
async function processIAA(find) {
    if (find) {
        const ownerName = document.querySelector('h1.typo-title-sm').textContent.trim();
        if (memicUtils.enabledAddons.includes("pagination")) {
            // 페이지네이션이 활성화되어 있다면
            const funcs = memicUtils.addons["pagination"].addonInfo.funcs;
            funcs.clearArticles();
            funcs.reloadNotion(true, "게시글 찾는 중...");
            for (let i = 1; i <= findMaxPage; i++) {
                /** @type {ArticleInfo[]} */
                const articles = (await funcs.loadPagesSequentially(i));
                for (const article of articles) {
                    if (article.owner.name === ownerName && isAllDashes(article.title)) {
                        function findIt() {
                            // 게시글을 찾았으니 처리
                            funcs.reloadNotion(false);
                            funcs.setPage(i, articles);
                            setTimeout(() => {
                                const articleLink = container.querySelector(`a[href="/articles/${article.id}"]`);
                                if (articleLink) {
                                    articleLink.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
                                }
                            }, 500); // 스크롤 이동을 위해 약간의 시간 지연
                        }
                        memicUtils.api.articles.get(article.id).then((data) => {
                            if (data.content.includes(atomicTemplate.content)) {
                                findIt();
                            }
                        }).catch((error) => {
                            logger.error("게시글을 찾는 중 오류가 발생했습니다:", error);
                            // 오류가 발생했으므로 내용 검사를 하지 않고 그냥 해당 게시글로 이동
                            findIt();
                        });
                        return;
                    }
                }
            }
        } else {
            // 페이지네이션이 비활성화되어 있다면
            const btn = container.parentElement.querySelector('div.flex > button');
            if (btn) {
                async function find(node) {
                    if (node.tagName !== "APP-ARTICLE-LIST-ITEM") return false; // 올바른 노드가 아니면 무시
                    const title = node.querySelector('span[itemprop="name"]');
                    const owner = node.querySelector('.areaOwner > span');
                    if (owner.textContent.trim() === ownerName && isAllDashes(title.textContent.trim())) {
                        observer.disconnect(); // 찾았으니 관찰 중지
                        const link = node.querySelector('a');
                        const href = link.getAttribute('href');
                        const id = href.split('/').pop(); // 게시글 ID 추출
                        function findIt() {
                            h_full.style.display = ""; // 전체 게시글 보이기
                            findingPanel.style.display = "none"; // 찾는 중 패널 숨기기
                            node.scrollIntoView({ behavior: "smooth", block: "center" }); // 해당 게시글로 스크롤 이동
                        }
                        try {
                        const article = await memicUtils.api.articles.get(id);
                        if (article.content.includes(atomicTemplate.content)) {
                            findIt();
                        }
                        } catch (error) {
                            logger.error("게시글을 찾는 중 오류가 발생했습니다:", error);
                            // 오류가 발생했으므로 내용 검사를 하지 않고 그냥 해당 게시글로 이동
                            findIt();
                        }
                        return true;
                    }
                    return false;
                }
                const observer = new MutationObserver(async (mutations) => {
                    for (const mutation of mutations) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                if (await find(node)) {
                                    return; // 게시글을 찾았으니 더 이상 관찰하지 않음
                                }
                            }
                        }
                    }
                    btn.click(); // 게시글을 못 찾았으니 더보기 버튼 클릭
                });
                h_full.style.display = "none"; // 전체 게시글 숨기기
                findingPanel.style.display = "flex"; // 찾는 중 패널 보이기
                for (const node of container.children) {
                    if (await find(node)) {
                        return; // 게시글을 찾았으니 더 이상 관찰하지 않음
                    }
                }
                observer.observe(h_full, { childList: true, subtree: true });
                btn.click(); // 게시글 더보기 버튼 클릭
            }
        }
    } else {
        try {
            const article = await createArticle();
            clickRefreshButton(); // 게시글을 만들었으니 새로고침 버튼 클릭
            history.pushState({}, "", `/articles/${article.id}`);
            window.dispatchEvent(new Event("popstate")); // 페이지 상태 변경 이벤트 발생
        } catch (error) {
            logger.error("I AM ATOMIC 게시글을 만드는 중 오류가 발생했습니다:", error);
            alert("I AM ATOMIC 게시글을 만들지 못했습니다.");
        }
    }
}

/**
 * I AM ATOMIC 게시글을 만듭니다.
 * @returns {Promise<ArticleInfo>}
 */
async function createArticle() {
    const shelterId = await getShelterId();
    if (!shelterId) {
        logger.error("I AM ATOMIC 게시글을 만들기 위해서는 개인 페이지가 필요합니다.");
        return Promise.reject(new Error("개인 페이지가 필요합니다."));
    }
    if (memicUtils.api.articles.create) {
        return memicUtils.api.articles.create(shelterId, atomicTemplate.title, `<p>${atomicTemplate.content}</p>`, false)
    } else {
        const token = memicUtils.api.getAuthToken();
        const body = {
            title: atomicTemplate.title,
            content: `<p>${atomicTemplate.content}</p>`,
            isHaveImage: false,
            isHaveVideo: false,
            isNotice: false,
            isOnlyAdult: false,
            isSecret: false,
            thumbnail: null,
            images: [],
            mentionList: []
        };
        const r = await fetch(`https://rest.memic.at/v2/shelters/${shelterId}/articles`, {
            "headers": {
                "accept": "application/json",
                "authorization": `Bearer ${token}`,
                "content-type": "application/json",
            },
            "body": JSON.stringify(body),
            "method": "POST"
        });
        return await r.json();
    }
}

const observer = new MutationObserver(() => {
    if (!document.body.contains(findingPanel)) {
        memicUtils.addons["pagination"].addonInfo.funcs.findContainer().then((c) => {
            if (c) {
                container = c;
                h_full = container.parentElement;
                if (!h_full.parentElement.contains(findingPanel)) {
                    h_full.parentElement.appendChild(findingPanel);
                }
            }
        });
    }
    if (!document.body.contains(i_am_atomicButton)) {
        findArticleButtons().then((buttons) => {
            if (buttons) {
                articleButtons = buttons;
                if (!articleButtons.contains(i_am_atomicButton)) {
                    try {
                        i_am_atomicButton.remove(); // 기존 버튼 제거
                    } catch {}
                    i_am_atomicButton = cloneAndCreateIAA();
                    i_am_atomicButton.addEventListener("click", onclickIAmAtomicButton)
                }
            }
        });
    }
});

function openSettings(modalBody) {
    const settingsContainer = document.createElement("div");
    settingsContainer.className = "settings-container";
    settingsContainer.className = "flex flex-col gap-4";
    const articleSettings = document.createElement("div");
    articleSettings.className = "flex flex-col gap-2";
    const titleLabel = document.createElement("label");
    titleLabel.textContent = "제목:";
    const titleInput = document.createElement("input");
    titleInput.style.marginLeft = "8px";
    titleInput.classList.add('border');
    titleInput.type = "text";
    titleInput.value = atomicTemplate.title;
    const titleContainer = document.createElement("div");
    titleContainer.style.display = "flex";
    titleContainer.style.flexDirection = "row";
    titleContainer.style.alignItems = "center";
    titleContainer.style.gap = "8px";
    titleContainer.appendChild(titleLabel);
    titleContainer.appendChild(titleInput);

    const contentLabel = document.createElement("label");
    contentLabel.textContent = "내용:";
    const contentInput = document.createElement("textarea");
    contentInput.style.marginLeft = "8px";
    contentInput.classList.add('border');
    contentInput.value = atomicTemplate.content;
    const contentContainer = document.createElement("div");
    contentContainer.style.display = "flex";
    contentContainer.style.flexDirection = "row";
    contentContainer.style.alignItems = "center";
    contentContainer.style.gap = "8px";
    contentContainer.appendChild(contentLabel);
    contentContainer.appendChild(contentInput);

    const resetButton = document.createElement("button");
    resetButton.className = 'flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap border border-on-surface-variant2 text-on-surface';
    resetButton.style.marginLeft = "8px";
    resetButton.textContent = '초기화';
    resetButton.addEventListener("click", async () => {
        titleInput.value = defaultAtomicTemplate.title;
        contentInput.value = defaultAtomicTemplate.content;
    });
    articleSettings.appendChild(titleContainer);
    articleSettings.appendChild(contentContainer);
    articleSettings.appendChild(resetButton);

    settingsContainer.appendChild(articleSettings);

    if (memicUtils.enabledAddons.includes("pagination")) {
        const findMaxPageContainer = document.createElement("div");
        findMaxPageContainer.className = "flex flex-col gap-2";
        findMaxPageContainer.dataset.tooltip = "I AM ATOMIC 게시글을 찾을 때 최대 페이지를 설정합니다.\n기본값은 10페이지입니다.";
        const findMaxPageLabel = document.createElement("label");
        findMaxPageLabel.textContent = "최대 페이지 찾기:";
        const findMaxPageInput = document.createElement("input");
        findMaxPageInput.style.marginLeft = "8px";
        findMaxPageInput.classList.add('border');
        findMaxPageInput.type = "number";
        findMaxPageInput.value = findMaxPage;
        findMaxPageInput.min = 1;
        findMaxPageInput.max = 30;
        findMaxPageInput.addEventListener("change", () => {
            let value = parseInt(findMaxPageInput.value, 10);
            value = Math.min(findMaxPageInput.max, Math.max(findMaxPageInput.min, value));
            findMaxPageInput.value = value;
        });
        findMaxPageInput.addEventListener("wheel", (event) => {
            event.preventDefault();
            findMaxPageInput.value = Math.min(findMaxPageInput.max, Math.max(findMaxPageInput.min, parseInt(findMaxPageInput.value, 10) + (event.deltaY < 0 ? 1 : -1)));
        });
        findMaxPageContainer.appendChild(findMaxPageLabel);
        findMaxPageContainer.appendChild(findMaxPageInput);

        settingsContainer.appendChild(findMaxPageContainer);
    }

    modalBody.appendChild(settingsContainer);

    return () => {
        atomicTemplate.title = titleInput.value;
        atomicTemplate.content = contentInput.value;
        addonStorage.set("atomic-template", atomicTemplate);
    };
}

function onenable() {
    if (!findingPanel) {
        findingPanel = createFindingPanel();
    }
    memicUtils.addons["pagination"].addonInfo.funcs["findContainer"]().then((c) => {
        if (c) {
            container = c;
            h_full = container.parentElement;
            h_full.parentElement.appendChild(findingPanel);
        }
    });
    findArticleButtons().then((buttons) => {
        if (buttons) {
            articleButtons = buttons;
            i_am_atomicButton = cloneAndCreateIAA();
            i_am_atomicButton.addEventListener("click", onclickIAmAtomicButton)
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function ondisable() {
    if (findingPanel) {
        findingPanel.remove();
    }
    if (i_am_atomicButton) {
        i_am_atomicButton.remove();
    }
    observer.disconnect();
}