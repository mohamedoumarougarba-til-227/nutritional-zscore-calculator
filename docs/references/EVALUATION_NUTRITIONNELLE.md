# PB et aide à l’orientation

Application 5.0.0 ; règles `WHO-wasting-2023-B1-B2`, version 1.

Les courbes de croissance OMS 2006/2007 sont distinctes des recommandations de soins. Le PB est facultatif, en millimètres. Pour les 6 à moins de 60 mois moyens OMS : moins de 115 mm fournit un critère sévère ; 115 à moins de 125 un critère modéré. PB ≥ 125 ne suffit pas à exclure les autres critères. Hors de ce groupe, la mesure reste enregistrée sans ces seuils. Les bornes de saisie 50–400 mm repèrent notamment les erreurs d’unité ; ce ne sont pas des seuils cliniques.

Le critère sévère combine PB, P/T exploitable avant arrondi et œdèmes bilatéraux prenant le godet, évalués par le soignant. Un P/T signalé comme biologiquement improbable n’est pas utilisé pour conclure. Les nouvelles réponses cliniques sont initialement non renseignées. Une inconnue ne devient jamais « non ».

Un signe de danger appelle une évaluation urgente. Avec un critère sévère, les critères OMS d’orientation hospitalière sont pris en compte. L’application ne décide pas d’une admission et ne prescrit pas. Une revue pour soins ambulatoires nécessite des réponses explicites et aucune évaluation approfondie restant à faire. Le soignant confirme le lieu de soins et organise leur continuité.

Les résultats sont versionnés et conservés dans les visites, lots, CSV et PDF. L’import vérifie leur cohérence sans remplacer les scores enregistrés ; il ne certifie pas leur exactitude médicale.

## Sources officielles

- [OMS, recommandations 2023](https://www.who.int/publications/i/item/9789240082830), B1/B2.
- [OMS, orientation hospitalière](https://www.who.int/tools/elena/interventions/sam-identification-inpatient).
- [OMS, dénutrition aiguë modérée](https://www.who.int/tools/elena/interventions/food-children-mam).
- [OMS/UNICEF, guide opérationnel, 17 septembre 2026](https://www.who.int/publications/i/item/9789240122840).

Le guide 2026 aide à mettre en œuvre les recommandations. Ses tableaux, illustrations et protocoles médicamenteux ne sont pas reproduits dans la distribution GPL. Aucun protocole national n’est déclaré appliqué sans identification de l’édition utilisée et rapprochement des règles.

## Apports locaux nécessaires

Protocole PCIMA applicable et pages utiles ; lieux de référence accessibles ; rôles autorisés ; examen et test d’appétit pratiqués ; suivi et compte rendu attendus. Les prescriptions, doses, admissions et sorties de programme ne sont pas automatisées sur une supposition de protocole. Les traductions médicales en langues locales nécessitent un traducteur et un relecteur compétents.

## Colonnes CSV des observations

`muac` : millimètres. `cannotDrink`, `vomitsEverything`, `convulsions`, `lethargy`, `acuteProblem` : `y` constat présent, `n` absent après examen, vide non renseigné. `appetite` : `good` test réussi, `poor` échoué, vide non effectué. `oedemaGrade` : `1`, `2`, `3` uniquement avec oedema=y. `furtherAssessment` : `n` aucune évaluation approfondie nécessaire selon le soignant ; `y` nécessaire et en attente ; `cleared` réalisée sans indication d’hospitalisation ; vide non renseigné. Ces réponses décrivent une évaluation professionnelle, pas une autoévaluation du parent.
