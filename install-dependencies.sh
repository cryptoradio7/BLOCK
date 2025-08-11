#!/bin/bash

echo "🚀 Installation des dépendances pour BLOCK avec gestion des dimensions d'images..."

# Installer sharp pour la gestion des images
echo "📦 Installation de sharp..."
npm install sharp

# Installer les types pour sharp
echo "📦 Installation des types pour sharp..."
npm install --save-dev @types/sharp

echo "✅ Dépendances installées avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Exécuter le script SQL : database_schema.sql"
echo "2. Redémarrer l'application"
echo "3. Tester le redimensionnement des images"
