#!/bin/bash
# Script de lancement pour l'application BLOCK
# Lance le serveur Next.js et ouvre le navigateur

PROJECT_DIR="/home/egx/Bureau/APPS/BLOCK"
PORT=3001
URL="http://localhost:${PORT}"

echo "🚀 Lancement de l'application BLOCK..."
echo "📁 Dossier: $PROJECT_DIR"
echo "🌐 Port: $PORT"
echo "🔗 URL: $URL"
echo ""

# Vérifier que le dossier existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ ERREUR: Le dossier $PROJECT_DIR n'existe pas"
    exit 1
fi

# Aller dans le dossier du projet
cd "$PROJECT_DIR"

# Vérifier si le serveur est déjà en cours d'exécution
if pgrep -f "next start.*3001" > /dev/null; then
    echo "⚠️  Le serveur est déjà en cours d'exécution sur le port $PORT"
    echo "🔄 Redémarrage du serveur..."
    pkill -f "next start.*3001"
    sleep 2
fi

# Vérifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Construire l'application si nécessaire
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
    echo "🔨 Construction de l'application..."
    npm run build
fi

# Démarrer le serveur en arrière-plan
echo "🚀 Démarrage du serveur Next.js..."
nohup npm run start > /tmp/block-app.log 2>&1 &

# Attendre que le serveur démarre
echo "⏳ Attente du démarrage du serveur..."
for i in {1..30}; do
    if curl -s "$URL" > /dev/null 2>&1; then
        echo "✅ Serveur démarré avec succès !"
        break
    fi
    echo "   Tentative $i/30..."
    sleep 1
done

# Attendre un peu plus pour s'assurer que le serveur est prêt
echo "🌐 Ouverture dans Google Chrome..."
sleep 3

# Forcer l'ouverture dans Google Chrome
echo "   Lancement de Google Chrome..."

# Vérifier si Chrome est installé
if ! command -v google-chrome > /dev/null; then
    echo "❌ ERREUR: Google Chrome n'est pas installé"
    echo "📥 Installez Google Chrome depuis: https://www.google.com/chrome/"
    echo "🌐 Ou ouvrez manuellement: $URL"
    exit 1
fi

# Tuer tous les processus Chrome existants pour éviter les conflits
echo "   Arrêt des processus Chrome existants..."
pkill -f "google-chrome" 2>/dev/null
sleep 2

# Lancer Chrome avec des options sûres et stables
echo "   Lancement de Chrome avec options optimisées..."
google-chrome \
    --disable-dev-shm-usage \
    --new-window \
    --window-size=1200,800 \
    --window-position=100,100 \
    "$URL" > /dev/null 2>&1 &

# Attendre que Chrome démarre
echo "   Attente du démarrage de Chrome..."
sleep 5

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
echo "📝 Logs: /tmp/block-app.log"
echo "🛑 Pour arrêter: pkill -f 'next start.*3001'"
echo ""
echo "💡 L'application est maintenant accessible dans Google Chrome"
echo "🌐 Si Chrome ne s'est pas ouvert, allez sur: $URL"
