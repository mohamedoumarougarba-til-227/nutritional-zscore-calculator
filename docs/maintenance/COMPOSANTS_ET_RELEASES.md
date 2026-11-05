# Composants, versions et préparation de release

CURRENT — procédures de maintenance ; les résultats d’anciens audits ne sont pas des contrôles automatiquement rejoués.

## Versions distinctes

| Objet | Source de vérité |
|---|---|
| Interface | `WorkspaceApp.version`, alignée avec `package.json` et le package-lock |
| Moteur combiné | `GrowthEngine.version`, conservée dans les résultats |
| Références | Identifiants/empreintes des manifestes OMS et CDC et code postnatal INTERGROWTH épinglé ; distincts du moteur |
| Sauvegarde | Flux `zscore-niger-stream` version 1 ; enveloppe facultative `ZSCOREENC1` |
| Résultat/espace de travail | Schéma de résultat 4 ; workspace 1 ; domaine d’âge 2 OMS / 3 profil américain / 4 postnatal INTERGROWTH ; contextes de profil/visite 1 ; complément facultatif 1 |
| Paquet/offline | ID SHA-256 de `src/release-manifest.json` et worker généré |

Les schémas sont des structures internes du format courant, pas des options d’anciens formats proposées à l’utilisateur. Un changement de schéma exige une analyse de compatibilité ; aucune suppression de sauvegarde ni conversion silencieuse. `private: true` dans package.json empêche une publication npm accidentelle et ne décrit pas la visibilité GitHub.

## Vérifications avant release

1. Inspecter branche, HEAD, status et diff ; préserver le travail non lié.
2. Vérifier les fichiers sélectionnés et leur provenance ; n’inclure ni `.local/`, ni tests privés, ni données patients.
3. Exécuter `npm test`, `npm run verify:public` et les contrôles privés pertinents disponibles. Dater séparément essais manuels et relecture métier.
4. Exécuter `npm run build:release`, `npm run check:release`, `npm run audit:licenses` et `npm run check:public`. Vérifier ensuite les mêmes commandes depuis la seule sélection publique ou les sources extraites, sans dépendance privée.
5. Examiner le diff généré ; vérifier que tous les fichiers à livrer sont réellement suivis avec `check:public -- --tracked` avant publication.
6. Préparer le paquet local avec `npm run prepare:public`. Cela ne le déploie pas. Conserver les empreintes et le lien avec le SHA du commit livré.

La CI publique prépare un paquet sans le déployer. Aucun badge de succès n’est annoncé avant une exécution GitHub correspondante.

## Tags, notes et paramètres GitHub

Convention utilisée : tag signé `v<version-interface>` sur un commit examiné. La première release versionnée [v5.8.2](https://github.com/mohamedoumarougarba-til-227/nutritional-zscore-calculator/releases/tag/v5.8.2), publiée le 4 novembre 2026, cible le commit de fusion signé `ffe86a5d12f8a4af1473581736b0d2ea0f627c35`. Les notes indiquent SHA, version UI, moteur, références, ID de release, changements utilisateurs/calculs/formats, compatibilité et validations encore manquantes. L’inventaire/checksum existant accompagne les sources GPL ; aucun second système de mise à jour n’est créé. La citation d’un résultat doit identifier la version du moteur et sa référence, pas seulement le nom du site.

La description et les topics effectivement appliqués sont documentés dans [présentation publique](PRESENTATION_PUBLIQUE.md). Le dépôt est public ; les preuves privées restent exclues. La fusion sur main utilise la liaison GitHub/Vercel existante : la CI vérifie et prépare, Vercel déploie. Vérifier après chaque livraison le SHA du déploiement, le manifeste servi et la version affichée ; un check vert ne prouve pas à lui seul la production.

Au 5 novembre 2026, main exige une PR, les checks GitHub Actions Node 20/24, une branche à jour, les conversations résolues et les signatures ; force-push et suppression sont interdits, administrateurs inclus. Zéro review d’une autre personne est imposée au mainteneur unique. La PR #1 a été fusionnée normalement, sans squash/rebase ni réécriture des commits signés.

Le signalement privé GitHub est activé ; voir [SECURITY](../../SECURITY.md). Ces réglages ont été relus après le lot explicitement autorisé. Une évolution des protections, une fusion ou une publication ultérieure reste une action à annoncer et autoriser selon le chantier ; la modification d’un document n’applique aucun réglage à distance. Ne jamais contourner les checks ou déplacer un tag publié pour actualiser une notice.

## Veille des ressources embarquées

À chaque release et périodiquement selon disponibilité, comparer les versions et avis de sécurité aux projets d’origine : [jsPDF](https://github.com/parallax/jsPDF), [AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable), [Amiri](https://github.com/aliftype/amiri) et les dépôts OMS épinglés. Noter date, version examinée, avis pertinent, exposition réelle, décision et test requis. `npm audit` n’inspecte pas automatiquement les bundles et polices vendorisés.

La distribution contient jsPDF 4.2.1 dans sa variante TIL report 1, AutoTable 5.0.8 et les polices Amiri épinglées ; l’inventaire exact est dans `src/vendor/pdf/*provenance.json`. Une version plus récente n’autorise pas à écraser directement le bundle ou ses notices. Étudier l’impact, reconstruire si nécessaire et tester FR/EN/AR, pagination et données fictives.

## Rebuild PDF optionnel

Une correction de texte ou du moteur ne nécessite pas de reconstruire jsPDF. La variante déjà construite est fournie avec ses sources lisibles.

Le builder attend **esbuild 0.27.2 exactement**. Son acquisition depuis le paquet officiel npm est une opération distincte : obtenir l’autorisation requise avant installation sur le poste et conserver version, intégrité et provenance. Le builder lui-même ne télécharge ni n’installe rien. Ne pas réutiliser un module provenant d’une source inconnue.

En PowerShell, avec un module déjà installé dans un emplacement explicitement choisi :

```powershell
$env:ZSCORE_ESBUILD_PATH = 'C:\chemin\autorise\node_modules\esbuild'
node tools/scripts/build-pdf-report.cjs
npm run build:release
npm run audit:licenses
```

Comparer le diff du bundle, `report-provenance.json`, les notices et les empreintes avant d’accepter une nouvelle sortie. Vérifier les modules exclus et les rapports fictifs dans les trois langues ; un hash différent doit être expliqué. L’absence du builder n’empêche ni `npm test`, ni une construction normale de release.
