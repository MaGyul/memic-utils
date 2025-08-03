const addonInfo = {
    name: "미밐 글 썸네일 미리보기",
    description: "미밐 글의 썸네일을 마우스 오버시 미리보기로 표시합니다.",
    author: "raws6633",
    version: "1.0.0",
    link: "https://github.com/isnoa/memic-utils"
}

var imgSize = await addonStorage.get("img-size", 120);

const processedItems = new WeakSet();
const thumbnailCache = new Map();

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

function createThumbnailElement(thumbnailUrl) {
    const thumbItem = document.createElement("div");
    thumbItem.id = "memic-thumbnail-preview";

    const img = document.createElement("img");

    img.src = thumbnailUrl;
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
    return thumbItem;
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
        let thumbnailUrl = thumbnailCache.get(id);

        if (!thumbnailUrl) {
            const data = await memicUtils.api.articles.get(id);

            thumbnailUrl = extractThumbnailUrl(data.content);

            if (thumbnailUrl) {
                thumbnailCache.set(id, thumbnailUrl);
            } else {
                return;
            }
        }

        const thumbItem = createThumbnailElement(thumbnailUrl);
        item.appendChild(thumbItem);
        item.style.position = "relative";

        let isHovered = false;

        item.addEventListener("mouseenter", () => {
            if (!isHovered) {
                isHovered = true;
                thumbItem.style.display = "flex";
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

function openSettings(modalBody) {
    const settingsContainer = document.createElement("div");
    settingsContainer.className = "settings-container";
    settingsContainer.style.display = "flex";
    settingsContainer.style.flexDirection = "row";
    settingsContainer.style.alignItems = "center";
    settingsContainer.style.gap = "8px";

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

    settingsContainer.appendChild(sizeLabel);
    settingsContainer.appendChild(sizeInput);
    settingsContainer.appendChild(resetButton);
    modalBody.appendChild(settingsContainer);

    return () => {
        imgSize = parseInt(sizeInput.value, 10);
        addonStorage.set("img-size", imgSize);
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