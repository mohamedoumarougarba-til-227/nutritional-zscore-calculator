# Sauvegardes locales

Version de l'application 2.8.0 ; modules et formats de sauvegarde inchangés par rapport à 2.7.2. Aucun compte, service distant ou envoi de dossiers n'est requis. Les copies ne sont pas chiffrées ; les conserver sur un support sûr. Un contrôle d'intégrité ne certifie pas la provenance médicale d'un résultat importé. Guide de parcours : [GUIDE_UTILISATEUR.md](../guides/GUIDE_UTILISATEUR.md). État des preuves et limites : [ETAT_VALIDATION.md](../projet/ETAT_VALIDATION.md).

## Choisir une copie

**Exporter la sauvegarde complète** produit un fichier `.zscore`, lu progressivement par les versions 2.5.0 et ultérieures. L'archive complète peut dépasser 50 MiB ; ce cas est vérifié automatiquement. **Copie JSON (ancien format)** conserve le format v2 pour les petits transferts avec un lecteur ancien, dans la limite de 50 MiB. Le format progressif garde les mêmes enregistrements avec moins de mise en forme ; ce gain de taille n'est pas une compression.

Ne pas renommer `.zscore` en JSON pour un ancien lecteur. Préparer un import, vérifier les effectifs affichés puis confirmer. Les identifiants de fiches, résultats et versions sont renouvelés ; les liens et identifiants de visites restent cohérents. Les scores ne sont pas recalculés, les résultats sont marqués importés et les préférences locales actuelles ne sont pas remplacées. Les doublons déjà importés sont signalés ; l'utilisateur peut choisir de conserver une nouvelle copie.

## Stockage et annulation

La préparation lit des morceaux de 64 KiB et copie les lignes dans une base locale distincte `ZScoreTransfer-…`, sans ajout à l'historique principal. Le fichier doit être entièrement vérifié avant l'aperçu. La confirmation relit et vérifie ces lignes, puis ajoute les enregistrements dans une seule transaction de la base principale. Un échec, manque d'espace ou conflit annule tous les ajouts de cette transaction. Le schéma principal reste en version 1. Une fermeture d'aperçu ferme sa connexion de préparation ; elle ne supprime pas ses octets.

Prévoir l'espace pour le fichier préparé et sa copie importée, en plus de l'historique existant. Les bases de préparation, y compris celles d'un import abandonné, sont conservées conformément au principe de non-suppression. La version 2.6.0 permet leur consultation et reprise volontaires ; aucune suppression n'est proposée. Ne pas effacer globalement les données du navigateur pour libérer ces espaces : cette opération peut aussi supprimer l'historique. Sans IndexedDB disponible, les grands imports sont refusés explicitement ; les petits JSON gardent leur secours localStorage.

## Retrouver plusieurs copies

Dans Sauvegardes, **Afficher / actualiser les copies** liste les copies locales et imports préparés par pages de dix, avec date, nom disponible, taille connue ou inconnue et état. **Créer une copie locale** conserve une archive du travail présent dans un espace séparé sur cet appareil. Cette copie n'est pas une protection contre la perte de l'appareil ou l'effacement du navigateur ; conserver aussi un fichier sur un autre support.

**Vérifier et consulter** relit tout le contenu et son intégrité avant d'ouvrir l'aperçu. Il présente les effectifs, en précisant que les fiches répétées dans les versions ne sont pas des personnes distinctes. Jusqu'à cinq versions récentes peuvent être examinées en lecture seule, par pages de 50 entrées ; les brouillons sont dépliables, le collage montre 4 000 caractères au maximum sans changer le texte archivé. Revenir à la reprise puis confirmer pour ajouter l'ensemble de la copie. Fermer un aperçu ne l'active pas et ne supprime pas ses octets. Une copie déjà ajoutée est signalée ; elle reste consultable.

L'inventaire utilise les bases présentes lorsqu'un navigateur fournit [`indexedDB.databases()`](https://developer.mozilla.org/en-US/docs/Web/API/IDBFactory/databases), avec un registre local des nouvelles copies en complément. Si l'inventaire complet est indisponible, l'interface l'indique ; des copies anciennes peuvent ne pas être listées. Un registre illisible reste intact. Les préparations 2.5.0 sans métadonnées restent lisibles lorsque trouvées ; un nom manquant peut rester inconnu. Une référence absente ne recrée pas une copie vide. Les marqueurs informatifs sont ajoutés séparément des lignes originales, sans réécriture de celles-ci ; le statut d'ajout repose sur la transaction de l'historique principal.

Essai navigateur réel : création d'une copie locale, rechargement, revue de 501 entrées, confirmation d'ajout de 89 sessions et conservation à l'identique des 89 anciennes sessions. Rechargement sans serveur, redécouverte et alerte de copie déjà ajoutée également vérifiés. Ce parcours local ne valide pas le sélecteur d'import de fichier ni le transfert physique entre appareils.

## Format technique actuel

UTF-8, un objet JSON par ligne, fin de ligne LF. Le lecteur gère aussi CRLF et une dernière ligne sans LF. Ordre émis :

1. En-tête `kind: header`, `format: zscore-niger-stream`, `version: 1`, date ISO `exportedAt`, objet `preferences`.
2. Événements `kind: record`, `store`, `record`, ordonnés par collections `children`, `results`, `sessions`, `settings`. Les liens globaux sont vérifiés avant ajout ; les versions de travail conservent leur structure complète.
3. Événements `kind: recovery`, `key`, `raw` pour les journaux de récupération illisibles. Ces octets sont archivés pour récupération technique et ne sont pas activés comme résultats.
4. Fin `kind: end`, `counts` dans l'ordre des quatre collections ci-dessus, nombre `recovery`, `checksum`.

La chaîne de contrôle commence par une chaîne vide. Pour chaque ligne avant la fin, SHA-256 de `empreinte_précédente + LF + ligne_UTF8`, sans LF final de cette ligne. La fin contient la dernière empreinte et les effectifs exacts. Les propriétés dangereuses `__proto__`, `prototype`, `constructor`, les liens absents, les identifiants dupliqués et les résultats mal formés sont refusés. Ce checksum détecte une modification accidentelle ; il ne remplace pas une signature du propriétaire.

Limites de traitement : 16 MiB UTF-8 par ligne, 50 000 enregistrements par collection, 50 000 journaux de récupération, deux millions d'identifiants de fiches/résultats retenus pour cohérence. Les limites de résultat/saisie du format JSON existant s'appliquent aussi, notamment 5 000 entrées au maximum dans une version importée. Ce ne sont pas des promesses de performance sur un téléphone ; l'espace réel et la capacité de l'appareil restent déterminants. Un refus conserve les originaux.

Le fichier exporté est assemblé en Blob à partir d'enregistrements sérialisés individuellement, sans conserver toute l'archive comme objets ni fabriquer une chaîne JSON unique. Le navigateur doit néanmoins conserver le Blob complet jusqu'au téléchargement ; le pic mémoire physique reste à mesurer. Pendant la confirmation, les ajouts sont dispatchés dans les événements actifs de la transaction IndexedDB, avec lectures de maintien qui ne modifient aucune donnée. Le cycle actif/inactif est décrit par [MDN : IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction).

## Validation disponible

En 2.7.0, 108 tests automatisés verts. PDF compact et affichage des anciens libellés inconnus ajoutés sans changement du format de sauvegarde, du schéma ni des modules de stockage/transfert. Contrôle indépendant des archives : les 181 sessions précédentes et tous les autres enregistrements restent identiques dans 186 sessions après les essais et sauvegardes volontaires. PDF et CSV restent des rapports, sans fonction de restauration. Preuves : [rapport 2.7.0](../../.local/audit/historique/2026-10-14/pdf-compact/rapport.md).

En 2.6.2, 104 tests automatisés verts. L'estimation de volume reste identique après suppression de la seconde sérialisation de chaque enregistrement : contrôles indépendants UTF-8, chaînes avec syntaxe JSON/échappements, conteneurs imbriqués et lots de 500. Aucun nouveau format de sauvegarde ni changement du schéma ; 180 anciennes sessions et tous les autres enregistrements conservés après adoption dans 181 sessions. Preuves : audit/2026-10-14/performance-catalogue/rapport.md.


Point 2.6.1 : 102 tests automatisés verts, dont transfert de plus de 50 MiB, UTF-8 traversant la limite des morceaux, corruption, troncature, modification d'aperçu et de préparation, lecture interrompue, manque d'espace simulé, conflit d'écriture tardif, concurrence des aperçus, redécouverte des copies et paquet public contrôlé. Export réel du navigateur, comparaison indépendante SHA-256, conservation de l'ancien historique et imports automatisés dans une base isolée vérifiés. Exports des deux formats sans serveur vérifiés. Adoption de 2.6.1 : les 179 sessions précédentes restent identiques dans 180 sessions après ajout de la version « Avant mise à jour » ; checksum de chaque export contrôlé indépendamment.

Import par sélection de fichier dans le navigateur : non vérifié, refus antérieur du contrôle de sécurité conservé sans contournement. Transfert réel entre deux appareils, fermeture forcée pendant import, durabilité après redémarrage, manque d'espace réel et essais TECNO restent à réaliser. Revue médicale et publication sont des validations distinctes.
