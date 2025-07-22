#!/bin/bash

# 🛑 Script d'arrêt BLOCK App
# Agile Vision - Gestionnaire de Pages et Blocs

APP_DIR="/home/egx/Bureau/APPS/BLOCK"
PID_FILE="$APP_DIR/block-app.pid"

# Fonction de notification
notify_user() {
    if command -v notify-send >/dev/null 2>&1; then
        notify-send "BLOCK App" "$1" --icon="$APP_DIR/blocks-icon.png" 2>/dev/null || true
    fi
    echo "$1"
}

notify_user "🛑 Arrêt de BLOCK App en cours..."

# Tuer les processus Next.js
pkill -f "next dev -p 3001" >/dev/null 2>&1 || true
pkill -f "node.*next.*3001" >/dev/null 2>&1 || true

# Tuer le processus principal si le fichier PID existe
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID" >/dev/null 2>&1 || true
    fi
    rm -f "$PID_FILE"
fi

# Vérifier que le port est libéré
sleep 2
if lsof -i :3001 >/dev/null 2>&1; then
    notify_user "⚠️ Le port 3001 est encore utilisé, force l'arrêt..."
    lsof -ti :3001 | xargs kill -9 >/dev/null 2>&1 || true
fi

notify_user "✅ BLOCK App arrêtée avec succès" 