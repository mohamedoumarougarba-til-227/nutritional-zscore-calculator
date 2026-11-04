# Sécurité et signalement

Pour une vulnérabilité, écrire à **contact@tilbadge.com**, objet « Z-score Niger — signalement sécurité ». Fournir une description, la version/SHA, les étapes de reproduction et un exemple entièrement fictif. Ne pas transmettre une sauvegarde réelle pour démontrer le problème.

**Ne jamais publier dans une issue, PR ou capture :** dossiers ou mesures de vrais patients, sauvegardes réelles, données médicales identifiantes, identifiants de compte, clés, jetons ou autres secrets. Si un exemple synthétique suffit, utiliser cet exemple. Ne pas tester sur des données ou systèmes auxquels vous n’avez pas accès.

La maintenance concerne en priorité la dernière version publiée et les corrections reproductibles sur la branche principale. Aucun délai de réponse, SLA, audit de sécurité indépendant ou support d’urgence médicale n’est promis. La maintenance dépend des disponibilités. GitHub Private Vulnerability Reporting peut être proposé ultérieurement ; son activation n’est pas présumée ici.

## Périmètre de confidentialité

Le moteur, l’historique et les exports sont conçus pour traiter les dossiers localement. Aucun backend patient n’est configuré. L’hébergeur peut néanmoins recevoir des requêtes HTTP et traiter des journaux techniques ; « local » ne signifie pas absence de toute communication réseau.

Sur un poste partagé, les personnes utilisant le même profil de navigateur peuvent accéder au stockage. La perte de l’appareil, l’effacement du profil ou les quotas peuvent rendre des données indisponibles. Conserver une sauvegarde sur un support protégé.

La sauvegarde `.zscore.enc` protège le fichier exporté, pas la session ouverte ni la base du navigateur. Les `.zscore`, PDF et CSV ordinaires restent en clair. Protéger ces fichiers avant de les partager ; préférer des identifiants pseudonymes et respecter les règles applicables au contexte d’utilisation. Voir [format et chiffrement](docs/references/FORMAT_SAUVEGARDE.md).

Une suite de tests verte ne constitue pas une garantie de sécurité, une certification WCAG ou une validation clinique.
