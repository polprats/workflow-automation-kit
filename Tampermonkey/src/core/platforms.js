(function () {
    'use strict';

    window.TM = window.TM || {};

    window.TM.Platforms = {
        campusExample: {
            id: 'campus-example',
            label: 'Campus Example',
            matchesHost() {
                return window.location.hostname === 'example-campus.invalid';
            }
        },
        iocExample: {
            id: 'ioc-example',
            label: 'IOC Example',
            matchesHost() {
                return window.location.hostname === 'example-ioc.invalid';
            }
        }
    };
})();
