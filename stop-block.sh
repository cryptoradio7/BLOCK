#!/bin/bash

# 🛑 Script d'arrêt BLOCK App
# Agile Vision - Gestionnaire de Pages et Blocs

echo "🛑 Arrêt de BLOCK App..."

# Arrêter tous les processus Next.js sur le port 3001
echo "🔍 Recherche des processus BLOCK en cours..."

# Tuer les processus Next.js
pkill -f "next dev -p 3001" && echo "✅ Processus Next.js arrêté" || echo "ℹ️  Aucun processus Next.js trouvé"

# Tuer les processus npm si nécessaire
pkill -f "npm run dev" && echo "✅ Processus npm arrêté" || echo "ℹ️  Aucun processus npm trouvé"

# Vérifier que le port est libre
if lsof -i :3001 >/dev/null 2>&1; then
    echo "⚠️  Le port 3001 est encore utilisé"
    echo "🔧 Tentative de libération forcée..."
    sudo lsof -t -i :3001 | xargs sudo kill -9 2>/dev/null || true
else
    echo "✅ Port 3001 libéré"
fi

echo "🎯 BLOCK App arrêtée avec succès !" 