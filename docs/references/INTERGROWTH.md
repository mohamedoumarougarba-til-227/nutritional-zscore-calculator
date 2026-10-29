# INTERGROWTH-21st — suivi postnatal des prématurés

CURRENT — sources interface 5.7.2, moteur combiné 4.4.0, contrat de visite 1. Le profil `intergrowth` est un choix explicite des réglages ou de la visite, jamais déduit du pays, de la langue ou du poids. OMS reste le choix par défaut. Aucun ancien résultat OMS/CDC n’est recalculé ni converti. Le noyau est dans `src/js/services/reference-intergrowth.js` ; les points d’entrée `tools/reference/intergrowth/*.cjs` utilisent ce même code.

## Provenance et droits

Équations adaptées de `R/ig_png.R`, [rOpenSci/GIGS](https://github.com/ropensci/gigs/tree/fb58fe6596d4b289d5362c5efe00f882984d3186), commit `fb58fe6596d4b289d5362c5efe00f882984d3186`, version 0.5.2.9000. Copyright London School of Hygiene & Tropical Medicine et auteurs GIGS ; GPL version 3 ou ultérieure. Original R, DESCRIPTION et licence sont conservés avec leurs empreintes dans `tools/reference/intergrowth/`. L’adaptation TIL est GPL version 3. Aucune dépendance R ou réseau nécessaire au moteur. Cette licence ne donne pas des droits généraux sur les images ou tables Oxford ; les PDF officiels ne sont pas redistribués.

Référence scientifique : Villar et al., Lancet Global Health 2015;3:e681–e691, [publication officielle](https://intergrowth21.com/node/142), DOI 10.1016/S2214-109X(15)00163-1. [Outils officiels](https://intergrowth21.com/tools-resources/postnatal-growth-preterm-infants), [guide de l’application, page 8](https://intergrowth21.com/sites/default/files/2023-02/preterm_app_-_instructions_faq_2017_04_13.pdf) et [FAQ d’utilisation](https://globalhealthtrainingcentre.tghn.org/preterm-infant-feeding-and-growth-monitoring-implementation-intergrowth-21st-protocol/faqs/).

## Âges, mesures et calcul

Deux parcours : PMA exact directement renseigné, ou PMA calculé depuis l’âge gestationnel à la naissance et l’âge chronologique exact en jours/deux dates ISO. PMA = somme de ces deux âges. En saisie directe, les âges chronologique et gestationnel inconnus restent `null` ; ils ne deviennent pas zéro. Des champs contradictoires sont refusés. Le mode en mois estimés n’est pas accepté. Le mode dérivé exige une naissance prématurée explicitement renseignée, avant 37 semaines, jours restants 0–6 ; aucune borne inférieure de 26 semaines n’est inventée à partir de la seule cohorte de construction.

| Entrée | Domaine/méthode |
|---|---|
| PMA | 189–448 jours entiers inclus ; semaines exactes = jours / 7 |
| Sexe | M ou F explicite |
| Poids | Saisie g, équation kg : Z = (ln(poids) − μ) / σ |
| Longueur couchée | cm : Z = (ln(longueur) − μ) / σ |
| Périmètre crânien | cm : Z = (mesure − μ) / σ |

Au moins une mesure positive et finie. Les mesures absentes restent absentes. Les μ/σ sont des fonctions continues du PMA, distinctes de LMS. Aucun ajustement longueur/taille de 0,7 ou 0,8 cm, interpolation de table imprimée, extension linéaire OMS au-delà de ±3 Z ou changement d’âge OMS. Pas d’IMC/âge ni de poids/taille dans ce profil ; le poids/longueur du code GIGS a une provenance séparée, hors de cette intégration. Les plis cutanés ne sont pas ignorés silencieusement : ils doivent être effacés ou traités avec la référence OMS adaptée.

Z brut conservé, affichage à deux décimales ; centile normal à six décimales, indisponible s’il s’arrondit à 0 ou 100. Seule la fonction mathématique normale déjà vérifiée est partagée avec le module CDC. Aucune catégorie nutritionnelle ou limite biologique OMS/CDC copiée. `outsidePrintedChart` indique seulement |Z brut| > 3 ; `biologicalPlausibilityAssessed` et `clinicalEligibilityAssessed` restent faux. Par politique conservatrice de l’application, poids suspendu si œdèmes présents ou inconnus ; ce choix n’est pas présenté comme une équation ou règle GIGS.

## Restitution et conservation

Formulaires/messages FR/EN/AR, résultat, PMA par visite, sauvegarde `.zscore` et enveloppe `.zscore.enc`, import en copie, CSV/PDF et courbes utilisent le contexte enregistré. Les courbes physiques ont un axe PMA en semaines exactes ; l’évolution des Z-scores reste datée et séparée par référence. Les groupes de lots donnent des résumés descriptifs sans catégories cliniques. Les lignes INTERGROWTH sont comptées comme mesures dans l’agrégat préparatoire ; elles ne sont pas incluses dans ses indicateurs de dépistage OMS des 6–59 mois. Aucun envoi DHIS2.

La visite utilise `ageDomainVersion: 4`, un `profileContext` explicite et `intergrowthContext` version 1 dans le résultat courant schéma 4 ; pas de second format de fichier. Les logiciels antérieurs à 5.6.0 peuvent refuser ce profil. Lecture et export ne recalculent pas les scores importés : le contrôle vérifie structure, âge, unité, arrondi, centile et liens enfant/résultat, sans certifier la mesure médicale. Une nouvelle visite conserve l’identité et l’âge gestationnel connu ; le PMA de l’ancienne visite n’est pas réutilisé.

## Portée et vérifications

La FAQ officielle distingue l’évaluation initiale de taille à la naissance et le suivi postnatal, particulièrement après 32 semaines PMA jusqu’à 64 semaines. Avant 32 semaines et pendant la perte/reprise de poids néonatale, interprétation particulière avec le soignant. Aucun délai minimal arbitraire de 14 jours, diagnostic, prescription, admission autonome ou transition automatique vers OMS.

`npm test` couvre le noyau, 90 attentes Decimal indépendantes, les deux parcours d’âge, mesures partielles, archives/chiffrement/corruption, CSV, modèles PDF et HTML FR/EN/AR, courbes, agrégats et ordre de chargement JavaScript classique. Ce dernier contrôle VM n’est pas un essai navigateur. Le générateur facultatif `python tools/scripts/build-intergrowth-verification.py` n’utilise que la bibliothèque standard.

Le recoupement privé initial des 1 596 cellules des six tables officielles conserve ses preuves. Maximum absolu : 0,005027 kg, 0,049912 cm longueur et 0,049917 cm PC. Une cellule garçon, 55 semaines, −3 Z imprime 4,40 kg ; les coefficients donnent 4,405026478… kg, légèrement au-delà d’une demi-unité imprimée. Écart conservé dans un test sans retoucher les coefficients. Ni GIGS R ni l’application officielle exécutés ; aucun contrôle clinique ou physique présumé. Vérifications visuelles navigateur, clavier/lecteur d’écran, RTL et essai de mise à jour offline restent distincts et à consigner.

Fenton reste séparé : données complètes et droits de redistribution/adaptation compatibles non acquis. La gratuité d’un calculateur ou une permission accordée à un tiers ne suffisent pas. Les questions de licences/équations ne sont pas à faire trancher à l’ami infirmier.
