# Préparation du premier commit

Mise à jour du 21 octobre 2026. Les évolutions jusqu’à 4.1.0 sont synchronisées sur `main`, notamment la distribution GPLv3 au commit signé `33c9f77`. Le contrôle de la sélection reste nécessaire avant chaque prochain commit.

## Politique d’inclusion

La liste exacte se trouve dans tools/git-sync-allowlist.json. .gitignore exclut tout par défaut et ne réinclut que ces chemins : application active (y compris manifestes/SRI/worker), outils de génération et serveur local, notices et fichiers de provenance requis, configuration npm, guides de maintenance. Ajouter un fichier au projet ne l’autorise donc pas automatiquement au commit.

Les bibliothèques PDF et polices dans src/vendor/pdf sont nécessaires à l’export hors ligne ; elles sont conservées avec leurs notices. node_modules n’est jamais inclus. package.json et package-lock.json sont des descriptions nécessaires à l’environnement reproductible, et non des dépendances installées. La dépendance fake-indexeddb reste déclarée pour les tests locaux mais son installation n’est pas envoyée.

Les références OMS 2006/2007, licences, données originales et sources de la variante PDF sont incluses : tools/scripts/audit-licenses.cjs et la préparation du paquet en dépendent. L’inventaire à jour est tools/git-sync-allowlist.json. Aucun autre fichier d’audit ou de test n’est autorisé.

## Restent sur cet ordinateur

Tests et fixtures, résultats de tests, journaux, captures, pilote, autres audits, public-builds, anciennes sources inactives, caches et dossiers d’éditeur, exports/sauvegardes de travail, bases locales, secrets et fichiers d’environnement. Le classeur PCIMA n’est pas inclus. Les plans internes et comptes rendus de validation restent locaux. Aucune suppression n’est effectuée.

Les commandes npm test et npm run audit:clinical ainsi que les liens vers les preuves locales ne sont pas autonomes dans ce périmètre de dépôt : leurs tests/oracles et certaines preuves sont volontairement exclus selon la demande. Ils restent utilisables dans le dossier de travail complet. Le dépôt est une sélection des sources de l’application et de ses outils de construction, pas une copie des preuves du poste. Les droits et obligations des ressources tierces restent décrits dans DROITS_ET_LICENCES.md ; le caractère privé du dépôt ne change pas ces obligations.

## Intégrité et revue

.gitattributes désactive toute conversion de fin de ligne afin de préserver les empreintes des ressources. Avant commit, comparer git ls-files --others --exclude-standard et les éventuels fichiers indexés à tools/git-sync-allowlist.json. Examiner git add --dry-run -- . ; vérifier les exclusions avec git check-ignore -v. L’index doit rester vide pendant cette revue. Le contrôle local et l’inventaire lisible sont conservés sous .local/audit/2026-10-17/reorganisation/ et ne sont pas proposés au commit.

Aucun commit, aucun push, aucune installation, aucune modification des sources applicatives n’est autorisé automatiquement par ce document.

La version 4.0.0 ajoute les données, sources/licence OMS 2007 et les modules de combinaison. Les deux constructeurs de données utilisent Python standard ; le lancement et la release n’installent aucune dépendance. Les preuves/tests locaux restent exclus selon la politique actuelle.

## Liaison Vercel

Le projet `zscore-niger` (`prj_NDSyq5yfLyYBhmzHXPpTkjm3DzjG`), dans l’équipe `mohameds-projects-0af41c6a`, est relié au dépôt privé `mohamedoumarougarba-til-227/nutritional-zscore-calculator`. Le titulaire a autorisé ce dépôt dans l’application GitHub Vercel. La branche de production est `main` ; les push sur cette branche utilisent l’intégration Git native, sans jeton ajouté au dépôt.

Construction : Node 24.x, commande `node tools/scripts/vercel-build.cjs`, installation npm désactivée, sortie `dist`. Le build vérifie les sources/notices GPL et la cohérence du paquet avant distribution. Une modification de documentation incluse dans les sources exige aussi `node tools/scripts/build-release.cjs`, car elle change l’archive correspondante et son empreinte.

L’alias prévu est `https://zscore-niger.vercel.app`. La production est accessible au public sans connexion Vercel ; l’authentification reste active pour les préversions. Une liaison Git réussie ne prouve pas à elle seule le déploiement automatique : contrôler un déploiement dont la source est `git`, le SHA exact du commit poussé, l’état `READY`, puis les ressources réellement servies. Les preuves de ce contrôle restent sous `.local/audit/`, hors dépôt.

Les réglages `gitProviderOptions.createDeployments` et `disableRepositoryDispatchEvents` concernent les événements/statuts GitHub ; ils ne doivent pas être confondus avec une validation du déclenchement des builds Vercel.

Vercel réécrit `vercel.json` avant le build. La copie de référence `tools/reference/vercel-config.json` conserve les octets revus pour l’archive des sources. Hors environnement Vercel, toute différence entre les deux fichiers bloque la construction : les modifier ensemble lors d’un changement d’hébergement. Les autres fichiers restent vérifiés sans exception.
