# Préparation de l'accès public

## Livraison courante - 5.0.0, 21 octobre 2026

La version 5.0.0 est publiée sur https://zscore-niger.vercel.app/ depuis le commit signé `cede1e4`. Le dépôt privé est relié à `main` ; les push déclenchent la production. Le site est accessible sans compte ; les préversions Vercel restent protégées. Le choix GPLv3, les notices et sources téléchargeables sont mis en œuvre. Aucune nouvelle décision propriétaire/GPL ou création de projet Vercel n'est attendue.

L'aide PB/orientation OMS, les sauvegardes courantes avec option chiffrée et les exports agrégés préparant DHIS2 sont livrés. Une adaptation nationale, une prescription automatique ou une connexion DHIS2 ne sont pas annoncées sans leurs références et paramètres réels.

Pour chaque mise à jour : contrôler branche/HEAD/diff indexé ; reconstruire l'archive des sources et la release ; vérifier les tests appropriés, `licenseDistributionReady`, le paquet et ses empreintes ; signer le commit autorisé puis pousser. Contrôler ensuite le SHA du déploiement Git READY et les ressources servies. Une documentation incluse dans l'archive modifie aussi les empreintes de release. Ne pas réécrire un commit ni effacer les données pour adopter une version.

Les preuves de la livraison fonctionnelle sont dans [le bilan 5.0.0](../../.local/audit/2026-10-21/finalisation/RAPPORT.md). La revue métier, le protocole PCIMA applicable et les essais physiques complémentaires restent distincts des contrôles techniques réussis. Aucun avis médical n'est déduit de la publication. Les réglages personnels MFA/récupération des comptes ne sont pas déclarés audités.

## Historique conservé - les états ci-dessous décrivent leurs dates

Les absences de licence, de projet Vercel, de liaison Git ou d'autorisation décrites plus bas ont été levées. Les versions et formats remplacés sont cités comme preuves historiques, pas comme options courantes.

> Actualisation du 21 octobre 2026 : le choix GPLv3 et la fourniture des sources remplacent la suspension liée au modèle propriétaire. Voir [Distribution GPL](../references/DISTRIBUTION_GPL.md). Le build Vercel contrôle désormais `licenseDistributionReady`, sans assimiler cette réussite technique à une validation clinique ou à la compatibilité du forfait. Les constats datés ci-dessous restent historiques.

## Candidat actuel — 4.0.0, 19 octobre 2026

[Bilan 4.0.0](../../.local/audit/2026-10-19/integration-2007/rapport.md) : paquet local vérifié de 49 fichiers/2 338 913 octets, release `30ae2c9ee544c2bda24da552e70cc46ea8ce35eba430134ec862cc2ca24dba53`. 187 tests et audit numérique combiné réussis ; aucune publication. Les notices/provenances sont techniquement contrôlées, `legalReady: false` ; protocoles/revue métier, essais physiques complémentaires, droits et compte d’hébergement restent à établir avant une autorisation sur ce paquet précis. Le dépôt GitHub relu est privé et le premier commit est signé ; cela ne crée ni hébergement, ni protection du compte hébergeur. Les bilans plus bas sont historiques.

## Présentation de l’application — 2.9.15, 17 octobre 2026

À la demande du propriétaire, retrait des mentions Prototype, Bêta, Version de développement et de la mention de relecture médicale à réaliser dans les textes de l’application, en français, anglais et arabe. Le pied de page utilise À propos ; les informations, l’aide, l’impression et les PDF décrivent les repères nutritionnels et leurs limites d’usage. Aucun calcul, schéma de sauvegarde ou droit d’accès modifié. Ce changement éditorial ne constitue pas une nouvelle validation médicale ni une publication. Les preuves historiques et les validations encore ouvertes dans le suivi sont conservées.

143 tests automatisés réussis, puis 33 contrôles ciblés réussis après harmonisation des styles ; mise à jour et fenêtre d’information vérifiées dans le navigateur intégré. Aucun nouvel essai TECNO ou Chrome natif. [Bilan, fichiers et commandes](../../.local/audit/historique/2026-10-17/libelles-application/rapport.md). Release `4f79df19ff478725810b049ed95b9bc5e232023eabf86aa4c9a619554db32517` ; paquet local de 43 fichiers / 2 096 308 octets, non publié.

## Reprise du 17 octobre 2026 — 2.9.14 inchangée

Les anciennes sessions serveur avaient disparu. Aperçus PC rétablis : source sur 127.0.0.1:8001 et paquet vérifié sur 127.0.0.1:8002, même release `2abd656c802ae9228c4756246aad382d6e36f6a2683ee7f53c078d91ab5ea576`. Le TECNO n’est pas détecté ; la redirection USB ne peut pas être vérifiée actuellement. Le transport USB réussi le 16 reste une preuve historique, sans validation supplémentaire de Chrome Android. Le kit de relecture 2.9.1 reste cohérent numériquement avec les sources actuelles vérifiées ; il n’est pas un avis médical réalisé. [Contrôle et blocages restants](../../.local/audit/historique/2026-10-17/reprise-finalisation/rapport.md).

## État de sauvegarde corrigé — 2.9.14

Une ancienne écriture ne peut plus afficher Enregistré pour une saisie plus récente ni modifier l’indicateur d’un autre travail. Écriture immédiate et reprise après échec affichent Sauvegarde en cours jusqu’à confirmation de la dernière version concernée. **143 tests automatisés réussis**. [Bilan et portée](../../.local/audit/historique/2026-10-16/etat-sauvegarde/rapport.md). Release 2abd656c802ae9228c4756246aad382d6e36f6a2683ee7f53c078d91ab5ea576 ; paquet 43 fichiers / 2096660 octets, non publié.

## Correction de fiabilité — 2.9.13

Import CSV protégé contre les activations simultanées ; lecture de fichier annulée si le travail ou la page a changé ; erreur de lecture signalée et commandes réactivées après échec. Les lignes ajoutées restent disponibles si leur sauvegarde échoue. **138 tests automatisés réussis**, contrôle ciblé du collage CSV dans le navigateur intégré ; sélecteur réel et TECNO non validés à nouveau. [Rapport et preuves](../../.local/audit/historique/2026-10-16/csv-concurrence/rapport.md). Release 3cb9816d148766490733869a8f3513bcece3a26851e76cfb32ac14874e06522f, paquet 43 fichiers / 2096311 octets, non publié.

## État actuel — 16 octobre, 2.9.12

Lots : Reprendre un travail/Nouveau travail en haut ; informations import/âge estimé regroupées dans une seule aide i près du titre, sans répétition par ligne. Les alertes propres aux mesures restent visibles et les métadonnées/rapports détaillés sont conservés. **130 tests automatisés réussis** ; reprise/nouveau/reprise et rendu ordinateur/mobile vérifiés dans le navigateur intégré, sans nouvel essai physique TECNO. [Bilan technique](../../.local/audit/historique/2026-10-16/utilite-et-perimetre/rapport.md).

[Étude d’utilité pour le Niger](../projet/ETUDE_UTILITE_NIGER.md) et [audit du périmètre initial](../projet/AUDIT_PERIMETRE_INITIAL.md) ajoutés : intérêt plausible à démontrer au pilote ; promesses initiales absentes, choix remplacés et validations externes distingués. Aucun ajout de synchronisation, PB, triage national ou export DHIS2 sans spécification. Release 93c3672e788f1a5fed1fd4bee286428810d01dc6724e709f1f3a4d4a83a71d1c ; paquet neuf 43 fichiers / 2 094 362 octets, non publié. Objectif global actif et incomplet ; cible 3 Go/plafond 5 Go inchangés.

## Dernières corrections — 2.9.11

Pagination commune : plage « Affichage de 1 à 8 sur X résultats » à gauche, flèches et numéros à droite, page active en couleur et ellipses. Huit lignes conservées pour historique/lots. Dans Sauvegardes, retrait du bouton Sauvegarder une version et du panneau de copies locales ; **copies déjà stockées conservées**, panneau d’espace maintenu et sauvegardes des formulaires présentes. Les petits i ouvrent une bulle ancrée non modale ; la fenêtre Prototype est élargie à 920 px maximum et répartie sur deux colonnes sur ordinateur. **126 tests automatisés réussis**, contrôles ciblés du navigateur intégré, distincts des essais Chrome natifs et TECNO. [Bilan et preuves](../../.local/audit/historique/2026-10-15/aides-pagination-2.9.11/rapport.md). Release `06917112c7b1fb86cd6366fa5a3b69734852f06a59a764f0966326605ced1130` ; paquet 43 fichiers / 2092952 octets, non publié.

## Sauvegardes — correction 2.9.9

Historique limité à **huit versions par page**, avec Précédent/Suivant et recherche conservée. Les titres de remplacement « Brouillon » et leurs pluriels traduits sont maintenant recherchables ; espaces superflus, casse et accents sont normalisés. Aucun historique supprimé ni format de sauvegarde modifié. **120 tests automatisés réussis** et contrôle ciblé dans le navigateur intégré, distinct de Chrome natif et du TECNO. [Preuves et explication des commandes](../../.local/audit/historique/2026-10-15/sauvegardes-2.9.9/rapport.md). Release `4ff2d227b99dfb04e8dc8a4a90a4bda0b7f4681a5d5dc404ad4ecaab36cfbffe` ; paquet 43 fichiers / 2085887 octets, non publié.

## Dernière retouche CSV — 2.9.8

Icône CSV retirée devant le titre « Importer ou coller un CSV ». Les deux commandes affichent **Choisir un CSV** et **Modèle CSV** quand le panneau offre au moins 500 px intérieurs ; les intitulés complets restent accessibles au survol et aux lecteurs d’écran. La section et ses deux actions se replient ensemble. Version 2.9.8, release `5fc7d30a5356e4caf1a512ee2d4bb2df9bc8ba54e3e93d59104a691c08a5da6c` ; 118 tests automatisés réussis, 42 ressources locales contrôlées et paquet 43 fichiers / 2085309 octets, sans publication. [Preuves et tâches restantes](../../.local/audit/historique/2026-10-15/csv-libelles-2.9.8/rapport.md). Les observations navigateur intégré restent distinctes des essais Chrome natifs et physiques TECNO. Arrêt demandé après les corrections.

État du 16 octobre 2026 : candidat **2.9.14**, paquet local `.local/public-builds/2.9.14-2abd656c802a-5efc40d2-e882-4d2a-b660-8afbc28e5571`, 43 fichiers / 2096660 octets. Release `2abd656c802ae9228c4756246aad382d6e36f6a2683ee7f53c078d91ab5ea576`. Aucun déploiement ni contrôle d’accès distant réalisé ; [preuves](../../.local/audit/historique/2026-10-16/etat-sauvegarde/rapport.md).

## Option proposée : hébergement statique Cloudflare Pages

La [page du service](https://www.cloudflare.com/products/pages/) annonce un démarrage gratuit et SSL intégré. Les [limites officielles Free](https://developers.cloudflare.com/pages/platform/limits/) indiquent 500 builds/mois, 20 000 fichiers/site et 25 MiB par fichier. L'application statique est suffisamment petite pour ces limites ; vérifier les mesures du paquet produit et recontrôler les conditions au moment d'ouvrir le service. Aucun serveur de calcul ni service payant n'est requis par l'architecture actuelle.

L'adresse fournie en `pages.dev` évite l'achat initial d'un domaine. Le [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) accepte un dossier ou ZIP depuis le tableau de bord ; il permet une préparation locale sans installer Wrangler. Ce mode de projet ne se convertit pas ensuite directement en projet d'intégration Git : choisir la stratégie avant création. Un domaine personnalisé serait une dépense distincte à autoriser.

C'est une option de préparation, pas un compte déjà configuré ni une garantie permanente de coût nul. Aucun compte, abonnement, projet distant, ZIP téléversé ou clé n'a été créé dans cette phase. Le coût d'accès Internet des utilisateurs reste distinct de l'hébergement.

## Paquet et contrôles locaux

Depuis le dossier du projet :

```powershell
npm run check:release
npm test
npm run audit:clinical
npm run audit:licenses
npm run prepare:public
node tools/scripts/prepare-public.cjs --verify .local/public-builds/<dossier-produit>
```

Utiliser **le dossier produit**, jamais la racine du projet ni une copie intégrale de `src/`. La liste autorisée exclut les fichiers historiques inutilisés et tous les audits/classeurs/exports. Conserver le manifeste et les preuves hors du paquet. Aucune commande ci-dessus n'envoie de fichier sur Internet.

Le paquet inclut `_headers`, au [format documenté pour Pages](https://developers.cloudflare.com/pages/configuration/headers/), avec CSP limitée aux ressources locales, interdiction d'encadrement, absence de referrer, `nosniff` et revalidation des ressources. Ces règles sont destinées à un hébergement statique Pages, sans Function ; vérifier les réponses réellement reçues après déploiement. Ne pas activer minification/injection de scripts qui change les octets validés.

## Notices et propriété

Le contrôle de provenance/notices est exécuté avant création et lors de la vérification de chaque paquet ; il ne délivre pas une autorisation juridique. Consulter [DROITS_ET_LICENCES.md](../references/DROITS_ET_LICENCES.md), établir les droits sur le code et résoudre la portée des ressources Anthro avant diffusion publique. Le paquet peut être préparé pour revue tant que legalReady reste faux ; cette préparation locale ne vaut pas feu vert de publication.

## Portes de validation avant l'ouverture

| Validation | État actuel | Preuve attendue |
| --- | --- | --- |
| Cohérence des ressources et absence d'anciens modules distribués | Contrôles locaux du paquet | Manifeste, SHA-256 et tests du paquet ; aucune donnée terrain incluse |
| Protocole nigérien applicable | Non authentifié | Source officielle/émetteur, édition, pages, confirmation locale ; voir REFERENCES_NATIONALES.md |
| Revue médicale | Non réalisée | Avis daté, version, cas et décision sur les limites/mesures debout avant neuf mois |
| Essais physiques TECNO et transfert A → B | Parcours de base 2.7.2 réussi selon l’utilisateur ; autres essais, interface actuelle 2.9.14 et transfert A → B ouverts | Voir VALIDATION_TERRAIN.md : version/appareil, observations et retests ; ne pas étendre ce retour aux tests non effectués |
| Accessibilité et performance finales | Partiellement vérifiées | Lecteur d'écran, grands caractères, catalogue volumineux et corrections nécessaires |
| Droits/licences de redistribution et propriété | Notices et provenance vérifiées ; droits encore à clarifier | Décision documentée sur code propre et portée des ressources Anthro ; voir DROITS_ET_LICENCES.md |
| Compte d'hébergement du propriétaire | Non configuré/vérifié | Authentification forte, récupération, droits limités, absence de secret public |
| Autorisation de publication de la version présentée | À obtenir à la fin | Feu vert explicite ; le feu vert aux travaux ne publie pas automatiquement |

Les choix facultatifs du carnet d'évolutions ne doivent pas retarder les validations indispensables. Ne pas présenter le site comme cliniquement validé tant que les portes métier/terrain restent ouvertes.

## Vérifications après un déploiement autorisé

Contrôler la version publique et les octets/pins, HTTPS et les en-têtes ; vérifier que les anciens chemins admin/tables historiques et les chemins audit sont absents. Une URL inconnue ne doit pas exposer un fichier de travail. Vérifier séparément qu'un visiteur ne peut pas publier ou modifier les références ; la lecture du code navigateur n'est pas un droit d'écriture sur l'hébergement.

Avec des dossiers fictifs, installer hors ligne, fermer/rouvrir sans réseau, sauvegarder, exporter, importer sur un second appareil ayant déjà du travail, puis vérifier sa conservation. Tester une adoption de version et un retour à une version préparée, sans suppression de cache ou de données. Documenter URL, release, date, appareil, anomalies et correctifs. Une réponse HTTP locale ne prouve pas cette validation publique.

## Préparation Vercel et mentions — 20 octobre 2026

Les informations légales, de confidentialité, de stockage local, les conditions d’usage et attributions sont préparées en français, anglais et arabe (`src/legal*.html`) et intégrées au paquet hors ligne. Identité publique de Tout Informatique Lazaret reprise des pages TIL, contact `contact@tilbadge.com`. Aucun cookie publicitaire ni outil de mesure d’audience ajouté.

`vercel.json` définit une construction Node sans installation npm, une sortie `dist` limitée au paquet vérifié et les en-têtes CSP, anti-cadrage et confidentialité. La commande `node tools/scripts/vercel-build.cjs` refuse la publication tant que `legalReady` est faux. Voir [audit de distribution](../references/AUDIT_DROITS_DISTRIBUTION.md). Ce refus est attendu et ne doit pas être supprimé pour contourner la décision sur les droits.

Cible prévue : équipe `mohameds-projects-0af41c6a`, dépôt privé `mohamedoumarougarba-til-227/nutritional-zscore-calculator`, branche `main`. Aucun lien Git Vercel actif n’est encore créé. Après résolution des droits, du forfait commercial et des préférences d’entraînement : créer le projet avec cette configuration, relier le dépôt et vérifier un déploiement issu du SHA poussé. Les futurs push sur `main` pourront alors déclencher la production via l’intégration Git native, sans secret de déploiement ajouté au dépôt.

## Liaison Git établie — 21 octobre 2026

Le choix GPL et les sources correspondantes sont mis en œuvre en 4.1.0. Le projet Vercel `zscore-niger` est créé, avec un premier paquet préconstruit vérifié ; le titulaire a ensuite autorisé l’accès au dépôt privé dans l’application GitHub Vercel. La liaison est maintenant établie sur `main`. La construction Git doit être contrôlée par son SHA, son état et les octets servis ; voir [Synchronisation Git](SYNCHRONISATION_GIT.md). La production est accessible sans connexion ; seules les préversions restent protégées par authentification Vercel. Les constats précédents d’absence de projet et de liaison sont historiques.
