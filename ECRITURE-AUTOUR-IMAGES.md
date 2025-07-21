# ✍️ Écrire autour des images dans les blocs

Cette fonctionnalité permet d'écrire facilement du texte à côté et autour des images intégrées dans vos blocs.

## 🎯 **Comment ça marche**

### 📝 **Écriture simple**
1. **Collez une image** (Ctrl+V) dans le contenu du bloc
2. **Cliquez à côté de l'image** pour placer le curseur
3. **Tapez votre texte** → il s'écrit naturellement à côté !

### 🖱️ **Double-clic magique**
- **Double-cliquez sur une image** → le curseur se place automatiquement après pour écrire en dessous

## 🎨 **Nouvelles fonctionnalités**

### ✅ **Images inline**
- **`display: inline-block`** → les images laissent la place au texte
- **Marge à droite** → espace automatique pour écrire à côté
- **Alignement en haut** → texte bien aligné avec l'image

### ✅ **Espaces automatiques**
- **Ligne vide avant** l'image (si contenu existant)
- **Espace après** l'image (`&nbsp;`) pour faciliter l'écriture
- **Deux lignes vides** en dessous pour écrire facilement

### ✅ **Sélection d'images**
- **Clic simple** → sélectionne l'image (bordure verte)
- **Clic ailleurs** → désélectionne toutes les images
- **Visual feedback** pour savoir quelle image est active

### ✅ **Améliorations UX**
- **Curseur clignotant** plus visible
- **Outline bleu** au focus du contenu
- **Placeholder** "Cliquez ici pour écrire..." dans les blocs vides
- **Line-height optimisée** pour une meilleure lisibilité

## 📝 **Exemples d'utilisation**

### **Texte à côté d'une image :**
```
Voici ma capture d'écran : [IMAGE] Cette image montre les résultats 
obtenus après l'optimisation. Comme vous pouvez le voir, les 
performances sont excellentes.
```

### **Texte sous une image :**
```
[IMAGE]

Description détaillée de l'image ci-dessus.
Vous pouvez ajouter autant de texte que nécessaire.
```

### **Mélange texte + images :**
```
Introduction du projet...

[IMAGE 1] Première étape avec cette capture...

Explication détaillée...

[IMAGE 2] Deuxième étape montrant les résultats.

Conclusion du projet.
```

## 🎛️ **Raccourcis et astuces**

### **Placement du curseur :**
- **Clic simple** → curseur où vous cliquez
- **Double-clic sur image** → curseur après l'image
- **Flèches clavier** → naviguez autour des images

### **Édition d'images :**
- **Clic sur image** → sélection (bordure verte)
- **Glisser les coins** → redimensionnement
- **Suppr** → supprime l'image sélectionnée

### **Gestion du texte :**
- **Entrée** → nouvelle ligne
- **Shift+Entrée** → saut de ligne simple
- **Ctrl+A** → sélectionne tout le contenu

## 🎨 **Styles visuels**

### **Images :**
- Bordure grise par défaut
- Bordure bleue au survol
- Bordure verte quand sélectionnée
- Poignées de redimensionnement visibles

### **Texte :**
- Line-height optimisée (1.6)
- Word-wrap automatique
- Curseur clignotant bleu

### **Zones d'écriture :**
- Outline bleu au focus
- Placeholder gris dans les blocs vides
- Feedback visuel sur les zones cliquables

## 🚀 **Workflow recommandé**

1. **Commencez par le texte** principal
2. **Insérez les images** (Ctrl+V) aux endroits stratégiques
3. **Ajustez la taille** des images si nécessaire
4. **Complétez le texte** autour des images
5. **Relisez et ajustez** la mise en page

## 🔧 **Dépannage**

### **Le curseur ne se place pas :**
- Double-cliquez sur l'image pour le placer automatiquement
- Utilisez les flèches clavier pour naviguer

### **Le texte ne s'écrit pas à côté :**
- Vérifiez que l'image n'est pas trop large
- Redimensionnez l'image si nécessaire

### **L'image est mal alignée :**
- Le texte s'aligne automatiquement en haut de l'image
- C'est normal et optimisé pour la lisibilité

---

✨ **Créez maintenant des blocs riches avec texte et images parfaitement intégrés !** ✨ 