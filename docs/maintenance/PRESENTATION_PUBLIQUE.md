# Présentation publique et images

CURRENT — préparation du 29 octobre 2026, interface 5.7.1 / moteur 4.4.0. Cette page prépare les réglages du dépôt ; elle ne prouve ni leur application sur GitHub, ni la fusion de la branche, ni la mise à jour du site hébergé.

## Réglages proposés

Description exacte proposée (en anglais pour la découvrabilité) :

> Offline-first WHO/CDC growth Z-score calculator with an explicit INTERGROWTH postnatal profile, local records, FR/EN/AR, PDF/CSV and no account.

Topics proposés : `nutrition`, `anthropometry`, `z-score`, `child-growth`, `public-health`, `offline-first`, `pwa`, `javascript`, `arabic`, `niger`, `global-health`, `open-source`.

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

GitHub accepte une image de moins de 1 Mo et recommande 1280 × 640 : [documentation officielle](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview). Le PNG préparé respecte ces dimensions. L’envoi de la preview et la modification de description/topics restent un lot externe annoncé séparément ; aucune publication ou sollicitation automatique n’est prévue.

## Support et portée

Présenter l’outil comme une aide ouverte au calcul, au suivi local et à l’exploration avec références explicites. Les tests publics et comparaisons numériques ne sont pas un audit clinique ni une validation terrain. Les utilisateurs doivent protéger leurs postes, sauvegardes et exports ; l’hébergeur peut traiter des journaux techniques HTTP. Les issues servent aux problèmes reproductibles sur données synthétiques, sans SLA ni support d’urgence médicale.
