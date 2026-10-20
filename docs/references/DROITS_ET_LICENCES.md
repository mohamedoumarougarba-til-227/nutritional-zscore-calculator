# Propriété du code et ressources tierces

> Actualisation du 21 octobre 2026 : le titulaire a choisi la GPLv3 pour le code original. Les conclusions ci-dessous sur une distribution propriétaire sont historiques et remplacées par [Distribution GPL](DISTRIBUTION_GPL.md). Sources téléchargeables, notices conservées et variante PDF dédiée sont mises en œuvre en 4.1.0.

État du 14 octobre 2026. Objectif : accès gratuit au calculateur, sans compte utilisateur, avec maîtrise des mises à jour par son propriétaire. Ce document inventorie les ressources et les décisions encore nécessaires ; il n'attribue aucune nouvelle licence au code du projet.

## Ce qui est vérifié

| Élément | Licence ou provenance constatée | Conservation et limite |
| --- | --- | --- |
| Tables LMS converties de WHO Anthro | Le [DESCRIPTION du commit figé](https://raw.githubusercontent.com/WorldHealthOrganization/anthro/b776d8a12b1c97369c748b561159fd2ec4f4db58/DESCRIPTION) déclare GPL-3 ; le [texte de licence](https://raw.githubusercontent.com/WorldHealthOrganization/anthro/b776d8a12b1c97369c748b561159fd2ec4f4db58/LICENSE.md) est conservé. | Notice publique : [LICENSE-anthro.txt](../../src/data/LICENSE-anthro.txt). Cinq TSV originaux et leurs empreintes sont conservés dans tools/reference/who/, dont la table IMC ajoutée en 3.0.0 ; les preuves historiques restent dans .local/audit/. La portée des droits sur les tables converties et leur distribution avec l'application reste à clarifier. |
| jsPDF 4.2.1 | [Notice MIT et copyrights](../../src/vendor/pdf/jspdf-4.2.1.umd.min.js.LICENSE.txt) de la version intégrée. | Fichier exact et notice inclus dans le paquet ; conserver les mentions lors de toute redistribution. |
| AutoTable 5.0.8 | [Notice MIT et copyright](../../src/vendor/pdf/autotable-5.0.8.min.js.LICENSE.txt) de la version intégrée. | Même contrôle de conservation ; ne pas présenter cette bibliothèque comme une création du projet. |
| Amiri Regular et Bold | [SIL Open Font License 1.1](../../src/vendor/pdf/OFL.txt), avec copyright du projet Amiri. | Polices inchangées, notice et métadonnées conservées ; l'intégration de la police n'accorde pas un droit de revendiquer son nom ou ses auteurs. |
| fake-indexeddb 6.2.5 | Le package installé déclare Apache-2.0. | Dépendance de tests uniquement, absente du paquet public et des téléphones. |
| Code spécifique du calculateur | Aucune licence d'ensemble ni preuve complète de titularité n'a été établie à partir du dossier reçu. | Identifier les auteurs, apports antérieurs et droits nécessaires avant de choisir les conditions de distribution. Aucun changement de licence effectué. |

Le moteur JavaScript est une implémentation locale de la méthode publiée ; ce constat technique ne tranche pas les droits sur les données ou un éventuel ensemble dérivé. Les calculs exécutés dans le navigateur et les tables reçues pour le mode hors ligne sont consultables. Les droits d'écriture sur l'hébergement sont une question distincte.

## Point GPL à résoudre avant publication

Les sections 4 à 6 du [texte GPL-3 amont](https://raw.githubusercontent.com/WorldHealthOrganization/anthro/b776d8a12b1c97369c748b561159fd2ec4f4db58/LICENSE.md) encadrent notices, modifications et accès au code source des œuvres couvertes. Elles distinguent également un ensemble dérivé d'un simple agrégat. Il reste à qualifier le cas des tables converties et de cette application ; la présence du fichier GPL seule ne prouve pas la conformité de l'ensemble.

Documenter cette qualification, les éléments éventuellement couverts, les sources à fournir et les mentions requises. Si une permission distincte est nécessaire, la conserver avec son périmètre. Toute décision changeant la licence du code propre doit être prise par le titulaire des droits. Ne pas annoncer une distribution entièrement propriétaire ou entièrement sous MIT sur la seule base des bibliothèques PDF.

## Contrôle reproductible

Exécuter **npm run audit:licenses**. L'audit est local et en lecture seule : il compare les huit fichiers PDF/polices à leur provenance, la licence Anthro à l'original conservé, les données converties et les cinq TSV à leurs empreintes, puis vérifie que les ressources et notices distribuées figurent dans la liste publique. Il retourne séparément technicalPassed et legalReady ; ce dernier reste faux tant que les décisions de droits sont ouvertes.

La préparation et la vérification de paquet exécutent aussi ce contrôle avant de produire ou valider un paquet. Un succès technique ne constitue ni une autorisation de publication ni une revue juridique. Les preuves sont sous [audit droits et références](../../.local/audit/historique/2026-10-14/droits-references/rapport.md).

Pour une nouvelle version de bibliothèque ou de source, conserver l'ancienne, sa provenance et ses mentions, puis examiner les nouveaux termes et actualiser les empreintes avec preuve. Ne pas contourner le contrôle en supprimant une notice de l'inventaire.

## Propriété et administration à finaliser

Consigner le titulaire du code, les contributions autorisées, les conditions d'utilisation publique et les obligations tierces. Conserver une copie de développement privée avec sauvegarde ; le dossier reçu ne possède actuellement pas de dépôt Git. Ne pas confondre cette confidentialité avec l'invisibilité du JavaScript distribué.

Vérifier séparément le compte d'hébergement : contrôle par le propriétaire, authentification forte, récupération, droits limités et absence de secret dans les fichiers publics. Aucun compte distant ni droit de publication n'a été configuré pendant cet audit. Les références de l'application restent en lecture seule pour les visiteurs.


## Référence OMS 2007 — 19 octobre 2026

Source WHO `anthroplus`, commit `7cfcdb39026e9a55de55732bc3cf14c82261bcf7`. Trois tables brutes épinglées et licence dans `tools/reference/who2007`, transformation standard dans `tools/scripts/build-who2007-data.py`, données/manifestes dans `src/data`. Le paquet distribue `LICENSE-anthroplus.txt`. La source déclare GPL version 3 ou ultérieure ; l’audit technique vérifie les octets et notices. Cela ne clôt pas la décision sur les obligations de redistribution et les droits du code assemblé, ni l’autorisation de publication.

## Revue du 20 octobre 2026

Voir [audit de distribution propriétaire](AUDIT_DROITS_DISTRIBUTION.md) : inventaire des ressources réelles, notices embarquées, GitHub privé et conditions Vercel. La préférence du propriétaire est de garder le code propre propriétaire si les composants le permettent ; aucune GPL globale n’a été appliquée. La qualification des tables OMS et une notice interne de jsPDF restent à résoudre. Le dépôt privé existe et la version 4.0.0 a été synchronisée avec un commit signé ; les constats antérieurs d’absence de Git sont historiques. Aucun projet Vercel ni abonnement payant n’a été créé.
