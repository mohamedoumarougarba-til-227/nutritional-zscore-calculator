# INTERGROWTH-21st — préparation postnatale, non activée

État du 28 octobre 2026 : socle numérique public préparé dans `tools/reference/intergrowth/postnatal.cjs`, complété par un contrat de visite séparé dans `visit.cjs`. Ils ne sont ni chargés par l’application 5.5.0, ni proposés dans les réglages, ni appliqués aux visites conservées. Les profils OMS/CDC actuels gardent leurs calculs. Aucun résultat ou format de sauvegarde n’est changé par cette préparation.

## Source, droits et méthode

Les équations sont adaptées de `R/ig_png.R` du projet [rOpenSci/GIGS](https://github.com/ropensci/gigs/tree/fb58fe6596d4b289d5362c5efe00f882984d3186), commit `fb58fe6596d4b289d5362c5efe00f882984d3186`, version déclarée 0.5.2.9000. Le code R original, DESCRIPTION, la GPL et leurs empreintes sont conservés dans le même dossier. Licence amont GPL version 3 ou ultérieure ; adaptation TIL GPL version 3. Aucun paquet R ni nouvelle dépendance n’est installé. Cette licence de code ne constitue pas une autorisation générale sur toutes les images ou tables du site Oxford.

Référence scientifique : Villar et al., *Lancet Global Health* 2015;3:e681–e691, [publication et résumé officiels](https://intergrowth21.com/node/142), DOI `10.1016/S2214-109X(15)00163-1`. Les [outils officiels](https://intergrowth21.com/tools-resources/postnatal-growth-preterm-infants) distinguent les références de taille à la naissance et le suivi postnatal des prématurés ; elles ne sont pas interchangeables.

| Entrée | Domaine du socle | Calcul |
|---|---|---|
| Âge postmenstruel (PMA) | 189 à 448 jours inclus, jours entiers ; semaines exactes = jours / 7 | Jamais l’âge chronologique utilisé à sa place |
| Sexe | M ou F, explicite | Coefficients différenciés |
| Poids pour PMA | kg strictement positifs et finis | Z = (ln(poids) − μ) / σ |
| Longueur pour PMA | cm strictement positifs et finis | Z = (ln(longueur) − μ) / σ |
| Périmètre crânien pour PMA | cm strictement positifs et finis | Z = (mesure − μ) / σ |

Les μ/σ sont des fonctions continues de l’âge exact, pas des paramètres LMS. Aucune interpolation de tables imprimées, extension OMS linéaire au-delà de ±3 Z, correction longueur/taille, catégorie nutritionnelle, admission ou prescription n’est ajoutée. Le noyau `postnatal.cjs` restitue des valeurs non arrondies et l’inverse Z → mesure ; valeurs non finies, non positives ou hors domaine renvoient `null`. Les centiles sont calculés séparément par le contrat préparé ci-dessous. Le poids pour longueur présent dans le code GIGS provient d’une autre communication signalée par ses auteurs ; il est volontairement hors de ce socle.

## Portée clinique à conserver dans une future interface

Selon la [FAQ officielle](https://globalhealthtrainingcentre.tghn.org/preterm-infant-feeding-and-growth-monitoring-implementation-intergrowth-21st-protocol/faqs/), ces courbes servent surtout au suivi après 32 semaines postmenstruelles et jusqu’à 64 semaines. Avant 32 semaines, la trajectoire demande une interprétation particulière. L’évaluation initiale à la naissance utilise les courbes de taille à la naissance ; le suivi postnatal ne doit pas les remplacer. Le contexte de perte/reprise de poids néonatale compte. Aucune règle arbitraire de délai minimal de 14 jours n’a été introduite.

Le domaine numérique 27–64 semaines ne prouve donc pas, à lui seul, qu’un résultat convient à tout contexte clinique. PMA = âge gestationnel à la naissance + âge chronologique ; l’âge corrigé est une autre notion. La préparation n’infère aucune de ces informations à partir du seul poids ou de l’âge actuel et ne modifie pas automatiquement l’âge OMS.

## Vérifications reproductibles et écart conservé

`npm test` exécute cinq tests publics dédiés : octets/licence épinglés, unités/domaines/entrées invalides, 90 cas synthétiques Decimal, valeurs non arrondies, absence d’activation dans les profils existants. Le générateur facultatif `python tools/scripts/build-intergrowth-verification.py` utilise seulement la bibliothèque standard Python, Decimal à 60 chiffres et les coefficients figés ; le JavaScript testé ne produit pas ses propres attentes.

Un contrôle privé distinct a comparé les 1 596 cellules des six tables Z officielles aux équations et aux tables du même commit GIGS. Les six tables GIGS sont identiques aux tables PDF officielles. Écarts absolus maximaux : 0,005027 kg pour le poids, 0,049912 cm pour la longueur et 0,049917 cm pour le périmètre crânien. Les PDF sont imprimés à 0,01 kg ou 0,1 cm.

Un écart dépasse légèrement une demi-unité imprimée : garçon, PMA 55 semaines, −3 Z. La table indique 4,40 kg ; les coefficients donnent 4,405026478… kg. Il est conservé et signalé dans un test, sans retoucher les coefficients ni prétendre à une égalité après arrondi sur toutes les cellules. Les PDF originaux sont consultables depuis les outils officiels ; ils ne sont pas redistribués dans l’archive publique. Leurs URLs et SHA-256 sont conservés dans `provenance.json`.

Ces contrôles vérifient l’arithmétique et la cohérence des sources ; ni GIGS R ni l’application officielle n’ont été exécutés. Ils ne prouvent pas une validation clinique.

## Contrat de visite préparé — pas un format utilisateur

`IntergrowthVisit.calculate(raw)` accepte sexe M/F, âge chronologique exact en jours ou calculé depuis deux dates ISO, âge gestationnel à la naissance en semaines entières et jours restants (0–6), puis poids en g, longueur couchée en cm et/ou périmètre crânien en cm. Au moins une mesure est requise. Il conserve distinctement :

- âge gestationnel à la naissance en jours ;
- âge chronologique depuis la naissance en jours ;
- PMA = somme des deux, sans arrondi en semaines complètes ;
- précision en jours et dates sources lorsqu’elles déterminent l’âge ;
- mesures originales, unités converties, référence, méthode et date de calcul.

La première version préparatoire de ce contrat est bornée aux naissances entre 26 et moins de 37 semaines, comme la cohorte de construction décrite dans l’article. Cette portée provisoire n’est ni la définition générale de la prématurité, ni une contre-indication des courbes pour les autres prématurés mentionnés par la FAQ. Le noyau numérique garde séparément son domaine PMA 27–64 semaines. La portée du profil utilisateur doit être arrêtée explicitement avant raccordement ; une vérification du contexte clinique n’est pas déduite de ces bornes. Le contrat inscrit `clinicalEligibilityAssessed: false`.

Le contrat calcule Z brut, Z affiché à deux décimales et centile normal à six décimales. Il partage uniquement la fonction de répartition normale déjà vérifiée du module CDC ; ce partage de fonction mathématique ne transforme pas INTERGROWTH en une référence CDC. Un centile arrondi à 0 ou 100 est indisponible avec statut `percentileExtreme`, sans fabriquer un centile extrême exact. Aucune catégorie clinique ou limite biologique OMS/CDC n’est copiée. `outsidePrintedChart` signifie seulement que le Z brut dépasse les courbes imprimées −3 à +3 ; `biologicalPlausibilityAssessed` reste faux.

La longueur exige la position couchée ; aucune correction de 0,7 ou 0,8 cm n’est appliquée. Les mesures absentes restent absentes. Par politique conservatrice de préparation, le score du poids est suspendu lorsque les œdèmes sont présents ou non renseignés ; longueur et périmètre crânien restent calculables. Ce choix de suspension n’est pas présenté comme une règle de calcul GIGS. Le contexte d’usage rappelle le suivi postnatal, la prudence avant 32 semaines, l’évaluation à la naissance distincte et la perte/reprise de poids néonatale. L’évaluation clinique et ces messages doivent encore être raccordés à la restitution FR/EN/AR.

`IntergrowthVisit.check(record)` vérifie types, sommes d’âges, dates, mesures/unités, méthode, arrondis, centiles et motifs de suspension. Il ne modifie pas le record et ne recalcule pas la vérité médicale d’une mesure importée. Six tests publics supplémentaires couvrent le contrat, les 90 cas numériques existants, jours bissextiles, bornes, mesures partielles, valeurs altérées et absence d’activation. Cette structure interne de préparation n’est ni un second fichier de sauvegarde proposé aux utilisateurs ni un objet actuellement accepté par l’importateur de dossiers. Le flux `.zscore` actuel et les visites existantes restent inchangés.

## Raccordement restant

Avant tout profil utilisateur : intégrer ce contrat d’âge et de mesures dans les formulaires, expliciter la portée clinique et la référence postnatale, traduire les messages sans diagnostic automatique, conserver le contexte par visite dans l’unique flux de sauvegarde courant, puis couvrir FR/EN/AR, sauvegardes/imports, CSV/PDF, courbes, lots, offline et accessibilité. Une bascule automatique vers OMS ou une correction silencieuse de visites existantes n’est pas prévue.

Fenton reste une recherche séparée : calculateur et guide des auteurs trouvés, mais aucune table complète et autorisation de redistribution/adaptation compatible n’est présumée acquise. Une permission pour un autre outil ne vaut pas permission pour celui-ci. Les questions de données/licence ne sont pas à faire trancher à l’ami infirmier.
