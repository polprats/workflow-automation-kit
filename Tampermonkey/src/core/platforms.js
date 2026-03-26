(function () {
    'use strict';

    window.TM = window.TM || {};

    window.TM.Platforms = {
        pedralbes: {
            id: 'pedralbes',
            label: 'Institut Pedralbes',
            matchesHost() {
                return window.location.hostname === 'campus.institutpedralbes.cat';
            }
        },
        ioc: {
            id: 'ioc',
            label: 'IOC',
            matchesHost() {
                return window.location.hostname === 'ioc.xtec.cat';
            }
        }
    };
})();
