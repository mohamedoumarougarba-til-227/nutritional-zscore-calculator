# Format unique de sauvegarde

L’application exporte et importe uniquement la sauvegarde complète `.zscore`, avec sa protection facultative `.zscore.enc`. CSV et PDF ne sont pas des sauvegardes de l’espace de travail. Les options et conversions des formats remplacés ont été retirées.

## Vérification et restauration

Le fichier est un flux UTF-8 de lignes JSON : en-tête `zscore-niger-stream` version 1, enregistrements, marqueur final avec comptes et empreinte chaînée SHA-256. Magasins : children, results, sessions, settings. Résultats : schéma 4 ; espaces de travail : version 1 ; domaine d’âge : version 2. Ces versions désignent des objets différents d’un même format courant.

Tout le contenu est vérifié avant aperçu : structure, limites, identifiants, liens, résultats, PB, orientation et empreinte. La confirmation ajoute des copies avec nouveaux identifiants, sans remplacer l’historique. L’ajout IndexedDB est atomique. Une erreur, un fichier tronqué ou une modification après aperçu annulent l’ajout.

Les journaux de secours illisibles sont conservés pour récupération technique, jamais activés comme mesures. Les préparations d’import sont séparées de l’historique. Ce stockage et les exportations ordinaires ne sont pas chiffrés.

## Protection facultative

Le bouton **Sauvegarde chiffrée** demande une phrase secrète et confirmation : 12 caractères minimum, 1 024 octets UTF-8 maximum. Choisir une phrase longue et unique, la conserver séparément. Elle n’est ni enregistrée dans les dossiers ou préférences, ni récupérable en cas d’oubli.

Web Crypto : AES-256-GCM, étiquette 128 bits, clé non exportable dérivée par PBKDF2-HMAC-SHA256, 600 000 itérations, sel aléatoire 16 octets. Nonce : préfixe aléatoire 8 octets et compteur 4 octets. Blocs de 1 MiB maximum ; en-tête entier et index du bloc authentifiés. Ordre, taille, troncature, ajout d’octets et modification contrôlés. La politique cryptographique est fixe, non négociée par le fichier entrant.

Enveloppe : `ZSCOREENC1` suivi d’un saut de ligne, quatre octets de longueur d’en-tête big-endian, paramètres JSON, blocs chiffrés. Taille et paramètres sont publics. Limite du contenu : 1 GiB. Pas d’ArrayBuffer de toute l’archive ; des Blob restent en mémoire et la capacité dépend de l’appareil.

Tous les blocs doivent être authentifiés avant préparation de l’import. Une phrase incorrecte ou un fichier altéré produit le même échec. Le contenu déchiffré suit ensuite le contrôle habituel et exige la confirmation de l’ajout.

Cette option protège le fichier téléchargé, pas la session ouverte, le stockage navigateur, les imports préparés, les PDF ou CSV. Le profil navigateur et les supports doivent être protégés. JavaScript ne permet pas de garantir l’effacement physique de toute copie de chaîne en mémoire. Aucune certification de sécurité indépendante n’est revendiquée.

Références : [OWASP, stockage cryptographique](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html), [dérivation PBKDF2](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
