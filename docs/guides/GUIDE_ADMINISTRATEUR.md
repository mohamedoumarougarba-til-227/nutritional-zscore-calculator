# Administrer et mettre à jour Z-score Niger

Guide actuel pour les sources 5.6.0 et le moteur combiné 4.4.0. L'application publique est gratuite et sans compte. Son interface consulte les références en lecture seule ; aucune API distante d'édition ou de dossier patient n'est présente. L'administration consiste à préparer une version et à contrôler le compte de l'hébergement. Aucun module d'administration côté navigateur n'est distribué ; les références publiques ne sont modifiables que par une nouvelle publication du titulaire.

## Environnement et propriété

Node.js 20 ou ultérieur suffit pour le serveur local et la préparation. `fake-indexeddb` 6.2.5 est une dépendance de tests ; aucun paquet npm n'est requis par les utilisateurs du site. R est réservé aux comparaisons scientifiques indépendantes. Ne pas installer de logiciel supplémentaire sans justification et contrôle du budget. Le plafond actif de téléchargement est de 1 Go cumulé. Les anciens plafonds cités dans les journaux historiques ne s'appliquent plus.

Le dépôt Git local est créé, lié au dépôt public `mohamedoumarougarba-til-227/nutritional-zscore-calculator`. La livraison fonctionnelle 5.0.0 correspond au commit signé `cede1e4`. Avant toute modification ou commit, contrôler `git status --short`, `git branch --show-current`, `git rev-parse HEAD` et le diff indexé. Préserver les changements non liés, les données et les preuves ; aucune réécriture d'historique ou purge globale.

Le titulaire a choisi **GPLv3** pour son code original. Conserver `COPYING`, `NOTICE.md`, les notices tierces et les archives de sources correspondantes téléchargeables. Le dépôt GitHub est public ; les dossiers, audits et preuves privés restent exclus. Les sources distribuées sont réutilisables conformément aux licences. Voir [distribution GPL](../references/DISTRIBUTION_GPL.md).

## Vérifier les ressources tierces

`npm run audit:licenses` vérifie les ressources, notices et archives exactes. `licenseDistributionReady` est le contrôle utilisé par le build de publication. Le champ général `legalReady` ne remplace ni une décision juridique ni la revue des conditions d'hébergement ; son état ne signifie pas que le choix GPL serait encore en attente. Les anciens constats de droits propriétaires non résolus sont historiques.

## Portée de l’audit du moteur combiné 4.1.0

`npm run audit:clinical` contrôle maintenant les deux références sur le moteur combiné actuel : 7 652 cas OMS 2006, 3 093 cas de noyau OMS 2007 et 880 entrées en jours. Une preuve OMS 2007 manquante/altérée ou une différence donne un statut technique en échec ; `clinicalReady: false` ne devient pas une validation professionnelle. Les oracles indépendants sont conservés localement, non téléchargés au lancement et exclus de la sélection Git actuelle. Cette commande nécessite donc le dossier local complet, comme les tests. [Preuves et commandes](../../.local/audit/2026-10-19/audit-combine/rapport.md).

## Préparer une version vérifiable

1. Conserver la version précédente, ses sources et son manifeste. Modifier les sources autorisées. Pour une modification de l'application, incrémenter `WorkspaceApp.version`. Une nouvelle ressource nécessaire doit figurer dans `tools/scripts/offline-assets.json` ; ne pas y réintroduire anciens modules admin, anciennes tables ou fichiers de travail.
2. Exécuter `npm run build:release`, puis `npm run check:release`, `npm test`, `npm run audit:clinical` et `npm run audit:licenses`. Conserver les sorties. L'audit distingue preuve technique et statut clinique ; `clinicalReady: false` maintient la revue métier ouverte même si les tests passent.
3. Une modification scientifique exige de figer les sources, contrôler conversion/empreintes, refaire les comparaisons indépendantes et obtenir la revue métier. Ne pas modifier les catégories à partir d'un extrait PCIMA non authentifié. Les résultats précédemment enregistrés gardent leur référence et leurs valeurs.
4. Exécuter `npm run prepare:public`. Il produit un **nouveau** dossier sous `.local/public-builds/`, sans écraser un ancien paquet. Il copie uniquement les ressources actives du manifeste, le worker, le manifeste de release et les en-têtes statiques préparés. Aucun dossier `audit/`, export patient, classeur, dépendance Node ou ancien module de démonstration n'est inclus.
5. Exécuter `node tools/scripts/prepare-public.cjs --verify .local/public-builds/<dossier-produit>`. Archiver le résultat et la release SHA-256. Ce contrôle refuse un fichier ajouté, absent ou altéré ; il ne certifie ni la médecine, ni la propriété du code, ni les droits sur un compte distant. Les dossiers `TEST-NE-PAS-PUBLIER-*` créés par les tests sont des preuves, certaines volontairement altérées ; ne jamais les publier. Utiliser uniquement le nouveau dossier produit par la commande de préparation avec `verified: true`.

Ces commandes préparent des fichiers locaux. **Aucune ne publie le site.** Un push sur `main` déclenche en revanche automatiquement Vercel ; traiter ce push comme une publication. Procédure : [PREPARATION_PUBLICATION.md](../maintenance/PREPARATION_PUBLICATION.md).

## Protection de l'administration

Réserver le compte d'hébergement au propriétaire et aux collaborateurs nécessaires ; activer son authentification forte, conserver ses moyens de récupération et contrôler les droits effectifs. Ne jamais incorporer clé API, mot de passe, jeton d'administration ou secret de publication au JavaScript public. Aucun compte ne doit être exigé du soignant pour les calculs, l'historique ou le mode hors ligne.

Les empreintes SHA-256/SRI contrôlent la cohérence des fichiers avec la page reçue. Une personne contrôlant l'ensemble de l'hébergement pourrait changer page et empreintes : la protection du compte et HTTPS sont indispensables. Si une interface d'édition distante devient nécessaire, définir d'abord une autorisation côté serveur et ses tests ; le verrouillage d'un bouton dans le navigateur ne suffit pas.

## Déploiement, mise à jour et retour arrière

La publication actuelle a été autorisée par le titulaire. Vercel est relié à `main` ; chaque push sur cette branche déclenche le build contrôlé et la publication sur https://zscore-niger.vercel.app/. Les préversions restent protégées. Contrôler le SHA Git, l'état READY et les octets réellement servis à chaque livraison. Désactiver toute transformation automatique des fichiers JavaScript/CSS. Conserver l'ancienne version et l'adresse stable. Vérifier HTTPS, en-têtes, identité de release reçue et protection réelle des droits de publication.

Dans l'application, une version téléchargée attend l'adoption. **Sauvegarder et mettre à jour** conserve d'abord le travail, puis active la version ; les autres onglets doivent être sauvegardés et fermés. Une incohérence doit laisser l'ancienne version disponible. Une correction/retour arrière est préparée comme une autre version complète, sans effacer caches, journaux ou archives. Confirmer la version après adoption ; remettre des fichiers sur le serveur ne remplace pas automatiquement les sessions déjà ouvertes.

Ne pas changer d'adresse sans prévoir le déplacement volontaire des sauvegardes : le navigateur sépare le stockage par origine. Ne pas demander aux utilisateurs d'effacer le navigateur pour adopter une mise à jour.

## Sauvegardes et support

Le sélecteur de fichiers et le retour de focus après confirmation/annulation sont vérifiés sur PC dans les trois langues ; les parcours physiques Android restent distincts. [Parcours natif PC](../../.local/audit/2026-10-19/focus-import/rapport.md).

Les dossiers restent dans le navigateur ; sauvegarder le code du serveur ne sauvegarde pas le travail des utilisateurs. Rappeler l'export complet sur support indépendant. Le format complet courant est `.zscore`, avec une option chiffrée `.zscore.enc` par mot de passe. Les anciens formats JSON ne sont plus acceptés. Seul le fichier exporté chiffré est protégé : données du navigateur, imports préparés, sauvegardes ordinaires, CSV et PDF restent en clair, sans synchronisation patient dans le cloud. Aucun mot de passe n'est conservé et il n'existe pas de récupération si celui-ci est perdu. Une copie locale et son original restent sur le même appareil ; les deux peuvent être perdus avec celui-ci.

Demander un cas fictif reproductible, version, appareil/navigateur, date, message et étapes. Conserver les preuves ; ne pas collecter un historique réel par défaut. Avant un import ou une récupération, consulter l'aperçu et garder l'export original. Le même fichier importé peut être signalé ; des exports différents du même travail ne constituent pas nécessairement le même fichier.

Les quotas réellement disponibles, fermeture forcée, redémarrage, import via sélecteur sur Android, transfert entre téléphones et lecteur d'écran Android restent à vérifier. Utiliser la [grille terrain](../projet/VALIDATION_TERRAIN.md), sans transformer un test automatisé réussi en validation physique.

## Vérification publique — 5.3.0

`npm run verify:public` fonctionne à partir du clone ou des sources distribuées, sans npm install, R ou `.local`. Il vérifie les cas numériques fictifs et les résultats R conservés sous `tools/verification/`. La suite de développement et les audits historiques restent locaux. Le numéro du paquet npm suit désormais celui de l’interface ; le moteur garde sa propre version 4.1.0 puisqu’aucune formule n’a changé. Les nouveaux imports peuvent être répartis en plusieurs travaux ; vérifier également restauration, conservation des versions et exports des grands lots. Les tables complémentaires recherchées restent des sources de travail et ne sont pas actives dans 5.3.0.

## Contrôles actuels

`npm test` lance le socle public autonome ; `npm run test:private` conserve la suite locale distincte. Voir [CONTRIBUTING](../../CONTRIBUTING.md), [Méthode](../references/METHODE.md) et [releases](../maintenance/COMPOSANTS_ET_RELEASES.md). Une ancienne livraison signée ne démontre pas l’état du workspace courant.
