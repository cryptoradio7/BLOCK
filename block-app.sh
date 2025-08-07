#!/bin/bash
APP_DIR="/home/egx/Bureau/APPS/BLOCK"
PORT="3001"
URL="http://localhost:$PORT"

cd "$APP_DIR" || exit 1

# Fonction pour nettoyer
cleanup() {
    pkill -f "npm run dev" 2>/dev/null
    rm -rf .next 2>/dev/null
}

# Vérifier si l'application tourne déjà
if ss -tlnp | grep -q ":$PORT"; then
    echo "BLOCK est déjà en cours d'exécution"
else
    echo "Lancement de BLOCK..."
    cleanup
    npm run dev > /dev/null 2>&1 &
    sleep 5  # Temps d'attente réduit
fi

# Ouvrir le navigateur
xdg-open "$URL" || {
    notify-send "BLOCK App" "Navigateur introuvable! Ouvrez manuellement: $URL"
    exit 1
}

exit 0 