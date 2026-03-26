(function () {
    'use strict';

    window.TM = window.TM || {};

    const LOG_PREFIX = '[TM Modular]';

    window.TM.Logger = {
        log(...args) {
            console.log(LOG_PREFIX, ...args);
        },
        warn(...args) {
            console.warn(LOG_PREFIX, ...args);
        },
        error(...args) {
            console.error(LOG_PREFIX, ...args);
        }
    };
})();
