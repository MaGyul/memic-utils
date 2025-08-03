(() => {
    function removeArray(arr) {
        var what, a = arguments, L = a.length, ax;
        while (L > 1 && arr.length) {
            what = a[--L];
            while ((ax = arr.indexOf(what)) !== -1) {
                arr.splice(ax, 1);
            }
        }
        return arr;
    }

    /**
     * @param {any[]} arr 
     * @param {*} by 
     * @returns 
     */
    function removeArrayBy(arr, by) {
        var ax;
        while ((ax = arr.findIndex(by)) !== -1) {
            arr.splice(ax, 1);
        }
        return arr;
    }

    function hasGlobalReturnWithBabel(code) {
        try {
            const ast = Babel.packages.parser.parse(code, {
                sourceType: 'module',
                allowImportExportEverywhere: true,
                allowReturnOutsideFunction: true
            });
            
            let hasGlobalReturn = false;
            
            Babel.packages.traverse.default(ast, {
                ReturnStatement(path) {
                    // 함수 부모가 없으면 전역 return
                    if (!path.getFunctionParent()) {
                        hasGlobalReturn = true;
                        path.stop(); // 더 이상 탐색하지 않음
                    }
                }
            });
            
            return hasGlobalReturn;
        } catch (error) {
            return null;
        }
    }

    /**
     * @returns {string[]} 
     */
    function getAddonList() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://mu.magyul.kr/addon/addons.json`,
                onload: function(response) {
                    if (response.status === 200) {
                        resolve(JSON.parse(response.responseText));
                    } else {
                        reject(new Error(`애드온 리스트 불러오기 실패 (네트워크 오류 ${response.status})`));
                    }
                }
            });
        });
    }

    /**
     * @param {string} name 
     * @returns {Promise<Addon>} 
     */
    function loadAddon(name) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://mu.magyul.kr/addon/${name}.js`,
                onload: async function(response) {
                    if (response.status === 200) {
                        if (hasGlobalReturnWithBabel(response.responseText)) {
                            reject(new Error(`애드온(${name}) 전역에 반환이 있습니다!`));
                        }
                        try {
                            const result = await eval(`(async (addonKey, logger, addonStorage) => {${response.responseText}\nif (typeof addonInfo !== "object") throw new Error("addonInfo이(가) 없거나 올바르지 않습니다."); else {if (typeof addonInfo.name !== "string") throw new Error("addonInfo.name이(가) 없거나 올바르지 않습니다.");if (typeof addonInfo.description !== "string") throw new Error("addonInfo.description이(가) 없거나 올바르지 않습니다.");if (typeof addonInfo.author !== "string") throw new Error("addonInfo.author이(가) 없거나 올바르지 않습니다.");if (typeof addonInfo.version !== "string") throw new Error("addonInfo.version이(가) 없거나 올바르지 않습니다.");}if (typeof onenable !== "function") throw new Error("onenable이(가) 없거나 함수가 아닙니다.");if (typeof ondisable !== "function") throw new Error("ondisable이(가) 없거나 함수가 아닙니다.");return {addonKey,addonInfo,onenable,ondisable,openSettings: typeof openSettings !== 'function' ? undefined : openSettings};})(name, Logger.getLogger(name), AddonStorage.getStorage(name));`);
                            resolve(result);
                        } catch (err) {
                            reject(new Error(`애드온(${name}) ${err.message}`));
                        }
                    } else {
                        reject(new Error(`애드온(${name}) 불러오기 실패 (네트워크 오류 ${response.status})`));
                    }
                }
            });
        });
    }

    class AddonStorage {
        static storageCache = {};
        /** @type {import("./localforage").LocalForage} */
        #store;
        
        static getStorage(name) {
            if (!AddonStorage.storageCache[name]) {
                return AddonStorage.storageCache[name] = new AddonStorage(name);
            }
            return AddonStorage.storageCache[name];
        }

        constructor(name) {
            this.name = name;
            if (typeof localforage !== 'undefined') {
                this.#store = localforage.createInstance({ 
                    name: 'memic-utils',
                    storeName: name,
                    driver: [localforage.INDEXEDDB, localforage.LOCALSTORAGE, localforage.WEBSQL],
                    version: 1
                });
            }
        }

        async get(key, defaultValue) {
            if (typeof this.#store === "undefined") {
                if (typeof localStorage === "undefined") return defaultValue;
                const value = localStorage.getItem(`${this.name}_${key}`);
                if (!value) return defaultValue;
                if (typeof defaultValue === 'boolean') {
                    return value === 'true' ? true : false;
                }
                if (typeof defaultValue === 'number') {
                    return Number(value);
                }
                return value;
            } else {
                const value = await this.#store.getItem(key);
                if (!value) return defaultValue;
                return value;
            }
        }

        set(key, value) {
            if (typeof this.#store === "undefined") {
                if (typeof localStorage === "undefined") return;
                localStorage.setItem(`${this.name}_${key}`, value);
            } else {
                this.#store.setItem(key, value);
            }
        }

    }

    class Logger {
        static loggerCache = {};

        /**
         * @param {string} name 
         * @returns {Logger} 
         */
        static getLogger(name) {
            if (!Logger.loggerCache[name]) {
                return Logger.loggerCache[name] = new Logger(name);
            }
            return Logger.loggerCache[name];
        }

        constructor(name) {
            this.name = name;
        }

        log(...msg) {
            setTimeout(console.log.bind(console, `[mu-${this.name}]`, ...msg));
        }

        info(...msg) {
            setTimeout(console.info.bind(console, `[mu-${this.name}]`, ...msg));
        }

        warn(...msg) {
            setTimeout(console.warn.bind(console, `[mu-${this.name}]`, ...msg));
        }

        error(...msg) {
            setTimeout(console.error.bind(console, `[mu-${this.name}]`, ...msg));
        }
    }

    class MemicAPI {
        constructor() {
            this.baseURL = 'https://rest.memic.at/v2';
            this.defaultHeaders = {
                'Content-Type': 'application/json',
            };
        }

        // 🔐 토큰 가져오기 (로컬스토리지에서)
        getAuthToken() {
            return localStorage.getItem('JwtToken');
        }

        // 📡 기본 요청 메서드
        async request(endpoint, options = {}) {
            const token = this.getAuthToken();
            const headers = {
                ...this.defaultHeaders,
                ...options.headers,
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const config = {
                ...options,
                headers,
            };

            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return response.json();
        }

        // 📝 게시글 관련 API
        articles = {
            // 게시글 목록 조회
            getList: async (shelterId, isNotice, size, offsetId) => {
                const searchParams = new URLSearchParams();
                
                if (isNotice) searchParams.append('isNotice', isNotice);
                if (size) searchParams.append('size', size);
                if (offsetId) searchParams.append('offsetId', offsetId);

                return this.request(`/shelters/${shelterId}/articles?${searchParams}`);
            },

            getListByBoard: async (boardId, isNotice, size, offsetId) => {
                const searchParams = new URLSearchParams();

                if (isNotice) searchParams.append('isNotice', isNotice);
                if (size) searchParams.append('size', size);
                if (offsetId) searchParams.append('offsetId', offsetId);

                return this.request(`/shelters/-/boards/${boardId}/articles?${searchParams}`);
            },

            // 게시글 상세 조회
            get: async (articleId) => {
                return this.request(`/articles/${articleId}`);
            }
        };

        // 🏠 쉘터 관련 API
        shelters = {
            // 쉘터 정보 조회
            get: async (shelterId) => {
                return this.request(`/shelters/${shelterId}`);
            },

            // 쉘터 검색
            search: async (keyword, size, offsetId) => {
                const searchParams = new URLSearchParams();
                if (keyword) searchParams.append('keyword', keyword);
                if (offsetId) searchParams.append('offsetId', offsetId);
                if (size) searchParams.append('size', size);

                return this.request(`/shelters/search?${searchParams}`);
            },

            // 쉘터 보드 목록
            getBoards: async (shelterId) => {
                return this.request(`/shelters/${shelterId}/boards`);
            }
        };

        // 👤 개인 관련 API
        personal = {
            // 개인의 쉘터 정보
            getShelter: async (personalId) => {
                return this.request(`/personal/${personalId}/shelter`);
            },

            // 개인의 쉘터 보드 목록
            getShelterBoards: async (personalId) => {
                return this.request(`/personal/${personalId}/shelter/boards`);
            }
        };
    }

    class MemicUtils extends EventTarget {
        /** @type {AddonStorage} */
        #systemStorage;
        #enabledAddons = '';
        /** @type {string} */
        #errorAddons = [];

        /** @type {MemicAPI} */
        api;
        /** @type {Addon} */
        uiAddon;
        /** @type {{ [key: any]: Addon }} */
        addons = {};
        enabledAddons = [];
        logger = Logger.getLogger('스크립트 관리자');

        get errorAddons() {
            return this.#errorAddons;
        }

        constructor() {
            super();
            this.#systemStorage = new AddonStorage('system');
            this.api = new MemicAPI();
            
            this.#systemStorage.get('enabledAddons', '').then(val => {
                this.#enabledAddons = val;
            });
        }

        async loadUIAddon() {
            if (this.uiAddon) {
                this.logger.warn('UI 애드온은 이미 로드되어 있습니다.');
                return;
            }
            try {
                this.uiAddon = await loadAddon('ui');
                this.uiAddon.onenable();
                this.logger.log('UI 애드온 로드 완료');
            } catch (err) {
                this.logger.error('UI 애드온 로드 실패:', err);
            }
        }

        async loadAddons() {
            const addons = await getAddonList();
            const loadedAddons = [];
            const failedAddons = [];
            for (let addonName of addons) {
                try {
                    if (this.addons[addonName]) {
                        this.logger.warn(`${addonName} 애드온은 이미 로드되어 있습니다.`);
                        continue;
                    }
                    const addon = await loadAddon(addonName);
                    this.addons[addonName] = addon;
                    loadedAddons.push(addonName);
                } catch (err) {
                    failedAddons.push({ addonName, err });
                }
            }

            this.logger.log(`애드온 (${loadedAddons.length}개) 로드 완료`);
            if (failedAddons.length > 0) {
                this.logger.log(`애드온 (${failedAddons.length}개) 로드 실패`);
                this.logger.log('사유 ↓');
                for (let { addonName, err } of failedAddons) {
                    this.logger.log(` - ${addonName}:`, err);
                } 
            }
            this.#errorAddons = failedAddons;
            this.dispatchEvent(new CustomEvent('addonsLoaded', { detail: loadedAddons }));
        }
        
        enableAddons(forge = false) {
            const addons = Object.values(this.addons);
            const filteredEA = forge ? addons : addons.filter(addon => this.#enabledAddons.includes(addon.addonKey));
            const loadedAddons = [];
            const failedAddons = [];
            for (let addon of filteredEA) {
                if (this.enabledAddons.includes(addon.addonKey)) continue;
                try {
                    addon.onenable();
                    loadedAddons.push(addon.addonKey);
                } catch (err) {
                    failedAddons.push({ addonName: addon.addonKey, err });
                }
            }
            if (loadedAddons.length === 0 && failedAddons.length === 0) {
                this.logger.warn('활성화할 애드온이 없습니다.');
                return;
            }

            this.logger.log(`애드온 (${loadedAddons.length}개) 활성화 완료`);
            if (failedAddons.length > 0) {
                this.logger.log(`애드온 (${failedAddons.length}개) 활성화 실패`);
                this.logger.log('사유 ↓');
                for (let { addonName, err } of failedAddons) {
                    this.logger.log(` - ${addonName}:`, err);
                } 
            }
            this.#errorAddons = failedAddons;
            this.enabledAddons = loadedAddons;
            this.#systemStorage.set('enabledAddons', loadedAddons.join(";"));
            this.dispatchEvent(new CustomEvent('addonsEnabled', { detail: loadedAddons }));
        }

        disableAddons() {
            const loadedAddons = [];
            const failedAddons = [];
            for (let addonName of this.enabledAddons) {
                const addon = this.addons[addonName];
                if (!addon) continue;
                try {
                    addon.ondisable();
                    loadedAddons.push(addonName);
                } catch (err) {
                    failedAddons.push({ addonName, err });
                }
            }
            if (loadedAddons.length === 0 && failedAddons.length === 0) {
                this.logger.warn('비활성화할 애드온이 없습니다.');
                return;
            }

            this.logger.log(`애드온 (${loadedAddons.length}개) 비활성화 완료`);
            if (failedAddons.length > 0) {
                this.logger.log(`애드온 (${failedAddons.length}개) 비활성화 실패`);
                this.logger.log('사유 ↓');
                for (let { addonName, err } of failedAddons) {
                    this.logger.log(` - ${addonName}:`, err);
                } 
            }
            this.#errorAddons = failedAddons;
            this.enabledAddons = [];
            this.#systemStorage.set('enabledAddons', '');
            this.dispatchEvent(new CustomEvent('addonsDisabled', { detail: loadedAddons }));
        }

        enableAddon(key) {
            if (this.enabledAddons.includes(key)) {
                this.logger.warn(`${key} 애드온은 이미 활성화되어 있습니다.`);
                return;
            }
            if (this.#errorAddons.some(val => val.addonName === key)) {
                this.logger.warn(`${key} 애드온은 오류로 인해 활성화되지 않았습니다. 오류를 확인해주세요.`);
                return;
            }
            const addon = this.addons[key];
            if (!addon) {
                throw new Error(`${key}인 애드온을 찾을 수 없습니다.`);
            }
            try {
                addon.onenable();
                removeArrayBy(this.#errorAddons, val => val.addonName === key);
            } catch (err) {
                this.logger.error(`${key}(${addon.addonInfo.name}@${addon.addonInfo.version}) 활성화 실패`);
                this.#errorAddons.push({ addonName: addon.addonKey, err });
                return;
            }
            this.enabledAddons.push(addon.addonKey);
            this.#systemStorage.set('enabledAddons', this.enabledAddons.join(";"));
            this.logger.log(`${key}(${addon.addonInfo.name}@${addon.addonInfo.version}) 활성화 완료`);
            this.dispatchEvent(new CustomEvent('addonEnabled', { detail: addon.addonKey }));
        }

        disableAddon(key) {
            if (!this.enabledAddons.includes(key)) {
                this.logger.warn(`${key} 애드온은 이미 비활성화되어 있습니다.`);
                return;
            }
            if (this.#errorAddons.some(val => val.addonName === key)) {
                this.logger.warn(`${key} 애드온은 오류로 인해 비활성화되지 않았습니다. 오류를 확인해주세요.`);
                return;
            }
            const addon = this.addons[key];
            if (!addon) {
                throw new Error(`${key}인 애드온을 찾을 수 없습니다.`);
            }
            try {
                addon.ondisable();
                removeArrayBy(this.#errorAddons, val => val.addonName === key);
            } catch (err) {
                this.logger.error(`${key}(${addon.addonInfo.name}@${addon.addonInfo.version}) 비활성화 실패`);
                this.#errorAddons.push({ addonName: addon.addonKey, err });
                return;
            }
            removeArray(this.enabledAddons, addon.addonKey);
            this.#systemStorage.set('enabledAddons', this.enabledAddons.join(";"));
            this.logger.log(`${key}(${addon.addonInfo.name}@${addon.addonInfo.version}) 비활성화 완료`);
            this.dispatchEvent(new CustomEvent('addonDisabled', { detail: addon.addonKey }));
        }

    }

    const safeWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    safeWindow.Logger = Logger;
    safeWindow.memicUtils = new MemicUtils();
})();