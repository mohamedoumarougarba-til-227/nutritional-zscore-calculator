# Rapports agrégés et DHIS2

Dans **Traitement par lots → Résumé du lot → Rapport agrégé / DHIS2**, choisir le mois. Le fichier générique contient des comptes de fiches de mesure, sans noms ni identifiants individuels. Les visites répétées restent comptées : il ne s’agit pas d’enfants uniques ou d’admissions. Les fiches hors du mois et les évaluations manquantes sont comptées séparément.

Le fichier DHIS2 est préparé localement, sans connexion ni envoi. Le responsable du système destinataire fournit le profil validé : organisation, jeu de données, éléments de données et combinaisons de catégories. Il confirme que ces métriques comptent bien des fiches. Les codes mal formés et correspondances répétées sont refusés.

Avant conversion, le rapport lui-même doit annoncer le format `zscore-measurement-aggregate`, version 1, un mois valide et l’unité `measurement-rows`. Un mapping correct ne suffit pas à autoriser un rapport déclaré en admissions ou enfants uniques. Les comptes doivent être des entiers sûrs, positifs ou nuls, avec les dix métriques attendues et des sous-totaux compatibles avec les fiches du mois. Les dates de mesure impossibles sont exclues avec les fiches hors période. Ces contrôles de cohérence ne certifient ni les mesures importées ni l’acceptation par DHIS2.

Exemple à remplacer par les codes réels ; les codes ci-dessous sont fictifs :

```json
{"format":"zscore-dhis2-mapping","version":1,"unit":"measurement-rows","orgUnit":"A0000000001","dataSet":"A0000000002","mappings":[{"metric":"rows","dataElement":"A0000000003","categoryOptionCombo":"A0000000004"}]}
```

Métriques : `rows`, `eligible6to59`, `muacMissing`, `muacSevere`, `muacModerate`, `muacNotLow`, `nutritionSevere`, `nutritionModerateCriteria`, `nutritionIncomplete`, `dangerPresent`. Elles se chevauchent ; ne pas les additionner comme des catégories exclusives. Les petits effectifs peuvent rester sensibles.

`eligible6to59` compte uniquement les fiches âgées de 6 à moins de 60 mois hors profil postnatal INTERGROWTH ; ce nom n’établit pas l’éligibilité à une admission ou à un programme. Plusieurs visites d’un même dossier comptent plusieurs fiches. Aucun seuil universel de publication ou d’anonymisation des petits effectifs n’est imposé : le destinataire doit définir les règles de partage applicables. Ce fichier n’est pas une enquête représentative ni une estimation de prévalence de population.

La sortie utilise `dataSet`, `period` mensuel YYYYMM, `orgUnit` et `dataValues`. Le destinataire contrôle métadonnées, droits, période ouverte et doublons avant import. Une génération réussie ne démontre pas l’acceptation par une instance ni la conformité à un canevas national.

Source : [documentation officielle DHIS2](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-241/data.html).


## Contrôle du lot et préparation d’analyse — sources 5.7.0

La section **Contrôle du lot**, repliée par défaut sous la liste des fiches, examine le lot entier, sur toutes ses pages. Les lignes signalées sont paginées par huit et ouvrent un aperçu en lecture seule. Les numéros désignent l’ordre du travail courant, pas l’ordre d’un ancien CSV ni un identifiant permanent.

Les signaux comptent des lignes : sans identifiant ; âge estimé ; PMA seul ; œdèmes inconnus ; date absente/impossible ; sexe ou âge non exploitables ; mesure non numérique/nulle/négative ; résultat non calculé/importé ; score demandé indisponible/signalé par son moteur ; référence de score incohérente. Un signal n’est ni une erreur certaine ni un diagnostic. Un âge estimé peut être la meilleure information disponible ; un résultat indisponible peut être attendu dans le domaine de la référence. L’absence de signal ne certifie pas la qualité d’une mesure.

Trois rapprochements sont distincts :

- Même identifiant exact (espaces périphériques retirés), avec sexes, dates de naissance ou gestations connues contradictoires : candidat à relire. Une information inconnue ne devient pas contradictoire.
- Même identifiant et même date de mesure : plusieurs visites le même jour peuvent être légitimes.
- Même identifiant/date/profil et mêmes entrées d’âge, mesures et observations cliniques contrôlées : mesures potentiellement dupliquées. Horodatages de calcul, IDs internes et résultats dérivés sont exclus de cette comparaison.

Les fiches sans identifiant ne sont pas rapprochées sur le seul poids/sexe/âge. Aucun nom n’est utilisé pour supposer une identité. Les comptes de lignes et de groupes sont séparés par le service ; aucune fusion, suppression, correction, déduplication ou exclusion du dénominateur n’est automatique. Les signaux se chevauchent : leur somme peut dépasser le nombre de lignes signalées.

**Contrôle des lignes · CSV** contient format/version/unité, numéro local de ligne et codes de revue stables, sans identité. **Préparer une analyse · CSV** produit `zscore-analysis-preparation` version 1, unité `measurement-rows` et `sampling_design=not-provided`. Il conserve mesures d’origine avec unités dans les en-têtes, taille harmonisée/IMC enregistrés, sexe, mois de mesure, âge/précision et âge de calcul, PMA/gestation s’ils sont connus, références et moteurs, scores bruts/arrondis, centiles, erreurs, méthodes et signalements existants. Les scores ne sont pas recalculés, arrondis de nouveau ou regroupés en une même référence. Les résultats importés sont identifiés.

Noms, identifiants de dossier/visite/enfant, date de naissance et jour de mesure ne figurent pas dans cette préparation. Cela ne garantit pas l’anonymat : mois, âge, sexe et mesures peuvent permettre des rapprochements, notamment dans de petits effectifs. Protéger le fichier et respecter les règles du destinataire. Le numéro de ligne facilite une correction locale ; il ne crée pas une identité partageable.

Les colonnes `sampling_cluster`, `sampling_stratum` et `sampling_weight` restent vides. Aucun poids égal à 1, grappe ou strate n’est inventé. Le responsable d’enquête doit fournir le plan, l’unité d’observation, les règles pour visites répétées, l’échantillonnage, les pondérations et le traitement des valeurs manquantes. Ce CSV de préparation ne calcule aucune prévalence représentative, intervalle de confiance d’enquête ou estimation tenant compte d’un plan complexe. Les indicateurs CDC, INTERGROWTH et OMS restent distingués par référence/domaine ; ils ne doivent pas être additionnés comme des catégories interchangeables.

Ces CSV dérivés ne sont pas des sauvegardes complètes ; utiliser `.zscore`/`.zscore.enc` pour conserver et reprendre tout le travail. Ils n’ajoutent pas un ancien format ni un import automatique des résultats. Le contrôle et les exports sont locaux, hors ligne après chargement complet, et ne modifient aucun résultat, historique ou format de sauvegarde.
