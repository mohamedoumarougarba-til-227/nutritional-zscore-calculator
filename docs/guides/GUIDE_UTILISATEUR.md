# Utiliser Z-score Niger

## Domaines d’âge et références — version 4.0.0, 19 octobre 2026

La référence est choisie automatiquement selon l’âge. Avant 60 mois moyens OMS, quatre indicateurs OMS 2006 sont disponibles. De 60 à moins de 229 mois, OMS 2007 fournit taille/âge et IMC/âge ; poids/âge reste disponible avant 121 mois. Le poids/taille n’est pas défini dans OMS 2007. Une absence liée au domaine est **non applicable**, pas une erreur de mesure ni une valeur normale ; elle ne rend pas à elle seule le résultat incomplet.

Avec des dates ou des jours, un mois moyen représente 30,4375 jours. Une date au cinquième anniversaire peut donc rester légèrement sous 60 mois moyens : la référence OMS 2006 est alors utilisée, sans arrondi forcé. Avec années/mois, l’âge est estimé et conserve le nombre de mois saisi. Cette version combinée suit la méthode R OMS épinglée ; les anciennes versions et leurs résultats restent inchangés. La saisie accepte au maximum 19 ans et zéro mois accomplis, ou 6 970 jours ; la limite de calcul est strictement inférieure à 229 mois moyens.

Pour OMS 2007, renseigner une taille debout. Une mesure couchée suspend taille/âge et IMC/âge ; aucune correction automatique de 0,7 cm n’est transposée à ces âges. Les œdèmes suspendent les indicateurs utilisant le poids. Des bornes de saisie jusqu’à 300 000 g et 250 cm permettent de traiter les plus grands ; elles ne sont pas des seuils médicaux et les valeurs inhabituelles restent signalées. Les plages P/T OMS 2006 ne sont pas étendues.

Le suivi montre les courbes des références réellement présentes dans le dossier, avec leurs propres axes/domaines. Les trajectoires de Z ne relient pas des références différentes. Dans un lot mixte, chaque famille de référence possède son résumé et ses dénominateurs ; les CSV agrégés indiquent WHO2006 ou WHO2007 dans leur nom. Les tableaux et PDF mixtes conservent chaque source et indiquent les non-applicables.

Les sauvegardes complètes/JSON gardent les résultats v4, les mesures, l’âge utilisé et les indicateurs applicables. Utiliser au moins la version 4.0.0 sur l’appareil destinataire. L’import est vérifié puis présenté avant confirmation, et la reprise crée une copie. Les anciens fichiers restent lisibles sans recalcul ; un ancien lecteur refuse les nouveaux résultats plutôt que les tronquer.

Les sections 3.x suivantes décrivent les fonctions conservées ; les domaines et règles de cette section 4.0.0 prévalent pour la version actuelle.

## Résumé descriptif des lots — interface 3.3.0

Sous le tableau du lot, ouvrir **Résumé du lot**. Les chiffres portent sur toutes les fiches, même lorsque le tableau n’en affiche que huit. Fiches, identifiants distincts, identifiants répétés et fiches sans identifiant sont distingués : plusieurs visites du même enfant restent plusieurs fiches. Les effectifs par sexe et âge décrivent ces fiches ; aucune déduplication ni estimation du nombre de personnes uniques n’est effectuée.

Chaque indicateur a son propre nombre de résultats utilisables. Les absences (calcul non effectué ou ancien format sans indicateur), suspensions, valeurs signalées et résultats non comparables sont séparés. Les âges inconnus/hors du domaine actuel avant cinq ans rendent également le résultat non comparable dans ce résumé. Le dénominateur affiché dans chaque catégorie est le nombre de résultats utilisables de cet indicateur. Un indicateur peut donc avoir sept résultats utilisables tandis qu’un autre en a neuf. Un dénominateur nul donne un tiret pour le pourcentage et la moyenne, jamais une proportion normale supposée.

Les catégories sont celles enregistrées lors du calcul, avant arrondi ; la moyenne, le minimum et le maximum portent sur les Z-scores affichés et archivés. Les imports comparables sont inclus sans recalcul et sans certification du contenu médical. Les proportions ne représentent pas une prévalence dans la population du Niger : absence de plan d’enquête, de pondérations et d’inférence statistique.

**Résumé CSV** exporte les agrégats, dénominateurs, proportions et référence, sans noms ni identifiants de dossier. Les clés de ce CSV sont stables en anglais pour faciliter son traitement informatique. Le CSV habituel garde les fiches individuelles. L’impression inclut le résumé ouvert et toutes les fiches ; les PDF dédiés gardent leurs rapports individuels/détaillés/compacts et ne reçoivent pas automatiquement ce résumé. La sauvegarde complète reste nécessaire pour reprendre le travail ; le CSV agrégé ne la remplace pas.

## Courbes de référence — interface 3.2.0, 18 octobre 2026

Renseigner le même identifiant local pour le même enfant et calculer ses visites datées. Dans **Mesures de ce dossier**, ouvrir **Courbes de croissance OMS · kg, cm, IMC**. Cette section est disponible dès une visite enregistrée. Elle situe le poids en kg, la longueur/taille harmonisée en cm et l’IMC sauvegardé sur cinq lignes de référence : −3, −2, 0, +2 et +3 Z, selon le sexe du dossier. L’axe des mois utilise 30,4375 jours par mois. Les courbes ne prolongent pas le calcul après cinq ans.

Un carré indique un âge estimé en années/mois ; un rond indique un âge saisi en jours ou obtenu par dates. Un point creux signale un résultat importé. Les mesures de taille et d’IMC reprennent les valeurs archivées lors du calcul, sans modifier les anciennes versions. Les deux références de longueur couchée et taille debout sont séparées à 731 jours ; les points ne sont pas reliés comme une prédiction.

Les valeurs sans date exploitable, hors domaine d’âge, signalées, suspendues ou associées à une autre référence ne sont pas tracées. Le tableau repliable sous les courbes les indique explicitement. Les anciens résultats sans IMC restent sans point IMC. Les tracés historiques de Z-scores restent disponibles dans leur section séparée. Ces graphiques sont dans le suivi web ; les PDF dédiés conservent les tableaux de scores, sans ces nouveaux graphiques.

## Centiles — 3.1.0, 18 octobre 2026

Les nouveaux calculs affichent aussi **P**, le centile dans la population de référence OMS pour chaque indicateur. P 10 signifie qu’environ 10 % des valeurs de cette référence sont inférieures. L’aide i près du titre des résultats explique cette lecture. Le centile utilise le score avant arrondi : deux Z-scores affichés avec les mêmes deux décimales peuvent avoir des centiles légèrement différents.

Le centile est fourni entre −3 et +3. **P —** indique un Z-score hors de cet intervalle ; le Z-score reste affiché. Un indicateur suspendu garde sa raison de suspension. Les anciennes versions qui n’enregistraient pas de centile restent sans P ; elles ne sont pas recalculées automatiquement. PDF et CSV conservent les centiles présents dans les résultats, avec une légende pour les rapports. Le tableau de suivi historique les montre aussi ; ses graphiques restent des trajectoires de Z-scores.

Exemple fictif masculin de 365 jours, 8 500 g, 75 cm couché, sans œdèmes : les centiles affichés sont **P 12,4 ; P 37,8 ; P 8,5 ; P 8,8**, dans l’ordre poids/âge, taille/âge, poids/longueur-taille et IMC/âge. Ces rangs décrivent la référence ; ils complètent les autres mesures et l’évaluation clinique.

## Quatrième indicateur — 3.0.0, 18 octobre 2026

Les nouveaux calculs fournissent aussi l’IMC brut (kg/m²) et le Z-score IMC pour l’âge. Aucun champ supplémentaire n’est nécessaire : le poids, la longueur/taille harmonisée, l’âge et le sexe déjà saisis suffisent. L’aide i près du résultat décrit le calcul. Les libellés IMC indiquent des intervalles de Z-score sans décider d’une prise en charge. Les règles adultes d’IMC ne s’appliquent pas ici.

L’IMC/âge complète les trois indicateurs précédents ; il ne remplace pas un poids/taille indisponible, le périmètre brachial mesuré ni l’examen clinique. Le poids/taille reste non calculé hors de sa propre plage, même si l’IMC/âge est disponible. Les œdèmes et la mesure debout avant neuf mois suspendent aussi l’IMC. Les anciens résultats restent à trois indicateurs ; dans une liste mixte, la colonne IMC précise qu’il est absent de leur version enregistrée.

Les PDF, CSV, sauvegardes et courbes historiques conservent le nouvel indicateur lorsqu’il a été calculé. Un transfert contenant de tels résultats nécessite la version 3.0.0 ou ultérieure sur l’appareil destinataire, y compris avec la copie JSON. Pour le cas fictif masculin de 365 jours, 8 500 g, 75 cm couché, sans œdèmes, l’IMC est 15,11 kg/m² et le Z-score IMC/âge −1,35. Les trois premiers scores restent −1,15 ; −0,31 ; −1,37.

## Limite d’âge — 2.9.16, 18 octobre 2026

Le calcul actuel concerne les enfants avant leur cinquième anniversaire. Avec les dates de naissance et de mesure, cette limite est vérifiée au calendrier, même pendant les années bissextiles. Pour une naissance le 29 février, l’anniversaire est fixé au 1er mars lorsque l’année n’est pas bissextile.

En âge exact en jours, la date de mesure devient nécessaire à 1 826 jours : selon les années traversées, cet âge peut être la veille ou le jour des cinq ans. Le logiciel utilise cette date pour vérifier la limite sans enregistrer une date de naissance déduite. En années/mois, l’âge reste une estimation et doit être inférieur à cinq ans ; ne pas inventer de dates pour contourner un refus. La même règle s’applique au CSV. Les anciens calculs restent consultables et transférables avec leur version de moteur ; un nouveau calcul utilise les règles actuelles.

## Présentation de l’application — 2.9.15, 17 octobre 2026

À la demande du propriétaire, retrait des mentions Prototype, Bêta, Version de développement et de la mention de relecture médicale à réaliser dans les textes de l’application, en français, anglais et arabe. Le pied de page utilise À propos ; les informations, l’aide, l’impression et les PDF décrivent les repères nutritionnels et leurs limites d’usage. Aucun calcul, schéma de sauvegarde ou droit d’accès modifié. Ce changement éditorial ne constitue pas une nouvelle validation médicale ni une publication. Les preuves historiques et les validations encore ouvertes dans le suivi sont conservées.

143 tests automatisés réussis, puis 33 contrôles ciblés réussis après harmonisation des styles ; mise à jour et fenêtre d’information vérifiées dans le navigateur intégré. Aucun nouvel essai TECNO ou Chrome natif. [Bilan, fichiers et commandes](../../.local/audit/historique/2026-10-17/libelles-application/rapport.md). Release `4f79df19ff478725810b049ed95b9bc5e232023eabf86aa4c9a619554db32517` ; paquet local de 43 fichiers / 2 096 308 octets, non publié.

## État de sauvegarde corrigé — 2.9.14

Une ancienne écriture ne peut plus afficher Enregistré pour une saisie plus récente ni modifier l’indicateur d’un autre travail. Écriture immédiate et reprise après échec affichent Sauvegarde en cours jusqu’à confirmation de la dernière version concernée. **143 tests automatisés réussis**. [Bilan et portée](../../.local/audit/historique/2026-10-16/etat-sauvegarde/rapport.md). Release 2abd656c802ae9228c4756246aad382d6e36f6a2683ee7f53c078d91ab5ea576 ; paquet 43 fichiers / 2096660 octets, non publié.

## Correction de fiabilité — 2.9.13

Import CSV protégé contre les activations simultanées ; lecture de fichier annulée si le travail ou la page a changé ; erreur de lecture signalée et commandes réactivées après échec. Les lignes ajoutées restent disponibles si leur sauvegarde échoue. **138 tests automatisés réussis**, contrôle ciblé du collage CSV dans le navigateur intégré ; sélecteur réel et TECNO non validés à nouveau. [Rapport et preuves](../../.local/audit/historique/2026-10-16/csv-concurrence/rapport.md). Release 3cb9816d148766490733869a8f3513bcece3a26851e76cfb32ac14874e06522f, paquet 43 fichiers / 2096311 octets, non publié.

## État actuel — 16 octobre, 2.9.12

Lots : Reprendre un travail/Nouveau travail en haut ; informations import/âge estimé regroupées dans une seule aide i près du titre, sans répétition par ligne. Les alertes propres aux mesures restent visibles et les métadonnées/rapports détaillés sont conservés. **130 tests automatisés réussis** ; reprise/nouveau/reprise et rendu ordinateur/mobile vérifiés dans le navigateur intégré, sans nouvel essai physique TECNO. [Bilan technique](../../.local/audit/historique/2026-10-16/utilite-et-perimetre/rapport.md).

[Étude d’utilité pour le Niger](../projet/ETUDE_UTILITE_NIGER.md) et [audit du périmètre initial](../projet/AUDIT_PERIMETRE_INITIAL.md) ajoutés : intérêt plausible à démontrer au pilote ; promesses initiales absentes, choix remplacés et validations externes distingués. Aucun ajout de synchronisation, PB, triage national ou export DHIS2 sans spécification. Release 93c3672e788f1a5fed1fd4bee286428810d01dc6724e709f1f3a4d4a83a71d1c ; paquet neuf 43 fichiers / 2 094 362 octets, non publié. Objectif global actif et incomplet ; cible 3 Go/plafond 5 Go inchangés.

## Dernières corrections — 2.9.11

Pagination commune : plage « Affichage de 1 à 8 sur X résultats » à gauche, flèches et numéros à droite, page active en couleur et ellipses. Huit lignes conservées pour historique/lots. Dans Sauvegardes, retrait du bouton Sauvegarder une version et du panneau de copies locales ; **copies déjà stockées conservées**, panneau d’espace maintenu et sauvegardes des formulaires présentes. Les petits i ouvrent une bulle ancrée non modale ; la fenêtre Prototype est élargie à 920 px maximum et répartie sur deux colonnes sur ordinateur. **126 tests automatisés réussis**, contrôles ciblés du navigateur intégré, distincts des essais Chrome natifs et TECNO. [Bilan et preuves](../../.local/audit/historique/2026-10-15/aides-pagination-2.9.11/rapport.md). Release `06917112c7b1fb86cd6366fa5a3b69734852f06a59a764f0966326605ced1130` ; paquet 43 fichiers / 2092952 octets, non publié.

## Sauvegardes — correction 2.9.9

Historique limité à **huit versions par page**, avec Précédent/Suivant et recherche conservée. Les titres de remplacement « Brouillon » et leurs pluriels traduits sont maintenant recherchables ; espaces superflus, casse et accents sont normalisés. Aucun historique supprimé ni format de sauvegarde modifié. **120 tests automatisés réussis** et contrôle ciblé dans le navigateur intégré, distinct de Chrome natif et du TECNO. [Preuves et explication des commandes](../../.local/audit/historique/2026-10-15/sauvegardes-2.9.9/rapport.md). Release `4ff2d227b99dfb04e8dc8a4a90a4bda0b7f4681a5d5dc404ad4ecaab36cfbffe` ; paquet 43 fichiers / 2085887 octets, non publié.

## Dernière retouche CSV — 2.9.8

Icône CSV retirée devant le titre « Importer ou coller un CSV ». Les deux commandes affichent **Choisir un CSV** et **Modèle CSV** quand le panneau offre au moins 500 px intérieurs ; les intitulés complets restent accessibles au survol et aux lecteurs d’écran. La section et ses deux actions se replient ensemble. Version 2.9.8, release `5fc7d30a5356e4caf1a512ee2d4bb2df9bc8ba54e3e93d59104a691c08a5da6c` ; 118 tests automatisés réussis, 42 ressources locales contrôlées et paquet 43 fichiers / 2085309 octets, sans publication. [Preuves et tâches restantes](../../.local/audit/historique/2026-10-15/csv-libelles-2.9.8/rapport.md). Les observations navigateur intégré restent distinctes des essais Chrome natifs et physiques TECNO. Arrêt demandé après les corrections.

Guide du 15 octobre 2026. Application gratuite, sans compte utilisateur, pour les mesures anthropométriques des enfants de moins de cinq ans. La version est affichée dans Références et aide. Le prototype reste soumis à une revue médicale et à des essais physiques : utiliser des dossiers fictifs pendant le pilote. Il ne prescrit aucun traitement.

## Interface actuelle 2.9.7

Dans les lots, l’état d’enregistrement est près de « Traitement par lots ». **Ajouter au lot** est en haut à droite des mesures. Cliquer **Importer ou coller un CSV** déplie ou replie la section : le choix de fichier et le téléchargement du modèle apparaissent sur la ligne du titre, dans cet ordre, puis disparaissent avec le corps au repli. L’aide i reste près du titre. À faible largeur, les textes des commandes CSV sont masqués ; leurs titres et noms accessibles demeurent disponibles. Replier ne supprime pas le texte collé.

Version **2.9.7**, release `c5eb5c7f2dccbca2732d1c02a4a7158aae534ca5856fd74620b653c3e30f65e8`. **118 tests automatisés réussis** ; paquet local de **43 fichiers / 2 085 162 octets**. Les 42 ressources servies sur 8001 sont conformes aux sources. Le contrôle ciblé dans le navigateur intégré porte sur la barre CSV, les listes ancrées, les libellés courts et les largeurs desktop/320/390 px ; il ne vaut pas nouvel essai Chrome natif ou TECNO. [Bilan et limites](../../.local/audit/historique/2026-10-15/corrections-finales-2.9.7/rapport.md).

## Langue, apparence et navigation

Le **globe** ouvre la liste des langues : Français, English et العربية. Le bouton voisin affiche un **soleil** en thème clair, une **lune** en thème sombre ou un **écran** en mode automatique (selon le réglage du système). Cliquer pour ouvrir la liste, puis choisir une option ; une coche indique l’option active. Aucun code FR/EN/AR n’est ajouté dans la barre.

Sur téléphone, les **trois barres en haut à droite** ouvrent Calcul individuel, Traitement par lots, Sauvegardes et Références et aide. Choisir une page ferme la fenêtre et mène au contenu ; les saisies restent dans le travail courant. Sur grand écran, ces pages restent dans la navigation latérale. Les choix de langue, apparence, âge, sexe, œdèmes et position s’ouvrent dans une liste près de leur commande. Flèches et Début/Fin parcourent les options ; Entrée choisit, Échap ferme et rend le focus. Tab ferme la liste puis poursuit la navigation. Le menu mobile reste une fenêtre distincte. Les boutons à icônes ont des noms accessibles indiquant la langue/le thème actif.

Depuis la version **2.9.1**, cliquer sur le **Z** sur ordinateur pour déployer ou rétracter cette navigation ; la préférence est conservée dans ce navigateur. Les boutons de langue et d’apparence affichent aussi leur libellé sur ordinateur, puis une icône seule sur téléphone. Le bouton **i** d’information générale se trouve en bas à droite, près de l’indication hors ligne. La disposition desktop et les principales commandes ont été essayées dans Chrome avec un dossier fictif ; les nouvelles dimensions mobiles et les essais physiques restent à vérifier séparément.

Le formulaire individuel présente **Calculer** et **Sauvegarder** en haut à droite des mesures. Les libellés courts accompagnent les icônes lorsque la carte est assez large ; sinon les titres restent au survol et les noms accessibles restent complets. **Nouveau travail** est placé après **Reprendre un travail** sur la ligne du titre principal. Les actions de résultat sont ordonnées Imprimer, PDF, CSV, Nouvelle visite ; les fichiers PDF et CSV ont leurs cartouches rouge et vert. Le message d’enregistrement se trouve près du titre « Calcul individuel ». Les petits **i** près de l’âge, du poids, de la position et du CSV ouvrent une bulle près de leur icône, sans bloquer la page. Cliquer à nouveau, sur la croix ou à l’extérieur, ou utiliser Échap pour fermer. La fenêtre Prototype reste modale et dispose d’une largeur supérieure ; un petit écran ou un fort zoom peut nécessiter un défilement. L’icône seule ne remplace pas la lecture des erreurs ou avertissements éventuels.

Dans les lots, le tableau affiche au plus huit entrées par page. Les flèches et numéros changent seulement la vue : les autres entrées restent conservées et les exports portent sur tout le lot. Le nombre près du titre est le total des entrées du lot. La disposition en deux panneaux devient verticale lorsque la largeur est insuffisante ; le téléphone peut nécessiter un défilement.

## Aide dans l'application

Depuis 2.7.1, ouvrir **Références et aide**, puis **Bien démarrer et garder son travail**. Les cinq rubriques expliquent les mesures, la reprise, les copies indépendantes, le mode hors ligne et les rapports. Elles sont disponibles en français/anglais/arabe, même sans connexion après installation complète. Au clavier, Tab atteint les titres et Entrée ou Espace ouvre/ferme une rubrique. Les changer ne modifie pas le travail.

Après un changement de langue ou d'apparence, le focus revient au bouton d’icône correspondant. Si la soumission d'un formulaire échoue, le message d'erreur reçoit le focus ; lire le message puis revenir aux champs concernés. Les conseils d'âge, de poids et de position sont reliés à leurs champs pour les technologies d'assistance. Le lecteur d'écran Android reste à tester physiquement.

## Première ouverture

Ouvrir l'adresse HTTPS communiquée par le responsable, avec une connexion Internet. Attendre **Disponible hors ligne** avant de compter sur une ouverture sans réseau. L'installation sur l'écran d'accueil dépend du navigateur. À ce jour, aucune adresse publique n'a été publiée ; `127.0.0.1` est une adresse locale. L’[essai TECNO par USB](../projet/ESSAI_TECNO_USB.md) utilise temporairement `http://127.0.0.1:8002/` sur le téléphone ; cette adresse ne sera pas celle du service public.

Choisir français, anglais ou arabe et le thème clair, sombre ou automatique. Les valeurs saisies, noms et identifiants ne sont pas traduits. Vérifier la date du téléphone avant de travailler.

Le cache conserve les fichiers de l'application ; les sauvegardes conservent votre travail. L'historique appartient à ce navigateur, sur cet appareil et à cette adresse. Deux personnes utilisant le même navigateur voient le même historique. Préférer un identifiant de dossier à un nom complet et utiliser le verrouillage du téléphone.

## Continuer au clavier

Après un calcul, le titre des résultats reçoit le focus : lire les indicateurs et limites, puis utiliser Tab pour atteindre les commandes. Après un ajout manuel au lot, le focus revient au premier champ pour la mesure suivante. Nouveau travail et Nouvelle visite de ce dossier placent aussi le focus au premier champ ; vérifier l'identité et les mesures avant de saisir. Une reprise en copie mène à la zone principale et la recherche des versions d'un dossier mène au champ de recherche. Échap ferme un aperçu et rend le focus à son bouton d'ouverture.

Ces déplacements facilitent la navigation ; ils ne valent pas une validation avec un lecteur d'écran réel. Les résultats enregistrés et les versions originales restent conservés.

## Calcul individuel

1. Ouvrir le calcul individuel. Saisir un identifiant de dossier, puis le sexe et l'âge : dates de naissance et de mesure si connues, âge exact en jours ou âge estimé en années/mois. Ne pas inventer une date de naissance pour remplacer un âge estimé.
2. Saisir le poids **en grammes** : 8,5 kg correspond à **8 500 g**. Saisir longueur/taille **en centimètres**, puis indiquer la position réellement utilisée, couché ou debout, et la présence ou l'absence d'œdèmes.
3. Calculer. Lire séparément poids-pour-âge, taille-pour-âge et poids-pour-longueur/taille, leurs messages et leurs références. Corriger une mesure incohérente avant toute interprétation.

Cas entièrement fictif pour vérifier la saisie : masculin, 365 jours, 8 500 g, 75 cm, couché, sans œdèmes. Avec `WHO-2006-anthro-b776d8a12b1c`, les scores affichés dans cet ordre sont **−1,15 ; −0,31 ; −1,37**. Cet exemple ne valide pas une décision clinique.

Une valeur absente, signalée ou non calculée n'est pas une valeur normale. L'application suspend les indicateurs utilisant le poids en présence d'œdèmes. Pour une mesure debout avant neuf mois, elle suspend aussi les indicateurs utilisant la taille : cette précaution diffère de WHO Anthro et doit être revue par un professionnel compétent. Les catégories sont déterminées avant l'arrondi d'affichage. Aucun résultat ni courbe ne remplace l'examen du patient et le protocole applicable.

## Lots et suivi

Un lot accepte jusqu'à **500 mesures**. Utiliser le modèle CSV proposé par l'application, l'ajout individuel ou le collage CSV. Le fichier/collage CSV est limité à **2 000 000 octets** ; une ligne invalide empêche l'ajout de l'ensemble. Les en-têtes du modèle restent en anglais même lorsque l'interface change de langue.

Colonnes reconnues : `name`, `caseId`, `ageYears`, `ageMonths`, `ageDays`, `ageMode`, `birthDate`, `measurementDate`, `weight`, `height`, `gender`, `position`, `oedema`. Poids, taille, sexe, position et œdèmes sont obligatoires, ainsi qu'un âge valide pour le mode choisi. Conserver le modèle pour les valeurs codées ; ne pas renommer les colonnes. Les CSV de résultats exportés servent à l'analyse et ne sont pas des modèles de saisie ni des sauvegardes restaurables.

Pour corriger la même mesure, modifier puis recalculer : les anciennes versions restent dans l'historique. Pour un nouveau rendez-vous, utiliser **Nouvelle visite de ce dossier** ; l'identité est conservée et les mesures sont vidées. Vérifier la date de la nouvelle mesure.

**Évolution des Z-scores** montre les valeurs déjà enregistrées et leurs dates. Consulter aussi le tableau : les valeurs non tracées et les différences de référence y restent visibles. Un trait entre deux visites n'est ni une mesure intermédiaire ni une prédiction. Les copies d'une même visite ne créent pas une nouvelle visite ; un conflit d'identité demande une vérification.

## Comprendre les commandes de Sauvegardes

| Commande | Utilité et emplacement de la copie |
| --- | --- |
| Exporter la sauvegarde complète | Produit un fichier .zscore de l’historique complet, du travail courant sauvegardé et des informations archivées. À conserver sur un autre support pour déplacer le travail ou résister à la perte du téléphone. |
| Copie JSON (ancien format) | Export complet de compatibilité avec l’ancien format, limité à 50 MiB. Ce n’est pas une autre fonction de restauration ; préférer .zscore pour l’usage courant. |
| Importer une sauvegarde | Lit un fichier .zscore ou JSON, vérifie et montre un aperçu avant confirmation d’ajout sans remplacer l’historique existant. Les imports .zscore préparés restent consultables dans les copies locales. |

**Espace et copies de sauvegarde** est un tableau d’estimations, pas une sauvegarde supplémentaire : nombre de versions (pas d’enfants), taille approximative de l’export complet, stockage du site incluant ses bases/caches/copies locales, quota estimé du navigateur et limite 50 MiB du JSON. Le quota n’est ni une consommation Internet ni une réservation garantie. Actualiser les estimations ne fait qu’en relire les valeurs. Les fichiers exportés ne sont pas chiffrés.

## Sauvegarder, consulter et reprendre

La saisie déclenche une sauvegarde après une courte pause, normalement environ 800 ms. Attendre le message de sauvegarde ; une erreur affichée signifie que la conservation durable n'est pas acquise. **Sauvegarder une version** crée une version volontaire, utile avant de changer d'appareil ou de fermer le travail.

À la réouverture, consulter les versions proposées ou la page **Sauvegardes**. L’historique affiche huit versions par page. Le compteur de plage est à gauche et les numéros de page à droite, avec des points de suspension pour les longues listes. La page courante est mise en couleur. Précédent/Suivant conserve le filtre ; une nouvelle recherche revient à la première page. Les versions sans nom affichées « Brouillon » sont retrouvées par brouillon/brouillons (ou leurs libellés anglais/arabe). Tous les historiques restent conservés. Rechercher une version par son contenu et sa date, puis ouvrir **Aperçu**. Cet aperçu ne remplace pas les champs actuels. **Reprendre dans une copie** conserve la version originale et protège le travail actuel avant d'ouvrir une copie. Plusieurs versions peuvent être examinées successivement avant de choisir.

Le panneau de copies locales et sa commande de création ne sont plus affichés sur la page Sauvegardes. Les anciennes copies et préparations restent stockées, sans purge, mais leur ancien inventaire n’est plus proposé dans cette page simplifiée. Les imports .zscore continuent à présenter un aperçu et une confirmation avant ajout.

Revenir à l'aperçu général puis confirmer pour ajouter **l'ensemble** de la copie à l'historique, avec nouveaux identifiants. Les effectifs peuvent compter plusieurs versions d'une même fiche ; ils ne représentent pas nécessairement des personnes distinctes. Fermer l'aperçu n'ajoute rien et ne supprime rien. Une copie déjà ajoutée est signalée.

Une archive restée dans le même navigateur ne protège pas contre la perte de l’appareil ou l’effacement de ses données. Garder un fichier exporté sur un autre support.

## Déplacer le travail et garder une copie indépendante

1. Sur l'appareil A, **Exporter la sauvegarde complète** produit un fichier `.zscore`. Garder ce fichier dans un emplacement sûr, idéalement sur un autre support. Il contient l'historique, les brouillons, mesures, résultats, références et préférences archivées. Il n'est pas chiffré.
2. Sur l'appareil B, utiliser une version 2.5.0 ou ultérieure et **Importer une sauvegarde**. Choisir le fichier, attendre la vérification puis lire les effectifs et l'aperçu.
3. Confirmer seulement la copie voulue. Le travail préexistant est conservé ; les résultats importés gardent leurs valeurs et sont marqués importés. Les préférences actuelles de B ne sont pas remplacées. Le même fichier déjà ajouté déclenche un avertissement de doublon.
4. Vérifier les versions et plusieurs dossiers sur B, puis garder l'export de A. Le transfert physique A → B reste à valider avec la grille terrain ; les tests automatisés et les essais de copies locales ne prouvent pas ce parcours sur téléphone.

**Copie JSON (ancien format)** permet un transfert vers un lecteur ancien, jusqu'à 50 MiB. Ne pas renommer `.zscore` en `.json`. Les gros transferts exigent IndexedDB disponible et de l'espace pour la préparation puis la copie ajoutée ; ils peuvent occuper plusieurs fois la taille du fichier. Un échec doit être affiché, sans ajout partiel à l'historique. Les préparations restent conservées et consultables après réouverture lorsque le navigateur le permet.

Le CSV et le PDF sont des rapports ; **ils ne restaurent pas le travail complet**. Le PDF reprend les scores sauvegardés : recalculer et sauvegarder une correction avant d'en produire un nouveau. Un très grand lot peut produire un rapport long. Vérifier les caractères signalés comme non représentables et la lisibilité avant de partager ou d'imprimer. L'impression physique reste à valider.

Depuis la version 2.7.0, **Exporter en PDF** garde le rapport détaillé et **PDF compact du lot** propose une présentation paysage plus courte pour les lots. Dans le compact, consulter la légende au début : C désigne catégorie et signal, N les avertissements, R la référence et le moteur. Ces codes valent pour ce rapport seulement ; leur numéro peut changer dans un autre export. Les signes des scores, dates, mesures, œdèmes et avertissements sont conservés. -- signifie aucun score calculé, jamais « normal ». Une taille harmonisée n'est affichée que si elle était enregistrée ; aucune valeur n'est recalculée pour le rapport.

Les PDF français/anglais/arabe sont créés sur l'appareil et peuvent être produits hors ligne après installation complète. Ils ne sont pas balisés pour lecteur d'écran : conserver aussi le CSV pour la lecture tabulaire et la sauvegarde .zscore pour la récupération. Cela ne constitue pas une validation d'accessibilité du CSV ni du parcours d'import.

## Mises à jour et difficultés

Dans **Références et aide**, **Vérifier les mises à jour** prépare une nouvelle version. **Sauvegarder et mettre à jour** conserve d'abord une version **Avant mise à jour**. Sauvegarder et fermer les autres onglets avant de réessayer une activation refusée. Une installation incomplète doit laisser la version actuelle disponible ; les anciens résultats ne sont pas recalculés silencieusement.

Si le stockage manque d'espace, exporter une copie indépendante dès que possible et conserver les originaux. Ne pas effacer les données du navigateur pour résoudre le problème : cette opération peut aussi supprimer l'historique et les copies. Un grand historique peut prendre du temps à s'ouvrir ; éviter de multiplier les imports identiques. Une nouvelle adresse de site utilise un autre stockage : prévoir un export/import volontaire pour la transition.

En cas d'anomalie, noter la version affichée, le navigateur, la date et les étapes, avec un cas fictif reproduisant le problème. Ne pas transmettre un dossier réel au support sans procédure appropriée.

Procédures détaillées : [sauvegardes](../references/FORMAT_SAUVEGARDE.md), [mises à jour](../maintenance/MISES_A_JOUR.md), [essais terrain](../projet/VALIDATION_TERRAIN.md), [références](../references/REFERENCES_NATIONALES.md).

## Aide du tableau de lots — 2.9.12

Reprendre un travail ouvre les versions consultables. Nouveau travail conserve d’abord le travail actuel puis ouvre un lot vide ; une sauvegarde en échec empêche de vider le lot. Les deux commandes se trouvent sur la ligne du titre de page.

Le petit i près d’Enfants du lot indique, quand nécessaire, combien de résultats sont importés et combien utilisent un âge estimé. Ces mentions ne sont plus répétées dans chaque ligne. Elles restent dans les aperçus/rapports détaillés ; les autres alertes propres aux mesures restent visibles. La bulle se ferme par sa croix, Échap, clic extérieur ou le même i.
