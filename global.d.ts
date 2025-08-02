
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

// === global ===

declare const localforage: import("./localforage").LocalForage;

declare interface Addon {
    addonKey: string;
    addonInfo: {
        name: string;
        description: string;
        version: string;
        author: string;
        link?: string;
    }
    onenable: () => void;
    ondisable: () => void;
}