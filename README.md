# Agile Vision BLOCK - Gestionnaire de Pages

Une application moderne de gestion de pages et blocs avec interface drag & drop par Agile Vision.

## 🚀 Fonctionnalités

- **Gestion de pages** : Créer, nommer et organiser des pages
- **Interface moderne** : Design épuré et responsive

## 🛠️ Technologies

- **Frontend** : Next.js 14, React, TypeScript
- **Styling** : CSS Modules
- **API** : Next.js API Routes

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:3001`

## 🏗️ Structure du Projet

```
src/
├── app/                 # App Router Next.js
│   ├── api/            # Routes API
│   │   └── pages/      # Gestion des pages
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Page d'accueil
├── components/         # Composants React
│   ├── Sidebar.tsx     # Barre latérale
│   ├── Toolbar.tsx     # Barre d'outils
│   ├── BlockCanvas.tsx # Canvas des blocs
│   └── EditableBlock.tsx # Blocs éditables
├── types/              # Types TypeScript
└── styles/             # Styles CSS
```

## 🔌 API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/pages` | GET | Récupérer toutes les pages |
| `/api/pages` | POST | Créer une nouvelle page |
| `/api/pages/[id]` | DELETE | Supprimer une page |

## 🎨 Interface

- **Sidebar** : Liste des pages avec bouton d'ajout
- **Toolbar** : Bouton export PDF
- **Page Editor** : Zone d'édition avec blocs draggables
- **Block Component** : Éditeur de contenu avec pièces jointes

## 🚧 Développement

Le projet est configuré pour évoluer ensemble. Les principales améliorations prévues :

- [x] Base de données PostgreSQL avec pg (node-postgres)
- [ ] Authentification utilisateur
- [ ] Collaboration en temps réel
- [ ] Templates de pages
- [ ] Historique des modifications
- [ ] Optimisation des images
- [ ] Mode sombre

## 📝 Licence

MIT 