const addonInfo = {
    name: "test",
    description: "test",
    author: "test",
    version: "1.0.0"
}

function onenable() {
    logger.log('enable');
    addonStorage.set('test', 1);
}

function ondisabled() {
    logger.log('disable');
    logger.log(addonStorage.get('test', 2));
}