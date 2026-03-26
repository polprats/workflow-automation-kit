(function () {
    'use strict';

    console.log('[TM Modular] carregant registry.js');

    window.TM = window.TM || {};
    window.TM.Modules = window.TM.Modules || [];

    window.TM.Registry = {
        getCurrentPlatform() {
            const Logger = window.TM.Logger || console;
            const Platforms = window.TM.Platforms || {};

            const allPlatforms = Object.values(Platforms);
            return allPlatforms.find(platform => {
                try {
                    return platform.matchesHost();
                } catch (err) {
                    Logger.error('Error detectant plataforma:', err);
                    return false;
                }
            }) || null;
        },

        getAvailableModules(currentPlatform) {
            const Logger = window.TM.Logger || console;
            const modules = window.TM.Modules || [];

            if (!currentPlatform) {
                Logger.warn('No hi ha plataforma actual. No es poden filtrar mòduls.');
                return [];
            }

            return modules.filter(module => {
                try {
                    if (module.platform !== currentPlatform.id) {
                        Logger.log(`Mòdul descartat per plataforma: ${module.id}`);
                        return false;
                    }

                    if (typeof module.matches !== 'function') {
                        Logger.warn(`El mòdul ${module.id} no té matches()`);
                        return false;
                    }

                    const result = module.matches();
                    Logger.log(`matches() -> ${module.id}:`, result);
                    return result;
                } catch (err) {
                    Logger.error(`Error a matches() del mòdul ${module.id}:`, err);
                    return false;
                }
            });
        }
    };

    console.log('[TM Modular] registry.js carregat correctament');
})();
