# Administrer et mettre à jour Z-score Niger

Guide du 14 octobre 2026. L'application publique est gratuite et sans compte. Son interface consulte les références en lecture seule ; aucune API distante d'édition ou de dossier patient n'est présente. L'administration consiste à préparer une version et à contrôler le compte de l'hébergement. Les anciens modules admin côté navigateur sont des démonstrations conservées dans les sources, exclues du cache actuel et du paquet public ; leurs identifiants ne doivent pas servir de protection.

## Environnement et propriété

Node.js 20 ou ultérieur suffit pour le serveur local et la préparation. `fake-indexeddb` 6.2.5 est une dépendance de tests ; aucun paquet npm n'est requis par les utilisateurs du site. R est réservé aux comparaisons scientifiques indépendantes. Ne pas installer de logiciel supplémentaire sans justification et contrôle du budget. Dernière autorisation : cible 3 Go, plafond cumulé 5 Go ; les anciennes mentions de 1 Go sont supersédées.

Le dossier reçu ne contient pas de dépôt Git. Branche, commit et HEAD ne peuvent donc pas être annoncés ; conserver copies et empreintes dans `audit/`. Avant chaque modification, contrôler `git status --short`, `git branch --show-current` et `git rev-parse HEAD` si un dépôt a depuis été créé. Préserver les modifications non liées. Aucun reset destructif, nettoyage global ou suppression de preuves/données.

La licence du code original n'a pas été établie. Conserver les licences tierces, notamment la GPL v3 associée à la source Anthro et les licences PDF/polices. La présence de ces fichiers ne tranche pas les obligations applicables à leur redistribution avec un code que le propriétaire souhaite protéger : documenter les droits et résoudre ce point avant publication. Ne pas déclarer tout le projet sous MIT ou promettre un code navigateur invisible. Un dépôt privé peut protéger l'accès aux sources de développement ; le JavaScript distribué reste consultable.

## Vérifier les ressources tierces

[DROITS_ET_LICENCES.md](../references/DROITS_ET_LICENCES.md) décrit provenance, mentions conservées et décisions ouvertes. **npm run audit:licenses** vérifie les fichiers exacts et leurs notices sans modifier le projet. Préparation et vérification du paquet font également ce contrôle. Son indicateur technicalPassed peut être vrai alors que legalReady reste faux : clarifier les droits de distribution et la titularité du code avant publication. Aucun changement automatique de licence n'est effectué.

## Préparer une version vérifiable

1. Conserver la version précédente, ses sources et son manifeste. Modifier les sources autorisées. Pour une modification de l'application, incrémenter `WorkspaceApp.version`. Une nouvelle ressource nécessaire doit figurer dans `tools/scripts/offline-assets.json` ; ne pas y réintroduire anciens modules admin, anciennes tables ou fichiers de travail.
2. Exécuter `npm run build:release`, puis `npm run check:release`, `npm test`, `npm run audit:clinical` et `npm run audit:licenses`. Conserver les sorties. L'audit distingue preuve technique et statut clinique ; `clinicalReady: false` maintient la revue métier ouverte même si les tests passent.
3. Une modification scientifique exige de figer les sources, contrôler conversion/empreintes, refaire les comparaisons indépendantes et obtenir la revue métier. Ne pas modifier les catégories à partir d'un extrait PCIMA non authentifié. Les résultats précédemment enregistrés gardent leur référence et leurs valeurs.
4. Exécuter `npm run prepare:public`. Il produit un **nouveau** dossier sous `.local/public-builds/`, sans écraser un ancien paquet. Il copie uniquement les ressources actives du manifeste, le worker, le manifeste de release et les en-têtes statiques préparés. Aucun dossier `audit/`, export patient, classeur, dépendance Node ou ancien module de démonstration n'est inclus.
5. Exécuter `node tools/scripts/prepare-public.cjs --verify .local/public-builds/<dossier-produit>`. Archiver le résultat et la release SHA-256. Ce contrôle refuse un fichier ajouté, absent ou altéré ; il ne certifie ni la médecine, ni la propriété du code, ni les droits sur un compte distant. Les dossiers `TEST-NE-PAS-PUBLIER-*` créés par les tests sont des preuves, certaines volontairement altérées ; ne jamais les publier. Utiliser uniquement le nouveau dossier produit par la commande de préparation avec `verified: true`.

Ces commandes préparent des fichiers locaux. **Aucune ne publie le site.** Procédure d'ouverture : [PREPARATION_PUBLICATION.md](../maintenance/PREPARATION_PUBLICATION.md).

## Protection de l'administration

Réserver le compte d'hébergement au propriétaire et aux collaborateurs nécessaires ; activer son authentification forte, conserver ses moyens de récupération et contrôler les droits effectifs. Ne jamais incorporer clé API, mot de passe, jeton d'administration ou secret de publication au JavaScript public. Aucun compte ne doit être exigé du soignant pour les calculs, l'historique ou le mode hors ligne.

Les empreintes SHA-256/SRI contrôlent la cohérence des fichiers avec la page reçue. Une personne contrôlant l'ensemble de l'hébergement pourrait changer page et empreintes : la protection du compte et HTTPS sont indispensables. Si une interface d'édition distante devient nécessaire, définir d'abord une autorisation côté serveur et ses tests ; le verrouillage d'un bouton dans le navigateur ne suffit pas.

## Déploiement, mise à jour et retour arrière

Après validations et feu vert de publication, distribuer les octets du paquet vérifié en une version complète. Désactiver toute transformation automatique des tools/scripts/CSS. Conserver l'ancienne version et l'adresse stable. Vérifier HTTPS, en-têtes, identité de release reçue et protection réelle des droits de publication.

Dans l'application, une version téléchargée attend l'adoption. **Sauvegarder et mettre à jour** conserve d'abord le travail, puis active la version ; les autres onglets doivent être sauvegardés et fermés. Une incohérence doit laisser l'ancienne version disponible. Une correction/retour arrière est préparée comme une autre version complète, sans effacer caches, journaux ou archives. Confirmer la version après adoption ; remettre des fichiers sur le serveur ne remplace pas automatiquement les sessions déjà ouvertes.

Ne pas changer d'adresse sans prévoir le déplacement volontaire des sauvegardes : le navigateur sépare le stockage par origine. Ne pas demander aux utilisateurs d'effacer le navigateur pour adopter une mise à jour.

## Sauvegardes et support

Les dossiers restent dans le navigateur ; sauvegarder le code du serveur ne sauvegarde pas le travail des utilisateurs. Rappeler l'export complet sur support indépendant. Les fichiers sont en clair, sans synchronisation patient dans le cloud. Une copie locale et son original restent sur le même appareil ; les deux peuvent être perdus avec celui-ci.

Demander un cas fictif reproductible, version, appareil/navigateur, date, message et étapes. Conserver les preuves ; ne pas collecter un historique réel par défaut. Avant un import ou une récupération, consulter l'aperçu et garder l'export original. Le même fichier importé peut être signalé ; des exports différents du même travail ne constituent pas nécessairement le même fichier.

Les quotas réellement disponibles, fermeture forcée, redémarrage, import via sélecteur, transfert entre téléphones et lecteur d'écran Android restent à vérifier. Utiliser la [grille terrain](../projet/VALIDATION_TERRAIN.md), sans transformer un test automatisé réussi en validation physique.
