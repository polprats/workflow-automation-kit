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
        // ESTAT
        // -----------------------------------------------------
        getStorageKey(suffix) {
            return `${this.storagePrefix}:${suffix}`;
        },

        getState() {
            try {
                const raw = localStorage.getItem(this.getStorageKey('state'));
                if (!raw) return null;
                return JSON.parse(raw);
            } catch (err) {
                Logger.error(`[${this.id}] Error llegint estat`, err);
                return null;
            }
        },

        setState(state) {
            localStorage.setItem(this.getStorageKey('state'), JSON.stringify(state));
        },

        clearState() {
            localStorage.removeItem(this.getStorageKey('state'));
        },

        createRunState() {
            return {
                moduleId: this.id,
                active: true,
                runId: `${this.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
                lastActionAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                currentUrl: window.location.href
            };
        },

        touchState(extra = {}) {
            const state = this.getState();
            if (!state || !state.active) return;
            state.lastActionAt = new Date().toISOString();
            state.currentUrl = window.location.href;
            Object.assign(state, extra);
            this.setState(state);
        },

        isStateFresh(state) {
            if (!state || !state.active || state.moduleId !== this.id) return false;
            if (!state.lastActionAt) return false;

            const age = Date.now() - new Date(state.lastActionAt).getTime();
            return age >= 0 && age <= this.maxResumeAgeMs;
        },

        stopLoop(reason) {
            const state = this.getState();
            if (state) {
                state.active = false;
                state.stoppedAt = new Date().toISOString();
                state.stopReason = reason || 'Aturat';
                this.setState(state);
            }
            this.clearState();
            this.log(`Bucle aturat: ${reason}`);
        },

        // -----------------------------------------------------
        // LOGS
        // -----------------------------------------------------
        log(...args) {
            Logger.log(`[${this.id}]`, ...args);
            const text = args.map(x => {
                if (typeof x === 'object') {
                    try {
                        return JSON.stringify(x);
                    } catch {
                        return String(x);
                    }
                }
                return String(x);
            }).join(' ');

            const box = document.getElementById(`${this.storagePrefix}-logbox`);
            if (!box) return;

            const line = document.createElement('div');
            line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
            line.style.marginBottom = '4px';
            box.appendChild(line);
            box.scrollTop = box.scrollHeight;
        },

        warn(...args) {
            Logger.warn(`[${this.id}]`, ...args);
            this.log('WARN:', ...args);
        },

        error(...args) {
            Logger.error(`[${this.id}]`, ...args);
            this.log('ERROR:', ...args);
        },

        // -----------------------------------------------------
        // UI DEL MÒDUL
        // -----------------------------------------------------
        ensurePanel() {
            const panelId = `${this.storagePrefix}-panel`;
            if (document.getElementById(panelId)) return;

            const panel = document.createElement('div');
            panel.id = panelId;
            panel.style.position = 'fixed';
            panel.style.left = '20px';
            panel.style.bottom = '20px';
            panel.style.width = '420px';
            panel.style.zIndex = '999999';
            panel.style.background = '#111';
            panel.style.color = '#fff';
            panel.style.border = '3px solid #ffcc00';
            panel.style.borderRadius = '14px';
            panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
            panel.style.fontFamily = 'Arial, sans-serif';
            panel.style.overflow = 'hidden';

            const header = document.createElement('div');
            header.style.cursor = 'move';
            header.style.userSelect = 'none';
            header.style.padding = '12px 14px';
            header.style.background = 'linear-gradient(135deg, #ffcc00, #ff9f1a)';
            header.style.color = '#111';
            header.style.display = 'flex';
            header.style.alignItems = 'flex-start';
            header.style.gap = '10px';

            const dragIcon = document.createElement('div');
            dragIcon.textContent = '⋮⋮';
            dragIcon.style.fontSize = '18px';
            dragIcon.style.lineHeight = '1';
            dragIcon.style.fontWeight = 'bold';
            dragIcon.style.opacity = '0.9';
            dragIcon.style.paddingTop = '2px';
            dragIcon.style.flexShrink = '0';

            const headerTextWrap = document.createElement('div');
            headerTextWrap.style.flex = '1';

            const title = document.createElement('div');
            title.textContent = 'Rúbrica automàtica per retard (dragable)';
            title.style.fontSize = '16px';
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '4px';

            const subtitle = document.createElement('div');
            subtitle.textContent = `Mòdul ${this.id} · v${this.version}`;
            subtitle.style.fontSize = '12px';
            subtitle.style.lineHeight = '1.35';
            subtitle.style.opacity = '0.95';

            headerTextWrap.appendChild(title);
            headerTextWrap.appendChild(subtitle);

            header.appendChild(dragIcon);
            header.appendChild(headerTextWrap);

            const body = document.createElement('div');
            body.style.padding = '14px';

            const info = document.createElement('div');
            info.textContent = 'Qualitat del codi al màxim. Puntualitat segons retard. Mode prova i mode bucle.';
            info.style.fontSize = '13px';
            info.style.lineHeight = '1.4';
            info.style.marginBottom = '12px';

            const buttons = document.createElement('div');
            buttons.style.display = 'flex';
            buttons.style.flexWrap = 'wrap';
            buttons.style.gap = '8px';
            buttons.style.marginBottom = '12px';

            const btnSingle = document.createElement('button');
            btnSingle.textContent = 'Avalua 1 alumne';
            this.stylePrimaryButton(btnSingle, '#ffcc00', '#000');
            btnSingle.addEventListener('click', () => {
                this.log('--- Inici prova 1 alumne (sense desar) ---');
                this.runSinglePreview();
            });

            const btnLoop = document.createElement('button');
            btnLoop.textContent = 'Inicia bucle';
            this.stylePrimaryButton(btnLoop, '#28a745', '#fff');
            btnLoop.addEventListener('click', () => {
                this.log('--- Inici bucle automàtic ---');
                this.startLoop();
            });

            const btnStop = document.createElement('button');
            btnStop.textContent = 'Atura bucle';
            this.stylePrimaryButton(btnStop, '#dc3545', '#fff');
            btnStop.addEventListener('click', () => {
                this.stopLoop('Aturat manualment');
            });

            const logBox = document.createElement('div');
            logBox.id = `${this.storagePrefix}-logbox`;
            logBox.style.background = '#1e1e1e';
            logBox.style.border = '1px solid #444';
            logBox.style.borderRadius = '8px';
            logBox.style.padding = '8px';
            logBox.style.height = '220px';
            logBox.style.overflow = 'auto';
            logBox.style.fontSize = '12px';
            logBox.style.whiteSpace = 'pre-wrap';

            buttons.appendChild(btnSingle);
            buttons.appendChild(btnLoop);
            buttons.appendChild(btnStop);

            body.appendChild(info);
            body.appendChild(buttons);
            body.appendChild(logBox);

            panel.appendChild(header);
            panel.appendChild(body);
            document.body.appendChild(panel);

            this.makePanelDraggable(panel, header);
            this.log('Panell del mòdul injectat.');
        },

        makePanelDraggable(panel, handle) {
            let isDragging = false;
            let offsetX = 0;
            let offsetY = 0;

            const onMouseMove = (event) => {
                if (!isDragging) return;

                const newLeft = event.clientX - offsetX;
                const newTop = event.clientY - offsetY;

                panel.style.left = `${newLeft}px`;
                panel.style.top = `${newTop}px`;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';
            };

            const onMouseUp = () => {
                if (!isDragging) return;
                isDragging = false;

                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            handle.addEventListener('mousedown', (event) => {
                if (event.button !== 0) return;

                const rect = panel.getBoundingClientRect();
                isDragging = true;
                offsetX = event.clientX - rect.left;
                offsetY = event.clientY - rect.top;

                panel.style.left = `${rect.left}px`;
                panel.style.top = `${rect.top}px`;
                panel.style.right = 'auto';
                panel.style.bottom = 'auto';

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        },

        stylePrimaryButton(button, bg, fg) {
            button.style.background = bg;
            button.style.color = fg;
            button.style.border = 'none';
            button.style.borderRadius = '10px';
            button.style.padding = '10px 12px';
            button.style.fontWeight = 'bold';
            button.style.cursor = 'pointer';
        },

        // -----------------------------------------------------
        // HELPERS
        // -----------------------------------------------------
        normalizeText(str) {
            return (str || '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        },

        getSubmissionStatusContainer() {
            return document.querySelector('.submissionstatustable');
        },

        getSubmissionStatusText() {
            const box = this.getSubmissionStatusContainer();
            if (!box) return '';
            return box.innerText || box.textContent || '';
        },

        getCurrentStudentLabel() {
            const heading = document.querySelector('[data-region="user-info"] h4');
            if (heading) {
                return heading.textContent.trim();
            }

            const userInfo = document.querySelector('[data-region="user-info"]');
            if (userInfo) {
                return (userInfo.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
            }

            return '(estudiant desconegut)';
        },

        parseLateDaysFromSubmissionText(statusText) {
            const text = this.normalizeText(statusText);

            if (text.includes('abans del límit') || text.includes('abans del limit')) {
                return 0;
            }

            if (!text.includes('tard')) {
                return 0;
            }

            let days = 0;
            let hours = 0;
            let minutes = 0;

            const daysMatch = text.match(/(\d+)\s+dies?/);
            const oneDayMatch = text.match(/(\d+)\s+dia\b/);
            const hoursMatch = text.match(/(\d+)\s+hores?/);
            const minutesMatch = text.match(/(\d+)\s+minuts?/);

            if (daysMatch) {
                days = parseInt(daysMatch[1], 10);
            } else if (oneDayMatch) {
                days = parseInt(oneDayMatch[1], 10);
            }

            if (hoursMatch) hours = parseInt(hoursMatch[1], 10);
            if (minutesMatch) minutes = parseInt(minutesMatch[1], 10);

            return days + (hours / 24) + (minutes / 1440);
        },

        hasNoSubmission(statusText) {
            const text = this.normalizeText(statusText);

            return (
                text.includes('cap intent') ||
                text.includes('no s ha tramès') ||
                text.includes('no s\'ha tramès') ||
                text.includes('no s ha enviat') ||
                text.includes('no s\'ha enviat') ||
                text.includes('sense tramesa')
            );
        },

        isAlreadyGraded() {
            const submissionText = this.normalizeText(this.getSubmissionStatusText());

            if (submissionText.includes('sense qualificació')) {
                return false;
            }

            if (submissionText.includes('qualificada')) {
                return true;
            }

            const currentGradeText = this.normalizeText(
                document.querySelector('.currentgrade')?.textContent || ''
            );

            if (currentGradeText.includes('sense qualificació')) {
                return false;
            }

            const checkedRubricInputs = document.querySelectorAll(
                '.gradingform_rubric input[type="radio"]:checked, input[type="radio"][name*="advancedgrading[criteria]"]:checked'
            );

            return checkedRubricInputs.length >= 2;
        },

        // -----------------------------------------------------
        // DETECCIÓ GENÈRICA DE CRITERIS I NIVELLS
        // -----------------------------------------------------
        findCriterionRowByLabel(labelRegex) {
            const rows = Array.from(document.querySelectorAll('.gradingform_rubric tr.criterion'));
            return rows.find(row => {
                const descriptionCell = row.querySelector('td.description');
                if (!descriptionCell) return false;
                const text = (descriptionCell.innerText || descriptionCell.textContent || '')
                    .replace(/\s+/g, ' ')
                    .trim();
                return labelRegex.test(text);
            }) || null;
        },

        getLevelsFromCriterionRow(row) {
            if (!row) return [];

            const cells = Array.from(row.querySelectorAll('td[role="radio"]'));

            return cells.map(cell => {
                const input = cell.querySelector('input[type="radio"]');
                const scoreEl = cell.querySelector('.scorevalue');
                const descriptionEl = cell.querySelector('.definition');

                const scoreText = scoreEl ? (scoreEl.innerText || scoreEl.textContent || '').trim() : '';
                const descriptionText = descriptionEl
                    ? (descriptionEl.innerText || descriptionEl.textContent || '').replace(/\s+/g, ' ').trim()
                    : '';

                const score = parseFloat(scoreText.replace(',', '.'));

                return {
                    cell,
                    input,
                    score: Number.isFinite(score) ? score : Number.NEGATIVE_INFINITY,
                    descriptionText
                };
            }).filter(level => level.input);
        },

        selectLevelObject(level) {
            if (!level || !level.cell || !level.input) {
                throw new Error('Nivell de rúbrica invàlid o incomplet');
            }

            const row = level.cell.closest('tr.criterion');
            if (!row) {
                throw new Error('No s’ha trobat la fila del criteri per al nivell seleccionat');
            }

            const allCells = Array.from(row.querySelectorAll('td[role="radio"]'));
            allCells.forEach(td => {
                td.setAttribute('aria-checked', 'false');
                td.classList.remove('checked');
                const radio = td.querySelector('input[type="radio"]');
                if (radio) radio.checked = false;
            });

            try {
                level.cell.focus();
            } catch (e) {
                // ignorem errors de focus
            }

            level.cell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            level.cell.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
            level.cell.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

            level.input.checked = true;
            level.input.dispatchEvent(new Event('input', { bubbles: true }));
            level.input.dispatchEvent(new Event('change', { bubbles: true }));

            level.cell.setAttribute('aria-checked', 'true');
            level.cell.classList.add('checked');

            const verified =
                level.input.checked === true ||
                level.cell.getAttribute('aria-checked') === 'true' ||
                level.cell.classList.contains('checked');

            if (!verified) {
                throw new Error('No s’ha pogut verificar la selecció del nivell de la rúbrica');
            }

            return true;
        },

        selectBestKnowledgeLevel() {
            const row = this.findCriterionRowByLabel(this.rubricConfig.knowledgeLabelRegex);
            if (!row) {
                throw new Error('No trobo el criteri de coneixement a la rúbrica');
            }

            const levels = this.getLevelsFromCriterionRow(row);
            if (!levels.length) {
                throw new Error('El criteri de coneixement no té nivells detectables');
            }

            const bestLevel = levels.reduce((best, current) => current.score > best.score ? current : best);

            this.log(`Coneixement -> millor puntuació detectada: ${bestLevel.score}`);
            this.selectLevelObject(bestLevel);

            return bestLevel;
        },

        selectWorstKnowledgeLevel() {
            const row = this.findCriterionRowByLabel(this.rubricConfig.knowledgeLabelRegex);
            if (!row) {
                throw new Error('No trobo el criteri de coneixement a la rúbrica');
            }

            const levels = this.getLevelsFromCriterionRow(row);
            if (!levels.length) {
                throw new Error('El criteri de coneixement no té nivells detectables');
            }

            const worstLevel = levels.reduce((worst, current) => current.score < worst.score ? current : worst);

            this.log(`Coneixement -> pitjor puntuació detectada: ${worstLevel.score}`);
            this.selectLevelObject(worstLevel);

            return worstLevel;
        },

        selectPunctualityLevelFromLateDays(lateDays) {
            const row = this.findCriterionRowByLabel(this.rubricConfig.punctualityLabelRegex);
            if (!row) {
                throw new Error('No trobo el criteri de puntualitat a la rúbrica');
            }

            const levels = this.getLevelsFromCriterionRow(row).sort((a, b) => b.score - a.score);
            if (levels.length < 4) {
                throw new Error(`El criteri de puntualitat té ${levels.length} nivells detectats. Esperava almenys 4.`);
            }

            let selectedLevel;

            if (lateDays <= 0) {
                selectedLevel = levels[0];
            } else if (lateDays <= 10) {
                selectedLevel = levels[1];
            } else if (lateDays <= 30) {
                selectedLevel = levels[2];
            } else {
                selectedLevel = levels[3];
            }

            this.log(`Puntualitat -> retard ${lateDays.toFixed(2)} dies, puntuació triada: ${selectedLevel.score}`);
            this.selectLevelObject(selectedLevel);

            return selectedLevel;
        },

        getSaveAndShowNextButton() {
            return document.querySelector('button[name="saveandshownext"]');
        },

        // -----------------------------------------------------
        // ESPERA DEL SEGÜENT ALUMNE EN MODE AJAX
        // -----------------------------------------------------
        waitForNextStudent(previousStudentLabel, previousUserId) {
            const startedAt = Date.now();
            const timeoutMs = 20000;
            let stableSuccessCount = 0;

            this.log('Esperant que Moodle carregui el següent alumne...');

            const tick = () => {
                try {
                    const state = this.getState();

                    if (!this.isStateFresh(state)) {
                        this.stopLoop('Estat caducat mentre s’esperava el següent alumne');
                        return;
                    }

                    const currentStudent = this.getCurrentStudentLabel();
                    const currentUserId = this.getCurrentUserId();
                    const overlayVisible = this.isSavingOverlayVisible();
                    const rubricVisible = this.hasRubricOnPage();

                    const userChanged =
                        !!currentUserId &&
                        !!previousUserId &&
                        currentUserId !== previousUserId;

                    const studentChanged =
                        !!currentStudent &&
                        !!previousStudentLabel &&
                        currentStudent !== previousStudentLabel;

                    this.log(
                        `WAIT tick -> prevUser=${previousUserId}, currUser=${currentUserId}, ` +
                        `overlay=${overlayVisible}, rubric=${rubricVisible}, ` +
                        `studentChanged=${studentChanged}, userChanged=${userChanged}`
                    );

                    const successNow = (userChanged || studentChanged) && rubricVisible && !overlayVisible;

                    if (successNow) {
                        stableSuccessCount += 1;
                    } else {
                        stableSuccessCount = 0;
                    }

                    if (stableSuccessCount >= 2) {
                        this.log(`Nou alumne detectat: ${currentStudent} [userid=${currentUserId}]`);
                        this.touchState({
                            waitingNextStudent: false,
                            previousStudentLabel: currentStudent,
                            previousUserId: currentUserId
                        });

                        setTimeout(() => {
                            this.runLoopStep();
                        }, 500);
                        return;
                    }

                    if (Date.now() - startedAt > timeoutMs) {
                        this.stopLoop(
                            `Timeout esperant la càrrega del següent alumne. ` +
                            `Anterior="${previousStudentLabel}" (${previousUserId}) · ` +
                            `Actual="${currentStudent}" (${currentUserId})`
                        );
                        return;
                    }

                    this.touchState({
                        waitingNextStudent: true,
                        previousStudentLabel,
                        previousUserId
                    });

                    setTimeout(tick, overlayVisible ? 800 : 600);
                } catch (err) {
                    this.error('Error mentre s’esperava el següent alumne:', err.message || err);
                    this.stopLoop('Error durant l’espera del següent alumne');
                }
            };

            setTimeout(tick, 1000);
        },

        getCurrentUserId() {
            const userInfo = document.querySelector('[data-region="user-info"]');
            if (!userInfo) return '';
            return userInfo.getAttribute('data-userid') || '';
        },

        isSavingOverlayVisible() {
            const overlay = document.querySelector('[data-region="overlay"]');
            if (!overlay) return false;

            const style = window.getComputedStyle(overlay);
            return (
                !overlay.hasAttribute('hidden') &&
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                overlay.offsetParent !== null
            );
        },

        // -----------------------------------------------------
        // EXECUCIÓ
        // -----------------------------------------------------
        buildDecision() {
            const student = this.getCurrentStudentLabel();
            const submissionText = this.getSubmissionStatusText();
            const lateDays = this.parseLateDaysFromSubmissionText(submissionText);
            const noSubmission = this.hasNoSubmission(submissionText);

            return {
                student,
                submissionText: submissionText.replace(/\s+/g, ' ').trim(),
                lateDays,
                noSubmission
            };
        },

        applyRubricToCurrentStudent() {
            const decision = this.buildDecision();

            this.log(`Estudiant: ${decision.student}`);
            this.log(`Estat de tramesa: ${decision.submissionText}`);
            this.log(`Retard calculat: ${decision.lateDays.toFixed(2)} dies`);

            let knowledgeLevel;
            let punctualityLevel;

            if (decision.noSubmission) {
                this.log('Detectat cas sense entrega ("Cap intent" o equivalent).');
                knowledgeLevel = this.selectWorstKnowledgeLevel();
                this.log(`Qualitat del codi -> nivell seleccionat amb puntuació ${knowledgeLevel.score}`);

                punctualityLevel = this.selectPunctualityLevelFromLateDays(0);
                this.log(`Puntualitat -> nivell seleccionat amb puntuació ${punctualityLevel.score}`);
            } else {
                knowledgeLevel = this.selectBestKnowledgeLevel();
                this.log(`Qualitat del codi -> nivell seleccionat amb puntuació ${knowledgeLevel.score}`);

                punctualityLevel = this.selectPunctualityLevelFromLateDays(decision.lateDays);
                this.log(`Puntualitat -> nivell seleccionat amb puntuació ${punctualityLevel.score}`);
            }

            return decision;
        },

        runSinglePreview() {
            try {
                this.ensurePanel();

                if (!this.matches()) {
                    this.warn('Aquesta pàgina no sembla una pàgina de grader amb rúbrica.');
                    return;
                }

                if (!this.hasRubricOnPage()) {
                    this.warn('No s’ha detectat una rúbrica operativa a la pàgina.');
                    return;
                }

                if (this.isAlreadyGraded()) {
                    this.warn('Aquest alumne ja està qualificat. No faig cap acció.');
                    return;
                }

                this.applyRubricToCurrentStudent();
                this.log('Prova completada. No s’ha desat res ni s’ha passat al següent alumne.');
            } catch (err) {
                this.error('Error a la prova d’un alumne:', err.message || err);
            }
        },

        startLoop() {
            try {
                this.ensurePanel();

                if (!this.matches()) {
                    this.warn('No estàs en una pàgina compatible per iniciar el bucle.');
                    return;
                }

                const state = this.createRunState();
                this.setState(state);
                this.log(`Bucle activat. runId=${state.runId}`);

                this.runLoopStep();
            } catch (err) {
                this.error('No s’ha pogut iniciar el bucle:', err.message || err);
                this.stopLoop('Error en iniciar el bucle');
            }
        },

        runLoopStep() {
            try {
                const state = this.getState();

                if (!this.isStateFresh(state)) {
                    this.stopLoop('Estat caducat o invàlid');
                    return;
                }

                if (!this.matches()) {
                    this.stopLoop('La pàgina actual ja no encaixa amb el mòdul');
                    return;
                }

                if (!this.hasRubricOnPage()) {
                    this.stopLoop('No s’ha detectat una rúbrica operativa');
                    return;
                }

                if (state.waitingNextStudent) {
                    this.log('Encara esperant el següent alumne...');
                    return;
                }

                if (this.isAlreadyGraded()) {
                    this.stopLoop('S’ha detectat un alumne ja qualificat. Fi del bucle.');
                    return;
                }

                const currentStudentBeforeSave = this.getCurrentStudentLabel();
                const currentUserIdBeforeSave = this.getCurrentUserId();

                this.applyRubricToCurrentStudent();
                this.touchState({
                    previousStudentLabel: currentStudentBeforeSave,
                    previousUserId: currentUserIdBeforeSave
                });

                const btn = this.getSaveAndShowNextButton();
                if (!btn) {
                    this.stopLoop('No trobo el botó "Desa i mostra el següent"');
                    return;
                }

                this.log('Desant canvis i passant al següent alumne...');
                btn.click();

                this.touchState({
                    waitingNextStudent: true,
                    previousStudentLabel: currentStudentBeforeSave,
                    previousUserId: currentUserIdBeforeSave
                });

                this.waitForNextStudent(currentStudentBeforeSave, currentUserIdBeforeSave);
            } catch (err) {
                this.error('Error durant el bucle:', err.message || err);
                this.stopLoop('Error durant el bucle');
            }
        },

        bootstrapAutoResume() {
            try {
                const state = this.getState();
                if (!this.isStateFresh(state)) return;
                if (!this.matches()) return;

                this.ensurePanel();
                this.log(`Auto-represa detectada. runId=${state.runId}`);

                if (state.waitingNextStudent && state.previousStudentLabel) {
                    this.log('Recupero espera del següent alumne...');
                    this.waitForNextStudent(state.previousStudentLabel, state.previousUserId || '');
                    return;
                }

                this.log('Continuo el bucle automàticament en aquesta pàgina...');

                setTimeout(() => {
                    this.runLoopStep();
                }, 700);
            } catch (err) {
                this.error('Error a l’auto-represa:', err.message || err);
                this.stopLoop('Error a l’auto-represa');
            }
        }
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
