
// === addon ===
// declare type addonInfo = {
//     name: string,
//     description: string,
//     author: string,
//     version: string,
//     link?: string
// }

// declare function onenable(): void;
// declare function ondisable(): void;

declare const addonStorage: AddonStorage;
declare const logger: Logger;

// === global ===

declare const localforage: import("./localforage").LocalForage;
declare const memicUtils: MemicUtils;

declare interface BoardInfo {
    color: string;
    description: string;
    headers: string[];
    icon: string;
    id: number;
    isAdultOnly: boolean;
    link: string;
    listItemType: string;
    name: string;
    newestArticleCreateDate: string;
    order: number;
    permission: any;
    shelter: number;
    type: string;
    viewType: string;
}

declare interface ImageInfo {
    contentType: string;
    fileSize: number;
    metadata: {
        width: number;
        height: number;
    };
    path: string;
    signature: string;
    url: string;
}

declare interface OwnerInfo {
    id: string;
    image: ImageInfo;
    isCertificationCreator: boolean;
    listItemType: string;
    name: string;
    personalId: string;
}

declare interface ShelterInfo {
    createDate: string;
    description: string;
    background: ImageInfo;
    highlightColor: string;
    id: number;
    isAttendanceEnabled: boolean;
    isCertificationCreator: boolean;
    isCommunityEnabled: boolean;
    isOnlyAccessAdult: boolean;
    listItemType: string;
    name: string;
    owner: OwnerInfo;
    tags: string[];
}

declare interface ArticleInfo {
    articleType: string;
    board: BoardInfo;
    commentCount: number;
    commentType: string;
    createDate: string;
    header: string;
    id: number;
    isHaveImage: boolean;
    isHaveVideo: boolean;
    isLicked: boolean;
    isMasked: boolean;
    isNotice: boolean;
    isOnlyAdult: boolean;
    isRead: boolean;
    isSecret: boolean;
    lickCount: number;
    listItemType: string;
    owner: OwnerInfo;
    shelter: ShelterInfo;
    shelterId?: number;
    thumbnail: ImageInfo;
    title: string;
    viewCount: number;
}

declare interface ArticleListResponse {
    hasNext: boolean;
    hasPrev: boolean;
    list: ArticleInfo[];
}

declare class AddonStorage {
    static getStorage(name: string): AddonStorage;
    constructor(name: string);
    get<T>(key: string, defaultValue: T): Promise<T>;
    set<T>(key: string, value: T): Promise<void>;
}

declare class Logger {
    static getLogger(name: string): Logger;
    constructor(name: string);
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}

declare class MemicAPI {
    getAuthToken(): string;
    request(endpoint: string, options?: RequestInit): Promise<any>;

    articles: {
        getList(shelterId: string, isNotice?: boolean, size?: number, offsetId?: string): Promise<ArticleListResponse>;
        getListByBoard(boardId: string, isNotice?: boolean, size?: number, offsetId?: string): Promise<ArticleListResponse>;
        get(articleId: string): Promise<ArticleInfo>;
    }

    shelters: {
        get(shelterId: string): Promise<ShelterInfo>;
        search(keyword: string, size?: number, offsetId?: string): Promise<ShelterInfo>;
        getBoards(shelterId: string): Promise<BoardInfo[]>;
    }

    personal: {
        getShelter(personalId: string): Promise<ShelterInfo>;
        getShelterBoards(shelterId: string): Promise<BoardInfo[]>;
    }
}

declare class MemicUtils extends EventTarget {
    #systemStorage: AddonStorage;
    #enabledAddons: string;
    #errorAddons: { addonName: string, err: Error }[];

    api: MemicAPI;
    uiAddon: Addon;
    addons: Record<string, Addon>;
    enabledAddons: string[];
    logger: Logger;

    get errorAddons(): { addonName: string, err: Error }[];

    async loadUIAddon(): Promise<void>;
    async loadAddons(): Promise<void>;
    enableAddons(forge = false): Promise<void>;
    disableAddons(): Promise<void>;
    enableAddon(addonKey: string): Promise<void>;
    disableAddon(addonKey: string): Promise<void>;
}

declare interface Addon {
    addonKey: string;
    addonInfo: {
        name: string;
        description: string;
        version: string;
        author: string;
        link?: string;
    }
    openSettings: (modalBody: HTMLDivElement) => () => void;
    onenable: () => void;
    ondisable: () => void;
}