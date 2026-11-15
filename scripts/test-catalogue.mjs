// Catalogue des tests pour le rapport : domaine et explication en langage courant de chaque test.
// À compléter à chaque nouveau test (le rapport signale les tests absents du catalogue).

/** Domaines, dans l'ordre d'affichage, avec ce qu'ils garantissent. */
export const DOMAINES = [
  { id: 'calcul', nom: 'Calcul des jours ouvrés', but: 'Le nombre de jours ouvrés, de week-ends et de jours à travailler est exact.' },
  { id: 'feries', nom: 'Jours fériés par pays', but: "Chaque pays et chaque région ont les bons jours fériés, aux bonnes dates, selon l'année." },
  { id: 'saisie', nom: "Saisie et messages d'erreur", but: 'Une saisie impossible est refusée avec un message clair, sans résultat faux.' },
  { id: 'affichage', nom: 'Affichage et navigation', but: "Les écrans, listes, graphiques et boutons d'aide réagissent comme prévu." },
  { id: 'personnalisation', nom: 'Fériés personnalisés et préférences', but: 'Les fériés cochés ou décochés et les réglages sont pris en compte et retrouvés.' },
  { id: 'exports', nom: 'Partage, impression et export', but: 'Le lien partagé, le PDF A4 et le fichier CSV contiennent les bonnes informations.' },
  { id: 'langues', nom: 'Langues (français / anglais)', but: 'Tout le site est disponible dans les deux langues, sans texte manquant.' },
  { id: 'mobile', nom: 'Téléphone et robustesse', but: "Le site s'affiche correctement sur téléphone et fonctionne même dans un navigateur restrictif." },
  { id: 'compat', nom: 'Compatibilité avec les versions précédentes', but: 'Les anciens liens et anciens réglages des utilisateurs continuent de fonctionner.' },
];

/** Nom exact du test → [domaine, ce qui est vérifié]. */
export const TESTS = {
  // ---- Moteur de calcul
  'date de Pâques': ['feries', 'La date de Pâques, base de nombreux fériés mobiles (Ascension, Pentecôte…), est juste pour plusieurs années.'],
  'fériés mobiles particuliers': ['feries', 'Les fériés suisses à date variable (Jeûne genevois, Lundi du Jeûne, Ascension, Pentecôte) tombent au bon jour.'],
  'les 26 cantons ont au moins les fériés nationaux': ['feries', 'Chaque canton suisse a bien Nouvel An, Ascension, 1er Août et Noël.'],
  'comptage Vaud 2026': ['calcul', "Vaud 2026 : 365 jours, 104 de week-end, 8 fériés en semaine, donc 253 jours ouvrés (valeur de référence)."],
  "férié exclu par l'utilisateur": ['calcul', 'Un férié décoché par la personne redevient un jour ouvré dans le calcul.'],
  'intervalle inversé refusé': ['saisie', 'Une date de fin antérieure à la date de début est refusée par le moteur.'],
  'période au jour près': ['calcul', "Les périodes partielles (quelques jours, un seul jour, à cheval sur deux mois) sont comptées exactement."],
  'jour trop grand ramené à la fin du mois': ['saisie', 'Un jour inexistant (31 février) est ramené au dernier jour du mois au lieu de provoquer une erreur.'],
  'déduction des congés': ['calcul', 'Jours à travailler = jours ouvrés × taux d\'activité − congés, demi-journées comprises.'],
  'congés invalides refusés': ['saisie', 'Des congés négatifs, non multiples de 0,5 ou supérieurs aux jours ouvrés sont refusés.'],
  'France métropole et Alsace-Moselle': ['feries', 'France : 11 fériés légaux en métropole, 13 en Alsace-Moselle, et 254 jours ouvrés en 2027.'],
  "Allemagne : fériés selon le Land et l'année": ['feries', "Allemagne : fériés propres à chaque Land et fériés récents appliqués seulement à partir de leur année de création."],
  'Italie : 4 octobre férié à partir de 2026': ['feries', "Italie : la Saint-François (4 octobre) est fériée à partir de 2026, pas avant."],
  'autres pays : nombre de fériés légaux': ['feries', 'Autriche, Belgique, Luxembourg : le nombre de fériés légaux est exact ; chaque région de chaque pays a ses fériés.'],
  'Espagne : calendrier officiel 2026 et 2027, estimation sinon': ['feries', "Espagne : calendrier officiel du BOE pour 2026 et 2027 (Madrid 2027 = 251 jours ouvrés), estimation signalée pour les autres années."],
  'Liechtenstein : fériés non légaux proposés mais non comptés par défaut': ['feries', 'Liechtenstein : 13 fériés légaux comptés, 5 jours d\'usage proposés sans être comptés.'],
  'Royaume-Uni : reports des fériés du week-end comme GOV.UK': ['feries', 'Royaume-Uni : nombre de fériés par nation et reports au lundi identiques aux données officielles GOV.UK.'],
  'Pays-Bas : fête du Roi et fériés non obligatoires': ['feries', 'Pays-Bas : fête du Roi avancée au samedi si besoin, Vendredi saint et 5 mai proposés sans être comptés.'],
  'Portugal : fériés nationaux et régionaux': ['feries', 'Portugal : 13 fériés obligatoires, fêtes de Madère et des Açores, fériés supprimés de 2013 à 2015.'],
  'Suisse : fériés partiels et demi-jours en optionnel': ['feries', 'Suisse : Sechseläuten, veille de Noël, fériés catholiques d\'Argovie… proposés sans changer le total par défaut.'],
  "Allemagne et Autriche : jours d'usage optionnels": ['feries', "Allemagne et Autriche : jours d'usage (24 et 31 décembre, Fête-Dieu partielle) proposés sans être comptés."],
  'erreurs avec un code stable': ['saisie', "Chaque erreur a un code fixe, ce qui permet de l'afficher dans la bonne langue."],
  'chaque pays a une source officielle et une note': ['feries', 'Chaque pays affiche un lien vers sa source officielle et une note explicative.'],
  'aucune traduction anglaise ne manque': ['langues', 'Tous les noms de fériés, régions, pays, notes et textes de l\'interface existent en anglais.'],
  'détection de la langue': ['langues', 'La langue est choisie dans le bon ordre : lien, puis choix mémorisé, puis langue du navigateur.'],
  'textes et paramètres dans les deux langues': ['langues', 'Les textes avec des valeurs variables (taux, nombres) s\'affichent correctement en français et en anglais.'],
  // ---- Interface
  'ouverture en français : résultats, version, source officielle': ['affichage', "À l'ouverture : bons résultats, numéro de version, source officielle, 12 mois de calendrier, aucune erreur."],
  'anglais par défaut hors navigateur francophone, puis passage en français mémorisé': ['langues', "Un navigateur non francophone voit le site en anglais ; le passage au français est retenu à la visite suivante."],
  "langue imposée par le lien (?lang=en) et conservée dans l'URL": ['langues', 'Un lien avec la langue ouvre le site dans cette langue et la garde dans le lien partagé.'],
  'anciens liens : canton= et dates au mois': ['compat', 'Les liens créés avec les premières versions (canton, mois) ouvrent toujours le bon calcul.'],
  "dates du téléphone : saisie d'une période au jour près": ['calcul', 'Les dates choisies avec le sélecteur donnent le bon résultat et le détail des mois incomplets.'],
  "messages d'erreur de saisie": ['saisie', "Dates inversées ou vides, congés impossibles : un message clair s'affiche et le résultat est masqué."],
  'période rapide : chaque choix remplit les dates': ['affichage', 'Chaque choix de la liste « Période rapide » remplit les bonnes dates de début et de fin.'],
  'pays : région masquée si inutile, libellés adaptés, région mémorisée par pays': ['affichage', 'Le choix de la région s\'adapte au pays (canton, nation…), disparaît si inutile et est retenu par pays.'],
  "taux d'activité et congés : détail du calcul": ['calcul', 'Le résultat principal et son détail (« 202,4 à 80 % − 20 congés ») sont exacts et à jour.'],
  "fériés : décocher, cocher un jour d'usage, rétablir la liste": ['personnalisation', 'Décocher un férié ou cocher un jour d\'usage modifie le total, est retenu, et « Rétablir » annule tout.'],
  'étiquettes : estimation (Espagne) et report (Royaume-Uni)': ['affichage', 'Les étiquettes « estimation » et « report » apparaissent ; une période sans férié l\'indique clairement.'],
  'réinitialiser remet les réglages par défaut': ['personnalisation', 'Le bouton « Réinitialiser » remet pays, région, dates, taux et congés à leurs valeurs par défaut.'],
  "bulles d'aide : ouverture et fermeture": ['affichage', 'Les boutons « ? » ouvrent et ferment leur explication.'],
  "graphique mensuel : détail d'un mois au clic": ['affichage', 'Un clic sur un mois du graphique affiche son détail (ouvrés, fériés, week-end), un second clic le ferme.'],
  'partager : fenêtre de partage du téléphone': ['exports', 'Sur téléphone, « Partager » ouvre la fenêtre de partage avec le lien du calcul.'],
  'partager : partage annulé ou impossible, puis copie du lien': ['exports', 'Si le partage est annulé, rien ne se passe ; s\'il est impossible, le lien est copié et un message le confirme.'],
  'partager sans presse-papiers : le lien est affiché': ['exports', 'Si le lien ne peut pas être copié, il est affiché pour être copié à la main.'],
  'impression : document A4 récapitulatif': ['exports', "L'impression produit le récapitulatif A4 (indicateurs, tableau mensuel avec total, fériés comptés ou non)."],
  'export CSV en français et en anglais': ['exports', 'Le fichier CSV a le bon nom, les bons chiffres et les bons libellés dans les deux langues.'],
  'export CSV inactif quand la saisie est en erreur': ['exports', "Aucun fichier n'est produit tant que la saisie est en erreur."],
  'longue période : calendrier limité à 36 mois': ['affichage', 'Au-delà de 36 mois, le calendrier est remplacé par un message ; le détail par mois reste complet.'],
  "téléphone : pas de défilement horizontal, aucun message d'erreur": ['mobile', "Sur un téléphone simulé, la page tient en largeur, sans erreur, et le résultat est exact."],
  'fonctionne même sans stockage local (navigation privée stricte)': ['mobile', 'Même si le navigateur bloque l\'enregistrement local, le calcul et la personnalisation des fériés fonctionnent.'],
  'anciens réglages enregistrés : canton et fériés décochés repris': ['compat', 'Les réglages enregistrés par les anciennes versions (canton, fériés décochés) sont repris.'],
};

/** Rôle de chaque fichier de code, pour le tableau de couverture. */
export const FICHIERS = {
  'js/app.js': 'Interface : formulaire, résultats, graphique, calendrier, partage, impression, CSV',
  'js/holidays.js': 'Moteur : règles des jours fériés de chaque pays et calculs',
  'js/i18n.js': 'Traductions français / anglais',
  'js/version.js': 'Numéro de version affiché',
};
