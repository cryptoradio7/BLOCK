#!/bin/bash
# Script de lancement pour l'application BLOCK
# Usage: ./launch-block.sh [start|stop]

PROJECT_DIR="/home/egx/Bureau/APPS/BLOCK"
PORT=3001
URL="http://localhost:${PORT}"
LOG_FILE="/home/egx/Bureau/APPS/BLOCK/.cursor/debug.log"

# #region agent log
log_debug() {
  local hypothesis_id=$1
  local message=$2
  local data=$3
  local line_num=$(caller 0 | awk '{print $1}')
  echo "{\"id\":\"log_$(date +%s%N)\",\"timestamp\":$(date +%s%3N),\"location\":\"launch-block.sh:$line_num\",\"message\":\"$message\",\"data\":$data,\"sessionId\":\"debug-session\",\"runId\":\"run1\",\"hypothesisId\":\"$hypothesis_id\"}" >> "$LOG_FILE"
}
# #endregion

# #region agent log
log_debug "H1" "Script started" "{}"
# #endregion

# Fonction pour arrêter l'application
stop_app() {
    echo "🛑 Arrêt de BLOCK..."
    pkill -f "next.*3001" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    if command -v lsof > /dev/null 2>&1; then
        lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null
    fi
    echo "✅ BLOCK arrêté"
    exit 0
}

# Si l'argument est "stop", arrêter l'application
if [ "$1" = "stop" ]; then
    stop_app
fi

cd "$PROJECT_DIR" || exit 1

# Nettoyer le port 3001 - TUER TOUS les processus utilisant ce port
echo "🧹 Nettoyage du port $PORT..."
# #region agent log
log_debug "H2" "Cleaning port" "{\"port\":$PORT}"
# #endregion
pkill -f "next.*3001" 2>/dev/null
pkill -f "next dev" 2>/dev/null
if command -v lsof > /dev/null 2>&1; then
    pids=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$pids" ]; then
        # #region agent log
        log_debug "H2" "Killing ALL processes on port" "{\"port\":$PORT,\"pids\":\"$pids\"}"
        # #endregion
        # Tuer TOUS les processus utilisant le port, pas seulement Next.js
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 2
    fi
    # Vérifier à nouveau
    remaining_pids=$(lsof -ti:$PORT 2>/dev/null)
    if [ -n "$remaining_pids" ]; then
        # #region agent log
        log_debug "H2" "Port still in use, force killing" "{\"port\":$PORT,\"pids\":\"$remaining_pids\"}"
        # #endregion
        echo "$remaining_pids" | xargs kill -9 2>/dev/null
        sleep 1
    fi
    # #region agent log
    if lsof -ti:$PORT > /dev/null 2>&1; then
        log_debug "H2" "Port still in use after cleanup" "{\"port\":$PORT}"
    else
        log_debug "H2" "Port cleaned successfully" "{\"port\":$PORT}"
    fi
    # #endregion
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    # #region agent log
    log_debug "H1" "node_modules missing, installing" "{}"
    # #endregion
    npm install
    # #region agent log
    log_debug "H1" "npm install completed" "{}"
    # #endregion
fi

# Démarrer le serveur
echo "🚀 Démarrage sur le port $PORT..."
# #region agent log
log_debug "H1" "Starting npm run dev" "{\"port\":$PORT}"
# #endregion
nohup npm run dev > /tmp/block-app-dev.log 2>&1 &
NEXTJS_PID=$!
# #region agent log
log_debug "H1" "npm run dev started" "{\"pid\":$NEXTJS_PID}"
# #endregion
sleep 2
# #region agent log
if ps -p $NEXTJS_PID > /dev/null 2>&1; then
    log_debug "H3" "Next.js process still running" "{\"pid\":$NEXTJS_PID}"
else
    log_debug "H3" "Next.js process died immediately" "{\"pid\":$NEXTJS_PID}"
fi
# #endregion

# Attendre que le serveur soit prêt (vérifier que le port répond)
echo "⏳ Attente du démarrage du serveur..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    # Vérifier si le port est ouvert
    if command -v curl > /dev/null 2>&1; then
        if curl -s --max-time 2 "$URL" > /dev/null 2>&1; then
            echo ""
            echo "✅ Serveur prêt !"
            # #region agent log
            log_debug "H3" "Server ready via curl" "{\"waited\":$WAITED,\"port\":$PORT}"
            # #endregion
            break
        fi
    elif command -v nc > /dev/null 2>&1; then
        if nc -z -w 1 localhost $PORT 2>/dev/null; then
            echo ""
            echo "✅ Serveur prêt !"
            # #region agent log
            log_debug "H3" "Server ready via nc" "{\"waited\":$WAITED,\"port\":$PORT}"
            # #endregion
            break
        fi
    else
        # Fallback: attendre un délai fixe
        if [ $WAITED -eq 5 ]; then
            echo ""
            echo "✅ Serveur en cours de démarrage..."
            break
        fi
    fi
    # #region agent log
    if [ $((WAITED % 10)) -eq 0 ] && [ $WAITED -gt 0 ]; then
        log_debug "H3" "Still waiting for server" "{\"waited\":$WAITED,\"max_wait\":$MAX_WAIT}"
        # Vérifier si le processus Next.js tourne toujours
        if [ -n "$NEXTJS_PID" ] && ! ps -p $NEXTJS_PID > /dev/null 2>&1; then
            log_debug "H3" "Next.js process died" "{\"pid\":$NEXTJS_PID}"
        fi
    fi
    # #endregion
    sleep 1
    WAITED=$((WAITED + 1))
    if [ $((WAITED % 5)) -eq 0 ]; then
        echo -n "."
    fi
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠️  Le serveur met du temps à démarrer. Vérifiez les logs: /tmp/block-app-dev.log"
    # #region agent log
    log_debug "H3" "Server timeout" "{\"waited\":$WAITED,\"max_wait\":$MAX_WAIT}"
    # Vérifier les dernières lignes des logs
    if [ -f /tmp/block-app-dev.log ]; then
        last_logs=$(tail -5 /tmp/block-app-dev.log 2>/dev/null | tr '\n' ' ')
        log_debug "H3" "Last log lines" "{\"logs\":\"$last_logs\"}"
    fi
    # #endregion
fi

# Ouvrir l'application dans le navigateur avec une fenêtre dédiée à BLOCK
echo "🌐 Ouverture de l'application..."
# #region agent log
log_debug "H1" "Opening browser" "{\"url\":\"$URL\"}"
# #endregion
if command -v google-chrome > /dev/null; then
    # Ouvrir Chrome avec une fenêtre dédiée à BLOCK (user-data-dir séparé)
    google-chrome \
        --app="$URL" \
        --new-window \
        --user-data-dir="$HOME/.config/google-chrome-BLOCK" \
        --class="BLOCK" \
        "$URL" > /dev/null 2>&1 &
    # #region agent log
    log_debug "H1" "Chrome opened" "{\"url\":\"$URL\"}"
    # #endregion
elif command -v firefox > /dev/null; then
    # Ouvrir Firefox avec un profil séparé pour BLOCK
    firefox --new-window "$URL" > /dev/null 2>&1 &
    # #region agent log
    log_debug "H1" "Firefox opened" "{\"url\":\"$URL\"}"
    # #endregion
elif command -v xdg-open > /dev/null; then
    xdg-open "$URL" 2>/dev/null &
    # #region agent log
    log_debug "H1" "xdg-open used" "{\"url\":\"$URL\"}"
    # #endregion
else
    echo "⚠️  Ouvrez manuellement votre navigateur et allez sur: $URL"
    # #region agent log
    log_debug "H1" "No browser found" "{}"
    # #endregion
fi
echo "✅ Application BLOCK lancée: $URL"
# #region agent log
log_debug "H1" "Script completed" "{\"url\":\"$URL\"}"
# #endregion
