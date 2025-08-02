const addonInfo = {
    name: "미밐 불필요한 광고 요청 차단",
    description: "의미 없는 NO_CONTENT 응답 요청하는 API 하나 차단합니다.",
    author: "isnoa",
    version: "1.0.0",
    link: "https://github.com/isnoa/memic-advanced"
}

var enabled = false;
const BLOCK_URL = "https://rest.memic.at/v2/ads/display-board/random";
const originalFetch = window.fetch;

// XHR 차단
Object.defineProperty(unsafeWindow, "XMLHttpRequest", {
    value: class extends XMLHttpRequest {
        open(method, url) {
            if (enabled && url === BLOCK_URL) {
                this.readyState = 4;
                this.status = 204;
                setTimeout(() => this.onreadystatechange?.(), 0);
                return;
            }
            super.open(method, url);
        }
    },
});

// Fetch 차단
unsafeWindow.fetch = function (input, init) {
    if (!enabled) return originalFetch.call(this, input, init);
    const url = typeof input === "string" ? input : input.url;
    return url === BLOCK_URL
    ? Promise.resolve(new Response(null, { status: 204 }))
    : originalFetch.call(this, input, init);
};

function onenable() {
    enabled = true;
}

function ondisable() {
    enabled = false;
}