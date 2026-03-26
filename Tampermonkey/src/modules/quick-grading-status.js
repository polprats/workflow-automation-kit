(function () {
    'use strict';

    window.TM = window.TM || {};
    window.TM.Modules = window.TM.Modules || [];

    const QuickGradingStatusModule = {
        id: 'quick-grading-status',
        version: '2.1.0',
        platform: 'pedralbes',
        label: 'Quick grading per estat',

        matches() {
            const isAssignPage = window.location.pathname.includes('/mod/assign/view.php');
            const hasQuickGradeInputs = !!document.querySelector('input.quickgrade[id^="quickgrade_"]');
            return isAssignPage && hasQuickGradeInputs;
        },

        apply() {
            const MODULE_PREFIX = '[TM Moodle Notes]';
            const panelId = 'tm-moodle-notes-panel';
            const logBoxId = 'tm-moodle-log-box';

            function appendLog(text) {
                const box = document.getElementById(logBoxId);
                if (!box) return;

                const line = document.createElement('div');
                line.textContent = text;
                line.style.marginBottom = '4px';
                box.appendChild(line);
                box.scrollTop = box.scrollHeight;
            }

            function log(...args) {
                console.log(MODULE_PREFIX, ...args);
                appendLog(args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
            }

            function warn(...args) {
                console.warn(MODULE_PREFIX, ...args);
                appendLog('WARN: ' + args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
            }

            function error(...args) {
                console.error(MODULE_PREFIX, ...args);
                appendLog('ERROR: ' + args.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '));
            }

            function normalizeText(str) {
                return (str || '')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .toLowerCase();
            }

            function parseLateDays(statusText) {
                const text = normalizeText(statusText);

                if (!text.includes('tard')) {
                    return 0;
                }

                let days = 0;
                let hours = 0;
                let minutes = 0;

                const daysMatch = text.match(/(\d+)\s+dies?/);
                const hoursMatch = text.match(/(\d+)\s+hores?/);
                const minutesMatch = text.match(/(\d+)\s+minuts?/);

                if (daysMatch) days = parseInt(daysMatch[1], 10);
                if (hoursMatch) hours = parseInt(hoursMatch[1], 10);
                if (minutesMatch) minutes = parseInt(minutesMatch[1], 10);

                return days + (hours / 24) + (minutes / 1440);
            }

            function calculateGradeFromStatus(statusText) {
                const text = normalizeText(statusText);

                if (text.includes("no s'ha tramès") || text.includes("no s’ha tramès")) {
                    return { grade: 0, reason: 'No entregat' };
                }

                if (text.includes("s'ha tramès") || text.includes("s’ha tramès")) {
                    const lateDays = parseLateDays(text);

                    if (lateDays <= 0) {
                        return { grade: 10, reason: 'Entregat a temps' };
                    } else if (lateDays <= 10) {
                        return { grade: 8, reason: `Entregat tard (${lateDays.toFixed(2)} dies)` };
                    } else if (lateDays <= 30) {
                        return { grade: 6, reason: `Entregat tard (${lateDays.toFixed(2)} dies)` };
                    } else {
                        return { grade: 5, reason: `Entregat molt tard (${lateDays.toFixed(2)} dies)` };
                    }
                }

                return { grade: null, reason: `Estat no reconegut: "${statusText}"` };
            }

            function getUserNameFromRow(row) {
                const nameCell = row.querySelector('td.c2');
                return nameCell ? nameCell.textContent.trim() : '(sense nom)';
            }

            function getStatusTextFromRow(row) {
                const statusCell = row.querySelector('td.c4');
                if (!statusCell) return '';
                return statusCell.innerText || statusCell.textContent || '';
            }

            function getGradeInputFromRow(row) {
                return row.querySelector('input.quickgrade[id^="quickgrade_"]');
            }

            function getFeedbackTextareaFromRow(row) {
                return row.querySelector('textarea[id^="quickgrade_comments_"]');
            }

            function isRealStudentRow(row) {
                if (!row) return false;
                if (row.classList.contains('emptyrow')) return false;
                return !!row.querySelector('input.quickgrade[id^="quickgrade_"]');
            }

            function gradeAllRows() {
                const rows = Array.from(document.querySelectorAll('tr[id^="mod_assign_grading-"]'))
                    .filter(isRealStudentRow);

                log(`Files detectades: ${rows.length}`);

                let updated = 0;
                let skipped = 0;

                rows.forEach((row, index) => {
                    const name = getUserNameFromRow(row);
                    const statusText = getStatusTextFromRow(row);
                    const input = getGradeInputFromRow(row);

                    if (!input) {
                        warn(`Fila ${index}: ${name} -> sense input de nota`);
                        skipped++;
                        return;
                    }

                    const result = calculateGradeFromStatus(statusText);

                    if (result.grade === null) {
                        warn(`${name} -> estat no interpretat`, statusText);
                        skipped++;
                        return;
                    }

                    input.value = String(result.grade);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));

                    const feedbackTextarea = getFeedbackTextareaFromRow(row);
                    if (feedbackTextarea) {
                        if (result.grade === 8 || result.grade === 6 || result.grade === 5) {
                            feedbackTextarea.value = "S'ha penalitzat la nota per entregar tard.";
                        } else {
                            feedbackTextarea.value = '';
                        }
                        feedbackTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                        feedbackTextarea.dispatchEvent(new Event('change', { bubbles: true }));
                    }

                    log(`${name} -> ${result.grade} | ${result.reason} | Estat: ${statusText.replace(/\s+/g, ' ').trim()}`);
                    updated++;
                });

                log(`Procés acabat. Actualitzades: ${updated}. Omeses: ${skipped}.`);
            }

            function saveQuickGrades() {
                const btn = document.querySelector('#id_savequickgrades');
                if (!btn) {
                    error('No trobo el botó "Desa tots els canvis de la qualificació ràpida"');
                    return;
                }
                btn.click();
            }

            function makePanelDraggable(panel, handle) {
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
            }

            function createOrFocusUI() {
                const existing = document.getElementById(panelId);
                if (existing) {
                    existing.style.display = 'block';
                    existing.style.zIndex = '1000000';
                    log('Panell ja existent. Reutilitzant-lo.');
                    return;
                }

                const panel = document.createElement('div');
                panel.id = panelId;
                panel.style.position = 'fixed';
                panel.style.right = '20px';
                panel.style.bottom = '20px';
                panel.style.zIndex = '1000000';
                panel.style.background = '#111';
                panel.style.color = '#fff';
                panel.style.border = '3px solid #ffcc00';
                panel.style.borderRadius = '14px';
                panel.style.padding = '0';
                panel.style.width = '360px';
                panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
                panel.style.fontFamily = 'Arial, sans-serif';
                panel.style.overflow = 'hidden';

                const header = document.createElement('div');
                header.style.cursor = 'move';
                header.style.userSelect = 'none';
                header.style.padding = '12px 14px';
                header.style.background = '#1a1a1a';
                header.style.borderBottom = '1px solid #333';
                header.style.display = 'flex';
                header.style.alignItems = 'center';
                header.style.justifyContent = 'space-between';
                header.style.gap = '10px';

                const titleWrap = document.createElement('div');

                const title = document.createElement('div');
                title.textContent = 'Tampermonkey Moodle Notes';
                title.style.fontSize = '18px';
                title.style.fontWeight = 'bold';
                title.style.color = '#ffcc00';
                title.style.marginBottom = '4px';

                const info = document.createElement('div');
                info.textContent = 'Calcula notes segons l’estat i el retard de la tramesa.';
                info.style.fontSize = '13px';
                info.style.lineHeight = '1.4';

                titleWrap.appendChild(title);
                titleWrap.appendChild(info);

                const closeBtn = document.createElement('button');
                closeBtn.textContent = '×';
                closeBtn.style.background = 'transparent';
                closeBtn.style.color = '#ffcc00';
                closeBtn.style.border = '1px solid #ffcc00';
                closeBtn.style.borderRadius = '8px';
                closeBtn.style.width = '32px';
                closeBtn.style.height = '32px';
                closeBtn.style.cursor = 'pointer';
                closeBtn.style.fontSize = '18px';
                closeBtn.style.fontWeight = 'bold';
                closeBtn.addEventListener('click', () => {
                    panel.style.display = 'none';
                });

                header.appendChild(titleWrap);
                header.appendChild(closeBtn);

                const body = document.createElement('div');
                body.style.padding = '14px';

                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = '8px';
                actions.style.flexWrap = 'wrap';

                const btnGrade = document.createElement('button');
                btnGrade.textContent = 'Qualifica ara';
                btnGrade.style.background = '#ffcc00';
                btnGrade.style.color = '#000';
                btnGrade.style.border = 'none';
                btnGrade.style.borderRadius = '10px';
                btnGrade.style.padding = '10px 14px';
                btnGrade.style.fontWeight = 'bold';
                btnGrade.style.cursor = 'pointer';
                btnGrade.addEventListener('click', () => {
                    log('--- Iniciant qualificació automàtica ---');
                    gradeAllRows();
                });

                const btnSave = document.createElement('button');
                btnSave.textContent = 'Desa canvis';
                btnSave.style.background = '#28a745';
                btnSave.style.color = '#fff';
                btnSave.style.border = 'none';
                btnSave.style.borderRadius = '10px';
                btnSave.style.padding = '10px 14px';
                btnSave.style.fontWeight = 'bold';
                btnSave.style.cursor = 'pointer';
                btnSave.addEventListener('click', () => {
                    log('Intentant desar canvis...');
                    saveQuickGrades();
                });

                actions.appendChild(btnGrade);
                actions.appendChild(btnSave);

                const logBox = document.createElement('div');
                logBox.id = logBoxId;
                logBox.style.marginTop = '12px';
                logBox.style.background = '#1e1e1e';
                logBox.style.border = '1px solid #444';
                logBox.style.borderRadius = '8px';
                logBox.style.padding = '8px';
                logBox.style.height = '180px';
                logBox.style.overflow = 'auto';
                logBox.style.fontSize = '12px';
                logBox.style.whiteSpace = 'pre-wrap';

                body.appendChild(actions);
                body.appendChild(logBox);

                panel.appendChild(header);
                panel.appendChild(body);

                document.body.appendChild(panel);
                makePanelDraggable(panel, header);

                log('Panell injectat correctament.');
                log('URL actual: ' + window.location.href);
            }

            createOrFocusUI();
        }
    };

    window.TM.Modules.push(QuickGradingStatusModule);
})();
