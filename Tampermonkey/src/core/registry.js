(function () {
    'use strict';

    window.TM = window.TM || {};
    window.TM.Modules = window.TM.Modules || [];

    window.TM.Registry = {
        getCurrentPlatform() {
            const Logger = window.TM.Logger;
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
            const Logger = window.TM.Logger;
            const modules = window.TM.Modules || [];

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
})();
