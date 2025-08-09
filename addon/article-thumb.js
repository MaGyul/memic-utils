const addonInfo = {
    name: "미밐 글 썸네일 미리보기",
    description: "미밐 글의 썸네일을 마우스 오버시 미리보기로 표시합니다.",
    author: "isnoa, raws6633",
    version: "1.0.1",
    link: "https://github.com/isnoa/memic-utils"
}

var imgSize = await addonStorage.get("img-size", 120);
var adult = await addonStorage.get("adult", true);
var spoiler = await addonStorage.get("spoiler", true);

const processedItems = new WeakSet();
const thumbnailCache = new Map();

addonStorage.get("thumbnail-cache").then((cache) => {
    if (cache) {
        try {
            const parsedCache = jsonToMap(cache);
            parsedCache.forEach((value, key) => {
                thumbnailCache.set(key, value);
            });
        } catch (e) {
            logger.error("썸네일 캐시를 불러오는 중 오류가 발생했습니다.", e);
        }
    }
});

// Map → JSON
function mapToJson(map) {
    return JSON.stringify(Array.from(map.entries()));
}

// JSON → Map
function jsonToMap(jsonStr) {
    return new Map(JSON.parse(jsonStr));
}

const observer = new MutationObserver((mutations) => {
    const newItems = [];

    for (const mutation of mutations) {
        if (mutation.type !== "childList") continue;

        for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            if (node.tagName === "APP-ARTICLE-LIST-ITEM") {
                newItems.push(node);
            } else {
                newItems.push(...node.querySelectorAll("app-article-list-item"));
            }
        }
    }

    newItems.filter((item) => !processedItems.has(item)).forEach(processArticleItem);
});

function extractThumbnailUrl(content) {
    if (!content) return null;

    const videoMatch = content.match(/<video[^>]+poster="([^"]+)"/i);
    if (videoMatch?.[1]) return videoMatch[1];

    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch?.[1]) return imgMatch[1];

    const carouselMatch = content.match(/data-media-list='(\[.*?\])'/);
    if (carouselMatch?.[1]) {
        try {
            const mediaList = JSON.parse(carouselMatch[1]);
            if (mediaList?.[0]?.url) return mediaList[0].url;
        } catch (e) {
            logger.error("썸네일을 불러올 수 없습니다.", e);
        }
    }

    const bgMatch = content.match(/background-image:\s*url\(&quot;([^&]+)&quot;\)/);
    return bgMatch?.[1] || null;
}

function createThumbnailElement() {
    const thumbItem = document.createElement("div");
    thumbItem.id = "memic-thumbnail-preview";

    const img = document.createElement("img");

    img.src = "#";
    img.alt = "이미지";
    img.loading = "lazy";

    Object.assign(img.style, {
        width: `${imgSize}px`,
        height: `${imgSize}px`,
        objectFit: "cover",
        borderRadius: "5px",
    });

    Object.assign(thumbItem.style, {
        position: "absolute",
        width: `${imgSize + 10}px`,
        height: `${imgSize + 10}px`,
        zIndex: "99999",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-background)",
        border: "1px solid var(--color-on-background-variant2)",
        borderRadius: "8px",
        top: "60px",
        pointerEvents: "none",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    });

    thumbItem.appendChild(img);
    return { thumbItem, img };
}

/**
 * @param {HTMLImageElement} img 
 * @param {string} id 
 * @returns 
 */
async function loadThumbnail(img, id) {
    let thumbnailUrl = thumbnailCache.get(id);
    let saveToCache = true;

    if (!thumbnailUrl) {
        const data = await memicUtils.api.articles.get(id);
        if (data.board.name === "후방주의" || data.isOnlyAdult === true) {
            saveToCache = false;
            if (adult) {
                thumbnailUrl = "https://mu.magyul.kr/assets/img/adult.avif";
            }
        }
        if (data.board.name === "스포/유출") {
            saveToCache = false;
            if (spoiler) {
                thumbnailUrl = "https://mu.magyul.kr/assets/img/spoiler-alert.png";
            }
        }
        if (!thumbnailUrl) {
            thumbnailUrl = extractThumbnailUrl(data.content);
        }
    }

    if (thumbnailUrl) {
        img.src = thumbnailUrl;
        if (saveToCache) {
            thumbnailCache.set(id, thumbnailUrl);
            addonStorage.set("thumbnail-cache", mapToJson(thumbnailCache));
        }
    }
}

async function processArticleItem(item) {
    if (processedItems.has(item)) return;
    processedItems.add(item);

    const link = item.querySelector("a");
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const id = href.split("/").pop();
    const thumb = item.querySelector(".ri-image-2-fill, .ri-video-chat-fill");
    if (!thumb) return;

    try {
        const { thumbItem, img } = createThumbnailElement();
        item.appendChild(thumbItem);
        item.style.position = "relative";

        let isHovered = false;

        item.addEventListener("mouseenter", () => {
            if (!isHovered) {
                isHovered = true;
                thumbItem.style.display = "flex";
                loadThumbnail(img, id);
            }
        });

        item.addEventListener("mouseleave", () => {
            if (isHovered) {
                isHovered = false;
                thumbItem.style.display = "none";
            }
        });
    } catch (error) {
        logger.error(`썸네일 로드에 실패하였습니다. ${id}`, error);
    }
}

function createSwitch(id, label, tooltip, initialValue) {
    // 메인 컨테이너 div 생성
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.marginTop = '8px';
    container.style.gap = '8px';
    container.setAttribute('data-tooltip', tooltip);

    // 라벨 span 생성
    const labelSpan = document.createElement('span');
    labelSpan.className = 'switch_label';
    labelSpan.textContent = label;

    // 스위치 래퍼 div 생성
    const switchWrapper = document.createElement('div');
    switchWrapper.className = 'switch-wrapper';

    // 체크박스 input 생성
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `${id}-switch`;
    input.className = 'switch_input';
    input.checked = initialValue;

    // 라벨 요소 생성
    const switch_label = document.createElement('label');
    switch_label.setAttribute('for', `${id}-switch`);
    switch_label.className = 'switch_label';

    // 라벨 내부 span 생성
    const onOffBtn = document.createElement('span');
    onOffBtn.className = 'onf_btn';

    // 요소들을 조립
    switch_label.appendChild(onOffBtn);
    switchWrapper.appendChild(input);
    switchWrapper.appendChild(switch_label);
    container.appendChild(labelSpan);
    container.appendChild(switchWrapper);

    return {input, container};
}

function openSettings(modalBody) {
    const settingsContainer = document.createElement("div");
    settingsContainer.className = 'flex flex-col gap-4';

    const sizeContainer = document.createElement("div");
    sizeContainer.className = 'size-container';
    sizeContainer.style.display = "flex";
    sizeContainer.style.flexDirection = "row";
    sizeContainer.style.alignItems = "center";
    sizeContainer.style.gap = "8px";

    const sizeLabel = document.createElement("label");
    sizeLabel.textContent = "썸네일 크기 (px):";
    const sizeInput = document.createElement("input");
    sizeInput.style.marginLeft = "8px";
    sizeInput.classList.add('border');
    sizeInput.type = "number";
    sizeInput.value = imgSize;
    sizeInput.min = 50;
    sizeInput.max = 300;

    sizeInput.addEventListener("change", () => {
        let value = parseInt(sizeInput.value, 10);
        value = Math.min(sizeInput.max, Math.max(sizeInput.min, value));
        sizeInput.value = value;
    });
    sizeInput.addEventListener("wheel", (event) => {
        event.preventDefault();
        sizeInput.value = Math.min(sizeInput.max, Math.max(sizeInput.min, parseInt(sizeInput.value, 10) + (event.deltaY < 0 ? 10 : -10)));
    });

    const resetButton = document.createElement("button");
    resetButton.className = 'flex items-center justify-center gap-1 rounded-full px-4 py-2 whitespace-nowrap border border-on-surface-variant2 text-on-surface';
    resetButton.style.marginLeft = "8px";
    resetButton.textContent = '초기화';
    resetButton.addEventListener("click", async () => {
        sizeInput.value = 120;
    });

    sizeContainer.appendChild(sizeLabel);
    sizeContainer.appendChild(sizeInput);
    sizeContainer.appendChild(resetButton);

    settingsContainer.appendChild(sizeContainer);

    const { input: adultSwitch, container: adultContainer } = createSwitch(
        "adult", "성인 콘텐츠", "성인 콘텐츠 미리보기를 가립니다.", adult
    );
    const { input: spoilerSwitch, container: spoilerContainer } = createSwitch(
        "spoiler", "스포일러 콘텐츠", "스포일러 콘텐츠 미리보기를 가립니다.", spoiler
    );

    settingsContainer.appendChild(adultContainer);
    settingsContainer.appendChild(spoilerContainer);

    modalBody.appendChild(settingsContainer);

    return () => {
        imgSize = parseInt(sizeInput.value, 10);
        addonStorage.set("img-size", imgSize);
        adult = adultSwitch.checked;
        addonStorage.set("adult", adult);
        spoiler = spoilerSwitch.checked;
        addonStorage.set("spoiler", spoiler);
        document.querySelectorAll("#memic-thumbnail-preview").forEach((preview) => {
            preview.style.width = `${imgSize + 10}px`;
            preview.style.height = `${imgSize + 10}px`;
            const img = preview.querySelector("img");
            if (img) {
                img.style.width = `${imgSize}px`;
                img.style.height = `${imgSize}px`;
            }
        });
    }
}

function onenable() {
    observer.observe(document.body, { childList: true, subtree: true });

    const articleItems = document.querySelectorAll("app-article-list-item");
    articleItems.forEach(processArticleItem);
}

function ondisable() {
    observer.disconnect();

    const articleItems = document.querySelectorAll("app-article-list-item");
    articleItems.forEach((item) => {
        processedItems.delete(item);
        const thumbItem = item.querySelector("#memic-thumbnail-preview");
        if (thumbItem) {
            thumbItem.remove();
        }
    });
}