> Mise à jour du 29 octobre 2026 : le [profil INTERGROWTH postnatal](INTERGROWTH.md) est désormais raccordé aux sources 5.6.0 / moteur 4.4.0. Les deux notes ci-dessous décrivent les étapes antérieures du 28 octobre ; elles ne sont plus l’état d’activation courant. Données/droits Fenton toujours non acquis.

> Sources 5.5.0 : les quatre indicateurs OMS facultatifs sont intégrés. Le [profil américain OMS/CDC](CDC.md) est raccordé aux réglages, visites, archives, courbes, résumés et modèles PDF/CSV. Tests automatisés et rendus PDF ne remplacent pas les vérifications navigateur et terrain. Les références spécialisées restent recherchées, pas activées. Le relevé ci-dessous conserve la recherche initiale du 26 octobre ; ses tâches prévisionnelles sont historiques, pas la liste des travaux courants.

> Mise à jour du 28 octobre : [INTERGROWTH postnatal](INTERGROWTH.md) possède désormais un socle numérique séparé, trois indicateurs, des équations GIGS GPL épinglées, 90 cas Decimal publics et un recoupement privé de 1 596 cellules officielles. Un écart d’arrondi est documenté. Aucun profil prématuré n’est activé ; taille à la naissance, suivi postnatal et OMS ne sont pas substitués silencieusement. Fenton reste en recherche de données/droits vérifiables, sans présumer que la gratuité d’un calculateur autorise sa redistribution.

# Référentiels complémentaires — recherche du 26 octobre 2026

Les données ci-dessous ont été recherchées auprès des organismes ou auteurs. « Trouvé » ne signifie pas « actif dans le calculateur ». La version 5.3.0 conserve son moteur OMS 2006/2007 : aucun résultat enregistré n’est recalculé par un téléchargement de table.

## Sources récupérées

Sept fichiers originaux, 613 530 octets au total. Leur provenance et SHA-256 sont conservés dans `tools/reference/additional-references.json`, avec les octets sources, localement. Aucune dépendance n’a été installée.

| Données | Source primaire | État et travail nécessaire |
|---|---|---|
| CDC 2000 poids/âge, taille/âge, IMC/âge | [Fichiers LMS CDC](https://www.cdc.gov/growthcharts/cdc-data-files.htm) : `wtage.csv`, `statage.csv`, `bmiagerev.csv` | Fichiers récupérés. Implémenter le moteur CDC, ses catégories, âges exacts, centiles et tests indépendants ; ne pas réutiliser les catégories OMS sans vérification |
| Périmètre crânien pour l’âge | [Table OMS épinglée](https://github.com/WorldHealthOrganization/anthro/blob/b776d8a12b1c97369c748b561159fd2ec4f4db58/data-raw/growthstandards/hcanthro.txt) | Récupérée. Ajouter saisie facultative en cm, calcul, contrôles, historique, documents et courbe |
| PB pour l’âge | [Table OMS épinglée](https://github.com/WorldHealthOrganization/anthro/blob/b776d8a12b1c97369c748b561159fd2ec4f4db58/data-raw/growthstandards/acanthro.txt) | Récupérée. Le Z-score PB/âge est distinct des seuils absolus PB du dépistage 6–59 mois. Respecter l’âge couvert et convertir explicitement mm/cm |
| Pli tricipital pour l’âge | [Table OMS épinglée](https://github.com/WorldHealthOrganization/anthro/blob/b776d8a12b1c97369c748b561159fd2ec4f4db58/data-raw/growthstandards/tsanthro.txt) | Récupérée. Mesure facultative en mm et apprentissage de la mesure ; ne pas supposer disponible en consultation courante |
| Pli sous-scapulaire pour l’âge | [Table OMS épinglée](https://github.com/WorldHealthOrganization/anthro/blob/b776d8a12b1c97369c748b561159fd2ec4f4db58/data-raw/growthstandards/ssanthro.txt) | Récupérée. Même chaîne de validation et de restitution |

Les tables OMS sont issues du même commit amont que les données actuelles ; leurs notices doivent être conservées. Pour le CDC, conserver attribution, source gratuite et absence d’approbation de l’application par le CDC ; aucune utilisation de son logo n’est prévue. [Conditions CDC](https://www.cdc.gov/other/agencymaterials.html)

## Compléments identifiés à approfondir

- **CDC IMC étendu 2022** : le CDC renvoie au paquet `cdcanthro`, qui distingue le LMS original et les résultats étendus pour l’obésité. Une intégration américaine complète doit définir cette portée, pas seulement changer l’âge de bascule. [CDC — programmes R](https://www.cdc.gov/growth-chart-training/hcp/computer-programs/r-programs.html), [dépôt des mainteneurs](https://github.com/CDC-DNPAO/CDCAnthro).
- **Fenton 2025** : calculateur et documentation d’auteur identifiés ; les tables LMS complètes ne sont pas présumées librement redistribuables. Les méthodes de PediTools mentionnent une table d’auteur non publiée et RCPCH décrit une référence sous licence. Vérifier l’accès et la permission avant d’intégrer. [Calculateur Fenton](https://fentongrowth.ca/Index), [documentation d’auteur](https://fentongrowth.ca/docs/Fenton2025PlotterUsersManual.pdf), [méthodes PediTools](https://www.peditools.org/growth_engine/sources.php), [RCPCH](https://growth.rcpch.ac.uk/developer/rcpchgrowth/).
- **INTERGROWTH-21st** : ressources officielles de taille à la naissance et de croissance postnatale des prématurés identifiées. Définir les âges gestationnels/postmenstruels requis et vérifier les conditions exactes des données ou équations choisies. [Standards et outils](https://intergrowth21.tghn.org/standards-tools/), [applications officielles](https://intergrowth21.tghn.org/fetal-preterm-and-newborn-applications/).
- **Références britanniques et syndromes** : certaines références restent soumises à des licences tierces même dans un dépôt public. Vérifier chaque source, sa population et son usage ; une licence du dépôt ne les libère pas toutes. [Catalogue RCPCH et droits](https://github.com/rcpch/growth-references).

## Choix dans les réglages

Prévoir un **profil de référentiel de croissance**, distinct de la langue et du pays administratif :

- profil OMS international conservé par défaut ;
- profil américain : OMS avant deux ans puis CDC, avec portée IMC étendue explicitement définie ;
- profils spécialisés proposés uniquement pour les populations et références effectivement prises en charge.

Le professionnel voit le profil sélectionné et la référence de chaque résultat. Un changement de réglage s’applique aux nouveaux calculs ; il ne change pas les visites conservées. Ni le pays, ni la langue, ni une adresse IP ne doivent provoquer une substitution silencieuse de référence. Les bornes de sauvegarde, courbes, statistiques, CSV et PDF doivent être testées ensemble avant activation.
