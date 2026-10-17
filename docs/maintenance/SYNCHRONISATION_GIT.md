# Préparation du premier commit

17 octobre 2026. Cette préparation locale ne crée aucun commit et n’envoie aucun fichier. Le dépôt distant existant est privé et vide. Le propriétaire doit examiner l’inventaire avant tout premier commit ou push.

## Politique d’inclusion

La liste exacte se trouve dans tools/git-sync-allowlist.json. .gitignore exclut tout par défaut et ne réinclut que ces chemins : application active (y compris manifestes/SRI/worker), outils de génération et serveur local, notices et fichiers de provenance requis, configuration npm, guides de maintenance. Ajouter un fichier au projet ne l’autorise donc pas automatiquement au commit.

Les bibliothèques PDF et polices dans src/vendor/pdf sont nécessaires à l’export hors ligne ; elles sont conservées avec leurs notices. node_modules n’est jamais inclus. package.json et package-lock.json sont des descriptions nécessaires à l’environnement reproductible, et non des dépendances installées. La dépendance fake-indexeddb reste déclarée pour les tests locaux mais son installation n’est pas envoyée.

Six fichiers sous tools/reference/who sont exceptionnellement inclus : downloads.json (métadonnées de provenance), licence et quatre tables OMS brutes. tools/scripts/audit-licenses.cjs et la préparation du paquet en dépendent. Aucun autre fichier d’audit ou de test n’est autorisé.

## Restent sur cet ordinateur

Tests et fixtures, résultats de tests, journaux, captures, pilote, autres audits, public-builds, anciennes sources inactives, caches et dossiers d’éditeur, exports/sauvegardes de travail, bases locales, secrets et fichiers d’environnement. Le classeur PCIMA n’est pas inclus. Les plans internes et comptes rendus de validation restent locaux. Aucune suppression n’est effectuée.

Les commandes npm test et npm run audit:clinical ainsi que les liens vers les preuves locales ne sont pas autonomes dans ce périmètre de dépôt : leurs tests/oracles et certaines preuves sont volontairement exclus selon la demande. Ils restent utilisables dans le dossier de travail complet. Le dépôt est une sélection des sources de l’application et de ses outils de construction, pas une copie des preuves du poste. Les droits et obligations des ressources tierces restent décrits dans DROITS_ET_LICENCES.md ; le caractère privé du dépôt ne change pas ces obligations.

## Intégrité et revue

.gitattributes désactive toute conversion de fin de ligne afin de préserver les empreintes des ressources. Avant commit, comparer git ls-files --others --exclude-standard et les éventuels fichiers indexés à tools/git-sync-allowlist.json. Examiner git add --dry-run -- . ; vérifier les exclusions avec git check-ignore -v. L’index doit rester vide pendant cette revue. Le contrôle local et l’inventaire lisible sont conservés sous .local/audit/2026-10-17/reorganisation/ et ne sont pas proposés au commit.

Aucun commit, aucun push, aucune installation, aucune modification des sources applicatives n’est autorisé automatiquement par ce document.
