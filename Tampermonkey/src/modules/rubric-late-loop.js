(function () {
    'use strict';

    window.TM = window.TM || {};
    window.TM.Modules = window.TM.Modules || [];

    const Logger = window.TM.Logger;

    const RubricLateLoopModule = {
        id: 'rubric-late-loop',
        version: '1.1.1',
        platform: 'pedralbes',
        label: 'Rúbrica automàtica per retard',

        storagePrefix: 'tm:example:rubric-late-loop',
        maxResumeAgeMs: 60 * 1000,

        rubricConfig: {
            knowledgeLabelRegex: /coneixement/i,
            punctualityLabelRegex: /puntualitat/i
        },

        matches() {
            const isAssignPage = window.location.pathname.includes('/mod/assign/view.php');
            const hasGraderAction = window.location.href.includes('action=grader');
            return isAssignPage && hasGraderAction;
        },

        hasRubricOnPage() {
            return !!document.querySelector(
                '.gradingform_rubric, [id^="advancedgrading-criteria"], .criterion, input[type="radio"][name*="advancedgrading[criteria]"]'
            );
        },

        apply() {
            this.ensurePanel();
            this.log('Panell del mòdul obert.');
            this.log('Pàgina actual detectada com a grader.');

            if (this.hasRubricOnPage()) {
                this.log('Rúbrica detectada correctament.');
            } else {
                this.warn('No s’ha detectat clarament la rúbrica en aquesta pàgina.');
            }
        },

        // -----------------------------------------------------
        // AQUI HI ENGANXES LA RESTA DEL MÒDUL EXACTAMENT IGUAL
        // sense tocar lògica, selectors, timings ni estils
        // -----------------------------------------------------
    };

    window.TM.Modules.push(RubricLateLoopModule);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            RubricLateLoopModule.bootstrapAutoResume();
        });
    } else {
        RubricLateLoopModule.bootstrapAutoResume();
    }
})();
