# 🚀 Lanceur Application BLOCK

Ce répertoire contient les scripts de lancement pour l'application BLOCK.

## 📁 Fichiers créés

### 🎯 Scripts principaux
- **`launch-block.sh`** - Script principal pour lancer l'application
- **`stop-block.sh`** - Script pour arrêter l'application
- **`block-app.desktop`** - Fichier de lanceur pour le bureau

### 🖼️ Icône
- **`blocks-icon.png`** - Icône de l'application

## 🚀 Comment utiliser

### 1️⃣ Lancement depuis le menu des applications
L'application **BLOCK App** devrait maintenant apparaître dans :
- Le menu des applications (Activités → BLOCK App)
- Les applications de développement
- La recherche d'applications

### 2️⃣ Lancement depuis le bureau
Un raccourci **block-app.desktop** a été créé sur votre bureau.
**Double-cliquez** dessus pour lancer l'application.

### 3️⃣ Lancement depuis le terminal
```bash
# Lancer l'application
./launch-block.sh

# Arrêter l'application
./stop-block.sh
```

## 🔧 Fonctionnalités du lanceur

### ✅ **Détection automatique**
- Vérifie si l'application est déjà en cours d'exécution
- Installe automatiquement les dépendances si nécessaire
- Ouvre le navigateur automatiquement

### 🌐 **Support multi-navigateur**
Le script essaie d'ouvrir l'application dans :
1. Google Chrome
2. Firefox
3. Chromium
4. Navigateur par défaut

### 📊 **Logs et diagnostic**
- Messages colorés pour un suivi facile
- Logs d'erreur dans `/tmp/block-app.log`
- Gestion d'erreur complète

### 🛑 **Arrêt propre**
- Arrêt gracieux avec Ctrl+C
- Script d'arrêt dédié (`stop-block.sh`)
- Nettoyage automatique des processus

## 🎨 URLs de l'application

- **Interface principale :** http://localhost:3001
- **API Backend :** http://localhost:3001/api

## 🔄 Si le lanceur ne fonctionne pas

### 1. Vérifiez les permissions
```bash
chmod +x launch-block.sh
chmod +x stop-block.sh
chmod +x block-app.desktop
```

### 2. Vérifiez le répertoire
Le script s'attend à être dans :
```
/home/egx/Bureau/APPS/BLOCK/
```

### 3. Relancez la base de données des applications
```bash
update-desktop-database ~/.local/share/applications
```

### 4. Logs de debug
Si l'application ne démarre pas, consultez :
```bash
tail -f /tmp/block-app.log
```

## 🛠️ Personnalisation

### Changer l'icône
Remplacez `blocks-icon.png` par votre icône (format PNG recommandé, 256x256px).

### Modifier les chemins
Éditez les variables dans `launch-block.sh` :
```bash
BLOCK_DIR="/votre/nouveau/chemin"
ICON="$BLOCK_DIR/votre-icone.png"
```

### Changer le port
Si vous changez le port dans `package.json`, mettez à jour :
- `launch-block.sh` (ligne avec `localhost:3001`)
- `stop-block.sh` (ligne avec `:3001`)

## 🎯 Dépannage rapide

| Problème | Solution |
|----------|----------|
| L'icône n'apparaît pas | Vérifiez que `blocks-icon.png` existe |
| "Permission denied" | Exécutez `chmod +x *.sh` |
| Port déjà utilisé | Lancez `./stop-block.sh` puis relancez |
| Dépendances manquantes | Le script les installe automatiquement |

---

✨ **L'application BLOCK est maintenant prête à être lancée d'un simple clic !** ✨ 