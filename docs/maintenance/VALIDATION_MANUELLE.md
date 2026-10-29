# Matrice de validation manuelle

CURRENT — protocole à exécuter sur une version identifiée, **pas une liste d’essais déjà réussis**. Données fictives uniquement. Aucun nouvel accès au TECNO n’est autorisé dans le chantier actuel.

Pour chaque exécution, noter date, SHA/ID de release, version UI/moteur, navigateur/version, système, appareil, taille et résultat observé. Marquer PASS, FAIL, NOT RUN ou NOT APPLICABLE ; joindre une preuve synthétique si utile. La maintenance ne garantit pas la disponibilité de tous les matériels ou technologies d’assistance.

| Surface | Vérification | Preuve attendue | État de ce protocole |
|---|---|---|---|
| Chrome desktop | Saisie fictive, résultats, retour aux mesures sans perte | Valeurs et focus observés | NOT RUN |
| Smartphone/petit écran | Actions lisibles, aucune sortie de fenêtre, orientation portrait/paysage | Dimensions et capture fictive | NOT RUN |
| Android ancien/faible | Tâches essentielles et temps de réponse sur appareil autorisé | Modèle/version, scénario chronométré | NOT RUN |
| Clavier | Parcours, listes, dialogs, Escape, retour au déclencheur | Séquence sans souris et focus | NOT RUN |
| Lecteur d’écran | Labels, erreurs, annonces de résultats et tableaux | Lecteur/version et restitution observée | NOT RUN |
| FR/EN/AR | Termes, longueurs, RTL, navigation et PDF | Cas identique dans chaque langue | NOT RUN |
| Offline | Chargement complet puis passage hors ligne et rafraîchissement | Ressources prêtes et calcul local réussi | NOT RUN |
| PDF/CSV/impression | Individuel/lot, unités, langues, pagination, lisibilité | Fichiers fictifs et tirage réel si disponible | NOT RUN |
| Sauvegardes | Export .zscore, reprise en copie, original conservé | Comptes, identifiants et historique | NOT RUN |
| Sauvegarde chiffrée | Bon/mauvais mot de passe, fichier altéré | Échec avant import ; aucun ajout partiel | NOT RUN |
| Grand lot raisonnable | Import préparé, annulation, calcul progressif, export | Taille, effectif, durée et réactivité | NOT RUN |
| Quota stockage | Échec signalé sans perte de l’existant | Profil isolé fictif, historique conservé | NOT RUN |
| Fermeture/reprise | Sauvegarde puis fermeture/réouverture | Travail accessible en reprise | NOT RUN |
| Mise à jour | Travail conservé et nouvelle release cohérente | IDs avant/après, reprise contrôlée | NOT RUN |
| Profils OMS/CDC | Réglage par défaut, choix par visite, bascule à 24 mois, 19 ans 11 mois, reprise OMS après réglage US | Profil et âge conservés ; aucune réécriture silencieuse | NOT RUN |
| Courbes et lots mixtes | OMS/CDC séparés, IMC étendu, absence poids/taille CDC, PDF/CSV | Sources, méthodes et catégories lisibles dans chaque langue | NOT RUN |

Les tests simulés Node, le navigateur redimensionné, les contrôles de palettes, la CI et les essais historiques doivent être notés séparément. Un navigateur redimensionné n’est pas un téléphone physique ; un contrôle de contraste n’est pas une certification WCAG. Un PDF généré n’est pas une preuve de tirage papier.

## Mesures offline proportionnées

Sur un profil isolé fictif et autorisé, relever : octets du premier chargement, nombre de requêtes, temps jusqu’à disponibilité, ID du cache actif, total des caches de cette origine avant/après mise à jour, octets des sources GPL/polices et du stockage de travail. Distinguer taille des assets, transfert compressé et stockage réel.

Ne pas vider le profil du propriétaire ni purger ses caches pour obtenir un chiffre favorable. Les anciennes caches et preuves restent conservées par le mécanisme actuel : mesurer leur croissance et documenter le compromis avant de proposer une politique différente. Ne pas retirer licences, polices ou sources nécessaires uniquement pour réduire une mesure.

## Informations à faire confirmer

La relecture clinique concerne le protocole applicable, la pratique des mesures, le vocabulaire et le circuit de soins. La validation DHIS2 concerne le système destinataire et ses métadonnées. Une enquête représentative relève de son responsable et de son plan statistique. Ces confirmations ne sont pas remplacées par les tests techniques.

## Observations du 29 octobre 2026 — portée partielle

Navigateur intégré Codex, moteur Chromium, fenêtre réellement observée environ 1280 × 720 ; version exacte du navigateur non fournie par l’interface d’essai. Application locale 5.7.1, moteur 4.4.0, données entièrement fictives. Les lignes NOT RUN du protocole général restent à exécuter dans leur portée complète : ce relevé ne les transforme pas en validation globale Chrome/Android.

| Parcours effectivement exécuté | Résultat | Limite |
|---|---|---|
| Saisie OMS, calcul, retour aux mesures | PASS : quatre scores et centiles attendus ; 8 500 g et les autres champs conservés | Un cas fictif, français, desktop |
| Profil postnatal dérivé | PASS : 30 semaines de naissance + 14 jours = PMA 224 ; trois scores/centiles présents ; retour au formulaire sans perte | Le PMA direct et les cas partiels restent à parcourir dans le navigateur |
| Aides par profil | Défaut trouvé et corrigé : le profil postnatal affichait l’aide OMS. Âge et position renvoient désormais à leurs propres règles ; trois langues testées dans les sources | Relecture métier distincte |
| FR/EN/AR et RTL | PASS dans la portée du cas postnatal : mêmes valeurs, libellés traduits, disposition arabe RTL sans débordement horizontal à 1265 px | Pas de lecteur d’écran ; ni toutes les pages ni tout le PDF parcourus |
| Aide au clavier | PASS : Entrée ouvre l’aide anglaise à l’âge ; Échap la ferme, focus conservé sur le déclencheur | Ce n’est pas un parcours clavier complet de l’application |
| CSV individuel postnatal | PASS : fichier réellement téléchargé, référence postnatale et contexte PMA conservés | Pas d’import dans un tableur pendant cet essai |
| Mise à jour après premier chargement | Défaut reproduit : ancien worker remplacé pris à tort pour une installation échouée. Corrigé ; proposition de mise à jour puis activation et copie de reprise vérifiées, mêmes valeurs | Les refus d’intégrité restent testés séparément ; aucune purge |
| Serveur local arrêté puis rafraîchissement | PASS : application chargée depuis le cache, historique accessible, reprise en copie et nouveau calcul OMS réussis sans serveur | Réseau du système toujours actif : ce n’est pas un essai en mode avion Android |
| Stockage après plusieurs releases | Estimation affichée : 38,7 Mio / quota indicatif 10 Gio sur une origine fictive après plusieurs installations ; anciennes caches conservées | Inclut caches et autres stockages de cette origine ; pas une mesure du transfert réseau compressé |
| Petit écran demandé | NOT RUN : l’override 390 × 844 n’a pas été appliqué ; dimensions réelles restées desktop. Override réinitialisé | Aucune capture desktop déclarée mobile ; aucun accès au TECNO |

Les [captures publiques](PRESENTATION_PUBLIQUE.md) ne contiennent que ces cas synthétiques. Les traces techniques détaillées restent privées. Aucun essai physique, validation clinique, certification WCAG, mesure de connexion faible ou impression papier n’est déduit de ces observations.


## Scénarios additionnels introduits en 5.7.0 — grille historique, portée exécutée ci-dessous

- Profil INTERGROWTH : PMA direct/âges dérivés, mesure partielle, référence conservée, retour à la saisie, nouvelle visite sans ancien PMA réutilisé, sauvegarde et PDF FR/EN/AR. Contrôler au clavier les champs affichés et le focus.
- Contrôle du lot : neuf lignes fictives importées, pagination huit puis une, aperçu en lecture seule, fermeture du dialogue et retour au bouton ; modifier une mesure et vérifier la mise à jour du contrôle sans effacer le travail.
- Même identifiant/date : conserver deux visites légitimes, deux mesures identiques et une identité contradictoire. Vérifier les différents signaux, la traduction et l’absence d’exclusion automatique des agrégats.
- CSV de préparation : retrouver valeurs brutes/arrondies et références distinctes OMS/CDC/INTERGROWTH ; noms/identifiants absents, âges inconnus vides, colonnes de sondage vides. Ouvrir dans un tableur avec une donnée fictive commençant par `=` pour vérifier qu’elle reste du texte.
- Mobile/RTL : section repliée, libellés complets, boutons/pagination sans débordement. Ces observations restent à exécuter sur une surface autorisée, sans TECNO.


## Lot mixte de neuf fiches — observations du 29 octobre 2026

Essai desktop dans le navigateur intégré, versions 5.7.1 puis patch PDF 5.7.2, moteur 4.4.0. Fenêtre réellement observée 1553 × 1336 CSS px pendant une partie du parcours ; aucun redimensionnement mobile revendiqué. Données synthétiques uniquement, mesure du 2026-10-29 sauf la fiche contradictoire du 2026-10-28.

Le lot comprend trois mesures OMS d’un même identifiant fictif (deux identiques, une de sexe différent), une mesure sans identifiant, un profil américain à trois ans, deux visites postnatales à PMA 224 jours (dérivé et direct), un profil OMS à douze ans et un nourrisson d’un mois. Les tailles, poids et autres champs nécessaires sont présents dans chaque cas valide. Un nom fictif commence par `=1+1` pour tester l’échappement CSV.

| Scénario | Résultat observé | Portée |
|---|---|---|
| Import et calcul | PASS : neuf lignes calculées ; références OMS 2006/2007, CDC et postnatale conservées | Petit lot ; pas un benchmark 50 000 lignes |
| Revue technique | PASS : neuf lignes signalées, sept âges estimés, un PMA seul, un identifiant absent ; conflit d’identité sur trois lignes, dates répétées sur quatre, mesures identiques sur deux | Signaux chevauchants ; aucun dossier fusionné ou exclu |
| Pagination indépendante | PASS : contrôle huit lignes puis une, distinct des pages du tableau principal ; même résultat en arabe | Numéros de lignes du lot, pas enfants uniques |
| Aperçu au clavier | PASS : Entrée ouvre la ligne neuf, Échap ferme et rend le focus au bouton de cette ligne ; page du contrôle conservée | Un dialogue, pas tout le clavier/lecteur d’écran |
| PMA direct | PASS : PMA 224 affiché ; âge chronologique et gestation inconnus restent « Non renseigné » | Pas d’âge inventé à partir du PMA seul |
| Conservation des résultats | PASS : CSV de résultats strictement identique avant/après les aperçus et après changement de langue/rejet de fichier | Pas de réécriture des valeurs ni des dates de calcul |
| Compteurs de sauvegarde | Libellés corrigés en « fiches »/« measurement records »/« سجلات قياس » dans les trois langues | Les copies et fiches ne représentent pas des personnes distinctes |
| CSV préparatoire | PASS : neuf lignes/105 colonnes, mêmes scores et références, aucun nom/identifiant/date précise ; sondage non fourni, grappe/strate/poids vides | Pas de garantie d’anonymat, analyse représentative ou mapping DHIS2 validé |
| Comparaison navigateur/Node | Même calcul et mêmes signaux ; différence brute maximale 1,4211e−14, valeurs arrondies identiques | Deux runtimes du même code, pas un oracle clinique indépendant |
| Formule CSV | PASS : nom exporté avec apostrophe protectrice avant `=1+1` | Fichier parsé ; ouverture dans Excel/LibreOffice non exécutée |
| Import incomplet | PASS : œdèmes vides à la ligne cinq rejetés avec message arabe ; neuf résultats antérieurs inchangés | Aucun ajout partiel, pas d’hypothèse « œdèmes absents » |
| FR/EN/AR | PASS : libellés et signaux traduits, compteur conservé ; RTL sans débordement horizontal au format desktop observé | Ni smartphone physique ni relecture linguistique professionnelle |
| PDF | Fichiers détaillés FR/AR et compact AR effectivement téléchargés ; pages rendues et inspectées. Défaut de repère sur continuation trouvé et corrigé en 5.7.2 ; notes uniques et contexte conservés | Rendus numériques ; aucune impression papier. Le rapport détaillé peut garder des fiches sur plusieurs pages |

La grille historique n’est pas intégralement terminée : modification d’une fiche au sein du lot, très gros import, toutes les langues/layouts du PDF au navigateur, lecteurs d’écran, mobile réel et quotas restent des scénarios distincts. Les preuves et fichiers fictifs détaillés restent privés ; les droits et l’architecture locale sont inchangés.
