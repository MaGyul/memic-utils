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
                url: `https://raw.githubusercontent.com/MaGyul/memic-utils/refs/heads/main/addon/addons.json`,
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
                url: `https://raw.githubusercontent.com/MaGyul/memic-utils/refs/heads/main/addon/${name}.js`,
                onload: async function(response) {
                    if (response.status === 200) {
                        if (hasGlobalReturnWithBabel(response.responseText)) {
                            reject(new Error(`애드온(${name}) 전역에 반환이 있습니다!`));
                        }
                        try {
                            const result = await eval(`(async (addonKey, logger, addonStorage) => {${response.responseText}\nif (typeof addonInfo !== "object") throw new Error("addonInfo이(가) 없거나 올바르지 않습니다."); else {if (typeof addonInfo.name !== "string") throw new Error("addonInfo.name이(가) 없거나 올바르지 않습니다.");if (typeof addonInfo.description !== "string") throw new Error("addonInfo.description이(가) 없거나 올바르지 않습니다.");if (typeof addonInfo.author !== "string") throw new Error("addonInfo.author이(가) 없거나 올바르지 않습니다.");if (typeof addonInfo.version !== "string") throw new Error("addonInfo.version이(가) 없거나 올바르지 않습니다.");}if (typeof onenable !== "function") throw new Error("onenable이(가) 없거나 함수가 아닙니다.");if (typeof ondisable !== "function") throw new Error("ondisable이(가) 없거나 함수가 아닙니다.");return {addonKey,addonInfo,onenable,ondisable};})(name, Logger.getLogger(name), AddonStorage.getStorage(name));`);
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
            getList: async (params = {}) => {
                const searchParams = new URLSearchParams();
                
                if (params.keyword) searchParams.append('keyword', params.keyword);
                if (params.shelterId) searchParams.append('shelterId', params.shelterId);
                if (params.ownerId) searchParams.append('ownerId', params.ownerId);
                if (params.searchType) searchParams.append('searchType', params.searchType);
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/articles?${searchParams}`);
            },

            // 게시글 상세 조회
            get: async (articleId) => {
                return this.request(`/articles/${articleId}`);
            },

            // 공개 게시글 목록
            getPublic: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/articles/public?${searchParams}`);
            },

            // 게시글 ID들로 일괄 조회
            getByIds: async (articleIds) => {
                return this.request('/articles/ids', {
                    method: 'POST',
                    body: JSON.stringify({ articleIds })
                });
            },

            // 쉘터에 게시글 작성
            createInShelter: async (shelterId, data) => {
                return this.request(`/shelters/${shelterId}/articles`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },

            // 보드에 게시글 작성
            createInBoard: async (boardId, data) => {
                return this.request(`/boards/${boardId}/articles`, {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },

            // 게시글 수정
            update: async (articleId, data) => {
                return this.request(`/articles/${articleId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
            },

            // 게시글 검색
            search: async (keyword, params = {}) => {
                const searchParams = new URLSearchParams();
                searchParams.append('keyword', keyword);
                
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/articles?${searchParams}`);
            }
        };

        // 🏠 쉘터 관련 API
        shelters = {
            // 쉘터 정보 조회
            get: async (shelterId) => {
                return this.request(`/shelters/${shelterId}`);
            },

            // 쉘터 검색
            search: async (keyword, params = {}) => {
                const searchParams = new URLSearchParams();
                if (keyword) searchParams.append('keyword', keyword);
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/shelters/search?${searchParams}`);
            },

            // 쉘터 보드 목록
            getBoards: async (shelterId) => {
                return this.request(`/shelters/${shelterId}/boards`);
            }
        };

        // 📋 보드 관련 API
        boards = {
            // 보드별 게시글 목록
            getArticles: async (boardId, params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.keyword) searchParams.append('keyword', params.keyword);
                if (params.searchType) searchParams.append('searchType', params.searchType);
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/boards/${boardId}/articles?${searchParams}`);
            }
        };

        // 👤 사용자 관련 API
        users = {
            // personalId로 사용자 조회
            getByPersonalId: async (personalId) => {
                return this.request(`/users/personal/${personalId}`);
            }
        };

        // 🔐 내 정보 관련 API
        me = {
            // 내 게시글 목록
            getArticles: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.keyword) searchParams.append('keyword', params.keyword);
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/me/articles?${searchParams}`);
            },

            // 내 댓글 목록
            getComments: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/me/comments?${searchParams}`);
            },

            // 내 타임라인
            getTimeline: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/me/timeline?${searchParams}`);
            },

            // 내 기본 쉘터
            getBaseShelter: async () => {
                return this.request('/me/base-shelter');
            },

            // 가입한 쉘터 목록
            getShelters: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/me/shelters/settlers/newest-date?${searchParams}`);
            },

            // 즐겨찾기 쉘터 목록
            getFavoriteShelters: async (shelterIds = []) => {
                const searchParams = new URLSearchParams();
                shelterIds.forEach(id => searchParams.append('shelterIds[]', id));
                searchParams.append('pageRequest.size', shelterIds.length || 20);

                return this.request(`/me/shelters/-/favorites?${searchParams}`);
            }
        };

        // 💾 임시글 관련 API
        tempArticles = {
            // 임시글 목록
            getList: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.shelter) searchParams.append('shelter', params.shelter);
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/me/temp/articles?${searchParams}`);
            },

            // 임시글 조회
            get: async (tempArticleId) => {
                return this.request(`/me/temp/articles/${tempArticleId}`);
            },

            // 임시글 저장
            create: async (data) => {
                return this.request('/me/temp/articles', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            },

            // 임시글 수정
            update: async (tempArticleId, data) => {
                return this.request(`/me/temp/articles/${tempArticleId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
            },

            // 임시글 삭제
            delete: async (tempArticleId) => {
                return this.request(`/me/temp/articles/${tempArticleId}`, {
                    method: 'DELETE'
                });
            }
        };

        // ❤️ 좋아요 관련 API
        likes = {
            // 좋아요 추가
            add: async (likeType, parentId) => {
                return this.request('/likes', {
                    method: 'POST',
                    body: JSON.stringify({ likeType, parentId })
                });
            },

            // 좋아요 취소
            remove: async (likeType, parentId) => {
                const searchParams = new URLSearchParams();
                searchParams.append('likeType', likeType);
                searchParams.append('parentId', parentId);

                return this.request(`/likes?${searchParams}`, {
                    method: 'DELETE'
                });
            }
        };

        // 🏆 랭킹 관련 API
        rankings = {
            // 통합 메타쉘터 랭킹
            getMetaShelters: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/rankings/consolidate/meta-shelters?${searchParams}`);
            },

            // 월 후원액 랭킹
            getMonthlySponsor: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/rankings/monthly-sponsor?${searchParams}`);
            },

            // 추천 랭킹
            getRecommend: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/rankings/recommend?${searchParams}`);
            }
        };

        // 🎯 리더보드 관련 API
        leaderboards = {
            // 인기 쉘터 랭킹
            getShelters: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/leaderboards/shelters?${searchParams}`);
            }
        };

        // 🖥️ UI 관련 API
        ui = {
            // 메인 페이지 데이터
            getMain: async () => {
                return this.request('/ui/main');
            },

            // 로그인 사용자 메인 데이터
            getMeMain: async () => {
                return this.request('/ui/me/main');
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

        // 🎯 퀵필터 관련 API
        quickFilters = {
            // 쉘터 클릭 기록
            setLatestClick: async (shelterId) => {
                return this.request(`/me/quick-filters/-/shelters/${shelterId}:click`, {
                    method: 'PATCH'
                });
            }
        };

        // 🔍 메타쉘터 필드 관련 API
        metaShelterFields = {
            // 메타쉘터 필드 목록
            getList: async (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.offsetId) searchParams.append('pageRequest.offsetId', params.offsetId);
                if (params.size) searchParams.append('pageRequest.size', params.size);

                return this.request(`/meta-shelters/fields?${searchParams}`);
            }
        };
    }

    class MemicUtils {
        /** @type {AddonStorage} */
        #systemStorage;
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
            this.#systemStorage = new AddonStorage('system');
            this.api = new MemicAPI();
            loadAddon('ui').then(addon => {
                this.uiAddon = addon;
                addon.onenable();
            });
            
            this.#systemStorage.get('enabledAddons', '').then(val => {
                this.enabledAddons.push(...val.split(";"));
            });
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
        }
        
        enableAddons(forge = false) {
            const addons = Object.values(this.addons);
            const filteredEA = forge ? addons : addons.filter(addon => this.enabledAddons.includes(addon.addonKey));
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
            if (forge && loadedAddons.length > 0) {
                this.enabledAddons = loadedAddons;
                this.#systemStorage.set('enabledAddons', loadedAddons.join(";"));
            }
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
        }

    }

    window.Logger = Logger;
    window.memicUtils = new MemicUtils();
})();