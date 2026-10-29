# Contribuer

Z-score Niger est une application statique, local-first, sans compte ni serveur de dossiers patients. Les contributions doivent préserver cette architecture et la GPLv3. La maintenance se fait selon les disponibilités ; aucune réponse immédiate n’est garantie.

## Lancer et vérifier

Node.js 20 ou ultérieur suffit. Aucune installation npm n’est nécessaire pour l’application ou les tests publics.

```sh
npm test
npm run verify:public
npm run check:public
npm run check:release
npm start
```

Après modification, exécuter `npm run build:release`, puis refaire `check:release`, les tests concernés et `npm run audit:licenses`. `npm run prepare:public` produit un paquet local sans le déployer. La reconstruction PDF est optionnelle : voir [maintenance des composants](docs/maintenance/COMPOSANTS_ET_RELEASES.md).

`npm test` lance une courte suite publique synthétique et échoue si elle est absente. `verify:public` effectue des comparaisons numériques plus étendues avec provenance. Ces commandes ne dépendent ni de `.local/`, ni des tests privés. `npm run test:private` est réservé au workspace de maintenance complet ; son absence dans un clone est intentionnelle. Les tests publics ne constituent pas l’audit clinique privé, une certification ou un essai physique.

## Ajouter un fichier public

Le dépôt ignore les nouveaux fichiers par défaut. Pour un fichier destiné à la distribution :

1. Ajouter son chemin exact et, si nécessaire, ses dossiers parents dans `.gitignore`.
2. Ajouter son chemin dans `tools/git-sync-allowlist.json` : cette liste construit les sources correspondantes GPL. Ne jamais y ajouter `.local/`, audits privés, sauvegardes, secrets ou données réelles.
3. Pour une ressource utilisée dans le navigateur, compléter `tools/scripts/offline-assets.json`, les ressources publiques de `prepare-public.cjs` et les pins de données si concernés. Respecter l’ordre des scripts dans `src/index.html`.
4. Reconstruire la release et vérifier les sources distribuées.

```sh
git check-ignore -v -- chemin/du/fichier
git status --short --untracked-files=all
git ls-files --error-unmatch -- chemin/du/fichier
npm run check:public -- --tracked
```

Un fichier visible dans `git status` peut encore être non suivi. Le contrôle `--tracked` doit passer dans le commit proposé ; pour un clone sans métadonnées `.git`, utiliser seulement `check:public`. Pour une archive `zscore-sources.zip`, reconstruire d’abord la release puis utiliser `npm run check:public -- --source-archive` : seul le bundle PDF historique, intentionnellement exclu de cette archive, est dispensé de présence. Aucun actif du moteur ou du paquet courant n’est dispensé.

## Proposer une modification

Une correction documentaire doit préciser le comportement actuel et distinguer l’historique. Pour une correction de calcul, fournir la source officielle, le commit de référence, un cas fictif complet, l’attendu, l’observé et un test de régression. Ne pas régénérer l’attendu avec le moteur testé.

Avant une PR, vérifier les impacts :

- **OMS/moteur/classification :** domaine, unités, âge, position, arrondi, valeurs extrêmes, seuils et indépendance des attentes ; voir [méthode](docs/references/METHODE.md).
- **FR/EN/AR :** mêmes clés, terminologie, RTL, labels et navigation clavier.
- **PDF/CSV :** données fictives, langues, unités, échappement et résultats conservés sans recalcul.
- **Sauvegardes/formats :** versions distinctes, rejet des fichiers corrompus, restauration en copie et conservation des anciens résultats.
- **Offline :** ressources, SRI, manifestes, sources GPL et mise à jour sans purge des données.

Publier uniquement des exemples inventés. Pour une vulnérabilité, suivre [SECURITY.md](SECURITY.md), pas une issue publique contenant des données sensibles. Une correction ne doit jamais transformer un message logiciel en diagnostic ou prescription automatique.
