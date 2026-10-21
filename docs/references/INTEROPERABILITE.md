# Rapports agrégés et DHIS2

Dans **Traitement par lots → Résumé du lot → Rapport agrégé / DHIS2**, choisir le mois. Le fichier générique contient des comptes de fiches de mesure, sans noms ni identifiants individuels. Les visites répétées restent comptées : il ne s’agit pas d’enfants uniques ou d’admissions. Les fiches hors du mois et les évaluations manquantes sont comptées séparément.

Le fichier DHIS2 est préparé localement, sans connexion ni envoi. Le responsable du système destinataire fournit le profil validé : organisation, jeu de données, éléments de données et combinaisons de catégories. Il confirme que ces métriques comptent bien des fiches. Les codes mal formés et correspondances répétées sont refusés.

Exemple à remplacer par les codes réels ; les codes ci-dessous sont fictifs :

```json
{"format":"zscore-dhis2-mapping","version":1,"unit":"measurement-rows","orgUnit":"A0000000001","dataSet":"A0000000002","mappings":[{"metric":"rows","dataElement":"A0000000003","categoryOptionCombo":"A0000000004"}]}
```

Métriques : `rows`, `eligible6to59`, `muacMissing`, `muacSevere`, `muacModerate`, `muacNotLow`, `nutritionSevere`, `nutritionModerateCriteria`, `nutritionIncomplete`, `dangerPresent`. Elles se chevauchent ; ne pas les additionner comme des catégories exclusives. Les petits effectifs peuvent rester sensibles.

La sortie utilise `dataSet`, `period` mensuel YYYYMM, `orgUnit` et `dataValues`. Le destinataire contrôle métadonnées, droits, période ouverte et doublons avant import. Une génération réussie ne démontre pas l’acceptation par une instance ni la conformité à un canevas national.

Source : [documentation officielle DHIS2](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-241/data.html).
