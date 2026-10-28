# Périmètre et vérification — 5.5.0

L’application calcule les indicateurs de croissance OMS 2006 avant 60 mois moyens et OMS 2007 à partir de 60 et avant 229 mois moyens. Un mois moyen vaut 30,4375 jours. Poids/âge n’est pas proposé à partir de 121 mois ; poids/taille n’appartient pas à la référence OMS 2007. Les indicateurs disponibles et leur référence sont conservés avec chaque résultat.

La longueur couchée, la taille debout et leurs corrections suivent des règles distinctes. Les mesures sortant des domaines publiés ne sont pas extrapolées. Un score très bas peut être calculable ; cela ne signifie pas qu’un traitement est prescrit. Le PB et l’aide au dépistage 6–59 mois restent séparés des courbes et des décisions du professionnel.

Le Z-score situe une mesure par rapport au centre de la référence. Le centile indique une position dans sa distribution ; P 12,4 ne signifie ni une probabilité de maladie de 12,4 %, ni un objectif de poids. Pour les indicateurs OMS, les centiles sont affichés dans le domaine −3 à +3. Le profil CDC utilise sa méthode documentée, notamment pour l’IMC étendu ; un centile arrondi à 0 ou 100 est déclaré indisponible. L’absence de centile extrême n’interdit pas le calcul ou le signalement d’un Z-score extrême exploitable.

Les lots décrivent les fiches saisies. Plusieurs fiches peuvent concerner un même enfant. Leur proportion ne permet donc pas d’estimer une prévalence nationale. Un plan d’enquête représentatif demande notamment une méthode d’échantillonnage, ses pondérations et une estimation adaptée de l’incertitude.

## Reproduire les vérifications

Depuis les sources de cette version : `node tools/verification/verify.cjs` ou `npm run verify:public`. Node 20 ou ultérieur suffit ; aucune installation npm ou R, aucun compte et aucune connexion ne sont requis. Le paquet est inclus dans les sources téléchargeables.

Il compare 7 652 cas fictifs OMS 2006 et 3 093 cas OMS 2007 à des résultats R indépendants déjà conservés, plus 6 001 valeurs de centile. Les empreintes des cas sont vérifiées. La politique conservatrice concernant une mesure debout avant neuf mois est explicitement testée séparément ; elle n’est pas présentée comme identique à tout comportement du logiciel OMS.

Ces vérifications établissent une concordance numérique sur ces jeux. Elles ne constituent pas un test de toutes les interfaces, une relecture clinique, une certification ou un essai physique sur téléphone. La suite de développement complète et les audits historiques sont conservés séparément dans le dossier de travail.

## Importer une série

Un CSV peut contenir jusqu’à 50 000 fiches et 50 Mio. Les colonnes non standard ouvrent une préparation des correspondances, unités et dates. Jusqu’à 5 000 fiches sont conservées dans un travail actif ; les séries plus grandes sont réparties en travaux sauvegardés. Une erreur de validation n’ajoute aucune fiche. Un échec d’enregistrement d’une série répartie ne crée pas quelques travaux seulement.

Les résultats, dossiers locaux et exports ne sont pas automatiquement envoyés à un service distant. Le partage entre utilisateurs n’est pas activé.
## Socle public et compléments — sources 5.5.0

`npm test` est public, sans installation npm, et refuse une suite vide. Ses 51 tests couvrent domaines, méthode, œdèmes/PB, CSV, historique, contrôle du format réel d’import et copie des identifiants, chiffrement sur fichier fictif, langues, intégrité, profil CDC et préparations INTERGROWTH, ainsi que les agrégats. Ils ne simulent pas une transaction IndexedDB complète ni un appareil physique ; ces vérifications restent distinctes. Les tests préparatoires INTERGROWTH ne signifient pas qu’un profil prématuré est activé dans l’application.

Le paquet numérique ajoute 962 cas complémentaires, évalués séparément avec Python Decimal à 60 chiffres à partir des TSV OMS. Il ne s’agit pas de sorties du logiciel R OMS. Les cas, leur générateur et leurs empreintes sont publics. Voir [Méthode](../references/METHODE.md). La suite privée reste accessible séparément par `npm run test:private` dans le workspace complet.



## Profil américain — 5.5.0 / moteur 4.3.0

Les tests du profil américain couvrent import CSV explicite, conservation des visites lors des réglages et restaurations, courbes CDC utilisant l’inverse IMC étendu, groupes de lots indépendants et modèles PDF FR/EN/AR. Le contrôle numérique comporte 254 cas CDC Decimal/libm, 161 probabilités et 120 positions de courbes. Les 962 cas facultatifs OMS restent distincts des sorties R OMS historiques.

Des PDF fictifs sont générés avec le moteur embarqué et rendus séparément pour contrôler la disposition ; ces preuves locales ne sont pas les tests publics et ne prouvent ni une impression physique ni l’interface navigateur. Les visites OMS antérieures restent lisibles sans recalcul. Voir [profil CDC](../references/CDC.md).
