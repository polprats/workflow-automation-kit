# Workflow Automation Kit

Col·lecció d'eines i scripts per automatitzar tasques repetitives en entorns web, especialment Moodle, mitjançant Tampermonkey.

## Tampermonkey: automatització de qualificacions Moodle

El projecte es va plantejar com un **marc modular de Tampermonkey** amb un nucli compartit (detecció de plataforma, registre de mòduls, interfície i logs) i automatitzacions independents. El mòdul `quick-grading-status.js` (**v2.1.0**) permetia recórrer la taula de qualificació ràpida de Moodle, interpretar si cada alumne havia tramès l'activitat i amb quin retard, assignar automàticament una nota i, quan corresponia, un comentari de penalització. Incloïa un panell flotant arrossegable, registre d'operacions i controls per aplicar i desar les qualificacions. **Estat en què va quedar:** la lògica del mòdul està escrita, però la integració modular no està acabada ni validada per a ús actual: `src/core/platforms.js` és buit, l'instal·lador utilitza dominis ficticis i cal comprovar els selectors de Moodle (en particular el botó de desar). No s'ha verificat el funcionament complet en una instal·lació real recent.

### Regles de qualificació del mòdul `quick-grading-status`

| Estat de tramesa | Nota |
| --- | ---: |
| No tramesa | 0 |
| Tramesa dins del termini | 10 |
| Retard de fins a 10 dies | 8 |
| Retard de més de 10 i fins a 30 dies | 6 |
| Retard superior a 30 dies | 5 |

Quan detecta retard i assigna 8, 6 o 5, escriu el comentari `S'ha penalitzat la nota per entregar tard.` al camp de retroacció, si existeix. El mòdul modifica els camps al navegador; desar els canvis és una acció diferenciada.

> **Important:** aquesta escala avalua l'estat i la puntualitat de les trameses, no la qualitat del contingut. Només és apropiada per a activitats que utilitzin explícitament aquesta regla.

### Altres components

- `Tampermonkey/src/modules/rubric-late-loop.js`: mòdul per seleccionar nivells de rúbrica segons lliurament i retard, amb prova d'un alumne i mode de bucle per avançar entre estudiants. Cal validar-ne el comportament abans d'utilitzar-lo sobre qualificacions reals.
- `Tampermonkey/src/core/`: peces compartides per al registre de mòduls, la interfície, els logs i la detecció de plataforma.
- `Tampermonkey/src/main.js`: inicialització del marc modular.
- `Tampermonkey/moodle-modular.user.js`: capçalera de userscript que carrega els fitxers amb `@require`; actualment és un **exemple**, amb `@match` de dominis ficticis (`example-campus.invalid`, `example-ioc.invalid`), no una instal·lació operativa.

### Pendent abans de reprendre el projecte

1. Implementar la configuració de plataformes a `platforms.js` i revisar la concordança amb el camp `platform: 'pedralbes'` dels mòduls.
2. Configurar els dominis reals de destinació de l'instal·lador, si es decideix desplegar-lo.
3. Verificar sobre una pàgina real els selectors de files, estats, retroaccions i el botó de desar (`#id_savequickgrades` pot no existir en versions actuals de Moodle).
4. Provar primer en un entorn de test o amb alumnes de prova, revisant els resultats abans de desar-los.
5. Afegir proves del càlcul de notes i de la detecció dels diferents textos d'estat.

**Estat general:** prototip funcional a nivell de codi, amb integració i proves pendents. Aquest repositori no inclou necessàriament les versions posteriors dels scripts independents utilitzats a la IOC.
