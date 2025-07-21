# 📷 Copier-Coller d'Images dans BLOCK

Cette fonctionnalité permet de coller directement des images depuis le presse-papier dans vos blocs.

## 🚀 Comment utiliser

### 1️⃣ **Copier une image**
Vous pouvez copier une image depuis :
- **Capture d'écran** (Impr écran, Ctrl+Shift+S, etc.)
- **Image depuis un site web** (clic droit → "Copier l'image")
- **Fichier image** (sélectionner et Ctrl+C)
- **Logiciel de dessin** (Photoshop, GIMP, Paint, etc.)

### 2️⃣ **Coller dans un bloc**
1. **Cliquez** dans un bloc (titre ou contenu)
2. **Collez** avec `Ctrl+V` (ou `Cmd+V` sur Mac)
3. L'image est **automatiquement uploadée** et ajoutée aux pièces jointes

## 🎯 **Zones de collage**

### ✅ **Titre du bloc**
- Collez dans le champ titre
- L'image s'ajoute aux attachments du bloc

### ✅ **Contenu du bloc**  
- Collez dans la zone de texte
- L'image s'ajoute aux attachments du bloc

## 🖼️ **Affichage des images**

### **Images collées**
- **Miniature** visible directement dans le bloc
- **Nom du fichier** affiché sous l'image
- **Clic** pour ouvrir l'image en grand

### **Autres fichiers**
- Affichés comme liens cliquables
- Icône 📎 + nom du fichier

## 📊 **Formats supportés**

### ✅ **Images compatibles**
- **PNG** (.png)
- **JPEG** (.jpg, .jpeg)
- **GIF** (.gif)
- **WebP** (.webp)
- **SVG** (.svg)

### ✅ **Sources compatibles**
- Presse-papier système
- Captures d'écran
- Images copiées depuis navigateur
- Fichiers copiés depuis explorateur

## 🔄 **Feedback visuel**

### **Pendant l'upload**
- Notification verte : "📷 Upload de X image(s)..."
- Position : coin supérieur droit

### **Succès**
- Notification verte : "✅ X image(s) ajoutée(s) !"
- Disparaît après 2 secondes

### **Erreur**
- Notification rouge : "❌ Erreur lors du collage de l'image"
- Disparaît après 3 secondes

## 🎨 **Exemple d'utilisation**

```
1. Faire une capture d'écran (Impr écran)
2. Cliquer dans un bloc BLOCK
3. Ctrl+V
4. ✅ L'image apparaît automatiquement !
```

## 🔧 **Comportement intelligent**

### **Si vous collez une image :**
- L'image est uploadée automatiquement
- Le texte normal n'est PAS collé
- L'image s'ajoute aux pièces jointes

### **Si vous collez du texte :**
- Le texte se colle normalement
- Aucune interférence avec la fonctionnalité

### **Si vous collez texte + image :**
- L'image est uploadée
- Le texte est ignoré (pour éviter les conflits)

## 🚨 **Limitations**

- **Taille max :** Dépend de la configuration serveur
- **Types :** Seules les images sont supportées
- **Nombre :** Pas de limite (toutes les images du presse-papier)

## 🛠️ **Dépannage**

### **L'image ne se colle pas :**
1. Vérifiez que c'est bien une image
2. Essayez de copier à nouveau
3. Vérifiez la console (F12) pour les erreurs

### **Erreur d'upload :**
1. Vérifiez la connexion internet
2. Vérifiez que le serveur fonctionne
3. Essayez avec une image plus petite

### **Image non visible :**
1. Actualiser la page
2. Vérifier que l'image est dans les pièces jointes
3. Cliquer sur l'image pour l'ouvrir

---

✨ **Maintenant vous pouvez enrichir vos blocs avec des images d'un simple Ctrl+V !** ✨ 