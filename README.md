# BLOCKS - Gestionnaire de Pages

Une application moderne de gestion de pages et blocs avec interface drag & drop.

## 🚀 Fonctionnalités

- **Gestion de pages** : Créer, nommer et organiser des pages
- **Blocs modulaires** : Ajouter des blocs de texte, images et fichiers
- **Drag & Drop** : Réorganiser les blocs par glisser-déposer
- **Pièces jointes** : Ajouter des fichiers et images aux blocs
- **Export PDF** : Télécharger les pages en format PDF
- **Interface moderne** : Design épuré et responsive

## 🛠️ Technologies

- **Frontend** : Next.js 14, React, TypeScript
- **Styling** : CSS Modules
- **Animations** : Framer Motion
- **Drag & Drop** : React DnD
- **PDF** : jsPDF
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
│   │   ├── pages/      # Gestion des pages
│   │   ├── blocks/     # Gestion des blocs
│   │   ├── files/      # Upload de fichiers
│   │   └── export/     # Export PDF
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Page d'accueil
├── components/         # Composants React
│   ├── Sidebar.tsx     # Barre latérale
│   ├── Toolbar.tsx     # Barre d'outils
│   ├── PageEditor.tsx  # Éditeur de page
│   └── BlockComponent.tsx # Composant de bloc
├── types/              # Types TypeScript
└── styles/             # Styles CSS
```

## 🔌 API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/pages` | GET | Récupérer toutes les pages |
| `/api/pages` | POST | Créer une nouvelle page |
| `/api/blocks` | PATCH | Mettre à jour un bloc |
| `/api/blocks` | POST | Créer un nouveau bloc |
| `/api/files` | POST | Upload de fichier |
| `/api/export` | POST | Export PDF |

## 🎨 Interface

- **Sidebar** : Liste des pages avec bouton d'ajout
- **Toolbar** : Boutons impression et export PDF
- **Page Editor** : Zone d'édition avec blocs draggables
- **Block Component** : Éditeur de contenu avec pièces jointes

## 🚧 Développement

Le projet est configuré pour évoluer ensemble. Les principales améliorations prévues :

- [ ] Base de données PostgreSQL avec Prisma
- [ ] Authentification utilisateur
- [ ] Collaboration en temps réel
- [ ] Templates de pages
- [ ] Historique des modifications
- [ ] Optimisation des images
- [ ] Mode sombre

## 📝 Licence

MIT 