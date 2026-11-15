#!/usr/bin/env sh
# Usage : sh scripts/version.sh 1.2.0
# Met à jour le numéro de version partout, y compris le paramètre ?v= qui force
# les navigateurs (surtout mobiles) à recharger les fichiers après une publication.
set -e
[ -n "$1" ] || { echo "Usage : sh scripts/version.sh X.Y.Z"; exit 1; }
cd "$(dirname "$0")/.."
sed -i.bak -E "s/\?v=[0-9]+\.[0-9]+\.[0-9]+/?v=$1/g" index.html js/app.js
sed -i.bak -E "s/\"version\": \"[^\"]+\"/\"version\": \"$1\"/" package.json
sed -i.bak -E "s/VERSION = '[^']+'/VERSION = '$1'/; s/VERSION_DATE = '[^']+'/VERSION_DATE = '$(date +%F)'/" js/version.js
rm -f index.html.bak js/app.js.bak js/version.js.bak package.json.bak
echo "Version $1 appliquée. Pensez à compléter CHANGELOG.md."
