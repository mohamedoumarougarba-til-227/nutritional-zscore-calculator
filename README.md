# Z-score Niger

**[Essayer l’application](https://zscore-niger.vercel.app/) · [Méthode et limites](docs/references/METHODE.md) · [Contribuer](CONTRIBUTING.md)**

Application web gratuite et sans compte pour calculer les indicateurs de croissance OMS selon l’âge, conserver le travail localement et exporter les résultats. Interface français, anglais et arabe, thèmes clair/sombre et fonctionnement hors ligne après chargement.

*Offline-first WHO / CDC growth Z-score calculator — local records, FR/EN/AR, no account.*

Version des sources de l’interface : **5.7.0** ; moteur combiné : **4.4.0**. La version hébergée se vérifie dans son pied de page et peut différer d’un checkout de développement. OMS Child Growth Standards avant 60 mois moyens : poids/âge, taille/âge, poids/longueur-taille et IMC/âge. OMS 2007 de 60 à moins de 229 mois : taille/âge et IMC/âge, poids/âge avant 121 mois. Aucun poids/taille extrapolé après cinq ans. Centiles OMS entre −3 et +3. Profil américain explicite : OMS avant 24 mois, puis CDC 2000 et IMC étendu 2022 de 24 à moins de 240 mois ; catégories CDC séparées du dépistage OMS. Les quatre mesures complémentaires facultatives et leurs domaines sont décrits dans [Méthode](docs/references/METHODE.md).

Un [profil INTERGROWTH postnatal](docs/references/INTERGROWTH.md) explicite ajoute poids, longueur couchée et périmètre crânien selon le PMA exact 27–64 semaines, sans catégories cliniques OMS transposées.

Le lot propose aussi une revue technique sans déduplication automatique et un CSV de préparation d’analyse sans noms/identifiants, avec plan de sondage explicitement non fourni. Voir [interopérabilité](docs/references/INTEROPERABILITE.md).

Le calcul, les sauvegardes, les courbes et les résumés de lots restent locaux ; aucun serveur de dossiers patients n’est configuré. Un seul format de sauvegarde complète est pris en charge : `.zscore`, avec protection facultative `.zscore.enc`. L’application comprend PB et aide à l’orientation OMS 6–59 mois, observations cliniques explicites et export agrégé préparatoire DHIS2 sans envoi automatique. Les recommandations proposées restent distinctes des décisions et prescriptions du soignant.

L’hébergeur peut traiter les requêtes HTTP et journaux techniques. Le stockage reste accessible aux personnes utilisant le même profil de navigateur ; protéger le poste et les exports. **Cet outil ne remplace ni l’examen, ni le protocole applicable, ni une décision du professionnel. Aucune certification OMS ou validation clinique indépendante n’est revendiquée.**


## Utilisation locale

Node.js 20 ou ultérieur. Les outils de lancement et de construction utilisent les modules intégrés à Node ; aucune installation n’est nécessaire pour lancer l’application.

- npm start : vérifie la release puis lance le serveur local (port 8000 par défaut ; variable PORT pour le modifier).
- npm test : lance la courte suite publique synthétique ; refuse une suite vide.
- npm run verify:public : compare les résultats numériques à des attentes conservées séparément.
- npm run check:public : contrôle les fichiers explicitement sélectionnés pour la distribution.
- npm run check:release : vérifie les empreintes des ressources.
- npm run build:release : régénère les manifestes et le worker après modification.
- npm run test:private et npm run audit:clinical : réservés au workspace complet et aux preuves locales ; aucune validation médicale automatique.
- npm run audit:licenses : vérifie la provenance et les notices requises.
- npm run prepare:public : produit un nouveau paquet local, sans le publier.

Les bibliothèques PDF et polices nécessaires hors ligne sont intégrées à src/vendor/pdf avec leurs notices. Le dossier node_modules reste exclu de Git.

## Organisation

- src/ : sources de l’application ; les références préparées non encore activées sont identifiées dans la documentation.
- [docs/](docs/README.md) : guides, références et maintenance ; suivi interne dans docs/projet, exclu de Git.
- tools/scripts/ : outils de construction et de vérification.
- tools/reference/who/ : provenance et cinq tables OMS brutes nécessaires à la construction.
- tools/reference/who2007/ : provenance, licence et trois tables OMS 2007 pour les plus grands.
- tools/reference/intergrowth/ : équations postnatales, code GPL épinglé et [profil postnatal explicite et limites](docs/references/INTERGROWTH.md).
- tools/tests/ : tests locaux, exclus de Git à la demande du propriétaire.
- tools/public-tests/ : socle public synthétique, autonome et redistribuable.
- tools/verification/ : comparaisons numériques publiques avec provenance.
- .local/ : audits historiques, journaux, paquets, pilote, documents et anciennes sources ; entièrement exclu de Git.

## Guides et maintenance

[Guide utilisateur](docs/guides/GUIDE_UTILISATEUR.md) · [Guide administrateur](docs/guides/GUIDE_ADMINISTRATEUR.md) · [Sauvegardes](docs/references/FORMAT_SAUVEGARDE.md) · [Mises à jour](docs/maintenance/MISES_A_JOUR.md) · [Sélection Git](docs/maintenance/SYNCHRONISATION_GIT.md).

Les sources des repères et leurs limites sont décrites dans les guides. Les droits de redistribution sont inventoriés dans [Droits et licences](docs/references/DROITS_ET_LICENCES.md) ; le code original est sous GNU GPL version 3, avec conservation des licences tierces.

`npm test` et `npm run verify:public` ne nécessitent ni `.local/`, ni tests privés, ni installation npm. Les comparaisons couvrent 7 652 cas OMS 2006, 3 093 cas OMS 2007 et 6 001 centiles issus d’attentes séparées, plus 962 cas complémentaires évalués en Python Decimal ; ces derniers ne sont pas des sorties du logiciel R OMS. **Tests publics ≠ audit clinique privé ≠ validation physique.** Voir [périmètre et vérification](docs/guides/PERIMETRE_ET_VERIFICATION.md). La préparation Git ne publie ni ne synchronise automatiquement les fichiers.

[CONTRIBUTING](CONTRIBUTING.md) explique tests, inclusion Git et corrections numériques. Signaler uniquement des cas entièrement fictifs ; pour une vulnérabilité, suivre [SECURITY](SECURITY.md). Maintenance selon disponibilité, sans SLA ni support d’urgence médicale.

Le [profil CDC](docs/references/CDC.md) est proposé dans les réglages comme préférence pour les nouveaux travaux, avec contrôle explicite par visite. Changer de préférence ne recalcule pas les visites conservées. Données hors ligne épinglées, 254 cas numériques indépendants, 161 probabilités et 120 positions de courbes inverses ; tests de sauvegardes mixtes, CSV, courbes, résumés et modèles PDF FR/EN/AR. Aucun logiciel CDC SAS/R exécuté, aucune certification revendiquée. Les contrôles navigateur, lecteurs d’écran et impressions physiques restent distincts.

### Mentions et distribution — 20 octobre 2026

Les pages `src/legal.html`, `src/legal-en.html` et `src/legal-ar.html` présentent l’éditeur TIL, la confidentialité, le stockage local, les conditions d’usage et les attributions. Elles sont générées depuis `tools/scripts/legal-content.cjs`, épinglées dans la release et disponibles hors ligne. Après modification de leur contenu, exécuter `node tools/scripts/build-release.cjs`.

L’[audit des droits tiers et services](docs/references/AUDIT_DROITS_DISTRIBUTION.md) conserve les décisions historiques. La préparation Vercel vérifie les notices et les sources GPL avant de construire le paquet. Les conditions du forfait et les réglages du compte restent un contrôle distinct. Le dépôt GitHub est public ; les dossiers et preuves privées n’y sont pas inclus.

### Distribution GPL — 21 octobre 2026

Voir [COPYING](COPYING), [NOTICE.md](NOTICE.md) et [Distribution GPL](docs/references/DISTRIBUTION_GPL.md). Les pages légales donnent accès à `data/zscore-sources.zip` (sources et instructions de reconstruction) et `data/who-data-sources.zip` (références originales), également hors ligne. Aucun dossier d’enfant, secret ou audit local n’y figure. Le stockage navigateur peut être perdu après effacement du profil, perte de l’appareil ou problème de quota : conserver une sauvegarde sur un support protégé. Les PDF/CSV et sauvegardes ordinaires restent en clair ; `.zscore.enc` protège le fichier exporté, pas la base du navigateur.

La variante PDF conserve les rapports FR/EN/AR et utilise les sources épinglées dans `tools/reference/pdf-report`. `node tools/scripts/build-pdf-report.cjs` permet sa reconstruction optionnelle avec esbuild 0.27.2 déjà installé, via `ZSCORE_ESBUILD_PATH` ; aucune dépendance n’est installée par ce script.

Voir aussi [versions, veille et releases](docs/maintenance/COMPOSANTS_ET_RELEASES.md) et [matrice manuelle](docs/maintenance/VALIDATION_MANUELLE.md). La présence d’un workflow ne prouve pas encore une exécution GitHub ; aucun badge de réussite n’est présumé.

### Import CSV — 5.3.0

Les fichiers peuvent contenir jusqu’à 50 000 lignes et 50 Mio. Un assistant associe les colonnes et choisit explicitement les unités et formats. Les imports dépassant le lot actif de 5 000 fiches sont répartis en travaux sauvegardés, accessibles dans Sauvegardes. Le calcul par lots cède régulièrement la main au navigateur. PDF et CSV restent disponibles sur les lots actifs. Les limites scientifiques des références ne sont pas étendues par ces améliorations techniques.
