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

## Correction de lignes — observations du 3 novembre 2026, version 5.8.0

Navigateur intégré Chromium sur ordinateur, moteur 4.4.0, 67 fiches entièrement fictives OMS/CDC/INTERGROWTH. La grille historique ci-dessus reste datée ; la modification de ligne est désormais parcourue dans la portée suivante.

| Parcours exécuté | Résultat observé | Limite |
|---|---|---|
| Import, calcul puis correction ciblée | PASS : ligne 1 OMS de 8 500 à 9 000 g ; ligne 55 CDC de 12 300 à 12 400 g ; ligne 61 postnatale de 42 à 43 cm | Trois corrections, pas toutes les combinaisons cliniques |
| Conservation du lot | PASS : 64 autres lignes identiques cellule par cellule dans les 119 colonnes du CSV ; 67 lignes conservées ; références et identifiants de visite des trois lignes inchangés | Comparaison des fichiers réellement téléchargés |
| Historique et sauvegarde | PASS : trois paires avant/après présentes dans le fichier .zscore réellement exporté, intégrité vérifiée ; une seule fiche différente par paire, nouveaux identifiants de résultat et de fiche, même visite | Export local sur données fictives, pas récupération après panne matérielle |
| Saisie et annulation | PASS : brouillon d’ajout conservé ; poids nul refusé avec focus sur le message ; changement de mode d’âge postnatal puis annulation sans perte ; export après annulations/langues identique à celui après correction | Les échecs de sauvegarde et doubles clics sont testés séparément dans le socle public |
| PMA seul | PASS : PMA 224 conservé ; âge chronologique et gestation inconnus restent vides après correction | Pas de reconstitution d’un âge inconnu |
| Années/mois issus du formulaire | Faux signal d’âge incomplet reproduit après correction CDC, puis supprimé : le contrôle accepte les entiers conservés en texte ; CSV final identique avant/après ce correctif | Aucun calcul ni résultat archivé modifié ; test public des âges absents/invalides conservé |
| Aperçu du contrôle vers correction | PASS : ouverture de la ligne 4 depuis le contrôle, passage à la correction puis fermeture sans changement exporté | Un parcours d’aperçu |
| Clavier | PASS : Tab du dernier bouton revient au premier ; Maj+Tab du premier revient au dernier, en français et arabe ; retour au bouton de ligne après enregistrement | Pas de lecteur d’écran ni certification d’accessibilité |
| FR/EN/AR et petite largeur RTL | PASS : titres et aides traduits ; erreur de poids arabe ; largeur réellement observée 480 × 844 CSS px, dialogue de 411,6 px dans la fenêtre, aucun débordement horizontal | Override sur ordinateur ; ni écran réel de 390 px, ni essai TECNO. Dimensions réinitialisées après test |
| Mise à jour | PASS : sauvegarde avant mise à jour et reprise en copie du lot calculé de 67 fiches ; archives précédentes présentes | Pas de purge de caches ; anciens paquets de développement conservés |

La capture d’écran a échoué dans l’outil de navigateur ; elle n’est pas une preuve visuelle disponible. Les observations DOM, dimensions, fichiers CSV/.zscore et leur comparaison sont conservés dans les preuves privées. La console contrôlée n’a fourni aucun avertissement ni erreur. Impression papier, lecteur d’écran, appareil physique, relecture médicale et très gros lot restent des validations distinctes.

## Import de 12 001 fiches — observations du 3 novembre 2026, 5.8.0 puis 5.8.1

Essai dans le navigateur intégré sur ordinateur, origine locale dédiée distincte des historiques de travail précédents. Fichier fictif de 1 464 342 octets : 2 401 fiches OMS 2006, 2 400 OMS 2007, 2 400 CDC et 4 800 postnatales (PMA direct/dérivé). Aucun patient réel, appareil physique, quota artificiellement rempli ou cache utilisateur effacé.

| Parcours exécuté | Résultat observé | Portée |
|---|---|---|
| Import via le sélecteur de fichier | PASS : progression de vérification observée ; trois travaux enregistrés en plages 1–5000, 5001–10000 et 10001–12001 | 12 001 lignes / 1,46 Mo ; limite de 50 000 lignes et 50 Mio non saturée |
| Intégrité de la répartition | PASS : sauvegarde .zscore réelle contrôlée ; 12 001 identifiants fictifs uniques, ordre et mesures conservés, chaque fiche dans une seule plage | Transaction/quota défaillant testé séparément dans le socle de développement |
| Calcul et export des trois tranches | PASS : 5 000, 5 000 et 2 001 résultats calculés et exportés ; 119 colonnes ; toutes les valeurs affichées et références concordent avec le même code Node | Écart brut maximal 1,4211e−14 ; deux environnements du même code, pas un oracle clinique indépendant ni un benchmark mobile |
| Erreur dans la dernière ligne | PASS : sexe invalide à la ligne 12002 rejeté ; CSV des 5 000 résultats déjà présents identique ; quatre archives attendues conservées, aucune tranche partielle ajoutée | Validation tardive après lecture du fichier, sans simulation de panne du disque |
| Aperçu de sauvegarde volumineuse | Défaut reproduit en 5.8.0 : 5 000 lignes rendues dans le dialogue et délai dépassé par l’outil. Corrigé en 5.8.1 : huit lignes visibles par page, compteur/numéros/flèches ; dernière page 625 accessible, focus conservé | Toutes les fiches restent accessibles ; aucun résultat supprimé pour accélérer l’aperçu |
| Reprise depuis la dernière page | PASS : depuis la page 625, reprise des 5 000 fiches complètes de la deuxième tranche, puis calcul et export | La page visible ne réduit pas le travail repris |
| Rechargement et reprise de la dernière tranche | PASS : historique retrouvé, dernière page 251 contenant la fiche 12001, reprise en copie des 2 001 résultats, CSV identique | Rechargement sur ordinateur avec serveur disponible ; pas de panne matérielle ou nouvel essai hors ligne physique |
| Traductions et clavier d’aperçu | PASS : dernières pages en FR/EN/AR, statut traduit, bouton courant conserve le focus ; RTL sans débordement du document | Pas de lecteur d’écran ni audit complet de clavier |
| CSV français flexible | PASS : trois profils, séparateur point-virgule, virgules décimales, kg/m et dates DD/MM/YYYY ; choix explicites des colonnes/unités/dates ; valeurs exportées 8500/14000/1600 g et 75/95/42 cm, PMA seul conservé | Un format d’exemple, pas tous les fichiers de services destinataires |

La console contrôlée ne rapporte aucun avertissement ou erreur. Les fichiers et comparaisons restent dans les preuves privées. Les estimations de stockage affichées dépendent de l’origine et des copies de versions ; elles ne mesurent ni le transfert réseau ni la consommation d’un téléphone. Les lignes historiques « gros import non exécuté » restent historiques : ce parcours est désormais exécuté dans la portée ci-dessus.

## Hors ligne, mise à jour et clavier — observations du 4 novembre 2026, 5.8.1

Navigateur intégré Chromium, données fictives et origines locales neuves ; aucun téléphone ni effacement de cache. Ce relevé décrit les parcours exécutés, pas la totalité de la matrice générale.

| Parcours exécuté | Observation | Limite |
|---|---|---|
| Premier chargement et cache | 104 réponses / 14 662 243 octets de corps ; rechargement à chaud : seul sw.js, 10 474 octets | Corps HTTP locaux non compressés, pas un débit mobile ou temps de rendu |
| Serveur arrêté | Rechargement, import/calcul de deux fiches OMS/INTERGROWTH, CSV/PDF et aller-retour chiffré réussis ; deux versions originales conservées et deux copies ajoutées | Réseau système actif, pas un mode avion physique ; PDF deux pages rendu, pas de tirage papier |
| Paquets réels 5.8.0 vers 5.8.1 | Fichier corrompu refusé ; activation refusée avec second onglet, réussie après fermeture ; sauvegardes préalables et six originaux strictement conservés | Mêmes moteur et formats, pas toutes les migrations possibles ; aucun cache purgé |
| Reprise après mise à jour | Brouillon, texte CSV non importé et résultats retrouvés ; CSV identique octet pour octet ; nouvelle version et archives accessibles après arrêt du serveur | Estimation de stockage 26,5 puis 26,6 MiB comprenant caches et historique |
| Clavier partiel FR/EN/AR | Évitement puis huit Tab, liste âge par Fin/Entrée, erreurs focalisées comme alertes, aide par Échap avec retour au bouton ; focus contenu dans l’aperçu | Pas de lecteur d’écran ni de certification WCAG ; RTL mesuré sur fenêtre desktop de 2560 CSS px |

Un essai instrumenté distinct sur 5.8.1 a ensuite reproduit un export complet bloqué après échec d’écriture locale, alors que l’interface invitait à exporter. Le correctif 5.8.2 est décrit dans les notes de mise à jour ; ses preuves et essais doivent être distingués des observations ci-dessus. La simulation d’une exception de quota n’est pas une saturation physique du disque ou du quota du navigateur.

## Échecs de stockage simulés — observations du 4 novembre 2026, 5.8.2

Page privée instrumentée sur une nouvelle origine locale, mêmes scripts applicatifs et contrôles d’intégrité des données. Des commandes QA visibles font lever `QuotaExceededError` sur les ajouts à la seule base fictive et, séparément, sur le journal local. Le worker est désactivé dans ce banc d’essai ; ce n’est pas un essai hors ligne ou une saturation réelle du disque. Aucun quota, historique ou cache de l’utilisateur n’est modifié.

| Scénario exécuté | Résultat observé |
|---|---|
| IndexedDB refuse les écritures | Échec local signalé ; export de secours créé avec le brouillon courant et les deux fiches calculées ; archives originales conservées |
| IndexedDB et journal refusent les écritures | « Nouveau travail » ne remplace pas la saisie ; sauvegardes ordinaire et chiffrée créées avec la dernière saisie restée uniquement en mémoire ; message distingue export et enregistrement local |
| Deuxième écriture de correction refusée | Dialogue reste ouvert avec 9000 g, tableau courant garde 8500 g ; réessai après levée du défaut enregistre la correction et conserve l’ancienne version |
| Deuxième ajout d’import refusé | Message d’annulation, aucun ajout partiel dans l’export réel comparé à l’archive précédente ; réimport après levée du défaut ajoute les copies attendues sans changer les originaux |

Les fichiers fictifs exportés sont contrôlés par le validateur réel du format courant et les contenus sont comparés. Les six tests publics de ce correctif sont indépendants de ce banc privé. Cette preuve d’erreur injectée ne remplace pas une validation de quota réellement atteint sur un appareil cible.

## Mesures facultatives et deux visites — observations des 4–5 novembre 2026, 5.8.2

Navigateur intégré sur ordinateur, moteur 4.4.0, nouvelle origine locale et cas entièrement fictifs. Les quatre champs facultatifs ont été saisis dans le formulaire individuel : périmètre crânien 46 cm, PB 130 mm, plis tricipital 8 mm/sous-scapulaire 6 mm ; garçon d’un an estimé, 8 500 g, 75 cm couché, œdèmes absents, mesure du 2026-11-04. Les autres observations cliniques restent inconnues. Les positions complémentaires ne modifient pas les critères absolus de PB.

| Parcours exécuté | Résultat observé | Limite |
|---|---|---|
| Quatre résultats complémentaires | Z −0,05/−1,54/−0,07/−0,43 ; centiles 48,0/6,2/47,3/33,5 ; unités et source conservées | Un cas fictif, comparaison au même code Node ; contrôles numériques indépendants séparés |
| FR/EN/AR et exports réels | Trois CSV de 119 colonnes strictement identiques, y compris les valeurs brutes et références ; trois PDF de deux pages rendus et inspectés, quatre résultats complémentaires présents | Six pages numériques, pas d’impression papier ; extraction arabe contrôlée aussi en mode layout car le mode plain omettait des nombres présents au rendu |
| Actions et petite fenêtre | Panneau compact pour calcul/PDF/CSV, sans export placé hors du menu ; dimensions réellement mesurées 480 × 844 CSS px en FR/AR, document 449 px, direction arabe RTL ; panneaux sur une colonne | Fenêtre réduite, pas un téléphone de 390 px. Capture native mobile non probante ; traces DOM/dimensions et fichiers conservés |
| Nouvelle visite du même dossier | Identité/sexe conservés ; anciennes mesures non reprises silencieusement. Visite rétrospective 2026-10-04 à 11 mois estimés, 8 200 g, 74 cm, PC 45,8 cm, PB 128 mm, plis 7,8/5,8 mm ; nouveau visitId | Identifiant local commun, pas preuve d’identité réelle |
| Courbes et évolution | Quatre courbes physiques et quatre tendances complémentaires : deux points pour deux visites ; une ligne par tendance entre les dates connues | Aucune prédiction ou interpolation de visite inventée |
| Réouverture et reprise sans serveur | Serveur et ancien onglet absents, application chargée depuis le cache à la même origine ; aperçu, reprise en copie et exports CSV/.zscore réussis. Formulaire repris exact ; les 12 sessions précédentes restent identiques, une copie ajoutée | Réseau système actif ; aucune purge, panne matérielle ou saturation physique simulée |

Aucun calcul, domaine ou format n’a été modifié par ce lot de vérification. Les résultats ne constituent ni diagnostic ni avis clinique. Les lignes générales NOT RUN restent ouvertes dans leur portée complète, notamment appareils physiques, lecteur d’écran et quotas réellement atteints.
