(function () {
    'use strict';

    function init() {
        const Logger = window.TM.Logger;
        const Registry = window.TM.Registry;
        const UI = window.TM.UI;

        Logger.log('Script carregat.');
        Logger.log('URL actual:', window.location.href);

        const currentPlatform = Registry.getCurrentPlatform();

        if (!currentPlatform) {
            Logger.warn('No s’ha detectat cap plataforma compatible.');
            return;
        }

        Logger.log('Plataforma detectada:', currentPlatform.id);

        const availableModules = Registry.getAvailableModules(currentPlatform);
        Logger.log(
            'Mòduls disponibles:',
            availableModules.map(m => `${m.id}@${m.version || 'sense-versió'}`)
        );

        UI.createPanel(currentPlatform, availableModules);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
