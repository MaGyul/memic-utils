(() => {
    function loadScript(file) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://github.com/MaGyul/memic-utils/raw/refs/heads/main/${file}`,
                onload: function(/** @type {Response} */ response) {
                    if (response.status === 200) {
                        resolve(eval(`(() => {const exports = {};((exports) => {${response.responseText}})(exports);return exports;})();`));
                    } else {
                        reject(new Error("스크립트 불러오기 실패"));
                    }
                }
            });
        });
    }

    class MemicAPI {
        constructor() {
            this.baseURL = 'https://memic.at/v2';
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
        /** @type {MemicAPI} */
        api;

        constructor() {
            this.api = new MemicAPI();
        }

        test() {
            return loadScript('test.js');
        }
    }

    window.memicUtils = new MemicUtils();
})();