# Historique des versions

Toutes les évolutions du site sont listées ici, de la plus récente à la plus ancienne.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et la numérotation suit le [versionnage sémantique](https://semver.org/lang/fr/) :

- **MAJEUR** (2.0.0) : changement qui modifie le fonctionnement ou les résultats existants
- **MINEUR** (1.1.0) : nouvelle fonctionnalité compatible avec l'existant
- **CORRECTIF** (1.0.1) : correction d'erreur (par exemple un jour férié mal défini)

La version affichée en bas du site provient de `js/version.js`. Pour publier une nouvelle version : `sh scripts/version.sh X.Y.Z`, puis compléter ce fichier.

## [Non publié]

### Corrigé
- Rapport de tests : décompte des fonctions exécutées. Les fonctions de même nom (« anonymous_1 », « date »…) étaient fusionnées, ce qui affichait 254 / 343 (74,1 %) au lieu de 341 / 343 (99,4 %). Seules restent non appelées les deux minuteries de l'interface (masquage du message « Lien copié » après 4 s, libération du fichier CSV après 1 s), qui se déclenchent après la fin des tests

## [1.5.1] – 2026-11-15

### Modifié
- **Rapport de tests lisible et synthétique**, sous forme de tableaux expliqués, dans le résumé de chaque exécution GitHub et dans le rapport HTML joint :
  1. verdict en une phrase, puis **indicateurs clés** (tests réussis, couverture du code, fonctions exécutées, échecs, durée) avec objectif, statut et « ce que cela signifie »
  2. **synthèse par domaine** (calcul, jours fériés par pays, saisie et erreurs, affichage, personnalisation, partage et exports, langues, téléphone, compatibilité) avec ce que chaque domaine garantit
  3. **couverture par fichier** avec le rôle de chaque fichier et, s'il y en a, le code jamais exécuté
  4. **détail des tests** par domaine, chacun expliqué en une phrase ; tableau dédié aux tests en échec
- Nouveau catalogue `scripts/test-catalogue.mjs` : domaine et explication de chaque test ; le rapport signale tout test non expliqué

### Corrigé
- Mesure de la couverture : le code exécuté avant un rechargement de page dans un test était perdu (couverture sous-estimée). Couverture réelle : 100 % des lignes

## [1.5.0] – 2026-11-15

### Ajouté
- **Interface en français et en anglais** (ACC-01) : sélecteur FR / EN en haut de page, langue mémorisée ; anglais par défaut, français si le navigateur est en français ; paramètre `lang` dans le lien. Noms des fériés, des régions, notes et sources traduits
- **Nouveaux pays** (DAT-05) :
  - **Royaume-Uni** : Angleterre et pays de Galles, Écosse, Irlande du Nord, avec le report des fériés tombant un week-end (« substitute day ») et les jours exceptionnels de 2020, 2022 et 2023
  - **Pays-Bas** : fêtes officielles ; le Vendredi saint et la fête de la Libération (5 mai) sont proposés sans être comptés
  - **Portugal** : continent, Madère et Açores ; fériés supprimés de 2013 à 2015 gérés ; mardi gras proposé sans être compté
- **Fériés partiels et jours d'usage en optionnel** (DAT-01) : listés mais non comptés par défaut, à cocher s'ils sont chômés
  - Suisse : veille de Noël, Saint-Sylvestre, Sechseläuten et Knabenschiessen (Zurich), fériés catholiques d'Argovie et de Soleure
  - Allemagne : Fête-Dieu en Saxe et en Thuringe, fête de la paix d'Augsbourg, 24 et 31 décembre
  - Autriche : 24 et 31 décembre
- **Source officielle** de chaque pays affichée et cliquable en bas de page (DAT-02)
- **Période rapide** (SIM-02) : une seule liste déroulante remplace les 5 boutons, avec deux nouveaux choix (« Le mois prochain », « 12 prochains mois »)
- **Sélecteur de date du téléphone** (UX-02) : une case par date au lieu de 3 listes jour / mois / année
- **Bouton « Partager »** (UX-04) : fenêtre de partage du téléphone, ou copie du lien sur ordinateur
- **Bouton « Réinitialiser »** et **bulles d'aide (?)** sur le taux d'activité, les congés, les jours ouvrés et les fériés optionnels (UX-05) ; bouton « Rétablir la liste par défaut » pour les fériés
- **Graphique mensuel interactif** (DES-03) : détail du mois (ouvrés, fériés, week-end, jours) au survol ou au toucher
- **Impression / PDF sur une page A4** (DES-04) : en-tête lieu et période, indicateurs, tableau mensuel avec total, fériés comptés ou non, note et source
- **Tests automatiques sur GitHub avec rapport** (QUA-01) : à chaque modification, un rapport par exécution (résumé dans l'onglet Actions et fichier HTML joint) avec résultats et couverture de code ; objectifs couverture ≥ 90 % et tests réussis ≥ 90 %, sinon l'exécution est en échec ; badge dans le README
- **Tests automatiques de l'interface** (QUA-02) : 24 scénarios dans Chromium, sur ordinateur et téléphone simulés, intégrés au même rapport. Première exécution : 50 tests sur 50 réussis, 99,7 % des lignes couvertes
- Lien « Rapport de tests » en bas de page

### Modifié
- Les fériés reportés (Royaume-Uni) et estimés (Espagne) portent une étiquette dédiée au lieu d'une mention dans leur nom
- Les erreurs de saisie ont un code stable, traduit par l'interface
- Le script `scripts/version.sh` met aussi à jour `package.json`

### Corrigé
- Si le navigateur bloque le stockage local (navigation privée stricte), cocher ou décocher un férié n'avait aucun effet : les réglages sont désormais gardés en mémoire pendant la visite

## [1.4.0] – 2026-11-15

### Ajouté
- **Espagne** : choix parmi les 17 communautés autonomes, Ceuta et Melilla
  - 2026 et 2027 : fériés nationaux et de la communauté d'après le **calendrier officiel du BOE** (résolutions BOE-A-2025-21667 et BOE-A-2026-21254), y compris les reports au lundi (lendemain de la Toussaint, de la Constitution, de l'Assomption…)
  - Autres années : estimation à partir des fêtes habituelles, signalée par la mention « estimation » dans la liste des fériés
- **Liechtenstein** : les 13 fériés légaux (loi sur le travail, art. 18)
- **Fériés optionnels** : jours usuels mais non légaux, affichés dans la liste et **non comptés par défaut** ; il suffit de les cocher pour les compter (Liechtenstein : Chandeleur, Saint-Joseph, Vendredi saint, 24 et 31 décembre). Le choix est mémorisé par pays et région
- Tests pour l'Espagne et le Liechtenstein (16 tests)

### Modifié
- Liste des pays : Suisse et France en tête, puis les autres par ordre alphabétique
- Moteur : paramètre `included` de `computeRange()` pour les fériés optionnels ; un pays peut fournir ses fériés année par année (`yearRules`)

## [1.3.0] – 2026-11-15

### Ajouté
- Choix du **pays** : Suisse, **France**, Allemagne, Autriche, Belgique, Italie, Luxembourg
- **France** : 11 jours fériés légaux, avec les zones Métropole, **Alsace-Moselle** (Vendredi saint et Saint-Étienne en plus), Guadeloupe, Martinique, Guyane, La Réunion et Mayotte (commémoration de l'abolition de l'esclavage à la date propre à chacune)
- **Allemagne** : choix parmi les 16 Länder, avec leurs fériés propres (Épiphanie, Fête-Dieu, Assomption, Réformation, Toussaint, Jour de pénitence et de prière en Saxe…) et les fériés récents selon l'année (8 mars à Berlin depuis 2019 et en Mecklembourg depuis 2023, 20 septembre en Thuringe depuis 2019, Réformation à Brême, Hambourg, Basse-Saxe et Schleswig-Holstein depuis 2018)
- **Autriche** (13 fériés), **Belgique** (10), **Luxembourg** (11, dont la Journée de l'Europe depuis 2019), **Italie** (dont la Saint-François d'Assise, 4 octobre, rétablie à partir de 2026)
- Le champ de région s'adapte au pays (« Canton », « Zone », « Land ») et disparaît pour les pays sans différence régionale
- Note explicative propre à chaque pays en bas de page (par exemple, lundi de Pentecôte et journée de solidarité en France)
- Pays et région mémorisés dans le navigateur ; la dernière région utilisée est retrouvée pour chaque pays
- Tests pour la France, l'Allemagne, l'Italie et les autres pays (14 tests)

### Modifié
- Le site s'appelle désormais **« Calculateur de jours ouvrés »** ; le logo affiche le code du pays choisi
- Lien partageable : paramètres `pays` et `region` (par exemple `?pays=FR&region=AM`). Les anciens liens avec `canton=` restent valables et ouvrent la Suisse
- Fériés décochés mémorisés par pays et par région ; les choix faits pour les cantons suisses avant cette version sont conservés
- Export CSV : ligne « Lieu » (pays et région) au lieu de « Canton » ; nom de fichier avec le code du pays
- Moteur de calcul : `holidaysFor(année, pays, région)` et `computeRange({ country, region, … })` ; l'ancien appel avec `canton` reste accepté

## [1.2.0] – 2026-11-15

### Ajouté
- Choix du **jour** de début et de fin, en plus du mois et de l'année : le calcul se fait désormais au jour près (bornes incluses)
- La liste des jours s'adapte au mois et à l'année choisis (28, 29, 30 ou 31) ; un jour trop grand est ramené au dernier jour du mois (31 → 28 en février)
- Raccourci **« D'aujourd'hui à fin d'année »**
- Calendrier : les jours hors période sont grisés (nouvelle légende « Hors période »)
- Détail par mois : pour un mois incomplet, les jours pris en compte sont indiqués (« du 14 au 25 »), y compris dans l'export CSV
- Export CSV : ligne « Période » avec les dates exactes ; nom du fichier avec les dates complètes
- Tests : période au jour près, sur deux mois, jour unique, jour trop grand, date de fin antérieure

### Modifié
- Le lien partageable utilise des dates complètes (`?du=2026-09-14&au=2026-09-25`). Les anciens liens au mois (`?du=2027-01&au=2027-06`) restent valables : ils vont du 1er du premier mois au dernier jour du dernier mois
- Libellés du filtre : « Du » et « Au (inclus) »
- Titre d'impression avec les dates exactes

## [1.1.1] – 2026-11-15

### Corrigé
- Sur téléphone, « Jours à travailler » restait à « – » et les congés n'étaient pas déduits : le navigateur mobile avait gardé en cache le script de la version 1.0.0 alors que la page était déjà en 1.1.0. Les fichiers CSS et JavaScript sont désormais appelés avec le numéro de version (`?v=1.1.1`), ce qui force leur rechargement à chaque nouvelle version.

### Ajouté
- Script `scripts/version.sh` qui met à jour le numéro de version à tous les endroits nécessaires (`js/version.js`, `index.html`, imports de `js/app.js`)

## [1.1.0] – 2026-11-15

### Ajouté
- Champ **« Congés à déduire »** : nombre de jours de congés pris sur la période, saisissable par demi-journée (0,5)
- Indicateur principal **« Jours à travailler »** = jours ouvrés × taux d'activité − congés, avec le détail du calcul affiché dessous
- Indicateur **« Congés déduits »** ; le détail du prorata est déplacé sous « Jours à travailler » et l'indicateur « Jours de week-end » est renommé « Week-end »
- Contrôles de saisie : congés négatifs, non multiples de 0,5 ou supérieurs aux jours ouvrés de la période refusés avec un message d'erreur
- Congés conservés dans le lien partageable (paramètre `conges`)
- Export CSV : ajout du canton, des jours ouvrés proratisés, des congés déduits et des jours à travailler en fin de fichier ; décimales avec virgule pour Excel
- Fonction `workingDays()` dans `js/holidays.js` et tests associés
- Numéro de version affiché en bas de page avec lien vers cet historique (`js/version.js`)
- Ce fichier `CHANGELOG.md`

### Modifié
- L'indicateur mis en avant (encadré rouge) est désormais « Jours à travailler » ; « Jours ouvrés » devient un indicateur secondaire

## [1.0.0] – 2026-11-15

Première version publiée.

### Ajouté
- Page unique, sans dépendance, prête pour GitHub Pages (`index.html`, `css/style.css`, `js/`)
- Filtre par **mois et année de début** et **mois et année de fin** (inclus), avec raccourcis : mois en cours, trimestre en cours, année en cours, année prochaine
- Choix parmi les **26 cantons**, avec leurs jours fériés officiels
- Calcul automatique des fériés mobiles pour toute année : Vendredi saint, lundi de Pâques, Ascension, lundi de Pentecôte, Fête-Dieu, Jeûne genevois, lundi du Jeûne fédéral, Näfelser Fahrt
- Indicateurs : jours ouvrés, fériés tombant en semaine, jours de week-end, jours calendaires
- **Taux d'activité** avec nombre de jours proratisé
- Détail des jours ouvrés **mois par mois** sous forme de barres
- Liste des **jours fériés de la période**, avec possibilité d'en décocher (mémorisé par canton dans le navigateur)
- **Calendrier** mensuel coloré (ouvré, férié, week-end), jusqu'à 36 mois
- **Export CSV** (séparateur `;`, compatible Excel) et **impression / PDF**
- Lien partageable : période, canton et taux dans l'URL
- Thème clair et sombre automatique, affichage mobile
- Tests Node (`npm test`) : dates de Pâques, fériés mobiles, fériés nationaux des 26 cantons, total Vaud 2026, exclusion d'un férié, intervalle inversé
