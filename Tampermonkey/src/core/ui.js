(function () {
    'use strict';

    window.TM = window.TM || {};

    window.TM.UI = {
        panelId: 'tm-modular-panel',
        dragHandleId: 'tm-modular-panel-header',
        storageKeyPosition: 'tm-modular-panel-position',

        createPanel(platform, modules) {
            const Logger = window.TM.Logger;

            if (document.getElementById(this.panelId)) {
                Logger.warn('El panell ja existeix.');
                return;
            }

            const panel = document.createElement('div');
            panel.id = this.panelId;
            panel.style.position = 'fixed';
            panel.style.right = '20px';
            panel.style.bottom = '20px';
            panel.style.zIndex = '999999';
            panel.style.width = '360px';
            panel.style.background = '#111';
            panel.style.color = '#fff';
            panel.style.border = '3px solid #00d4ff';
            panel.style.borderRadius = '14px';
            panel.style.padding = '0';
            panel.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)';
            panel.style.fontFamily = 'Arial, sans-serif';
            panel.style.overflow = 'hidden';

            const header = document.createElement('div');
            header.id = this.dragHandleId;
            header.style.cursor = 'move';
            header.style.userSelect = 'none';
            header.style.padding = '12px 14px';
            header.style.background = 'linear-gradient(135deg, #00d4ff, #0099cc)';
            header.style.color = '#081018';
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
            title.textContent = 'Panell modular';
            title.style.fontSize = '18px';
            title.style.fontWeight = 'bold';
            title.style.marginBottom = '4px';

            const subtitle = document.createElement('div');
            subtitle.textContent = this.buildSubtitle(platform, modules);
            subtitle.style.fontSize = '12px';
            subtitle.style.lineHeight = '1.35';
            subtitle.style.opacity = '0.95';

            headerTextWrap.appendChild(title);
            headerTextWrap.appendChild(subtitle);

            header.appendChild(dragIcon);
            header.appendChild(headerTextWrap);

            const body = document.createElement('div');
            body.style.padding = '14px';

            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.flexDirection = 'column';
            buttonsContainer.style.gap = '8px';

            if (modules.length === 0) {
                const empty = document.createElement('div');
                empty.textContent = 'No hi ha mòduls disponibles per aquesta pàgina.';
                empty.style.fontSize = '13px';
                empty.style.background = '#1e1e1e';
                empty.style.padding = '10px';
                empty.style.borderRadius = '8px';
                buttonsContainer.appendChild(empty);
            } else {
                modules.forEach(module => {
                    const button = document.createElement('button');
                    button.textContent = `${module.label} (v${module.version || 'sense-versió'})`;
                    button.title = `${module.id} - versió ${module.version || 'sense-versió'}`;
                    button.style.background = '#00d4ff';
                    button.style.color = '#000';
                    button.style.border = 'none';
                    button.style.borderRadius = '10px';
                    button.style.padding = '10px 12px';
                    button.style.fontWeight = 'bold';
                    button.style.cursor = 'pointer';
                    button.style.textAlign = 'left';

                    button.addEventListener('click', () => {
                        try {
                            Logger.log(`Executant mòdul: ${module.id} (v${module.version || 'sense-versió'})`);
                            module.apply();
                        } catch (err) {
                            Logger.error(`Error executant el mòdul ${module.id}:`, err);
                            alert(`Error executant el mòdul ${module.label}. Mira la consola.`);
                        }
                    });

                    buttonsContainer.appendChild(button);
                });
            }

            body.appendChild(buttonsContainer);
            panel.appendChild(header);
            panel.appendChild(body);
            document.body.appendChild(panel);

            this.restorePosition(panel);
            this.makeDraggable(panel, header);

            Logger.log('Panell creat correctament.');
        },

        buildSubtitle(platform, modules) {
            if (!modules || modules.length === 0) {
                return `Plataforma: ${platform.label} · cap mòdul disponible`;
            }

            if (modules.length === 1) {
                return `Plataforma: ${platform.label} · context detectat: ${modules[0].label}`;
            }

            return `Plataforma: ${platform.label} · mòduls disponibles: ${modules.length}`;
        },

        makeDraggable(panel, handle) {
            const Logger = window.TM.Logger;

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

                this.savePosition(panel);
                Logger.log('Nova posició del panell desada.');
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

        savePosition(panel) {
            const rect = panel.getBoundingClientRect();
            const position = {
                left: rect.left,
                top: rect.top
            };
            localStorage.setItem(this.storageKeyPosition, JSON.stringify(position));
        },

        restorePosition(panel) {
            const Logger = window.TM.Logger;
            const raw = localStorage.getItem(this.storageKeyPosition);
            if (!raw) return;

            try {
                const position = JSON.parse(raw);
                if (
                    typeof position.left === 'number' &&
                    typeof position.top === 'number'
                ) {
                    panel.style.left = `${position.left}px`;
                    panel.style.top = `${position.top}px`;
                    panel.style.right = 'auto';
                    panel.style.bottom = 'auto';
                    Logger.log('Posició del panell restaurada.');
                }
            } catch (err) {
                Logger.warn('No s’ha pogut restaurar la posició del panell:', err);
            }
        }
    };
})();
