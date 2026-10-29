# Préparer et adopter une mise à jour

## 5.7.0 — revue technique du lot et préparation d’analyse

Contrôle local du lot entier : signaux de données absentes/estimées/importées/indisponibles, incohérences de référence, identités contradictoires et mesures potentiellement dupliquées. Aperçu en lecture seule, huit lignes par page, sans fusion/correction/suppression automatique. Deux CSV : revue par numéro local et préparation d’analyse sans noms/identifiants, plan de sondage explicitement absent et colonnes de sondage vides. Aucune prévalence représentative, connexion DHIS2 ou modification de calcul clinique. Moteur combiné 4.4.0 et formats de sauvegarde inchangés. Les contrôles automatiques ne remplacent pas les essais navigateur ou la relecture métier.


## 5.6.0 — profil postnatal INTERGROWTH explicite

Moteur combiné 4.4.0 : PMA direct ou dérivé avec âges distincts, trois mesures postnatales, résultats/sauvegardes/import en copie, CSV/PDF, courbes et lots séparés, FR/EN/AR. Aucun seuil clinique OMS copié, aucune transition d’âge automatique, aucune visite existante réécrite. Les mesures absentes ne s’affichent plus comme zéro. Le flux de sauvegarde reste version 1 avec contexte de visite additionnel. Voir [INTERGROWTH](../references/INTERGROWTH.md). Tests numériques/logiciels distincts de la relecture clinique et des essais navigateur/terrain ; pas de nouvelle validation TECNO.


## Profil américain explicite — sources 5.5.0 / moteur 4.3.0

Réglages propose OMS 2006/2007 ou OMS avant deux ans puis CDC 2000/IMC étendu 2022. Ce choix est conservé par visite et modifiable explicitement dans le formulaire ; la préférence seule ne réécrit pas les travaux existants. Les imports peuvent indiquer `growthProfile` (`who`/`us`). CDC couvre 24 à moins de 240 mois sans poids/taille. Catégories, courbes et résumés sont séparés des références OMS ; âge déclaré, âge utilisé et méthode figurent dans les sorties. Voir [méthode CDC](../references/CDC.md).

Contrôles numériques et modèles de sortie testés sur données fictives ; la vérification navigateur, RTL visuel, accessibilité et impression ne sont pas présumées réalisées. Pas de publication implicite de ces sources locales.


## Boutons nommés sur mobile - 5.2.2, 22 octobre 2026

Sur mobile, un bouton Actions fixé en bas ouvre une grille compacte avec icônes et libellés courts. Calcul/ajout, sauvegarde, exports, impression, nouvelle visite et modification utilisent les mêmes commandes que sur ordinateur. Les boutons Reprendre et Nouveau restent en haut, réduits à des cibles de 44 px ; le titre reste sur une ligne et les deux états sont regroupés dessous. Le menu d’export pouvant sortir de l’écran est retiré. Le moteur et les données enregistrées ne changent pas. Les contrôles navigateur restent distincts des essais physiques TECNO.

## Complément de vérification — 19 octobre 2026, 4.0.0 inchangée

[Parcours natif PC](../../.local/audit/2026-10-19/focus-import/rapport.md) : confirmation d’import et reprise du clavier vérifiées dans les trois langues ; annulation/aperçu restituent le focus. Les courbes OMS 2007 arabes sont dépliées et inspectées à 320 px. Aucun runtime modifié ; la suite de 187 tests précédente reste le dernier passage complet, sans répétition inutile. Les nouveaux essais physiques et la revue métier ne sont pas acquis par ce contrôle PC.

## Audit du moteur actuel — 19 octobre 2026, application 4.0.0 inchangée

La commande `npm run audit:clinical` couvre maintenant le moteur combiné et les deux références OMS 2006/2007, avec échec si une preuve OMS 2007 manque ou est altérée. 187 tests réussis ; preuve clinique et essais physiques restent distincts. Aucun changement du runtime, des archives ou de la release. [Bilan et état Git](../../.local/audit/2026-10-19/audit-combine/rapport.md).

## Références combinées — 4.0.0, 19 octobre 2026

Intégration OMS 2007 à la saisie, au moteur, au modèle v4, à la validation/aux sauvegardes, aux aperçus, aux courbes, aux lots séparés par référence, aux CSV et aux PDF détaillés/compacts. Les anciens résultats restent immuables. Les nouvelles données, leur provenance et les licences sont incluses dans le paquet et l’inventaire signé : 46 ressources hors ligne, 20 scripts HTML.

183 tests réussis, incluant 3 093 cas numériques de référence et 880 cas R supplémentaires avec âges en jours, jonction des dates, exclusions/non-applicables et imports atomiques. Quinze PDF fictifs trilingues, 30 pages rendues et inspectées ; individuel sur une page dans les trois langues. Transfert réel par fichier vers une origine vierge, reprise en copie et réexport contrôlés ; puis réouverture/recalcul OMS 2007 sans serveur. Bilan complet : `.local/audit/2026-10-19/integration-2007/rapport.md`. Ce bilan est technique, distinct de la revue médicale et d’essais physiques TECNO. Aucun déploiement ni nouveau commit.

## Résumé descriptif des lots — interface 3.3.0, moteur inchangé 3.1.0

Nouveau composant local `lot-analysis.js`, inclus et signé dans les ressources hors ligne. Résumé repliable sur toutes les pages du lot : fiches/identifiants, sexe/âge, résultats utilisables et exclusions par indicateur, catégories enregistrées avec dénominateurs, moyenne/minimum/maximum des Z affichés. Export CSV agrégé sans identité et inclusion du résumé dans l’impression. Aucun nouveau schéma de sauvegarde ni recalcul.

175 tests réussis ; 26 contrôles ciblés après exclusion explicite des anciennes limites d’âge hors périmètre. Les tests de release vérifient désormais 41 ressources hors ligne et 18 scripts HTML, dont le nouveau composant et son refus d’installation en cas d’altération. Bilan : `.local/audit/2026-10-18/analyse-lots/rapport.md`.

## Courbes en unités réelles — interface 3.2.0, moteur inchangé 3.1.0

Courbes OMS poids/âge en kg, longueur-taille/âge en cm et IMC/âge, visibles dès une visite sauvegardée avec identifiant. Séparation des références à deux ans, repères pour âges estimés/imports, tableau accessible, absence de recalcul des anciennes archives. Composant existant étendu, aucune bibliothèque graphique ajoutée. Contrôle R de 54 810 ordonnées quotidiennes (deux sexes, trois indicateurs, cinq Z) ; 167 tests automatisés réussis sur la release finale, incluant les étiquettes, l’axe des mois et les anciennes limites calendaires. Bilan : `.local/audit/2026-10-18/courbes-reference/rapport.md`.

## Centiles conservés — 3.1.0, moteur 3.1.0, 18 octobre 2026

Les nouveaux calculs conservent le score avant arrondi et les centiles calculés entre −3 et +3, sans extrapoler les extrêmes ni modifier les anciens résultats. Affichage compact P, aide contextuelle, présence dans les aperçus/tableaux de suivi et exports CSV/PDF. Le PDF individuel conserve une page ; le PDF compact n’ajoute pas une entrée de légende pour chaque centile distinct. Les trois langues sont prises en charge.

161 tests automatisés réussis ; 24 contrôles ciblés supplémentaires après correction des identifiants d’aide entre résultat et aperçu fermé. Conversion vérifiée contre 6 001 valeurs `pnorm` de R et 240 cas LMS avant arrondi. Un contrôle de transfert détecte désormais une incohérence score brut/arrondi avant le checksum ; un changement des seuls octets continue d’être refusé par checksum, avec transaction annulée dans les deux cas. Archives JSON/progressives et passage JSON via le lecteur 3.0 vérifiés. Bilan et limites : `.local/audit/2026-10-18/centiles/rapport.md`. Aucune dépendance, aucun fichier externe téléchargé, aucune publication.

## IMC pour l’âge — 3.0.0, moteur 3.0.0, 18 octobre 2026

Les nouveaux calculs ajoutent l’IMC brut et son Z-score pour l’âge à partir d’une cinquième table brute OMS vérifiée contre les données R figées. Les trois autres tables et leurs valeurs restent identiques. L’âge reste inférieur à cinq ans ; aucune extrapolation P/T ni extension aux références des plus grands. Les valeurs et intervalles IMC sont disponibles en individuel, lots, aperçus, courbes, CSV, PDF et impression, en français/anglais/arabe. Les suspensions pour œdèmes ou mesure debout avant neuf mois s’appliquent aussi à l’IMC.

Schéma des nouveaux résultats : v3 ; les anciens résultats v1/v2 restent conservés et consultés sans recalcul. Une archive qui contient des résultats v3 nécessite un lecteur 3.0.0 ou ultérieur, y compris dans le conteneur JSON ancien format. L’interface et le guide de sauvegarde l’indiquent. 155 tests réussis, dont comparaison indépendante IMC/âge sur 6 161 cas et 1 491 suspensions nourrisson explicites ; génération et contrôle des neuf PDF de démonstration (15 pages). Pas de nouvelle dépendance ni nouveau téléchargement de fichier : la table préparée à l’étape précédente est réutilisée. Voir `.local/audit/2026-10-18/integration-imc/rapport.md` pour le paquet, les parcours navigateur et les limites.

## Borne d’âge cohérente — 2.9.16, moteur 2.0.1, 18 octobre 2026

La saisie par dates refuse désormais le jour du cinquième anniversaire, au lieu de comparer seulement un âge divisé par la durée moyenne d’un mois. À 1 826 jours saisis directement, la date de mesure est requise pour distinguer ce jour de la veille d’un anniversaire après deux années bissextiles. Les naissances le 29 février utilisent le 1er mars dans une année non bissextile. La saisie années/mois reste estimée et limitée à moins de 60 mois. La correction s’applique au calcul individuel, au lot et à la validation CSV.

La vérification d’archive garde le domaine précédemment accepté : les anciens résultats restent lisibles, exportables et importables sans recalcul, avec leur moteur d’origine. Toute tentative de nouveau calcul utilise la règle actuelle. Les tables OMS, les formules et les catégories ne sont pas modifiées. Les 576 cas à 1 826 jours de l’oracle R sont testés avec une date de mesure explicite admissible ; les valeurs attendues et les preuves originales restent inchangées.

Première étape du plan d’évolution : fiabilité du socle. 149 tests automatisés réussis et paquet hors ligne vérifié ; pas de nouvel essai physique. Les nouveaux indicateurs, le module après cinq ans, l’analyse descriptive des lots et l’aide clinique ne sont pas livrés par cette correction. Voir le bilan local `.local/audit/2026-10-18/fiabilite-age/rapport.md` pour les commandes, les tests et les limites de validation.

## Présentation de l’application — 2.9.15, 17 octobre 2026

À la demande du propriétaire, retrait des mentions Prototype, Bêta, Version de développement et de la mention de relecture médicale à réaliser dans les textes de l’application, en français, anglais et arabe. Le pied de page utilise À propos ; les informations, l’aide, l’impression et les PDF décrivent les repères nutritionnels et leurs limites d’usage. Aucun calcul, schéma de sauvegarde ou droit d’accès modifié. Ce changement éditorial ne constitue pas une nouvelle validation médicale ni une publication. Les preuves historiques et les validations encore ouvertes dans le suivi sont conservées.

143 tests automatisés réussis, puis 33 contrôles ciblés réussis après harmonisation des styles ; mise à jour et fenêtre d’information vérifiées dans le navigateur intégré. Aucun nouvel essai TECNO ou Chrome natif. [Bilan, fichiers et commandes](../../.local/audit/historique/2026-10-17/libelles-application/rapport.md). Release `4f79df19ff478725810b049ed95b9bc5e232023eabf86aa4c9a619554db32517` ; paquet local de 43 fichiers / 2 096 308 octets, non publié.

## État de sauvegarde corrigé — 2.9.14

Une ancienne écriture ne peut plus afficher Enregistré pour une saisie plus récente ni modifier l’indicateur d’un autre travail. Écriture immédiate et reprise après échec affichent Sauvegarde en cours jusqu’à confirmation de la dernière version concernée. **143 tests automatisés réussis**. [Bilan et portée](../../.local/audit/historique/2026-10-16/etat-sauvegarde/rapport.md). Release 2abd656c802ae9228c4756246aad382d6e36f6a2683ee7f53c078d91ab5ea576 ; paquet 43 fichiers / 2096660 octets, non publié.

## Correction de fiabilité — 2.9.13

Import CSV protégé contre les activations simultanées ; lecture de fichier annulée si le travail ou la page a changé ; erreur de lecture signalée et commandes réactivées après échec. Les lignes ajoutées restent disponibles si leur sauvegarde échoue. **138 tests automatisés réussis**, contrôle ciblé du collage CSV dans le navigateur intégré ; sélecteur réel et TECNO non validés à nouveau. [Rapport et preuves](../../.local/audit/historique/2026-10-16/csv-concurrence/rapport.md). Release 3cb9816d148766490733869a8f3513bcece3a26851e76cfb32ac14874e06522f, paquet 43 fichiers / 2096311 octets, non publié.

## État actuel — 16 octobre, 2.9.12

Lots : Reprendre un travail/Nouveau travail en haut ; informations import/âge estimé regroupées dans une seule aide i près du titre, sans répétition par ligne. Les alertes propres aux mesures restent visibles et les métadonnées/rapports détaillés sont conservés. **130 tests automatisés réussis** ; reprise/nouveau/reprise et rendu ordinateur/mobile vérifiés dans le navigateur intégré, sans nouvel essai physique TECNO. [Bilan technique](../../.local/audit/historique/2026-10-16/utilite-et-perimetre/rapport.md).

[Étude d’utilité pour le Niger](../projet/ETUDE_UTILITE_NIGER.md) et [audit du périmètre initial](../projet/AUDIT_PERIMETRE_INITIAL.md) ajoutés : intérêt plausible à démontrer au pilote ; promesses initiales absentes, choix remplacés et validations externes distingués. Aucun ajout de synchronisation, PB, triage national ou export DHIS2 sans spécification. Release 93c3672e788f1a5fed1fd4bee286428810d01dc6724e709f1f3a4d4a83a71d1c ; paquet neuf 43 fichiers / 2 094 362 octets, non publié. Objectif global actif et incomplet ; cible 3 Go/plafond 5 Go inchangés.

Version actuelle de l’interface : 4.0.0. Version du moteur combiné : 4.0.0 (noyau OMS 2006 3.1.0 conservé), indépendante de la présentation. La référence des résultats précédents reste celle enregistrée lors de leur calcul.

## Pour le propriétaire des fichiers et de l’hébergement

1. Conserver une copie de la version précédente et des preuves. Modifier les sources autorisées. Incrémenter `WorkspaceApp.version` pour une nouvelle version destinée à être distribuée. Ajouter toute nouvelle ressource nécessaire à `tools/scripts/offline-assets.json` ; les tests contrôlent la couverture des ressources de la page.
2. Exécuter `npm run build:release`. Le générateur calcule les empreintes de toutes les ressources, met à jour les attributs SRI et les empreintes des données dans `src/index.html`, attribue un identifiant à leur ensemble et produit `src/sw.js` et `src/release-manifest.json`. Modifier le modèle `tools/scripts/service-worker.template.js`, plutôt que le fichier généré. Une transformation des scripts ou du CSS par l’hébergement après génération invalide leurs empreintes : distribuer les octets vérifiés.
3. Exécuter `npm run check:release`, `npm test` et `npm run audit:clinical`. Conserver les sorties et le manifeste. Une modification scientifique exige des comparaisons indépendantes et une revue métier ; les tests verts ne constituent pas un avis médical. Toute modification d’une ressource après génération exige une nouvelle génération et les contrôles appropriés.
4. Exécuter `npm run prepare:public`, puis `node tools/scripts/prepare-public.cjs --verify .local/public-builds/<dossier-produit>`. Distribuer le dossier produit pour un hébergement HTTPS avec remplacement atomique de version. Ne pas copier intégralement `src/` : les anciens modules de démonstration et tables historiques restent conservés dans les sources, mais sont exclus du paquet et du cache 2.6.1. Conserver les versions antérieures. Réserver les droits de modification au propriétaire autorisé. Les visiteurs n’ont aucune API publique d’édition des références. Les empreintes détectent un ensemble incohérent ; la protection du compte d’hébergement reste essentielle.

Cette procédure prépare les fichiers. Aucune publication n’est autorisée par ce document : obtenir le feu vert explicite, l’avis métier, les essais terrain et la vérification des droits/licences nécessaires avant ouverture publique.

`npm start` vérifie le manifeste avant de démarrer. Le serveur local sert `src/` en lecture seule. Il est possible de l’arrêter puis de le relancer sans téléchargement externe. Sur un navigateur déjà équipé, un simple rechargement conserve la version du cache actif ; utiliser le parcours d’adoption ci-dessous pour voir une version modifiée.

## Pour la personne utilisant le calculateur

- Dans **Références et aide**, **Vérifier les mises à jour** recherche une version complète. Le téléchargement peut prendre du temps ; garder le travail en cours.
- Quand la version est prête, **Sauvegarder et mettre à jour** crée d’abord une version locale **Avant mise à jour**, puis rouvre l’application. À la réouverture, consulter les sauvegardes et reprendre le travail choisi dans une copie.
- Si d’autres onglets du calculateur sont ouverts, sauvegarder leur travail puis les fermer avant de réessayer. L’application ne les recharge pas automatiquement.
- Si la sauvegarde échoue, l’activation est arrêtée. Exporter une copie indépendante et vérifier l’espace disponible avant de réessayer.
- Si le téléchargement est incomplet ou les fichiers incohérents, continuer avec la version actuelle et vérifier plus tard. Aucune valeur précédente n’est recalculée silencieusement.

Les anciens caches et historiques sont conservés. Plusieurs versions peuvent donc occuper davantage d’espace ; aucune purge automatique n’est prévue. Un export complet indépendant reste nécessaire pour se protéger d’un effacement du navigateur ou de la perte du téléphone.

## Adoption 2.7.2

Release retenue : 7a5d02e3a6a9741db9b1af4ec0cab15a97bb043b9c3f9fb04cd19d3e3d59ffda. 40 ressources, 2 033 079 octets de corps HTTP ; paquet de 43 fichiers/2 045 238 octets. Destinations explicites du focus après calcul et reprise, sans migration ni modification du moteur, des références, du PDF ou du transfert. Les 188 sessions présentes avant les essais et autres enregistrements sont inchangés ; 201 sessions après les calculs et reprises fictifs. Adoption depuis 2.7.1, réouverture et restauration/calcul sans serveur vérifiés. Aucune publication. Preuves : [rapport clavier](../../.local/audit/historique/2026-10-14/parcours-clavier/rapport.md).

## Adoption 2.7.1

Release retenue : 94bc91b8d1afbf8d3dde9e3a23bcd09cfaa777d3dd31f192c309af74211c3625. 40 ressources, 2 032 674 octets de corps HTTP ; paquet vérifié de 43 fichiers/2 044 833 octets. Aide intégrée et corrections du focus/conseils, sans changement du moteur, des tables OMS, du PDF ou des modules de stockage/transfert. Les 186 sessions antérieures restent identiques dans 188 sessions après deux adoptions locales, chacune précédée d'une sauvegarde. Rechargement et guide au clavier vérifiés après arrêt confirmé du serveur. Le paquet n'est pas publié. Preuves : [rapport 2.7.1](../../.local/audit/historique/2026-10-14/accessibilite-aide/rapport.md).

## Adoption 2.7.0

Release retenue : 627314bb03f72e77688fa91799ce64cb200cf7044f75d3073e074c06846c4605. 40 ressources, 2 023 290 octets de corps HTTP ; paquet vérifié de 43 fichiers, 2 035 449 octets. Aucun changement du moteur, des tables OMS ou des modules de stockage/transfert. Les anciennes versions et caches sont conservés.

Adoption depuis 2.6.2 puis révisions locales de 2.7.0 vérifiées. Archives avant/après contrôlées indépendamment : les 181 sessions précédentes et autres enregistrements restent inchangés ; 186 sessions à la fin des essais. Après arrêt confirmé du serveur et fermeture du port : rechargement, aperçu, reprise en copie de 500 mesures et PDF compact réussis. La dernière révision protège l'affichage des libellés hérités inconnus ; les modèles ordinaires de 500 mesures dans les trois langues restent strictement identiques à ceux utilisés pour les exports natifs précédents. Aucune publication ni essai physique acquis. Preuves : [rapport PDF compact](../../.local/audit/historique/2026-10-14/pdf-compact/rapport.md).

## Vérifications et limites actuelles

En 2.6.2, optimisation du calcul de volume du catalogue, sans modification des archives ni du schéma. Adoption depuis 2.6.1 et ouverture du catalogue/aperçu de 501 mesures sans serveur vérifiées. Toutes les anciennes sessions restent identiques ; nouvelle version « Avant mise à jour » ajoutée. Paquet historique 2.6.2 : 43 fichiers, 2 029 247 octets, 40 ressources en cache. Preuves : audit/2026-10-14/performance-catalogue/rapport.md.


En 2.6.1, 40 ressources actives dans le cache ; 43 fichiers dans le paquet préparé, 2 028 397 octets. Le paquet est vérifié contre les sources, avec licences et en-têtes statiques ; les fichiers ajoutés/altérés et une liste réintroduisant les anciens modules sont refusés. Aucune publication. Guides et procédure : [GUIDE_ADMINISTRATEUR.md](../guides/GUIDE_ADMINISTRATEUR.md), [PREPARATION_PUBLICATION.md](PREPARATION_PUBLICATION.md). Preuves : `audit/2026-10-14/guides-references/`.

En 2.6.0, les copies de secours locales et imports préparés peuvent être retrouvés et revérifiés après réouverture, sans migration de la base principale ni purge des anciennes copies. Création locale, aperçu, ajout de 89 sessions sans écrasement, rechargement sans serveur et alerte de doublon vérifiés dans le navigateur ; ce parcours n'utilise pas le sélecteur d'import de fichier. Les essais après adoption conservent les originaux et les valeurs enregistrées. Commandes de détail compactes sur petit écran, brouillons dépliables, aucune modification du moteur OMS. Preuves : `audit/2026-10-13/reprise-transferts/rapport.md`.

En 2.5.0 : 60 ressources, 2 310 968 octets de corps HTTP, 17 scripts avec SRI. Nouveau format `.zscore` chargé localement et mis en cache, sans changement du moteur OMS ni du schéma de la base principale. Adoption depuis 2.4.0, export progressif et JSON après rechargement sans serveur vérifiés ; 86 anciennes sessions inchangées dans l'export contrôlé. `.zscore` exige cette version ou une version ultérieure ; garder le JSON pour un lecteur ancien si sa taille le permet. L'import de fichier dans le navigateur de test reste non validé, ainsi que la compatibilité/performance physique TECNO. Preuves : `audit/2026-10-13/transfert-progressif/rapport.md`.

En 2.4.0 : 59 ressources, 2 288 843 octets de corps HTTP. Catalogue progressif, estimation de capacité et lecture de la version sélectionnée, sans migration de base. Adoption depuis 2.3.1, sauvegarde préalable, aperçu et reprise en copie de 500 mesures après arrêt du serveur vérifiés ; l'export de 35 560 230 octets conserve les 81 sessions précédentes à l'identique. Les caches antérieurs restent conservés. Les archives dépassant la limite d'import de 50 MiB exigent encore une solution de transfert complet. Preuves : `audit/2026-10-13/capacite-historique/rapport.md`.

Les tests techniques couvrent intégrité d’installation, cache distinct, refus d’octets provenant d’une autre version, protection des onglets et sauvegarde avant activation. Les essais navigateur couvrent passage 2.1.0 → 2.1.1, déploiement incohérent, deux brouillons, export après mise à jour et ouverture de la version adoptée sans serveur. Preuves : `audit/2026-10-12/mises-a-jour-pwa/`.

La première ouverture est aussi contrôlée en 2.2.0 : les scripts et le CSS sont vérifiés par SRI, puis les trois JSON contre les empreintes inscrites dans la page. Aucun calculateur ni initialisation du stockage en cas d’incohérence. Le message permet de réessayer après correction, sans suppression des sauvegardes. Quatre essais navigateur (script, CSS, bootstrap et dictionnaire altérés) ont été refusés ; leur correction et la reprise ont réussi. Une première ouverture valide, un calcul et une reprise en copie après arrêt du serveur ont été vérifiés. Preuves : `audit/2026-10-12/premiere-ouverture/rapport.md`.

Ces empreintes assurent la cohérence avec la page reçue ; une personne contrôlant tout l’hébergement pourrait changer aussi cette page. Réserver les modifications au propriétaire, utiliser HTTPS et conserver le remplacement atomique des fichiers. Le chargement initial des tables reste indispensable ; le mode hors ligne exige une installation complète réussie.

Une version contient 59 ressources vérifiées, soit 2 271 701 octets de corps HTTP en 2.3.1, hors en-têtes et recherches documentaires. L’adoption 2.2.0 → 2.2.1 et un lot fictif de 500 résultats, avec conservation de l’ancien export, ont été vérifiés ; reprise du lot après arrêt du serveur réussie. Preuves : `audit/2026-10-12/grand-historique/rapport.md`. Les accès au serveur 127.0.0.1 restent locaux. Aucun essai physique TECNO ni avis métier n’est acquis. La grille `VALIDATION_TERRAIN.md` doit être complétée séparément.

Le fonctionnement s’appuie sur le [cycle de vie documenté des service workers](https://web.dev/articles/service-worker-lifecycle) : une installation réussie prépare une version en attente ; une installation rejetée conserve la version active. Notre composant ajoute le contrôle des empreintes et la sauvegarde avant adoption. Les exemples de purge de cache de la documentation ne sont pas appliqués à ce projet.

La version 2.3.0 ajoute les scripts PDF et les polices locales. Les 16 scripts et le CSS portent SRI ; les polices sont aussi épinglées par la page et vérifiées avant génération du rapport. Adoption 2.2.1 → 2.3.0, export de 500 dossiers en trois langues et export arabe après rechargement sans serveur vérifiés. Les anciens caches restent conservés. Preuves : `audit/2026-10-13/pdf-pagine/rapport.md`.

La version 2.3.1 corrige les lots et aperçus sur les écrans étroits ; les boutons d'un aperçu restent accessibles pendant le défilement de son contenu. Adoption depuis 2.3.0, sauvegarde avant mise à jour, reprise en copie de 500 mesures après arrêt confirmé du serveur, export complet et conservation à l'identique des 65 sessions du précédent export vérifiés. Aucun ancien cache supprimé. Les essais intermédiaires locaux ont aussi leurs identifiants de release distincts ; seule la release finale `5a211f902acdb72103741bce75ec3917e16823e8560933431fdfa038b926de6c` est le résultat retenu. Preuves : `audit/2026-10-13/lots-lisibles/rapport.md`.

## 4.0.1 — 20 octobre 2026

- Informations légales, confidentialité, stockage local et conditions d’usage en FR/EN/AR, accessibles depuis le pied de page et disponibles hors ligne.
- Identité publique Tout Informatique Lazaret et notices des ressources conservées.
- Inventaire détaillé des droits tiers et des services prévus ; aucune GPL globale appliquée au code propre.
- Préparation du build statique Vercel et des en-têtes de sécurité, sans installation de dépendances. Publication suspendue tant que les droits et conditions d’hébergement ne sont pas résolus.
- Le moteur de calcul reste 4.0.0 ; aucun résultat existant recalculé et aucune donnée locale déplacée.

## 4.1.0 — 21 octobre 2026

- Choix explicite de la GPLv3 pour le code original TIL ; COPYING et notices conservés.
- Sources correspondantes de l’application et tables OMS originales téléchargeables depuis les pages légales FR/EN/AR, également hors ligne.
- Variante jsPDF dédiée aux rapports, sans modules MD5, ancien RGBColor, images ou HTML inutilisés ; sources lisibles, adaptations et script de reconstruction fournis.
- Données OMS et moteurs inchangés ; aucune migration ni transmission de dossiers d’enfants.
- Construction Vercel conditionnée à la cohérence des notices et sources. Hébergement et forfait à contrôler séparément.

## 5.3.0 — 26 octobre 2026

Import CSV jusqu’à 50 000 fiches/50 Mio, association des colonnes, unités et dates explicites, découpage des grands imports en travaux de 5 000 fiches enregistrés ensemble. Calcul des lots progressif. PDF sur les lots actifs élargis. Paquet public de contrôle numérique sans installation ni oracles locaux, documentation de périmètre et recherche de références complémentaires. Aucune modification des formules OMS et aucun partage patient activé.

## 5.3.1 — 26 octobre 2026

- Sur PC, les boutons d’export et d’import évitent de répéter PDF/CSV : le format se lit dans l’icône, agrandie et placée après le libellé. Les commandes PDF/CSV du lot gardent seulement leur icône et leur intitulé complet au survol.
- Les libellés, tailles et dispositions sur mobile sont conservés, y compris dans le menu Actions.

## 5.4.0 — 27 octobre 2026

- Indicateurs OMS facultatifs : périmètre crânien, PB pour âge, plis tricipital et sous-scapulaire ; domaines explicites, historique, CSV/PDF et courbes. Les seuils absolus PB et les calculs usuels restent inchangés ; moteur combiné 4.2.0.
- Contrôle du format de sauvegarde isolé de sa préparation IndexedDB pour des tests publics sans base ; transaction de restauration en copie conservée.
- Socle public synthétique de 16 tests, runner refusant zéro test, suite privée séparée et 962 cas complémentaires Decimal.
- CI sans déploiement, contribution, sécurité, templates et documentation actuelle ; la présence du workflow ne prouve pas encore une exécution GitHub.
- Format unique .zscore et protection .zscore.enc conservés ; aucun résultat historique recalculé et aucun backend patient ajouté.
