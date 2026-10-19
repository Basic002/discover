# ✦ DISCOVER — Frontend Application

> Interface web moderne, sombre et responsive pour la découverte et la géolocalisation de concerts en direct en France.

[![Site en ligne](https://img.shields.io/badge/Site%20en%20ligne-GitHub%20Pages-rose?style=for-the-badge&logo=github)](https://basic002.github.io/discover/)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌐 Déploiement en Ligne

L'application est automatiquement déployée sur **GitHub Pages** :
👉 **[https://basic002.github.io/discover/](https://basic002.github.io/discover/)**

---

## ✨ Fonctionnalités Principales

- **Recherche instantanée sans bouton** : Saisie libre au clavier avec filtrage réactif en temps réel des artistes, salles et villes.
- **Carte interactive Leaflet** : Marqueurs thématiques, clusters automatiques (`leaflet.markercluster`), zoom et bornes géographiques verrouillées.
- **Menu Hamburger ultra-compact (~180px)** : Déroulement fluide sous le header, affichage 2 colonnes de tous les menus sans aucun défilement requis.
- **Navigation mobile optimisée** :
  - **Dock fixe inférieur** avec accès direct aux Concerts, à la Carte, aux Favoris (avec badge compteur) et au Profil.
  - **Modales en feuille basse (Bottom Sheet)** : Ouverture fluide depuis le bas de l'écran avec swipe et poignée tactile.
  - **Protection auto-zoom iOS** : Champs de formulaires calibrés (`text-base sm:text-sm`).
- **Gestion de Profil & Sécurité** :
  - Changement d'avatar par icône musicale ou import photo personnalisé (avec compression Canvas).
  - Modification sécurisée du mot de passe avec validation immédiate.
  - Synchronisation et purge automatique des favoris orphelins ou expirés.
- **Liaison billetterie officielle** : Redirection directe vers les billetteries Ticketmaster France.
- **Export Google Calendar** en 1 clic.

---

## 📁 Structure du Projet

```
src/
├── api.js                # Configuration Axios avec bascule automatique localhost / Render
├── App.jsx               # Routage React Router avec détection dynamique du chemin de base
├── index.css             # Utilitaires Tailwind, Leaflet touch targets & safe-area mobile
├── main.jsx              # Point d'entrée React
└── pages/
    ├── Home.jsx          # Page principale : Recherche live, Carte, Filtres, Cartes concerts
    ├── Favorites.jsx     # Gestion des concerts favoris de l'utilisateur connecté
    ├── Profile.jsx       # Gestion du compte, photo de profil et sécurité
    ├── Login.jsx         # Formulaire de connexion
    ├── Register.jsx      # Formulaire d'inscription
    ├── AdminDashboard.jsx# Tableau de bord administrateur
    ├── AdminEventForm.jsx# Formulaire d'ajout d'événement
    └── NotFound.jsx      # Page 404 gothique
```

---

## 💻 Démarrage Local

```bash
# Installation des dépendances
npm install

# Lancement du serveur de développement Vite
npm run dev

# Construction de la version de production
npm run build

# Prévisualisation du build de production
npm run preview
```

---

## ⚙️ Configuration du Déploiement GitHub Pages

Ce dépôt inclut :
1. **Support du routage SPA** via `public/404.html` et redirection automatique dans `index.html` pour éviter toute erreur 404 lors du rafraîchissement des routes (`/favorites`, `/profile`, `/login`).
2. **Chemin relatif universel** (`base: './'`) dans `vite.config.js`.
3. **Redéploiement automatique** via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) ou via la branche de production `gh-pages`.
