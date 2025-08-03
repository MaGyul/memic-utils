const addonInfo = {
    name: "미밐 글 썸네일 미리보기",
    description: "미밐 글의 썸네일을 마우스 오버시 미리보기로 표시합니다.",
    author: "isnoa",
    version: "1.0.0",
    link: "https://github.com/isnoa/memic-utils"
}

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
        width: "120px",
        height: "120px",
        objectFit: "cover",
        borderRadius: "5px",
    });

    Object.assign(thumbItem.style, {
        position: "absolute",
        width: "130px",
        height: "130px",
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