# 📏 Gestion des Dimensions d'Images dans BLOCK

## 🎯 Objectif

Ce système permet de **persister les dimensions et positions des images** dans les blocs, évitant ainsi la perte de données lors du redémarrage de l'application.

## 🏗️ Architecture

### 1. **Nouvelle Table : `image_dimensions`**
```sql
CREATE TABLE image_dimensions (
    id SERIAL PRIMARY KEY,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    attachment_id INTEGER REFERENCES block_attachments(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_name TEXT NOT NULL,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    original_width INTEGER,
    original_height INTEGER,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. **Nouvelle API : `/api/image-dimensions`**
- `GET` : Récupérer les dimensions pour un bloc
- `POST` : Créer/mettre à jour les dimensions
- `DELETE` : Supprimer les dimensions

### 3. **Hook Personnalisé : `useImageDimensions`**
Gère l'état local et les opérations CRUD pour les dimensions d'images.

## 🚀 Installation

### Étape 1 : Installer les dépendances
```bash
chmod +x install-dependencies.sh
./install-dependencies.sh
```

### Étape 2 : Créer la table en base
Exécuter le fichier `database_schema.sql` dans votre base de données PostgreSQL.

### Étape 3 : Redémarrer l'application
```bash
npm run dev
```

## 🔧 Fonctionnement

### 1. **Upload d'Image**
- L'image est uploadée et sauvegardée dans `block_attachments`
- Les dimensions originales sont automatiquement détectées avec **Sharp**
- Une entrée est créée dans `image_dimensions` avec les dimensions par défaut

### 2. **Redimensionnement d'Image**
- L'utilisateur redimensionne l'image dans le contenu
- Un `ResizeObserver` détecte les changements de taille
- Les nouvelles dimensions sont automatiquement sauvegardées en base

### 3. **Persistance des Données**
- À chaque redémarrage, les dimensions sauvegardées sont rechargées
- Les images retrouvent automatiquement leur taille et position

## 📱 Utilisation

### **Coller une Image**
1. Copier une image depuis n'importe où
2. Coller dans le contenu d'un bloc
3. L'image est automatiquement uploadée et ses dimensions sauvegardées

### **Redimensionner une Image**
1. Cliquer sur une image dans le contenu
2. Utiliser les poignées de redimensionnement
3. Les nouvelles dimensions sont automatiquement sauvegardées

### **Supprimer une Image**
1. Cliquer sur le bouton "×" de l'image
2. Confirmer la suppression
3. L'image et ses dimensions sont supprimées de la base

## 🔍 Monitoring

### **Logs Console**
- `📏 Dimensions d'images chargées pour bloc X: Y`
- `💾 Dimensions d'image sauvegardées pour [nom]`
- `📏 Image [url] redimensionnée: WxH`
- `🗑️ Dimensions d'image supprimées pour [url]`

### **Base de Données**
```sql
-- Voir toutes les dimensions d'images
SELECT * FROM image_dimensions ORDER BY block_id, created_at;

-- Voir les dimensions pour un bloc spécifique
SELECT * FROM image_dimensions WHERE block_id = 1;

-- Voir les images orphelines (plus dans aucun bloc)
SELECT * FROM image_dimensions WHERE block_id NOT IN (SELECT id FROM blocks);
```

## 🛠️ Maintenance

### **Nettoyage des Images Orphelines**
```sql
-- Supprimer les dimensions d'images de blocs supprimés
DELETE FROM image_dimensions 
WHERE block_id NOT IN (SELECT id FROM blocks);

-- Supprimer les attachments orphelins
DELETE FROM block_attachments 
WHERE block_id NOT IN (SELECT id FROM blocks);
```

### **Migration des Images Existantes**
Si vous avez des images existantes sans dimensions sauvegardées, elles utiliseront les dimensions par défaut (300x200px).

## ⚠️ Points d'Attention

1. **Sharp** : Assurez-vous que Sharp est installé pour la détection automatique des dimensions
2. **Performance** : Le ResizeObserver peut être coûteux sur de nombreuses images
3. **Synchronisation** : Les dimensions sont sauvegardées avec un délai pour éviter les sauvegardes excessives

## 🐛 Dépannage

### **Images qui ne gardent pas leur taille**
- Vérifier que la table `image_dimensions` existe
- Vérifier les logs console pour les erreurs
- Vérifier que l'API `/api/image-dimensions` fonctionne

### **Erreurs Sharp**
- Réinstaller Sharp : `npm install sharp`
- Vérifier la compatibilité avec votre OS
- Utiliser les dimensions par défaut si Sharp échoue

## 🎉 Résultat

Avec ce système, vos images **garderont toujours leur taille et position** même après redémarrage de l'application ! 🎯
