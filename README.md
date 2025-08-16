# Agile Vision BLOCK - Gestionnaire de Pages

Une application moderne de gestion de pages et blocs avec interface drag & drop par Agile Vision.

## 🚀 Fonctionnalités

- **Gestion de pages** : Créer, nommer et organiser des pages
- **Interface moderne** : Design épuré et responsive avec drag & drop
- **Gestion des blocs** : Blocs éditables avec pièces jointes
- **Lanceur automatique** : Intégration au dash Ubuntu avec icône personnalisée
- **Sauvegarde automatique** : Système de sauvegarde quotidienne des bases et images

## 🛠️ Technologies

- **Frontend** : Next.js 14, React 18, TypeScript 5
- **Styling** : CSS Modules, PostCSS
- **Base de données** : PostgreSQL avec pg (node-postgres)
- **API** : Next.js API Routes
- **Système** : Scripts bash, cron, intégration desktop Linux

## 📦 Installation et Configuration

### **Prérequis**
- Node.js 18+
- PostgreSQL
- Git

### **Installation**
```bash
# Cloner le repository
git clone https://github.com/cryptoradio7/BLOCK.git
cd BLOCK

# Installer les dépendances
npm install

# Construire l'application
npm run build

# Lancer le serveur de production
npm run start
```

L'application sera accessible sur `http://localhost:3001`

### **Configuration de la base de données**
```bash
# Créer la base de données
sudo -u postgres createdb block_app

# Exécuter le schéma
psql -U egx -d block_app -f database_schema.sql
```

## 🖥️ Lanceur Automatique

### **Installation du lanceur**
```bash
# Copier le fichier .desktop
cp BLOCK.desktop ~/.local/share/applications/

# Mettre à jour le cache des applications
update-desktop-database ~/.local/share/applications/
```

### **Fichier .desktop**
```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=BLOCK - Gestionnaire de Pages
Comment=Lance l'application BLOCK - Gestionnaire de pages et blocs avec interface drag & drop
Exec=/home/egx/Bureau/APPS/BLOCK/launch-block.sh
Icon=/home/egx/Bureau/APPS/BLOCK/blocks-icon.png
Terminal=false
Categories=Development;WebDevelopment;Office;
Keywords=block;pages;drag;drop;editor;agile;vizion;
StartupNotify=true
Hidden=false
```

### **Script de lancement**
Le script `launch-block.sh` :
- ✅ Vérifie et construit l'application si nécessaire
- ✅ Démarre le serveur Next.js sur le port 3001
- ✅ Lance automatiquement Google Chrome
- ✅ Gère les erreurs et conflits de processus
- ✅ Utilise des options Chrome optimisées pour Linux

## 💾 Système de Sauvegarde Automatique

### **Configuration du cron**
```bash
# Ajouter la tâche cron (18h00 quotidien)
echo "0 18 * * * /home/egx/Bureau/APPS/BLOCK/backup_daily.sh" | crontab -

# Vérifier la configuration
crontab -l
```

### **Ce qui est sauvegardé**
- **Base de données** : Export PostgreSQL complet de `block_app`
- **Images** : Synchronisation du dossier `public/uploads`
- **Version Git** : Chaque sauvegarde inclut le hash Git actuel
- **Rétention** : 14 dernières sauvegardes de base conservées

### **Structure des sauvegardes**
```
/home/egx/Bureau/backups/BLOCK/
├── databases/                    # Sauvegardes DB quotidiennes
│   ├── block_app_20240816_180000_git-a1b2c.sql
│   ├── block_app_20240817_180000_git-d3e4f.sql
│   └── ... (14 dernières conservées)
├── images/                       # Images synchronisées
│   ├── image1.jpg
│   ├── image2.png
│   └── ... (toutes les images)
└── backup_daily.log              # Log détaillé des sauvegardes
```

### **Fonctionnement**
- **Automatique** : Tous les jours à 18h00
- **Intelligent** : Synchronisation incrémentale des images
- **Sécurisé** : Profil Chrome séparé, options optimisées
- **Logs** : Traçabilité complète des opérations

## 🏗️ Structure du Projet

```
BLOCK/
├── src/                          # Code source Next.js
│   ├── app/                      # App Router Next.js
│   │   ├── api/                  # Routes API
│   │   │   ├── pages/            # Gestion des pages
│   │   │   ├── blocks/           # Gestion des blocs
│   │   │   ├── upload/           # Upload de fichiers
│   │   │   └── attachments/      # Gestion des pièces jointes
│   │   ├── layout.tsx            # Layout principal
│   │   └── page.tsx              # Page d'accueil
│   ├── components/               # Composants React
│   │   ├── Sidebar.tsx           # Barre latérale
│   │   ├── Toolbar.tsx           # Barre d'outils
│   │   ├── BlockCanvas.tsx       # Canvas des blocs
│   │   └── EditableBlock.tsx     # Blocs éditables
│   ├── types/                    # Types TypeScript
│   ├── hooks/                    # Hooks React personnalisés
│   ├── lib/                      # Utilitaires (base de données)
│   └── styles/                   # Styles CSS globaux
├── public/                       # Fichiers statiques
│   └── uploads/                  # Images et fichiers uploadés
├── launch-block.sh               # Script de lancement automatique
├── backup_daily.sh               # Script de sauvegarde quotidienne
├── BLOCK.desktop                 # Fichier d'intégration desktop
├── blocks-icon.png               # Icône de l'application
├── database_schema.sql           # Schéma de base de données
└── package.json                  # Dépendances et scripts
```

## 🔌 API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/pages` | GET | Récupérer toutes les pages |
| `/api/pages` | POST | Créer une nouvelle page |
| `/api/pages/[id]` | GET | Récupérer une page spécifique |
| `/api/pages/[id]` | PUT | Mettre à jour une page |
| `/api/pages/[id]` | DELETE | Supprimer une page |
| `/api/pages/reorder` | POST | Réorganiser l'ordre des pages |
| `/api/blocks` | GET | Récupérer tous les blocs |
| `/api/blocks` | POST | Créer un nouveau bloc |
| `/api/blocks/[id]` | GET | Récupérer un bloc spécifique |
| `/api/blocks/[id]` | PUT | Mettre à jour un bloc |
| `/api/blocks/[id]` | DELETE | Supprimer un bloc |
| `/api/upload` | POST | Upload de fichiers |
| `/api/upload-content-image` | POST | Upload d'images de contenu |
| `/api/attachments/[id]` | GET | Récupérer une pièce jointe |
| `/api/image-dimensions` | GET | Récupérer les dimensions d'une image |

## 🎨 Interface Utilisateur

- **Sidebar** : Liste des pages avec bouton d'ajout et réorganisation
- **Toolbar** : Boutons d'export PDF et outils de navigation
- **Page Editor** : Zone d'édition avec blocs draggables et redimensionnables
- **Block Component** : Éditeur de contenu riche avec pièces jointes
- **Drag & Drop** : Interface intuitive pour organiser les blocs

## 🚧 Développement et Améliorations

### **Fonctionnalités implémentées**
- [x] Base de données PostgreSQL avec pg (node-postgres)
- [x] Système de lancement automatique intégré au dash
- [x] Sauvegarde automatique quotidienne (cron 18h00)
- [x] Interface drag & drop pour les blocs
- [x] Gestion des pièces jointes et images
- [x] API REST complète pour pages et blocs
- [x] Intégration desktop Linux (.desktop)

### **Améliorations prévues**
- [ ] Authentification utilisateur
- [ ] Collaboration en temps réel
- [ ] Templates de pages
- [ ] Historique des modifications
- [ ] Mode sombre
- [ ] Export PDF avancé
- [ ] Synchronisation cloud

## 🔧 Maintenance et Dépannage

### **Lancer manuellement l'application**
```bash
cd /home/egx/Bureau/APPS/BLOCK
./launch-block.sh
```

### **Lancer manuellement une sauvegarde**
```bash
cd /home/egx/Bureau/APPS/BLOCK
./backup_daily.sh
```

### **Vérifier le statut du cron**
```bash
crontab -l
```

### **Arrêter le serveur**
```bash
pkill -f "next start.*3001"
```

### **Logs de sauvegarde**
```bash
cat /home/egx/Bureau/backups/BLOCK/backup_daily.log
```

## 📝 Licence

MIT

## 👨‍💻 Auteur

Agile Vision - Développement d'applications modernes et intuitives

---

**🚀 L'application BLOCK est maintenant prête pour la production avec lancement automatique et sauvegarde quotidienne !** 