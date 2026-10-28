# Distribution de Z-score Niger sous GPLv3

Décision du titulaire exprimée le 20 octobre 2026, mise en œuvre dans l’interface 4.1.0 le 21 octobre. Le code original de Tout Informatique Lazaret est sous **GNU GPL version 3**. Cette décision remplace l’option propriétaire étudiée précédemment. Le dépôt GitHub est désormais public ; les sources correspondant au logiciel distribué restent également fournies avec celui-ci.

## Ce qui est fourni

- `COPYING` contient le texte complet de la GPLv3 ; `NOTICE.md` décrit les attributions et la portée de la décision. Le navigateur reçoit aussi `data/LICENSE-TIL.txt`.
- `data/zscore-sources.zip` contient le code lisible, les scripts de construction, les adaptations PDF, les références OMS originales, les notices et `SOURCE-README.txt`. Son inventaire SHA-256 est dans `data/zscore-sources.json`.
- `data/who-data-sources.zip` rassemble séparément les tables LMS d’origine, leurs conversions JSON, les licences et la provenance figée. Son inventaire est publié à côté.
- Les pages légales FR/EN/AR proposent ces téléchargements depuis le même hébergement que l’application, sans compte ni frais supplémentaires. Ils sont inclus dans le paquet hors ligne.

Les archives excluent les dossiers des enfants, les sauvegardes, les documents de terrain, les audits, les secrets, les métadonnées Git et `node_modules`. Une licence logicielle ne donne aucun droit sur les données personnelles saisies. La suite privée reste exclue ; le socle synthétique public et les comparaisons numériques indépendantes sont distribués avec leurs outils. Aucune donnée patient ne les accompagne.

## Composants et conditions

| Composant | Licence et conservation |
| --- | --- |
| Code original Z-score et adaptations TIL | GPL-3.0-only ; droits d’utilisation, étude, modification et redistribution selon la GPL |
| Tables WHO Anthro | GPL version 3 ; cinq tables de base et quatre tables complémentaires originales, conversions, manifestes et licence conservés |
| Tables WHO AnthroPlus | GPL version 3 ou ultérieure ; trois tables originales, conversions, manifestes et licence conservés |
| jsPDF 4.2.1, AutoTable 5.0.8, fflate 0.8.2 et FileSaver | Notices MIT respectives conservées ; la variante jsPDF distribuée est limitée aux fonctions utilisées par les rapports |
| Amiri Regular/Bold | SIL OFL 1.1, fichiers de licence et métadonnées conservés ; les rapports produits ne deviennent pas GPL du seul fait de la police |

La variante PDF exclut le MD5 Joseph Myers et l’ancien parseur RGBColor dont les formulations de permission nécessitaient une clarification. Les adaptations couleur et le refus explicite de l’option de chiffrement non proposée sont écrits par TIL. Aucun chiffrement de rapport n’est annoncé. Les fonctions d’images et de HTML inutilisées sont exclues. Le bundle complet historique reste dans les archives locales et dans l’historique antérieur ; il n’est ni servi ni inclus dans les sources de la variante distribuée.

Les valeurs OMS et les moteurs de calcul ne sont pas modifiés par cette opération. Les restrictions de l’ancien logiciel WHO Anthro de bureau et celles de publications OMS ne sont pas appliquées par analogie aux paquets R GPL. Aucun logo OMS ni approbation OMS/UNICEF n’est revendiqué. Les guides de prise en charge et documents PCIMA locaux ne sont pas republiés.

## Reconstruction et vérification

Avec Node.js 20 ou ultérieur, extraire les sources puis exécuter :

```text
node tools/scripts/build-release.cjs
node tools/scripts/build-release.cjs --check
node tools/scripts/audit-licenses.cjs
node tools/scripts/prepare-public.cjs
```

Aucune installation npm ni connexion réseau n’est nécessaire pour reconstruire le paquet fourni. La reconstruction optionnelle de la variante PDF utilise un module esbuild 0.27.2 installé séparément, indiqué par `ZSCORE_ESBUILD_PATH`, puis `node tools/scripts/build-pdf-report.cjs`. Les scripts de conversion optionnels des tables utilisent Python 3 sans paquet tiers.

`licenseDistributionReady` indique que les sources et notices attendues sont présentes et cohérentes. Ce contrôle technique ne constitue ni un avis juridique, ni une revue médicale, ni une validation physique sur téléphone. Le choix du forfait et les réglages du compte d’hébergement sont des contrôles distincts.

## Exploitation et financement

La GPL autorise la vente, les dons et le sponsoring, avec maintien des droits des destinataires sur les éléments couverts. TIL conserve son droit d’auteur ; la licence accorde des permissions aux destinataires et permet aussi leurs redistributions. Elle ne garantit ni exclusivité commerciale ni absence de litige.

Le forfait Vercel Hobby est réservé aux usages personnels non commerciaux. Une diffusion au titre d’une activité commerciale de TIL, un accès payant ou une monétisation nécessitent de vérifier un forfait approprié. Aucun abonnement payant n’est souscrit par ces scripts. Les préférences d’entraînement de modèles du compte sont à vérifier séparément ; aucun dossier d’enfant n’est envoyé à Vercel par l’application.

## Références

- [Texte GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.html), notamment sections 4 à 6 pour notices et sources.
- [FAQ GNU : vente d’un logiciel GPL](https://www.gnu.org/licenses/gpl-faq.html#DoesTheGPLAllowMoney).
- Licences exactes et commits figés dans `tools/reference/who`, `tools/reference/who2007` et `tools/reference/pdf-report/sources.json`.
- [Conditions Vercel](https://vercel.com/legal/terms), version consultée du 19 octobre 2026, et [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines).

Contact public : contact@tilbadge.com.
