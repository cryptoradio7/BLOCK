#!/bin/bash

# 🚀 Lanceur BLOCK App - Version Nettoyée
# Agile Vision - Gestionnaire de Pages et Blocs

echo "🚀 Lancement de BLOCK App..."

# Vérifier si nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé"
    echo "📂 Assurez-vous d'être dans le répertoire BLOCK"
    exit 1
fi

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Vérifier si le port 3001 est libre
if lsof -i :3001 >/dev/null 2>&1; then
    echo "⚠️  Le port 3001 est déjà utilisé"
    echo "🔄 Tentative d'arrêt du processus existant..."
    pkill -f "next dev -p 3001" || true
    sleep 2
fi

# Lancer l'application
echo "🌐 Démarrage du serveur sur http://localhost:3001"
echo "⏹️  Appuyez sur Ctrl+C pour arrêter"

# Ouvrir le navigateur après 3 secondes en arrière-plan
(sleep 3 && (xdg-open http://localhost:3001 || firefox http://localhost:3001 || chromium-browser http://localhost:3001) >/dev/null 2>&1) &

# Lancer le serveur
npm run dev 