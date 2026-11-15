# Calculateur de jours ouvrés

[![Tests](https://github.com/PascalGir/JoursOuvr-s/actions/workflows/tests.yml/badge.svg)](https://github.com/PascalGir/JoursOuvr-s/actions/workflows/tests.yml)

Site statique, en **français et en anglais**, qui calcule le nombre de jours ouvrés entre deux dates, jours fériés inclus, pour :

- la **Suisse** (26 cantons)
- la **France** (Métropole, Alsace-Moselle, Guadeloupe, Martinique, Guyane, La Réunion, Mayotte)
- l'**Allemagne** (16 Länder)
- l'**Espagne** (17 communautés autonomes, Ceuta, Melilla ; calendrier officiel du BOE pour 2026 et 2027, estimation pour les autres années)
- le **Royaume-Uni** (Angleterre et pays de Galles, Écosse, Irlande du Nord ; reports des fériés du week-end)
- le **Portugal** (continent, Madère, Açores)
- l'**Autriche**, la **Belgique**, l'**Italie**, le **Liechtenstein**, le **Luxembourg** et les **Pays-Bas**

Site en ligne : https://pascalgir.github.io/JoursOuvr-s/

## Fonctions

- Dates de début et de fin (incluses) avec le **sélecteur de date du téléphone**, et une liste **« Période rapide »** : ce mois, le mois prochain, ce trimestre, d'aujourd'hui à fin d'année, cette année, l'an prochain, 12 prochains mois
- Choix du **pays** puis de la **région** (canton, zone, Land, nation…) ; les fériés mobiles sont calculés pour n'importe quelle année
- **Taux d'activité** et **congés à déduire** (par demi-journée) pour obtenir les jours réellement à travailler
- **Graphique mensuel interactif** (détail du mois au survol ou au toucher), liste des fériés et **calendrier** coloré
- Fériés **personnalisables** : décocher un férié non chômé, cocher un **jour d'usage** (veille de Noël, Sechseläuten, Vendredi saint aux Pays-Bas…) ; bouton pour rétablir la liste par défaut
- **Source officielle** de chaque pays affichée en bas de page
- **Bulles d'aide (?)**, bouton **Réinitialiser**, bouton **Partager** (fenêtre de partage du téléphone ou copie du lien)
- **Impression / PDF** : récapitulatif sur une page A4 (indicateurs, tableau mensuel, fériés, source)
- **Export CSV** (séparateur `;`, compatible Excel)
- Lien partageable : `?du=2027-01-01&au=2027-12-31&pays=CH&region=VD&taux=80&conges=20` (et `&lang=en` pour imposer la langue)
- Langue : anglais par défaut, français si le navigateur est en français ; sélecteur FR / EN en haut de page

## Utilisation en local

Aucune installation pour le site : le servir avec un petit serveur (les modules ES ne se chargent pas en `file://`) :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Publication

**GitHub Pages** : Settings → Pages → Source « Deploy from a branch », branche `main`, dossier `/ (root)`.

## Versions

La version courante est affichée en bas du site. L'historique détaillé est dans [CHANGELOG.md](CHANGELOG.md). À chaque évolution : `sh scripts/version.sh X.Y.Z` (met à jour le numéro partout et force le rechargement des fichiers dans les navigateurs), puis compléter le changelog.

## Tests et rapport de tests

```bash
npm ci                                   # une fois : installe Playwright
npx playwright install chromium          # une fois : installe le navigateur de test
npm test                                 # tous les tests
npm run test:report                      # tests + rapport (reports/rapport.html)
```

- **Tests du moteur** (`tests/holidays.test.mjs`, `tests/i18n.test.mjs`) : dates de Pâques, fériés de chaque pays et région, reports britanniques, totaux de référence, traductions complètes.
- **Tests de l'interface** (`tests/ui.test.mjs`) : le site est ouvert dans Chromium, sur ordinateur et sur téléphone simulé ; un robot clique, saisit et vérifie les résultats affichés (périodes, erreurs, fériés, partage, impression, CSV, langues…).
- **Rapport automatisé** (`scripts/test-report.mjs`) : nombre de tests réussis, **couverture des lignes** (Node pour le moteur, Chromium pour la page) par fichier, avec les lignes non couvertes.
- **Objectifs** : couverture **≥ 90 %** et tests réussis **≥ 90 %**. En dessous, l'exécution est en échec (modifiables avec `COVERAGE_MIN` et `PASS_RATE_MIN`).
- **Sur GitHub** : à chaque envoi de code, le workflow `Tests` publie le rapport dans le résumé de l'exécution (onglet **Actions**) et le joint en fichier (`rapport-tests-N`, conservé 90 jours). Le badge en haut de cette page indique l'état de la dernière exécution.

## Structure

```
index.html               page
css/style.css            styles (clair / sombre, impression A4)
js/holidays.js           règles des fériés par pays et région, et calcul (module réutilisable)
js/i18n.js               traductions français / anglais
js/app.js                interface
js/version.js            numéro de version affiché
tests/                   tests du moteur, des traductions et de l'interface
scripts/test-report.mjs  rapport de tests (résultats + couverture)
scripts/version.sh       changement de version
.github/workflows/       tests automatiques sur GitHub
CHANGELOG.md             historique des versions
```

## Limites

- Suisse : fériés chômés dans tout le canton ou sa majorité ; les demi-jours d'usage et les fériés catholiques d'Argovie et de Soleure sont proposés sans être comptés.
- France : le lundi de Pentecôte est compté comme férié (à décocher si c'est la journée de solidarité travaillée).
- Allemagne : l'Assomption en Bavière ne concerne que les communes à majorité catholique ; la Fête-Dieu en Saxe et en Thuringe (certaines communes) et la fête de la paix d'Augsbourg sont proposées sans être comptées.
- Espagne : les 2 fêtes locales de chaque commune et les fêtes propres à chaque île des Canaries ne sont pas comptées. Le calendrier officiel est à ajouter chaque année dans `ES_OFFICIEL` (`js/holidays.js`) dès sa publication au BOE (en général en octobre).
- Royaume-Uni : les jours exceptionnels décidés par le gouvernement sont intégrés jusqu'en 2023 ; un nouveau jour exceptionnel serait à ajouter dans `UK_EXCEPTIONS`.
- Pays-Bas : aucun férié n'est un jour chômé obligatoire ; le Vendredi saint et le 5 mai sont proposés sans être comptés.
- Portugal : les fêtes municipales ne sont pas comptées.

## Ajouter un pays

Dans `js/holidays.js`, créer une liste de règles (`{ id, nom, date: (année) => Date, regions, optionnel? }`) puis l'ajouter à `COUNTRIES` avec ses régions, sa région par défaut, sa note et sa source officielle. Ajouter ensuite les traductions anglaises dans `js/i18n.js` : le test `aucune traduction anglaise ne manque` signale tout oubli.
