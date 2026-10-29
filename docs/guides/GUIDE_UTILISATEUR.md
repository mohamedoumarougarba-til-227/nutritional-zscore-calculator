# Guide utilisateur — Z-score Niger 5.7.0

## Relire un lot et préparer une analyse

Sous la liste des enfants du lot, déplier **Contrôle du lot**. Les signaux désignent des points à vérifier, sans correction ni suppression automatique. Les lignes sont paginées par huit ; **Aperçu** ouvre la fiche en lecture seule. Un identifiant répété ne prouve pas un doublon ou une identité ; plusieurs visites peuvent être légitimes.

Télécharger le contrôle des lignes pour retrouver leurs numéros dans ce travail. Le CSV de préparation d’analyse fournit les mesures/scores enregistrés et leur référence, sans noms ni identifiants de dossier ; il reste sensible et ne garantit pas l’anonymat. Grappe, strate et poids restent vides : demander le plan au responsable d’enquête avant toute estimation de population. Ce fichier ne remplace pas une sauvegarde complète. Voir [portée et colonnes](../references/INTEROPERABILITE.md).


## Suivi postnatal du prématuré — INTERGROWTH

Sélectionner explicitement ce profil dans les réglages pour les nouveaux travaux, ou dans la référence de la visite. Entrer le PMA exact en jours (189–448), ou l’âge gestationnel à la naissance et l’âge chronologique exact (jours/deux dates). Les mois estimés ne sont pas convertis. Renseigner au moins un poids en g, une longueur couchée en cm ou un périmètre crânien en cm. Les âges inconnus restent inconnus. Les résultats décrivent une position dans cette référence postnatale, sans catégorie de diagnostic OMS ni admission/prescription. Naissance, perte/reprise de poids et PMA avant 32 semaines demandent une interprétation particulière avec le soignant. Voir [méthode et limites](../references/INTERGROWTH.md).


## Profil américain explicite — sources 5.7.0 / moteur 4.4.0

Réglages propose OMS 2006/2007 ou OMS avant deux ans puis CDC 2000/IMC étendu 2022. Ce choix est conservé par visite et modifiable explicitement dans le formulaire ; la préférence seule ne réécrit pas les travaux existants. Les imports peuvent indiquer `growthProfile` (`who`/`us`). CDC couvre 24 à moins de 240 mois sans poids/taille. Catégories, courbes et résumés sont séparés des références OMS ; âge déclaré, âge utilisé et méthode figurent dans les sorties. Voir [méthode CDC](../references/CDC.md).

Contrôles numériques et modèles de sortie testés sur données fictives ; la vérification navigateur, RTL visuel, accessibilité et impression ne sont pas présumées réalisées. Pas de publication implicite de ces sources locales.


## Démarrer

Ouvrir l’application par HTTPS ou avec le serveur local. Dans **Réglages**, choisir français, anglais ou arabe et le thème. Cliquer sur le logo Z pour ouvrir/rétracter le menu sur ordinateur. Le bandeau supérieur et le menu de gauche restent visibles pendant le défilement ; sur une fenêtre basse, le menu possède son propre défilement. Le mode hors ligne est disponible après le chargement complet signalé en bas. Conserver la même adresse et le même profil de navigateur pour retrouver les dossiers.

L’application calcule localement, sans compte ni transmission des dossiers. Utiliser un identifiant ou pseudonyme. Le stockage dans le navigateur n’est pas chiffré et peut être effacé par le navigateur ou une personne ayant accès au profil. Faire des copies sur un support protégé.

## Calcul individuel

Saisir identifiant et pseudonyme facultatifs, âge, date de mesure, poids **en grammes**, longueur/taille **en cm**, sexe, position et œdèmes bilatéraux. Les œdèmes doivent être renseignés explicitement : aucune absence n’est présumée. Les dates connues sont préférables à l’âge estimé. Le mois moyen OMS compte 30,4375 jours. Avec le profil OMS, le calcul sélectionne OMS 2006 avant 60 mois moyens, OMS 2007 de 60 à moins de 229 mois. Le profil américain suit les règles distinctes décrites en tête de ce guide.

Cliquer **Calculer**. **Sauvegarder** conserve une version explicite ; la sauvegarde automatique protège aussi le travail commencé. L’état à droite du titre distingue prêt, en cours, enregistré et échec. Une mesure changée après calcul rend le résultat à recalculer. Les actions PDF, CSV et impression utilisent les valeurs enregistrées, avec leur référence et date de calcul.

### Tableau de bord après calcul

Après un calcul réussi, la saisie se replie et les résultats utilisent toute la largeur. Sur grand écran : synthèse et indicateurs à gauche, mesures calculées et références à droite. **Modifier les mesures** rouvre les champs sans effacer les valeurs ; **Afficher les résultats** revient à la vue large. Une modification conserve l'ancien résultat avec un avertissement jusqu'au prochain calcul. **Sauvegarder** reste disponible dans la vue résultats. Pour un résultat importé, un avis de sept secondes rappelle qu’il est conservé sans recalcul ; cliquer dessus le ferme. L’indication d’import reste consultable dans les valeurs et références et les rapports. Le bouton **Détails**, en haut à droite de la synthèse, donne accès aux données manquantes, au PB détaillé et aux sources cliniques.

Les groupes de courbes se déplient à la demande. Les trois courbes de croissance se répartissent sur trois colonnes lorsque la largeur suffit. Les quatre graphiques d’évolution des Z-scores tiennent sur une seule ligne lorsque l’espace le permet ; leur largeur s’adapte à la fenêtre et ils passent sur plusieurs lignes sur les écrans plus petits. Chaque graphique peut aussi être replié séparément. Les détails du calcul et références sont ouverts par défaut. **Voir les versions**, près de « Mesures calculées », ouvre les sauvegardes filtrées sur ce dossier. Les courbes restent repliées par défaut. Sur mobile, le bouton **Actions**, fixé en bas, ouvre une grille compacte avec les icônes et leurs libellés courts. Elle regroupe calcul/ajout, sauvegarde et, après calcul, impression, exports PDF/CSV, nouvelle visite et modification. Le choix ferme le panneau ; **Fermer**, Échap ou un clic à l’extérieur le ferment aussi. **Reprendre** et **Nouveau** restent en haut, avec le titre sur une ligne et les états de sauvegarde et connexion regroupés dessous. Sur ordinateur, les boutons restent directement visibles. Une petite fenêtre ou l'ouverture de toutes les courbes peut nécessiter un défilement ; aucun résultat ou avertissement clinique n'est tronqué pour tenir artificiellement sur un écran.

### Lire les indicateurs

- **Poids pour âge (P/A)** : situe le poids selon âge et sexe ; ne distingue pas à lui seul petite taille et maigreur.
- **Taille pour âge (T/A)** : situe la croissance en longueur/taille selon âge et sexe.
- **Poids pour longueur/taille (P/T)** : situe le poids par rapport à la longueur/taille ; non applicable dans OMS 2007.
- **IMC pour âge** : IMC = poids en kg / taille en mètres au carré, comparé à la référence selon âge et sexe.

Z = 0 correspond à la médiane de référence. Une valeur négative n’est pas automatiquement une maladie. Le libellé concerne uniquement l’indicateur affiché. Les centiles P sont fournis entre −3 et +3 ; un tiret ne signifie pas zéro. Les domaines et suspensions propres à chaque indicateur sont explicités. Les valeurs hors table ne sont pas extrapolées.

### PB et évaluation clinique

Ouvrir la section repliable pour saisir le **PB en millimètres** et les observations du soignant. Toutes les nouvelles observations cliniques commencent « Non renseigné ». Ne pas utiliser « Non » pour une observation non faite. Le grade des œdèmes doit être cohérent avec leur présence.

La **synthèse du dépistage** est séparée des **indicateurs de croissance**. Elle expose le critère retenu et l’orientation proposée. Un PB sévère peut justifier une évaluation rapide même si les Z-scores ne montrent pas de déficit. Les informations manquantes restent visibles dans les détails. Aucun traitement ou admission n’est décidé automatiquement. Voir [règles et sources](../references/EVALUATION_NUTRITIONNELLE.md).

## Suivre un dossier

**Nouvelle visite** conserve l’identité et ouvre de nouvelles mesures. Garder un identifiant stable par enfant ; un nom seul ne suffit pas à éviter les homonymes. Les visites, dates, résultats enregistrés et courbes sont rapprochés par identifiant, avec signalement des conflits d’identité. Les copies d’une même visite ne créent pas artificiellement une nouvelle observation.

**Reprendre un travail** ouvre les sauvegardes : rechercher identifiant, nom, brouillon ou date, consulter un aperçu puis reprendre. Le travail courant est conservé avant remplacement de l’écran. **Nouveau travail** ouvre un espace vide après préservation du précédent.

## Traitement par lots

Ajouter les mesures à gauche, voir les fiches à droite. Le tableau présente huit lignes par page avec plage de résultats, numéros et flèches. Les exports et impressions portent sur tout le lot, pas uniquement la page visible.

Ouvrir **Importer ou coller un CSV** pour choisir le fichier ou coller les lignes. Télécharger le modèle. Colonnes possibles : name, caseId, ageMode, ageYears, ageMonths, ageDays, birthDate, measurementDate, weight, height, gender (M/F), position (L/H), oedema (n/y), muac et observations cliniques. Pour leurs valeurs techniques, consulter le code du modèle ou le [guide PB](../references/EVALUATION_NUTRITIONNELLE.md). Tout le fichier est validé avant ajout ; un fichier invalide n’ajoute aucune ligne. Limites CSV : 50 Mio et 50 000 lignes de données. Le lot actif contient au maximum 5 000 fiches. Au-delà, l’import crée automatiquement plusieurs travaux dans Sauvegardes et ouvre le premier lot. Tous les travaux sont ajoutés ensemble : un échec d’enregistrement n’en conserve pas seulement une partie. Les colonnes personnalisées ouvrent un assistant : vérifier les correspondances, les unités de poids/taille/PB, les dates et le codage des œdèmes. Les colonnes non utilisées peuvent être ignorées ; une réponse obligatoire absente doit être renseignée dans le fichier, jamais supposée négative. Une ligne erronée est signalée pour correction avant ajout. Le calcul des grands lots progresse par tranches sans extrapoler les références scientifiques.

Sous le tableau, **Résumé du lot** décrit les fiches et leurs résultats utilisables, avec dénominateur propre à chaque indicateur. Une visite répétée reste une fiche ; ce n’est pas une estimation de prévalence ou un nombre de patients distincts. **Rapport agrégé / DHIS2** exporte des comptes sans noms ni identifiants et prépare, avec un profil validé, un fichier pour le destinataire. Aucun envoi automatique : voir [interopérabilité](../references/INTEROPERABILITE.md).

## Sauvegardes et transfert

- **Exporter la sauvegarde complète** : fichier `.zscore`, non chiffré, contenant versions, brouillons, mesures, résultats et préférences archivées.
- **Sauvegarde chiffrée** : protège le même contenu dans un fichier `.zscore.enc` avec une phrase secrète. La conserver séparément ; aucun mot de passe ne peut être récupéré.
- **Importer une sauvegarde** : sélection du fichier, phrase secrète si nécessaire, vérification complète, aperçu puis confirmation d’ajout. Les enregistrements existants restent conservés.

**Espace et copies de sauvegarde** indique versions, taille approximative et stockage/quota du navigateur. Ce n’est pas une sauvegarde supplémentaire. Actualiser relit les estimations. Le chiffrement protège le fichier exporté, pas le profil navigateur, les PDF, CSV ou copies de préparation d’import.

Pour un transfert A → B : exporter sur A, déplacer le fichier sur un support sûr, ouvrir la même version sur B et importer, vérifier l’aperçu puis confirmer. Vérifier les dossiers avant de modifier un appareil. Le [format](../references/FORMAT_SAUVEGARDE.md) décrit les contrôles et limites, dont 1 GiB de contenu pour le chiffrement.

## Aide et limites

Les icônes d’information ouvrent une aide proche du champ ; les listes restent ancrées à leur bouton. L’information générale et les mentions sont accessibles en bas. Les sorties FR/EN/AR conservent les unités et références. Les libellés OMS ne constituent ni une prescription ni une certification par l’OMS ou l’UNICEF. Le soignant confirme l’examen, l’orientation, le suivi et les règles nationales applicables.
## Mesures complémentaires facultatives — 5.4.0

Dans la saisie, ouvrir **Mesures complémentaires** pour renseigner le périmètre crânien (cm) et les plis tricipital et sous-scapulaire (mm), uniquement si la mesure a été réalisée correctement. Le PB (mm) de l’évaluation clinique est réutilisé pour PB/âge ; ne pas le saisir deux fois. Avant 60 mois, le périmètre crânien est calculable dès la naissance, PB/âge et plis dès 91 jours. Hors du domaine, la mesure reste conservée et le score est indiqué non calculé.

Les résultats complémentaires repliables, les courbes, le CSV et les notes PDF conservent leur référence. Les positions −2/+2 Z ne sont pas des diagnostics et ne remplacent pas les seuils absolus du dépistage PB. Voir [Méthode](../references/METHODE.md).
