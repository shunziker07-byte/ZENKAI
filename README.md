# ZENKAI

Application pour centraliser tout ce que tu regardes — films, séries et
animés — dans une interface **Obsidian Luxe** (glassmorphism, accents
fuchsia et sable-or).

100% front-end, sans backend : HTML + Tailwind CSS (CDN) + JavaScript vanilla. Les comptes et les données sont stockés dans le `localStorage` du navigateur.

## ✨ Fonctionnalités

- **Connexion / Inscription** — e-mail + mot de passe, et un flux "Google" simulé (voir *Limites* ci-dessous).
- **Home** — rythme de visionnage, reprise de lecture, titres à rattraper, tendances de la watchlist.
- **Actually** — séries/animés en cours de visionnage, filtres par statut, ajout d'épisode, ajout de titre.
- **Watchlist** — tout ce que tu veux voir plus tard (films, séries, animés), filtrable par type, avec passage direct vers Actually.
- **Ranking** — classement personnel noté sur 10, répartition par tier (S/A/B), ajout de nouvelles notes.
- **Settings** — préférences (plateforme, piste audio, spoilers, rappels), export JSON des données, édition du profil, déconnexion, suppression de compte.
- Chaque compte a ses propres données, isolées des autres comptes créés sur le même navigateur.

## 📁 Structure du projet

```
zenkai/
├── index.html               # Page unique de l'application (SPA)
├── assets/
│   ├── css/
│   │   └── style.css        # Styles custom (au-delà des utilitaires Tailwind)
│   ├── js/
│   │   ├── tailwind.config.js  # Design tokens (couleurs, typographie, espacements)
│   │   └── app.js              # Logique de l'application (état, rendu, stockage)
│   └── icones/               # Logo + icônes de nav — remplaçables manuellement
│       ├── logo.svg
│       ├── nav-home.svg, nav-actually.svg, nav-watchlist.svg, nav-ranking.svg, nav-settings.svg
│       └── README.md         # Comment remplacer une icône
├── README.md
└── LICENSE
```

## 🖼️ Remplacer les icônes

Les icônes actuelles dans `assets/icones/` sont des exemples. Remplace
simplement les fichiers (même nom) par tes propres images — voir
[`assets/icones/README.md`](./assets/icones/README.md) pour le détail.
Si un fichier est manquant ou cassé, l'app affiche automatiquement une
icône de secours : rien ne plante jamais.

## 🔑 Compte de démonstration

```
E-mail        : demo@zenkai.app
Mot de passe  : demo1234
```

Ce compte est créé automatiquement au premier chargement de l'app. Tu peux
bien sûr créer ton propre compte depuis l'onglet "Créer un compte".

## 🚀 Lancer le projet

Aucune installation ni build requis.

**Option 1 — ouvrir directement**
Double-clique sur `index.html` (ou ouvre-le depuis ton navigateur). Certains navigateurs restreignent `localStorage` sur les fichiers `file://` : si les données ne persistent pas, utilise l'option 2.

**Option 2 — petit serveur local**
```bash
cd zenkai
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
ou avec Node :
```bash
npx serve .
```

## 🌐 Déployer sur GitHub Pages

1. Pousse ce dossier sur un dépôt GitHub.
2. Dans **Settings → Pages**, choisis la branche `main` et le dossier `/ (root)` — ou `/zenkai` si ce dossier est à la racine du repo.
3. Ton app sera disponible à `https://<ton-user>.github.io/<ton-repo>/`.

## ⚠️ Limites à connaître (prototype front-end)

- **Pas de vrai backend.** Comptes, mots de passe et données sont stockés uniquement dans le `localStorage` du navigateur utilisé — rien n'est envoyé à un serveur. Vider le cache du navigateur ou changer d'appareil = perte d'accès aux données.
- **Mots de passe non sécurisés.** Le hash utilisé est une fonction simple à but de démo, pas un algorithme cryptographique (type bcrypt/argon2). Ne pas utiliser de vrais mots de passe sensibles.
- **"Connexion Google" simulée.** Il n'y a pas de vraie intégration OAuth Google — le bouton ouvre un petit formulaire qui simule la connexion. Pour une vraie authentification Google, il faut un backend (ou un service comme Firebase Auth / Supabase Auth / Auth0) avec des identifiants OAuth enregistrés auprès de Google.
- **Affiches génériques.** Les vignettes de films/séries/animés sont des dégradés générés (pas d'images tierces), pour rester 100% autonome et sans dépendance réseau.

### Pour aller plus loin (production)
Si tu veux une vraie authentification et une synchronisation multi-appareils, il faudra remplacer la couche `storage` de `assets/js/app.js` par des appels vers un vrai backend (Firebase, Supabase, ou une API maison), et gérer les mots de passe côté serveur avec un hash sécurisé.

## 🎨 Design system

Le fichier `assets/js/tailwind.config.js` contient tous les tokens (couleurs, typographie `Hanken Grotesk`, espacements) du design system **Obsidian Luxe**, identique à celui utilisé par LISTMAX, CREAFOOD et EVOLIFT.

## 📄 Licence

MIT — voir [LICENSE](./LICENSE).
