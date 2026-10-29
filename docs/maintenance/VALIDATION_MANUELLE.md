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


## Scénarios additionnels 5.7.0 — NOT RUN sur navigateur

- Profil INTERGROWTH : PMA direct/âges dérivés, mesure partielle, référence conservée, retour à la saisie, nouvelle visite sans ancien PMA réutilisé, sauvegarde et PDF FR/EN/AR. Contrôler au clavier les champs affichés et le focus.
- Contrôle du lot : neuf lignes fictives importées, pagination huit puis une, aperçu en lecture seule, fermeture du dialogue et retour au bouton ; modifier une mesure et vérifier la mise à jour du contrôle sans effacer le travail.
- Même identifiant/date : conserver deux visites légitimes, deux mesures identiques et une identité contradictoire. Vérifier les différents signaux, la traduction et l’absence d’exclusion automatique des agrégats.
- CSV de préparation : retrouver valeurs brutes/arrondies et références distinctes OMS/CDC/INTERGROWTH ; noms/identifiants absents, âges inconnus vides, colonnes de sondage vides. Ouvrir dans un tableur avec une donnée fictive commençant par `=` pour vérifier qu’elle reste du texte.
- Mobile/RTL : section repliée, libellés complets, boutons/pagination sans débordement. Ces observations restent à exécuter sur une surface autorisée, sans TECNO.
