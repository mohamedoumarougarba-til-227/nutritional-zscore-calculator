# Z-score Niger

Application web gratuite et sans compte pour calculer les indicateurs de croissance OMS selon l’âge, conserver le travail localement et exporter les résultats. Interface français, anglais et arabe, thèmes clair/sombre et fonctionnement hors ligne après chargement.

Version de l’interface : **5.1.1** ; moteur combiné : **4.1.0**. OMS 2006 avant 60 mois moyens : poids/âge, taille/âge, poids/longueur-taille et IMC/âge. OMS 2007 de 60 à moins de 229 mois : taille/âge et IMC/âge, avec poids/âge avant 121 mois. Les domaines propres à chaque indicateur sont respectés ; aucun poids/taille n’est extrapolé après cinq ans. Centiles entre −3 et +3 pour les nouveaux calculs.

Le calcul, les sauvegardes, les courbes et les résumés de lots restent locaux ; aucun serveur de dossiers patients n’est configuré. Un seul format de sauvegarde complète est pris en charge : `.zscore`, avec protection facultative `.zscore.enc`. L’application comprend PB et aide à l’orientation OMS 6–59 mois, observations cliniques explicites et export agrégé préparatoire DHIS2 sans envoi automatique. Les recommandations proposées restent distinctes des décisions et prescriptions du soignant.



## Utilisation locale

Node.js 20 ou ultérieur. Les outils de lancement et de construction utilisent les modules intégrés à Node ; aucune installation n’est nécessaire pour lancer l’application.

- npm start : vérifie la release puis lance le serveur local (port 8000 par défaut ; variable PORT pour le modifier).
- npm run check:release : vérifie les empreintes des ressources.
- npm run build:release : régénère les manifestes et le worker après modification.
- npm run audit:clinical : compare le moteur combiné aux preuves R OMS 2006/2007 conservées localement ; aucune validation médicale automatique.
- npm run audit:licenses : vérifie la provenance et les notices requises.
- npm run prepare:public : produit un nouveau paquet local, sans le publier.

Les bibliothèques PDF et polices nécessaires hors ligne sont intégrées à src/vendor/pdf avec leurs notices. Le dossier node_modules reste exclu de Git.

## Organisation

- src/ : uniquement l’application active.
- [docs/](docs/README.md) : guides, références et maintenance ; suivi interne dans docs/projet, exclu de Git.
- tools/scripts/ : outils de construction et de vérification.
- tools/reference/who/ : provenance et cinq tables OMS brutes nécessaires à la construction.
- tools/reference/who2007/ : provenance, licence et trois tables OMS 2007 pour les plus grands.
- tools/tests/ : tests locaux, exclus de Git à la demande du propriétaire.
- .local/ : audits historiques, journaux, paquets, pilote, documents et anciennes sources ; entièrement exclu de Git.

## Guides et maintenance

[Guide utilisateur](docs/guides/GUIDE_UTILISATEUR.md) · [Guide administrateur](docs/guides/GUIDE_ADMINISTRATEUR.md) · [Sauvegardes](docs/references/FORMAT_SAUVEGARDE.md) · [Mises à jour](docs/maintenance/MISES_A_JOUR.md) · [Sélection Git](docs/maintenance/SYNCHRONISATION_GIT.md).

Les sources des repères et leurs limites sont décrites dans les guides. Les droits de redistribution sont inventoriés dans [Droits et licences](docs/references/DROITS_ET_LICENCES.md) ; le code original est sous GNU GPL version 3, avec conservation des licences tierces.

La sélection Git exclut les tests et leurs preuves : npm test et npm run audit:clinical nécessitent le dossier local complet. La préparation Git ne publie ni ne synchronise automatiquement les fichiers.

### Mentions et distribution — 20 octobre 2026

Les pages `src/legal.html`, `src/legal-en.html` et `src/legal-ar.html` présentent l’éditeur TIL, la confidentialité, le stockage local, les conditions d’usage et les attributions. Elles sont générées depuis `tools/scripts/legal-content.cjs`, épinglées dans la release et disponibles hors ligne. Après modification de leur contenu, exécuter `node tools/scripts/build-release.cjs`.

Voir [l’audit des droits tiers et services](docs/references/AUDIT_DROITS_DISTRIBUTION.md) avant publication. La préparation Vercel vérifie les notices et les sources GPL avant de construire le paquet. Les conditions du forfait et les réglages du compte restent un contrôle distinct. Le dépôt privé ne signifie pas que les ressources envoyées au navigateur sont techniquement invisibles.

### Distribution GPL — 21 octobre 2026

Voir [COPYING](COPYING), [NOTICE.md](NOTICE.md) et [Distribution GPL](docs/references/DISTRIBUTION_GPL.md). Les pages légales donnent accès à `data/zscore-sources.zip` (sources et instructions de reconstruction) et `data/who-data-sources.zip` (références originales). Aucun dossier d’enfant, secret ou audit local n’y figure. Le dépôt GitHub privé reste distinct de ces téléchargements.

La variante PDF conserve les rapports FR/EN/AR et utilise les sources épinglées dans `tools/reference/pdf-report`. `node tools/scripts/build-pdf-report.cjs` permet sa reconstruction optionnelle avec esbuild 0.27.2 déjà installé, via `ZSCORE_ESBUILD_PATH` ; aucune dépendance n’est installée par ce script.
