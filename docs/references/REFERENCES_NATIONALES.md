# Références scientifiques et contexte nigérien

État du 14 octobre 2026. Séparer les normes de croissance utilisées par le moteur, les recommandations de prise en charge et l'édition nationale applicable. Aucune règle de traitement PCIMA n'a été ajoutée à partir d'un document non authentifié.

| Source | Ce qui est établi | Limite / action restante |
| --- | --- | --- |
| [Normes de croissance OMS](https://www.who.int/tools/child-growth-standards/standards) et [implémentation officielle Anthro](https://github.com/WorldHealthOrganization/anthro/tree/b776d8a12b1c97369c748b561159fd2ec4f4db58/data-raw/growthstandards) | Référence du moteur `WHO-2006-anthro-b776d8a12b1c`, 9 712 lignes LMS ; sources et conversion conservées. | Conformité numérique des cas testés ; cela ne constitue pas une validation clinique ou une authentification PCIMA. |
| [Recommandations OMS du 29 décembre 2023](https://www.who.int/publications/i/item/9789240082830) | Document global de prévention et prise en charge de l'émaciation et des œdèmes nutritionnels chez les moins de cinq ans, remplaçant la recommandation de prise en charge de 2013. | Document de contexte ; aucune transcription de prescription. Il ne permet pas d'affirmer que les tables de croissance 2006 sont remplacées. |
| [Rapport d'évaluation Niger déposé par l'UNICEF](https://evaluationreports.unicef.org/GetDocument?documentID=16400&fileID=40163) | Rapport daté du 13 janvier 2021 sur le programme 2010–2019 ; l'annexe des documents consultés cite le protocole PCIMA Niger du MSP, édition 2016. Repère : 157e page du PDF, page imprimée 149, annexe 7 ; citation aussi dans la bibliographie. | Atteste une référence historique. Ce rapport ne fournit pas la preuve de l'édition nationale applicable en 2026. Ne pas présenter 2016 comme dernière édition. |
| Classeur local `Pages de PROTOCOLE PCIMA 2023 VFcorrigé.pdf.xlsx` | Extrait d'une seule feuille `Table 1`, 19 790 octets, 107 formules. Métadonnées : créateur Handicap International, dernière modification Tout Informatique Lazaret. Extraction OpenXML en lecture seule, sans calcul des formules. | Aucun élément de couverture/pays/édition dans les cellules textuelles examinées. Le nom du fichier ne prouve ni l'origine nigérienne ni une validation nationale en 2023. |

## Source de contexte vérifiée le 14 octobre

L'article [OMS / Nations Unies au Niger, 30 septembre 2026](https://niger.un.org/fr/323605-%C3%A0-maradi-une-nouvelle-chance-pour-les-enfants-atteints-de-malnutrition-aigu%C3%AB-s%C3%A9v%C3%A8re) décrit l'application des directives OMS 2023 au CRENI du CHR de Maradi avec le ministère et l'OMS. C'est une source primaire récente de contexte local, sans texte intégral ni décision de validation d'une édition nationale PCIMA. Elle ne ferme donc pas l'authentification nationale et ne justifie aucune nouvelle règle de calcul ou prescription.

L'ouverture actuelle de l'ancien lien CADEV (?p=2110) renvoie la page d'accueil. L'extrait de recherche relatif à une formation et à une révision 2023 ne peut pas être traité comme un article intégral consulté. Les intitulés 2025/2026 sur des plateformes de partage restent exclus de toute règle métier. Registre : [sources et limites](../../.local/audit/historique/2026-10-14/droits-references/sources.json). Les droits des ressources scientifiques sont traités séparément dans [DROITS_ET_LICENCES.md](DROITS_ET_LICENCES.md).

## Empreintes et preuve locale

Classeur conservé à l'identique : SHA-256 `4d0144fcd9e88c1bc8d7fae1fdb13924891333a8cb326d76cd6ae165505793ee`. Résumé d'extraction et méthode : `audit/2026-10-14/guides-references/classeur-local.json` et `inspect-local-workbook.py`. Aucun lien externe ou composant macro trouvé dans le conteneur examiné ; aucune formule évaluée. Les métadonnées sont déclaratives et ne certifient pas l'émetteur.

Tables actives : `src/data/who-official.json`, SHA-256 `4ce52083be714b20fe6df6eefa597cf67531dc31fe842a7befba42016a839701`. Le manifeste `src/data/who-manifest.json` identifie la source et sa conversion. L'ancien `who-standards.json` reste conservé dans les sources comme preuve du prototype ; il est exclu du paquet public et du nouveau cache.

## Recherche nationale : pistes insuffisantes

La recherche a rencontré des intitulés PCIMA 2023 et 2025 sur des plateformes de partage tierces. Ces copies ne constituent pas une authentification par l'autorité sanitaire ; aucune table ou prescription n'en a été importée. Des résultats concernant le Mali et d'autres pays ont été exclus. La page du Nutrition Cluster Niger n'a pas pu être consultée intégralement (403), et une page de formation CADEV Niger n'a pas pu être ouverte ; leurs extraits ne suffisent pas à certifier une édition. Aucun accès payant, téléchargement de ces copies ou contournement n'a été effectué.

L'édition nationale actuellement applicable reste **non authentifiée**. Pour fermer ce point, obtenir une copie complète ou un lien officiel avec l'institution émettrice, le pays, l'édition/date, la décision de validation et les pages pertinentes. Conserver origine, empreinte du fichier, date de consultation et avis d'un professionnel connaissant l'application du protocole au Niger. Confirmer aussi si une édition plus récente remplace le document reçu.

## Revue métier requise

Le moteur 2.0.0 a été comparé à WHO Anthro R : 7 652 cas, 19 974 valeurs d'indicateurs, sans écart inexpliqué dans les comparaisons retenues. Les 2 982 suspensions conservatrices liées à une mesure debout avant neuf mois sont isolées et attendent une décision métier : l'application suspend là où Anthro peut produire un score signalé. Ne pas assimiler ce choix à une règle nationale validée.

La revue doit couvrir classifications et limites, bornes avant arrondi, unités, âges exacts/estimés, position de mesure, œdèmes, valeurs inhabituelles et interprétation des courbes. Consigner professionnel, date, version, source, cas fictifs, conclusion et retest. La grille [VALIDATION_TERRAIN.md](../projet/VALIDATION_TERRAIN.md) distingue cette revue des tests automatisés et des essais physiques.
