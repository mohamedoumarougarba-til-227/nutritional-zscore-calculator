# Z-score Niger

Application web gratuite et sans compte pour calculer trois indicateurs nutritionnels OMS, conserver le travail localement et exporter les résultats. Interface français, anglais et arabe, thèmes clair/sombre et fonctionnement hors ligne après chargement.

Version de l’interface : 2.9.15. Le calcul et les sauvegardes sont exécutés dans le navigateur. Aucun serveur de données patients n’est configuré.

## Utilisation locale

Node.js 20 ou ultérieur. Les outils de lancement et de construction utilisent les modules intégrés à Node ; aucune installation n’est nécessaire pour lancer l’application.

- npm start : vérifie la release puis lance le serveur local (port 8000 par défaut ; variable PORT pour le modifier).
- npm run check:release : vérifie les empreintes des ressources.
- npm run build:release : régénère les manifestes et le worker après modification.
- npm run audit:licenses : vérifie la provenance et les notices requises.
- npm run prepare:public : produit un nouveau paquet local, sans le publier.

Les bibliothèques PDF et polices nécessaires hors ligne sont intégrées à src/vendor/pdf avec leurs notices. Le dossier node_modules reste exclu de Git.

## Organisation

- src/ : uniquement l’application active.
- [docs/](docs/README.md) : guides, références et maintenance ; suivi interne dans docs/projet, exclu de Git.
- tools/scripts/ : outils de construction et de vérification.
- tools/reference/who/ : provenance et quatre tables OMS brutes nécessaires à la construction.
- tools/tests/ : tests locaux, exclus de Git à la demande du propriétaire.
- .local/ : audits historiques, journaux, paquets, pilote, documents et anciennes sources ; entièrement exclu de Git.

## Guides et maintenance

[Guide utilisateur](docs/guides/GUIDE_UTILISATEUR.md) · [Guide administrateur](docs/guides/GUIDE_ADMINISTRATEUR.md) · [Sauvegardes](docs/references/FORMAT_SAUVEGARDE.md) · [Mises à jour](docs/maintenance/MISES_A_JOUR.md) · [Sélection Git](docs/maintenance/SYNCHRONISATION_GIT.md).

Les sources des repères et leurs limites sont décrites dans les guides. Les droits de redistribution sont inventoriés dans [Droits et licences](docs/references/DROITS_ET_LICENCES.md) ; aucune nouvelle licence d’ensemble n’est attribuée ici.

La sélection Git exclut les tests et leurs preuves : npm test et npm run audit:clinical nécessitent le dossier local complet. La préparation Git ne publie ni ne synchronise automatiquement les fichiers.
