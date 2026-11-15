# Jours ouvrés en Suisse

Site statique qui calcule le nombre de jours ouvrés entre un mois de début et un mois de fin, pour chacun des 26 cantons suisses.

## Fonctions

- Filtre par **jour, mois et année** de début et de fin (inclus), avec raccourcis : mois, trimestre, d'aujourd'hui à fin d'année, année en cours, année prochaine
- Choix du **canton** (26 cantons) ; les fériés mobiles (Pâques, Ascension, Pentecôte, Fête-Dieu, Jeûne genevois, Lundi du Jeûne, Näfelser Fahrt…) sont calculés pour n'importe quelle année
- **Taux d'activité** : nombre de jours proratisé (par ex. 80 %)
- **Congés à déduire** : jours de congés pris sur la période (par demi-journée), pour obtenir les jours réellement à travailler
- Détail **mois par mois**, liste des fériés de la période et **calendrier** coloré
- Fériés **personnalisables** : décocher un férié non chômé (mémorisé par canton dans le navigateur)
- **Export CSV** (séparateur `;`, compatible Excel) et impression / PDF
- Lien partageable : la période et le canton sont dans l'URL (`?du=2027-01-01&au=2027-12-31&canton=VD&taux=80&conges=20`)

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
js/holidays.js      règles des fériés par canton et calcul (module réutilisable)
js/app.js           interface
js/version.js       numéro de version affiché
CHANGELOG.md        historique des versions
tests/              tests Node
```

## Limites

Les fériés retenus sont ceux chômés dans tout le canton ou dans sa majorité. Certains fériés ne s'appliquent qu'à une partie du canton (communes catholiques d'Argovie, Fribourg ou Soleure, par exemple) et les demi-jours (Sechseläuten, Knabenschiessen, veilles de fête) ne sont pas comptés. La liste est ajustable directement dans le site.
