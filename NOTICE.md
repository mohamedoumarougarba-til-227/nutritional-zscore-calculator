# Z-score Niger — licence et attributions

Copyright © 2026 Tout Informatique Lazaret (TIL).

Sur décision du titulaire le 20 octobre 2026, le code original de l’application est distribué sous **GNU General Public License, version 3**. Le texte complet est dans [COPYING](COPYING). Cette décision remplace la préparation d’une licence propriétaire, qui n’a pas été publiée.

Cette licence couvre les créations originales du projet : l’interface, les moteurs JavaScript indépendants, les modèles, les services et composants, ainsi que les scripts de construction et les adaptations TIL du rendu PDF. Les éléments tiers conservent leurs auteurs et licences :

- WHO Anthro : GPL version 3 ; WHO AnthroPlus : GPL version 3 ou ultérieure. Tables originales et conversions lisibles fournies.
- jsPDF, AutoTable, fflate et FileSaver : notices MIT respectives conservées. La version PDF TIL exclut les composants MD5, RGBColor amont, HTML et images inutilisés ; ses modifications originales sont sous GPL version 3.
- Amiri : SIL Open Font License 1.1, texte et attributions conservés. L’intégration de ces polices ne change pas la licence des rapports produits.
- fake-indexeddb : Apache-2.0, dépendance des tests uniquement, non livrée dans l’application.
- GIGS : extrait du code R de London School of Hygiene & Tropical Medicine et des auteurs GIGS, GPL version 3 ou ultérieure, commit fb58fe6596d4b289d5362c5efe00f882984d3186. Code original, DESCRIPTION et licence conservés dans tools/reference/intergrowth ; adaptation numérique TIL sous GPL version 3. Profil postnatal INTERGROWTH explicite dans les sources 5.6.0 ; équations runtime et contexte de visite fournis dans les sources correspondantes. Les tables PDF Oxford ne sont pas redistribuées. Voir [INTERGROWTH](docs/references/INTERGROWTH.md).
- Tables LMS CDC 2000 : source Centers for Disease Control and Prevention (CDC), National Center for Health Statistics. Les trois CSV originaux, leur provenance et une conversion hors ligne sont inclus. Leur réutilisation suit les [conditions CDC](https://www.cdc.gov/Other/imagereuse.html), distinctes de la GPL du code original ; aucune notice tierce spécifique n’est présente dans ces CSV. Les calculs du profil CDC et leurs limites sont décrits dans [CDC](docs/references/CDC.md).

Les sources correspondant à la version servie sont téléchargeables dans `data/zscore-sources.zip` ; le dépôt GitHub est également public. L’archive contient les fichiers nécessaires à la reconstruction, les références originales et les sources de la variante PDF, avec les instructions. Les outils de construction généraux s’obtiennent séparément dans les versions indiquées.

Les données saisies, dossiers d’enfants, sauvegardes privées et documents de terrain ne deviennent pas des logiciels libres et sont exclus de cette archive. Les droits sur les marques et les ressources tierces ne sont pas transférés à TIL ; aucune approbation par l’OMS ou l’UNICEF n’est revendiquée.

**L’utilisation des contenus CDC et des liens correspondants ne constitue aucune approbation du CDC, du HHS ou du gouvernement des États-Unis de cette application, de TIL ou de ses services.** Aucun logo CDC n’est utilisé. Les sources 5.5.0 proposent un profil américain explicite, avec références conservées par visite et contrôles numériques distincts de la validation clinique ou physique.

Contact public : contact@tilbadge.com.
