#!/bin/bash
# Script de lancement pour l'application BLOCK
# Mode DÉVELOPPEMENT uniquement avec nettoyage automatique

PROJECT_DIR="/home/egx/Bureau/APPS/BLOCK"
PORT=3001
URL="http://localhost:${PORT}"

echo "🚀 Lancement de l'application BLOCK en mode DÉVELOPPEMENT..."
echo "📁 Dossier: $PROJECT_DIR"
echo "🌐 Port: $PORT"
echo "🔗 URL: $URL"
echo "🔧 Mode: DÉVELOPPEMENT (hot-reload)"
echo ""

# Vérifier que le dossier existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ ERREUR: Le dossier $PROJECT_DIR n'existe pas"
    exit 1
fi

# Aller dans le dossier du projet
cd "$PROJECT_DIR"

# Nettoyer TOUS les processus Next.js sur le port 3001 (optimisé)
echo "🧹 Nettoyage des processus existants..."
if pgrep -f "next.*3001" > /dev/null; then
    echo "⚠️  Processus Next.js détecté sur le port $PORT"
    echo "🔄 Arrêt de tous les processus Next.js..."
    pkill -f "next.*3001"
    sleep 1
    echo "✅ Nettoyage terminé"
fi

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Mode DÉVELOPPEMENT uniquement
echo "🔧 Mode DÉVELOPPEMENT - Hot-reload activé"
echo "🧹 Nettoyage du cache de développement..."
rm -rf .next

# Démarrer le serveur de développement
echo "🚀 Démarrage du serveur de développement..."
nohup npm run dev > /tmp/block-app-dev.log 2>&1 &

# Attendre que le serveur démarre (lancement immédiat)
echo "⏳ Démarrage du serveur en arrière-plan..."
sleep 2  # Juste le temps que Next.js commence à compiler
echo "✅ Serveur en cours de démarrage !"

# Attendre un peu plus pour s'assurer que le serveur est prêt (ultra-optimisé)
echo "🌐 Ouverture dans Google Chrome..."
sleep 0.5

# Forcer l'ouverture dans Google Chrome
echo "   Lancement de Google Chrome..."

# Vérifier si Chrome est installé
if ! command -v google-chrome > /dev/null; then
    echo "❌ ERREUR: Google Chrome n'est pas installé"
    echo "📥 Installez Google Chrome depuis: https://www.google.com/chrome/"
    echo "🌐 Ou ouvrez manuellement: $URL"
    exit 1
fi

# Tuer tous les processus Chrome existants pour éviter les conflits (optimisé)
echo "   Arrêt des processus Chrome existants..."
pkill -f "google-chrome" 2>/dev/null
sleep 1

# Lancer Chrome avec des options sûres et stables
echo "   Lancement de Chrome avec options optimisées..."
google-chrome \
    --disable-dev-shm-usage \
    --new-window \
    --window-size=1200,800 \
    --window-position=100,100 \
    "$URL" > /dev/null 2>&1 &

# Attendre que Chrome démarre (ultra-optimisé)
echo "   Attente du démarrage de Chrome..."
sleep 1

# Vérifier que Chrome est bien lancé
if pgrep chrome > /dev/null; then
    echo "✅ Google Chrome lancé avec succès !"
    echo "🌐 L'application s'ouvre dans Chrome"
else
    echo "⚠️  Chrome n'a pas pu être lancé automatiquement"
    echo "🌐 Ouvrez manuellement Chrome et allez sur: $URL"
fi

echo ""
echo "🎉 Application BLOCK lancée !"
echo "🔗 URL: $URL"
echo "🔧 Mode: DÉVELOPPEMENT (hot-reload)"
echo "📝 Logs: /tmp/block-app-dev.log"
echo "🛑 Pour arrêter: pkill -f 'next dev.*3001'"
echo "💡 Mode développement: Hot-reload actif, modifications visibles immédiatement"
echo ""
echo "💡 L'application est maintenant accessible dans Google Chrome"
echo "🌐 Si Chrome ne s'est pas ouvert, allez sur: $URL"
