# Présentation publique et images

CURRENT — état public vérifié les 4–5 novembre 2026. Les captures ci-dessous restent celles de l’interface 5.7.1 / moteur 4.4.0, datées du 29 octobre ; elles ne sont pas présentées comme des essais rejoués sur chaque release.

## Réglages appliqués et release identifiable

Description appliquée (en anglais pour la découvrabilité) :

> Offline-first WHO/CDC growth Z-score calculator with an explicit INTERGROWTH postnatal profile, local records, FR/EN/AR, PDF/CSV and no account.

Topics appliqués : `nutrition`, `anthropometry`, `z-score`, `who`, `child-growth`, `public-health`, `offline-first`, `pwa`, `javascript`, `arabic`, `niger`, `global-health`, `open-source`.

La [release v5.8.2](https://github.com/mohamedoumarougarba-til-227/nutritional-zscore-calculator/releases/tag/v5.8.2) a été publiée le 4 novembre 2026 au commit signé `ffe86a5d12f8a4af1473581736b0d2ea0f627c35` : moteur 4.4.0, sources GPL, manifeste et empreintes joints. La fusion de la PR #1 a déclenché le déploiement Vercel automatique du même commit ; interface et ressources servies ont été vérifiées. Ce constat est daté : consulter les [releases](https://github.com/mohamedoumarougarba-til-227/nutritional-zscore-calculator/releases) et le pied de page pour une version ultérieure, sans supposer qu’une branche de développement est déjà déployée.

Lien du site : https://zscore-niger.vercel.app/. Vérifier sa version affichée avant d’annoncer une fonctionnalité de la branche. Aucun topic ou libellé ne doit suggérer un diagnostic, une certification OMS ou une validation gouvernementale. L’application nécessite un premier chargement complet pour préparer le fonctionnement hors ligne.

## Captures réelles, cas entièrement fictifs

Les JPEG sont des captures brutes de l’application locale dans le navigateur intégré, le 29 octobre 2026, au format de fenêtre disponible (environ 1280 × 720). Aucun patient, nom réel, compte ou service de dossiers distant n’a été utilisé. Les images ne sont ni des maquettes, ni des preuves d’essai Android, ni un audit de lecteur d’écran.

| Image | Saisie fictive | Résultat observé |
|---|---|---|
| [Individuel FR](../assets/individual-fr.jpg) | FICTIF-DEMO-001 ; masculin ; 1 an et 0 mois estimés ; 8 500 g ; 75 cm couché ; œdèmes absents ; PB non renseigné ; mesure 2026-10-29 | OMS 2006 : Z poids/âge −1,15, taille/âge −0,31, poids/taille −1,37, IMC/âge −1,35 ; centiles respectifs 12,4 / 37,8 / 8,5 / 8,8. Dépistage incomplet affiché, sans conclusion de bonne santé. |
| [Postnatal AR](../assets/postnatal-ar.jpg) | FICTIF-PRETERM-001 ; masculin ; 14 jours chronologiques ; gestation à la naissance 30 semaines + 0 jour ; 1 600 g ; 42 cm couché ; périmètre crânien 29 cm ; œdèmes absents ; mesure 2026-10-29 | PMA 224 jours ; Z poids 0,02 / longueur 0,42 / PC −0,57 ; P 50,7 / 66,4 / 28,3. Le PC est dans le volet complémentaire (replié sur la capture). Référence postnatale distincte, aucune catégorie clinique OMS transposée ; disposition RTL. |

Les résultats arrondis ci-dessus permettent de reproduire les captures ; la classification éventuelle utilise les valeurs non arrondies. La date et l’heure de calcul visibles décrivent seulement cet essai. Les saisies et calculs ne changent pas lorsqu’on passe de FR à EN ou AR ; l’interprétation clinique reste distincte de cette démonstration.

## Social preview

[PNG 1280 × 640](../assets/social-preview.png) et [source SVG éditable](../assets/social-preview.svg), création originale du projet sous GPL-3.0. Aucun logo OMS, photographie de patient ou label d’approbation. Les polices Amiri utilisées pour le rendu sont déjà embarquées, sous OFL avec leurs notices conservées.

Le générateur optionnel `tools/scripts/build-social-preview.py` utilise Python et Pillow déjà disponibles dans l’environnement choisi. Il ne télécharge aucune ressource. Sa réexécution n’est nécessaire ni pour lancer l’application, ni pour les tests publics, ni pour corriger la documentation. Ne pas installer une dépendance uniquement pour une faute dans le README. SVG et PNG sont des ressources documentaires ; ils ne sont pas ajoutés au cache de l’application.

GitHub accepte une image de moins de 1 Mo et recommande 1280 × 640 : [documentation officielle](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview). Le PNG préparé respecte ces dimensions. L’envoi de la preview reste une opération externe distincte, non réalisée par sa présence dans les sources. Description/topics ont été appliqués dans le lot autorisé du 4 novembre. Aucune sollicitation ou publication sociale automatique n’est prévue.

## Support et portée

Présenter l’outil comme une aide ouverte au calcul, au suivi local et à l’exploration avec références explicites. Les tests publics et comparaisons numériques ne sont pas un audit clinique ni une validation terrain. Les utilisateurs doivent protéger leurs postes, sauvegardes et exports ; l’hébergeur peut traiter des journaux techniques HTTP. Les issues servent aux problèmes reproductibles sur données synthétiques, sans SLA ni support d’urgence médicale.
