# Référence CDC — profil américain explicite

**CURRENT — sources locales 5.5.0, moteur combiné 4.3.0, service CDC 1.0.0.** Le choix est explicite dans Réglages et dans chaque formulaire. Il est conservé par visite : changer la préférence ne transforme ni ne recalcule les dossiers existants. Les nouvelles visites d’un dossier conservent son profil ; un professionnel peut le changer explicitement. L’interface hébergée peut différer tant que ce lot n’est pas publié. Les tests automatisés ci-dessous ne constituent pas des essais navigateur ou une relecture clinique.

## Périmètre et sources

- Poids/âge et taille debout/âge : [tables LMS CDC 2000](https://www.cdc.gov/growthcharts/cdc-data-files.htm).
- IMC/âge : LMS CDC 2000 jusqu’au 95e centile ; [méthode étendue CDC 2022](https://www.cdc.gov/growthcharts/extended-bmi-data-files.htm) au-dessus.
- Domaine : **24 à moins de 240 mois** pour les deux sexes. La ligne 240 sert uniquement d’extrémité à l’interpolation. Aucun calcul à 240 mois ou au-delà, aucun poids/taille ajouté à ce profil.
- Le profil est OMS avant deux ans puis CDC, selon la [recommandation américaine](https://www.cdc.gov/growth-chart-training/hcp/using-growth-charts/recommendations-and-rationale.html). Le pays administratif ou la langue ne doit pas sélectionner silencieusement cette référence.

Les trois CSV originaux sont conservés octets inchangés dans `tools/reference/cdc/`. Les SHA-256 et URL initiales sont dans `additional-references.json` et repris dans `src/data/cdc-growth-manifest.json`. Conversion sans réseau :

```sh
python tools/scripts/build-cdc-reference.py
python tools/scripts/build-cdc-verification.py
node --test tools/public-tests/cdc.test.cjs
```

Le CSV IMC original contient une seconde ligne d’en-tête et une ligne à 240,5 mois pour chaque sexe. Le convertisseur les identifie explicitement ; il conserve les originaux et n’élargit pas le domaine à cause de ces lignes. Chaque table convertie contient 218 âges par sexe.

## Méthode

Les paramètres L, M et S sont interpolés linéairement entre les âges publiés, y compris entre 24 et 24,5 mois et entre 239,5 et 240 mois. La formule LMS utilise le cas logarithmique si L est nul. L’extension linéaire OMS à ±3 Z n’est pas appliquée aux scores CDC.

Un âge exact est fourni en mois décimaux ; les jours sont divisés par 30,4375. Si seul le nombre de **mois révolus** est connu, le service exige explicitement `agePrecision: 'completedMonths'` et ajoute 0,5 mois. Un âge décimal ne peut pas être marqué comme mois révolus. Il conserve séparément l’âge déclaré et l’âge de calcul ; aucune précision de date n’est inventée. Voir [instructions CDC](https://www.cdc.gov/growth-chart-training/hcp/computer-programs/sas.html).

Pour les enfants de ce domaine, une longueur couchée est convertie en taille debout en retirant **0,8 cm**, selon le CDC. Cette correction est distincte de la correction OMS de 0,7 cm. L’IMC utilise la taille ainsi corrigée. Les œdèmes inconnus sont refusés ; les œdèmes présents suspendent les scores dépendant du poids, suivant la politique conservatrice actuelle de l’application, sans présenter cette suspension comme une règle propre aux tables CDC.

Pour l’IMC supérieur au 95e centile, la méthode étendue utilise `P = 90 + 10 Φ((IMC − P95)/sigma)`, en pourcentage. Sigma est calculé avec l’âge en années :

- garçons : `0.3728 + 0.5196 × âge − 0.0091 × âge²` ;
- filles : `0.8334 + 0.3712 × âge − 0.0011 × âge²`.

Sigma est arrondi à huit décimales comme dans le [code des mainteneurs épinglé](https://github.com/CDC-DNPAO/CDCAnthro/blob/47a3a34897c27ee1bae80f7397b7cdb526822121/cdcanthro.R). Les équations ont été réimplémentées indépendamment ; le code R n’a été ni exécuté ni incorporé. Le fichier mensuel 2022 supplémentaire a renvoyé HTTP 403 lors de sa récupération ; il n’est pas prétendu acquis. Le calcul continu repose sur les trois tables 2000 acquises et les équations sigma publiées, pas sur un tableau sigma reconstitué ou inventé.

Le score étendu inverse la probabilité de queue, ce qui évite de remplacer arbitrairement les scores élevés par un plafond de 8,21. Si la probabilité n’est plus représentable numériquement, le résultat est suspendu explicitement. Un centile qui s’arrondirait à 0 ou 100 n’est pas affiché comme une valeur exacte ; le score non arrondi reste conservé lorsqu’il est calculable. Les graphiques publiés jusqu’à Z = 5 ne constituent pas une preuve de précision clinique pour toute valeur extrême calculable.

## Catégories et drapeaux

L’IMC utilise les [catégories CDC](https://www.cdc.gov/growth-chart-training/hcp/using-bmi/summary.html) : inférieur au 5e centile, de 5 à moins de 85, de 85 à moins de 95, au moins 95 ; critère d’obésité sévère à au moins 120 % du 95e centile ou IMC au moins 35 kg/m². Les comparaisons portent sur les mesures/seuils avant arrondi, pas sur le centile affiché. Les poids/âge et tailles/âge indiquent seulement une position descriptive (<3, 3–97, >97), sans reprendre les catégories de malnutrition OMS.

Les drapeaux utilisent le **Z modifié CDC**, distinct du Z LMS ou du Z IMC étendu : demi-distance entre médiane et ±2 Z. Bornes publiées : poids/âge −5/+8, taille/âge −5/+4, IMC/âge −4/+8, avec drapeau strictement hors de ces bornes. Un drapeau invite à examiner les mesures ; il ne prouve pas une erreur et ne supprime pas la visite. Aucun seuil national de prise en charge n’est déduit de ces catégories.

## Contrôles et limites

La suite publique comprend six tests lisibles : provenance, domaines/interpolation, âge estimé, position/œdèmes, catégories/drapeaux et comparaison numérique. Elle compare **254 cas fictifs** à une évaluation indépendante Python Decimal (60 chiffres), **161 probabilités normales** à `math.erfc` et **120 points de courbes inverses**, dont deux positions sans solution LMS réelle laissées explicitement non traçables. Elle inclut deux exemples publiés sur la page CDC de l’IMC étendu. Ces contrôles ne constituent pas une exécution de SAS/R, une certification CDC, une relecture clinique ou une validation physique.

Les tests publics contrôlent la bascule, l’âge jusqu’à moins de 240 mois, la conservation/restauration des visites, les exports CSV, les courbes et les résumés séparés par référence, ainsi que les textes et modèles PDF FR/EN/AR. La validation visuelle, clavier, RTL réel et PDF imprimé reste à effectuer séparément. Le dépistage OMS 6–59 mois doit garder une portée explicite ; l’absence de poids/taille CDC ne doit jamais être interprétée comme une absence de critère clinique.

## Attribution

Source : Centers for Disease Control and Prevention (CDC), National Center for Health Statistics. L’utilisation de ces données et liens ne constitue aucune approbation par le CDC, le HHS ou le gouvernement des États-Unis de Z-score Niger ou de TIL. Aucun logo CDC n’est utilisé. Voir [conditions d’utilisation des contenus CDC](https://www.cdc.gov/Other/imagereuse.html) et [NOTICE](../../NOTICE.md) ; les droits des éléments tiers restent distincts du code original GPL de l’application.

## Conservation du profil par visite

`growthProfile: 'us'` est explicite dans les nouvelles mesures ; l’absence de ce champ conserve le profil OMS. Le moteur combiné utilise un quatrième argument pour recevoir les tables CDC. Une demande CDC sans ces données est refusée plutôt que calculée avec OMS. Les mesures américaines utilisent `ageDomainVersion: 3` et le résultat conserve `profileContext` version 1, son âge déclaré et sa précision. Le résultat conserve le schéma 4 et la sauvegarde reste le flux version 1 ; les visites OMS sans contexte restent lisibles avec leur domaine d’âge 2.

Le validateur distingue les catégories CDC, le Z modifié, la méthode IMC d’origine/étendue et les centiles. Il contrôle les liens avec l’âge et la position de la mesure et refuse un résultat CDC présenté comme OMS. Ces contrôles arithmétiques ne réexécutent pas les tables sur les visites importées et ne constituent pas une certification du contenu. Les tests publics couvrent la bascule, la précision d’âge, le mélange de références, les altérations et la sauvegarde/chiffrement.


## Réglages, imports, courbes et sorties

La préférence s’applique aux nouveaux brouillons et aux imports sans colonne `growthProfile`. Une valeur explicite `who` ou `us` dans une ligne CSV prime ; une autre valeur est rejetée. Le profil d’un travail déjà saisi reste conservé. Le formulaire comporte un choix repliable pour chaque nouvelle mesure. Les mois révolus CDC utilisent le milieu du mois (+0,5) ; les dates/jours utilisent leur âge calculé sans ajout. Les résultats et exports indiquent les deux âges, leur précision et la méthode.

Le CSV de résultats ajoute les colonnes `growth_profile`, `reported_age_months`, `age_precision`, la méthode et le Z modifié par indicateur, puis les seuils/paramètres de l’IMC. Ce CSV n’est pas une sauvegarde réimportable de l’espace de travail : utiliser `.zscore` ou `.zscore.enc`.

Les courbes physiques CDC emploient l’inverse de la méthode étendue pour l’IMC au-dessus du P95 ; elles ne prolongent pas les LMS d’origine dans cette zone. Les points conservent l’âge effectif et la mesure harmonisée enregistrés. Les références OMS/CDC ne sont pas reliées dans une même courbe. Les résumés utilisent les catégories propres à chaque famille et excluent les valeurs suspendues/signalées des dénominateurs. L’export préparatoire DHIS2 compte les lignes et observations de dépistage enregistrées ; il ne convertit pas une catégorie d’IMC CDC en malnutrition aiguë OMS.
