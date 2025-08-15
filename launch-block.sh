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
if [ ! -d ".next" ]; then
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

# Ouvrir le navigateur
echo "🌐 Ouverture du navigateur..."
sleep 2  # Attendre un peu plus pour s'assurer que le serveur est prêt

# Essayer plusieurs méthodes pour ouvrir le navigateur
if command -v google-chrome > /dev/null; then
    echo "   Tentative avec Google Chrome..."
    google-chrome "$URL" > /dev/null 2>&1 &
elif command -v chromium-browser > /dev/null; then
    echo "   Tentative avec Chromium..."
    chromium-browser "$URL" > /dev/null 2>&1 &
elif command -v firefox > /dev/null; then
    echo "   Tentative avec Firefox..."
    firefox "$URL" > /dev/null 2>&1 &
elif command -v xdg-open > /dev/null; then
    echo "   Tentative avec xdg-open..."
    xdg-open "$URL" > /dev/null 2>&1 &
elif command -v gnome-open > /dev/null; then
    echo "   Tentative avec gnome-open..."
    gnome-open "$URL" > /dev/null 2>&1 &
else
    echo "⚠️  Impossible d'ouvrir automatiquement le navigateur"
    echo "🌐 Ouvrez manuellement: $URL"
fi

# Attendre un peu pour que le navigateur s'ouvre
sleep 3

echo ""
echo "🎉 Application BLOCK lancée !"
echo "🔗 URL: $URL"
echo "📝 Logs: /tmp/block-app.log"
echo "🛑 Pour arrêter: pkill -f 'next start.*3001'"
echo ""
echo "💡 L'application est maintenant accessible dans votre navigateur"
