---
app: ZENKAI
design_system: Obsidian Luxe
mode: dark-only
font_display: Hanken Grotesk
icon_fallback_font: Material Symbols Outlined
colors:
  surface: "#131318"
  surface-dim: "#131318"
  surface-bright: "#39383e"
  surface-container-lowest: "#0e0e13"
  surface-container-low: "#1b1b20"
  surface-container: "#1f1f25"
  surface-container-high: "#2a292f"
  surface-container-highest: "#35343a"
  on-surface: "#e4e1e9"
  on-surface-variant: "#e3bdc7"
  background: "#131318"
  on-background: "#e4e1e9"
  primary: "#ffb0c9"
  primary-container: "#ff4898"
  on-primary: "#650034"
  on-primary-container: "#58002d"
  secondary: "#eeb8c7"
  secondary-container: "#653e4a"
  on-secondary: "#492631"
  on-secondary-container: "#dfaab8"
  tertiary: "#d6c5a2"
  tertiary-container: "#9e8f70"
  on-tertiary: "#392f17"
  on-tertiary-container: "#322811"
  outline: "#aa8891"
  outline-variant: "#5b3f47"
  error: "#ffb4ab"
  error-container: "#93000a"
  on-error: "#690005"
  on-error-container: "#ffdad6"
radius:
  sm: "0.25rem"
  DEFAULT: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  full: "9999px"
spacing:
  container-padding: "20px"
  card-padding: "16px"
  widget-padding: "14px"
  stack-gap: "12px"
  grid-gap: "10px"
  element-margin: "8px"
  tight-margin: "4px"
typography:
  display: "36px / 44px / -0.02em / 700"
  headline-lg: "24px / 32px / 600"
  headline-md: "20px / 28px / 600"
  body-lg: "15px / 24px / 400"
  body-md: "14px / 20px / 500"
  label-md: "13px / 18px / 500"
  label-sm: "11px / 16px / 0.05em / 600"
---

# ZENKAI — Design System "Obsidian Luxe"

ZENKAI réutilise à l'identique le design system **Obsidian Luxe** partagé
avec LISTMAX, CREAFOOD et EVOLIFT : mêmes tokens de couleur, même
typographie (Hanken Grotesk), mêmes espacements et rayons, même
architecture de fichiers et le même moteur de rendu (état en mémoire +
`localStorage`, icônes avec repli automatique, pages `.page`/`.page.active`,
modale unique, toast unique).

## Principes esthétiques

- **Glassmorphism fonctionnel** — header et nav en `backdrop-blur`, cartes
  en surfaces `surface-container-*` empilées.
- **Halos plutôt que des ombres classiques** — halo fuchsia discret autour
  de la carte "Reprendre la lecture" plutôt qu'un `box-shadow` marqué.
- **Coins très arrondis** — `rounded-xl`/`rounded-2xl` pour les cartes,
  `rounded-full` pour les boutons d'action et les pastilles de filtre.
- **Accent fuchsia réservé aux actions et états actifs** (`primary`,
  `primary-container`) ; **sable-or réservé au premium** (badges Tier S,
  éléments "Élite").

## Layout

- Mobile-first, largeur de confort ~380–420px.
- Header fixe en haut, navigation fixe en bas (5 onglets), contenu
  défilant entre les deux.
- Grille 2 colonnes pour les cartes denses (Watchlist).

## Pages

1. **Home** — rythme de visionnage, reprise de lecture, titres à
   rattraper, tendances de la watchlist, accès rapide aux 3 autres pages.
2. **Actually** — titres en cours de visionnage : filtres de statut,
   recherche, incrément d'épisode, ajout manuel.
3. **Watchlist** — films/séries/animés à voir plus tard, filtrables par
   type, avec passage direct vers Actually ("Commencer").
4. **Ranking** — classement personnel noté sur 10, répartition par tier
   (S/A/B), ajout de nouvelles notes.
5. **Settings** — profil, préférences (plateforme, piste audio, spoilers,
   rappels), export JSON, édition du profil, déconnexion, suppression de
   compte.

## Stockage

Comme les autres apps de la famille, ZENKAI utilise le `localStorage` du
navigateur (comptes, session active, données par utilisateur) via un
adaptateur `storage` asynchrone dans `assets/js/app.js` — aucun backend.
