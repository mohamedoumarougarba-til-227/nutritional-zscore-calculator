# Droits de distribution de Z-score Niger

> Actualisation du 21 octobre 2026 : le titulaire a choisi la GPLv3 pour le code original. Les conclusions ci-dessous sur une distribution propriétaire sont historiques et remplacées par [Distribution GPL](DISTRIBUTION_GPL.md). Sources téléchargeables, notices conservées et variante PDF dédiée sont mises en œuvre en 4.1.0.

Vérification du 20 octobre 2026. Version examinée : 4.0.0, commit signé `0f450a2d446be01e2a5d251eed7195a2736f9628`. Préparation des informations légales en 4.0.1. Ce document distingue les conditions constatées dans les sources et la qualification juridique qui reste à établir ; ce n’est pas une garantie d’absence de litige.

## Conclusion pour le propriétaire

**L’exclusivité sur tout le paquet ne peut pas être affirmée dans son état actuel.** La volonté exprimée est de réserver à TIL les droits du code propre, si les droits tiers le permettent. Aucune licence GPL d’ensemble n’a donc été appliquée au code de TIL. Le dépôt reste privé et aucun téléchargement public de ses sources n’a été créé.

Il faut distinguer trois choses : la propriété du code original, la licence accordée aux utilisateurs et les droits des composants tiers. Une bibliothèque permissive peut être intégrée à un logiciel propriétaire sans ouvrir le code propre. En revanche, ses propres conditions et notices ne disparaissent pas. Une interdiction générale de modifier ou redistribuer **tous** les fichiers, y compris les bibliothèques et les polices libres, serait inadaptée.

Le principal point à résoudre porte sur les tables OMS tirées de dépôts GPL et distribuées au navigateur pour le fonctionnement hors ligne. La conversion TSV vers JSON ne les rend pas automatiquement exclusives. Cela ne suffit pas non plus à démontrer que tout le moteur JavaScript indépendant doit être GPL : il faut qualifier les droits sur les données et l’assemblage. La présente vérification ne prétend pas trancher ce point par le seul nom de la licence.

## Inventaire des éléments effectivement utilisés

| Élément | Présence et source vérifiées | Compatibilité avec du code propre propriétaire | Conditions / points ouverts |
| --- | --- | --- | --- |
| WHO Anthro, commit `b776d8a12b1c97369c748b561159fd2ec4f4db58` | Cinq tables LMS : poids/âge, taille/âge, poids/longueur, poids/taille, IMC/âge ; bruts, JSON et manifestes conservés | **À qualifier** pour la distribution combinée des données | Le dépôt déclare GPL-3. Conserver notices et sources couvertes ; ne pas interdire leurs droits de redistribution et modification. Aucune autorisation commerciale propriétaire distincte n’est présente dans le projet. |
| WHO AnthroPlus, commit `7cfcdb39026e9a55de55732bc3cf14c82261bcf7` | Trois tables LMS : poids/âge, taille/âge et IMC/âge | **À qualifier**, même question | Déclaration GPL-3 ou ultérieure ; pas de permission distincte établie. |
| jsPDF 4.2.1, bundle UMD inchangé | `src/vendor/pdf/jspdf-4.2.1.umd.min.js`, SHA-256 `e6551fcdc32f09d6853b2c5126d18d01d9447e0da618a41a11ebeee0f6c20d54` | Licence principale **MIT**, compatible en principe | Copyrights et licence conservés. L’examen des composants internes ci-dessous révèle une réserve de provenance supplémentaire. |
| AutoTable 5.0.8 | Bundle et notice épinglés dans la provenance PDF | **Oui**, MIT | Garder copyright et notice. Ne rend pas le code propre libre. |
| Amiri Regular et Bold | Deux polices inchangées et notice, commit Google Fonts `fffdadf0f0c9cc1ec8b407063424a8bfbee05611` | **Oui**, OFL-1.1 | Les polices restent sous OFL, ne peuvent être vendues seules ; pas d’interdiction de leur extraction/réutilisation conforme. Les PDF produits et le code propre n’en deviennent pas OFL. |
| fake-indexeddb 6.2.5 | Unique dépendance du verrou npm, utilisée par les tests locaux | **Oui**, Apache-2.0 ; absent du paquet public | Aucun besoin de l’installer sur Vercel pour produire les fichiers statiques. Si on le redistribue un jour, appliquer ses notices et conditions. |
| Graphiques, tableaux, exports CSV, calculs JavaScript | Code local, SVG et API du navigateur ; aucun Chart.js, Highcharts ou service de calcul distant intégré | Pas de nouvelle licence de bibliothèque détectée | Cette revue du dossier n’est pas une attestation de titularité sur toute contribution historique. Les formules scientifiques ne doivent pas être confondues avec une copie d’implémentation tierce. |
| Icônes et logo PWA | SVG inline géométriques ; PNG générés par le script Python local | Pas de paquet d’icônes externe distribué détecté | Ne pas revendiquer une autorisation de marque OMS/UNICEF ; ne pas utiliser leur logo sans permission. |
| Police système Segoe UI / Arial / sans-serif | Noms CSS seulement, fichiers non distribués | Pas d’ouverture du code | Le système de l’utilisateur fournit ces polices. |
| Node.js, Python, Git et outils CLI | Outils de développement, construction et synchronisation ; non intégrés au paquet web | Leur simple usage n’impose pas la licence du code produit | Les composants des outils ne sont pas vendus comme créations TIL. L’audit ne couvre pas un futur installateur qui les embarquerait. |
| Navigateurs, IndexedDB, localStorage, service worker et Cache Storage | API de la plateforme ; aucun service de base de données cloud configuré | Pas de cession du code à un public tiers par ces API | Les fichiers web et données de référence sont techniquement reçus par le navigateur. Licence propriétaire et impossibilité technique de copier sont deux notions différentes. |

### Composants internes de jsPDF

Le bundle conserve 28 blocs `@license`, examinés directement, dont des plugins MIT, pako 2.1.0 (MIT et zlib), omggif (MIT), des éléments Adobe sous conditions de type BSD, FPDF annoncé permissif et WebP sous MIT. Ces familles n’imposent en principe pas d’ouvrir le code propre ; leurs notices doivent rester accessibles. Ne pas modifier le bundle pour effacer ces notices.

Deux déclarations méritent une attention particulière : le parseur de couleurs est accompagné d’une permission informelle, et le composant MD5 de Joseph Myers est décrit par jsPDF comme n’ayant pas de licence particulière précisée. La source officielle jsPDF 4.2.1 confirme cette dernière mention. La licence MIT générale est bien présente, mais cette revue ne transforme pas l’imprécision amont en autorisation certaine. Clarifier la provenance, obtenir une confirmation adéquate ou préparer un bundle minimal excluant les composants concernés avant d’annoncer une chaîne de droits sans réserve. Ne pas remplacer la bibliothèque à l’aveugle : les exports, polices arabes et impressions doivent être revérifiés après toute modification.

## Services actuels ou prévus

| Service | Effet sur les droits du code | Conclusion pratique |
| --- | --- | --- |
| GitHub, dépôt privé | Le propriétaire conserve ses droits ; GitHub reçoit les droits nécessaires au service. Les dépôts privés sont traités comme confidentiels selon la section E. Un dépôt public autorise notamment la consultation et le fork via GitHub. Des fonctionnalités IA optionnelles ont leurs conditions. | **Compatible avec un projet propriétaire**, garder ce dépôt privé. Ne pas assimiler confidentialité du dépôt et secret du JavaScript servi aux visiteurs. Ne pas activer de fonctions IA supplémentaires sans examiner leurs réglages. |
| Vercel, hébergement prévu | Les conditions consultées le 20 octobre portent la date du 19 octobre 2026. Elles accordent à Vercel des droits non exclusifs étendus pour exploiter et améliorer le service ; ce n’est pas une licence libre donnée aux visiteurs. Elles prévoient aussi l’entraînement de modèles sur Hobby / essai Pro, avec une option de refus dans les réglages d’équipe ; pas d’activation par défaut sur Pro payant selon le texte. | **Peut héberger du propriétaire**, mais pas avec une promesse qu’aucun tiers ne reçoit de droit technique. Vérifier les réglages d’entraînement avant connexion du dépôt. L’API d’équipe consultée n’expose pas l’état de ce réglage : il n’est pas validé. |
| Vercel Hobby, équipe actuelle | Réservé aux usages personnels non commerciaux par les conditions et les règles d’usage | **Pas adapté à la vente d’accès**. L’usage professionnel porté par TIL doit être qualifié avant publication sur Hobby ; prévoir une offre autorisant cet usage. Aucun abonnement payant n’a été souscrit. |
| npm / GitHub officiel / site OMS | Fournisseurs des ressources et notices téléchargées, pas des services recevant les dossiers d’enfants à l’exécution | Ne pas confondre accès gratuit à un téléchargement et autorisation de réutilisation propriétaire. |
| Paiements, dons, sponsors | Aucun prestataire de paiement, formulaire de don, SDK publicitaire ou traceur de sponsor n’est actuellement intégré | Leur choix et leurs conditions devront être examinés lors de leur ajout. Pas d’intégration fictive ni de promesse de compatibilité d’un fournisseur encore inconnu. |
| Base cloud / authentification / messagerie / analytics | Aucun Supabase, Firebase, compte utilisateur cloud, synchronisation patient, outil d’analyse d’audience ou d’envoi d’email n’est intégré à cette version | Ces services ne sont pas nécessaires au déploiement statique proposé. Le lien email ouvre simplement le logiciel de messagerie de l’utilisateur. |

Vendre une application GPL est permis, de même que recevoir des dons ou un financement. Ce qui ne l’est pas est de supprimer les droits GPL des destinataires sur les éléments couverts. Une licence propriétaire du code spécifique permet de réserver davantage de droits sur ce code, **sous réserve de résoudre les éléments incompatibles ou incertains**. Dans tous les cas, la confidentialité des dossiers des enfants est distincte des licences logicielles.

## Documents OMS : ne pas mélanger les régimes

L’accord de l’ancien logiciel de bureau WHO Anthro limite les usages commerciaux. Ce n’est pas le texte des paquets R GPL utilisés ici : ne pas appliquer indistinctement l’un à l’autre. De même, les publications et guides OMS peuvent être sous CC BY-NC-SA ou sous d’autres conditions. La politique générale OMS demande une permission pour certains usages commerciaux et ne permet pas de supposer que tous les fichiers publiés avant 2017 sont devenus librement commercialisables.

Remplacer simplement les tables GPL par un téléchargement Excel ou PDF du site OMS ne résout donc pas nécessairement le problème. Il faut établir les conditions du fichier exact et la portée de la permission, puis vérifier l’identité et les limites numériques des nouvelles données. Les recommandations de soins futures, le document PCIMA transmis localement et les cas de relecture ne sont pas publiés avec l’application.

## Voie recommandée pour l’intention exprimée

1. Conserver le dépôt privé et les droits propres en attente ; ne pas appliquer GPL à tout le projet et ne pas publier une interdiction globale visant aussi les composants libres.
2. Établir une permission ou une qualification documentée pour les données OMS exactes dans un produit commercial propriétaire, ou identifier une source de remplacement offrant explicitement ces droits. Une éventuelle demande à l’OMS doit préciser les données, transformations, mode hors ligne et modèle de distribution. **Aucune demande n’a été envoyée.**
3. Clarifier les notices internes ambiguës de jsPDF, ou préparer séparément une alternative technique avec les mêmes capacités et une chaîne de droits vérifiable. Aucune dépendance ni table de calcul n’a été remplacée pendant cette vérification.
4. Prévoir une licence d’usage du code propre TIL avec une exception explicite pour les composants tiers et les droits impératifs. Ne pas revendiquer la propriété exclusive des tables OMS, bibliothèques ou polices.
5. Résoudre le forfait et les réglages Vercel avant de brancher la publication automatique. Les scripts de construction et en-têtes sont préparés ; la commande de déploiement refuse de publier tant que l’audit annonce `legalReady: false`.

## Sources primaires consultées

- [WHO Anthro, déclaration de licence du commit utilisé](https://github.com/WorldHealthOrganization/anthro/blob/b776d8a12b1c97369c748b561159fd2ec4f4db58/DESCRIPTION) et [licence](https://raw.githubusercontent.com/WorldHealthOrganization/anthro/b776d8a12b1c97369c748b561159fd2ec4f4db58/LICENSE.md).
- [WHO AnthroPlus, déclaration du commit utilisé](https://github.com/WorldHealthOrganization/anthroplus/blob/7cfcdb39026e9a55de55732bc3cf14c82261bcf7/DESCRIPTION).
- [FAQ GPL : distribution, agrégation et vente](https://www.gnu.org/licenses/gpl-faq.fr.html).
- [jsPDF 4.2.1, MIT](https://raw.githubusercontent.com/MrRio/jsPDF/v4.2.1/LICENSE) ; [notice MD5](https://raw.githubusercontent.com/MrRio/jsPDF/v4.2.1/src/libs/md5.js).
- [AutoTable 5.0.8, MIT](https://raw.githubusercontent.com/simonbengtsson/jsPDF-AutoTable/v5.0.8/LICENSE.txt).
- [pako 2.1.0, MIT](https://raw.githubusercontent.com/nodeca/pako/2.1.0/LICENSE) et [notice zlib](https://raw.githubusercontent.com/nodeca/pako/2.1.0/lib/zlib/deflate.js).
- [FAQ officielle OFL : inclusion dans un logiciel propriétaire et vente](https://openfontlicense.org/ofl-faq/).
- [Conditions GitHub, sections D et E](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).
- [Conditions Vercel](https://vercel.com/legal/terms), [usage commercial](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage), [forfait Hobby](https://vercel.com/docs/plans/hobby).
- [Politique de droits OMS](https://www.who.int/about/policies/publishing/copyright), [accès ouvert et publications antérieures à 2017](https://www.who.int/about/policies/publishing/open-access), [ancien accord du logiciel de bureau Anthro](https://www.who.int/docs/default-source/child-growth/child-growth-standards/software/license2.pdf).
- Identité éditeur : [mentions publiques TIL](https://www.tilbadge.com/legal), contact public `mailto:contact@tilbadge.com` et [site TIL](https://toutinformatiquelazaret.vercel.app/), vérifiés en lecture seule. Les textes de confidentialité de Badge Access ne sont pas repris comme description technique de Z-score.

## Preuves et portée

Le contrôle local `node tools/scripts/audit-licenses.cjs` vérifie les empreintes des ressources et notices. Ses résultats techniques ne valent pas avis juridique. L’extraction des 28 notices du bundle exact, les décisions et les résultats des commandes sont conservés sous `.local/audit/2026-10-20/droits-proprietaires/`, hors dépôt et hors paquet public. Les informations légales FR/EN/AR sont préparées, sans prétendre qu’une autorisation propriétaire de l’ensemble ou une certification médicale aurait été acquise.
