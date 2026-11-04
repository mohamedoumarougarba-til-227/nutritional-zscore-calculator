# Vérifications numériques publiques

Depuis la racine : `node tools/verification/verify.cjs` ou `npm run verify:public`.

Node 20 ou plus récent suffit. Aucune installation npm, connexion, base de données ou installation R n’est nécessaire. Les fichiers sont des cas fictifs et des résultats numériques conservés de fonctions R OMS non modifiées ; aucun dossier d’enfant ni journal terrain n’est distribué.

Couverture : 7 652 cas OMS 2006, 3 093 cas OMS 2007 et 6 001 valeurs de la fonction de répartition normale. Provenance, empreintes et effectifs sont contrôlés. Les cas avant neuf mois saisis debout vérifient la suspension conservatrice propre à l’application ; ils ne sont pas présentés comme des résultats identiques à ceux du paquet R OMS.

Ces contrôles numériques ne remplacent ni une revue des messages cliniques, ni l’évaluation d’une pratique de soins, ni un essai sur un appareil physique. La suite de développement complète et les audits historiques restent distincts.

Sources : [anthro OMS](https://github.com/WorldHealthOrganization/anthro/tree/b776d8a12b1c97369c748b561159fd2ec4f4db58), [anthroplus OMS](https://github.com/WorldHealthOrganization/anthroplus/tree/7cfcdb39026e9a55de55732bc3cf14c82261bcf7). Licences et notices OMS conservées dans les sources du projet. Les attentes ne doivent pas être régénérées par le moteur que l’on vérifie.

## Compléments et tests publics

La version 5.4.0 ajoute 962 cas des quatre indicateurs facultatifs, évalués avec Python Decimal à 60 chiffres depuis les TSV originaux. Cette vérification indépendante du calcul JavaScript n’exécute pas le paquet R OMS. Le générateur est tools/scripts/build-additional-verification.py. `npm test` lance séparément la suite fonctionnelle publique et refuse une suite vide. Les tests et audits privés restent exclus.

Le profil CDC 5.5.0 est contrôlé dans cette suite par 254 cas Decimal/libm, 161 probabilités et 120 positions de courbes inverses ; les logiciels CDC SAS/R ne sont pas exécutés. Générateur : tools/scripts/build-cdc-verification.py ; méthode : docs/references/CDC.md.

La préparation INTERGROWTH postnatale possède cinq tests publics et 90 cas Decimal à 60 chiffres dans intergrowth-decimal.json. Générateur facultatif sans dépendance : `python tools/scripts/build-intergrowth-verification.py`. Ni GIGS R ni l’application officielle ne sont exécutés. Ce socle n’est pas chargé par l’application et ne propose pas de profil prématuré aux utilisateurs ; voir docs/references/INTERGROWTH.md. `verify:public` contrôle OMS et CDC ; les cas INTERGROWTH sont exécutés par `npm test`.

Six autres tests couvrent le contrat de visite préparé : âge gestationnel/chronologique/PMA, dates exactes, mesures partielles, centiles normaux, suspensions et cohérence d’un record sérialisé. Le contrat n’est pas encore connecté aux profils ou à l’importateur de sauvegardes de l’application ; sa validation interne ne certifie pas les mesures cliniques.
