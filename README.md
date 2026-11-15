# Calculateur de jours ouvrés

Site statique qui calcule le nombre de jours ouvrés entre deux dates, jours fériés inclus, pour :

- la **Suisse** (26 cantons)
- la **France** (Métropole, Alsace-Moselle, Guadeloupe, Martinique, Guyane, La Réunion, Mayotte)
- l'**Allemagne** (16 Länder)
- l'**Autriche**, la **Belgique**, l'**Italie** et le **Luxembourg**

## Fonctions

- Filtre par **jour, mois et année** de début et de fin (inclus), avec raccourcis : mois, trimestre, d'aujourd'hui à fin d'année, année en cours, année prochaine
- Choix du **pays** puis de la **région** (canton, zone ou Land) ; les fériés mobiles (Pâques, Ascension, Pentecôte, Fête-Dieu, Jeûne genevois, Lundi du Jeûne, Näfelser Fahrt…) sont calculés pour n'importe quelle année
- **Taux d'activité** : nombre de jours proratisé (par ex. 80 %)
- **Congés à déduire** : jours de congés pris sur la période (par demi-journée), pour obtenir les jours réellement à travailler
- Détail **mois par mois**, liste des fériés de la période et **calendrier** coloré
- Fériés **personnalisables** : décocher un férié non chômé (mémorisé par canton dans le navigateur)
- **Export CSV** (séparateur `;`, compatible Excel) et impression / PDF
- Lien partageable : la période et le canton sont dans l'URL (`?du=2027-01-01&au=2027-12-31&pays=CH&region=VD&taux=80&conges=20`)

## Utilisation

Aucune installation : ouvrir `index.html` via un petit serveur local (les modules ES ne se chargent pas en `file://`) :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Publication

Le site est prévu pour **GitHub Pages** : Settings → Pages → Source « Deploy from a branch », branche `main`, dossier `/ (root)`.

## Versions

La version courante est affichée en bas du site. L'historique détaillé est dans [CHANGELOG.md](CHANGELOG.md). À chaque évolution : lancer `sh scripts/version.sh X.Y.Z` (met à jour le numéro et force le rechargement des fichiers dans les navigateurs), puis ajouter une entrée au changelog.

## Tests

```bash
npm test
```

## Structure

```
index.html          page
css/style.css       styles (clair / sombre, impression)
js/holidays.js      règles des fériés par pays et région, et calcul (module réutilisable)
js/app.js           interface
js/version.js       numéro de version affiché
CHANGELOG.md        historique des versions
tests/              tests Node
```

## Limites

- Suisse : fériés chômés dans tout le canton ou sa majorité ; certains ne s'appliquent qu'à une partie du canton (communes catholiques d'Argovie, Fribourg ou Soleure, par exemple) et les demi-jours (Sechseläuten, veilles de fête) ne sont pas comptés.
- France : le lundi de Pentecôte est compté comme férié (à décocher si c'est la journée de solidarité travaillée).
- Allemagne : l'Assomption en Bavière ne concerne que les communes à majorité catholique ; les fêtes purement locales (Augsbourg) ne sont pas comptées.
- Autriche, Italie : les fêtes de saints patrons régionaux ou communaux ne sont pas comptées.

La liste des fériés est ajustable directement dans le site.

## Ajouter un pays

Dans `js/holidays.js`, créer une liste de règles (`{ id, nom, date: (année) => Date, regions }`) puis l'ajouter à `COUNTRIES` avec ses régions, sa région par défaut et sa note.
