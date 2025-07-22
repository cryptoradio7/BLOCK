#!/bin/bash

# Définir le répertoire de base
BLOCK_DIR="/home/egx/Bureau/APPS/BLOCK"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Démarrage de l'application BLOCK...${NC}"

# Fonction pour arrêter tous les processus
cleanup() {
    echo -e "${YELLOW}🛑 Arrêt des processus...${NC}"
    pkill -f "next dev" 2>/dev/null
    pkill -f "node.*next.*3001" 2>/dev/null
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Aller dans le répertoire BLOCK
cd "$BLOCK_DIR"

# Vérifier si les dépendances sont installées
echo -e "${BLUE}📦 Vérification des dépendances...${NC}"

if [ ! -d "$BLOCK_DIR/node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
fi

# Vérifier si BLOCK est déjà en cours d'exécution
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ BLOCK déjà en cours d'exécution sur le port 3001${NC}"
    BLOCK_RUNNING=true
else
    echo -e "${GREEN}🔧 Démarrage de BLOCK...${NC}"
    npm run dev &
    BLOCK_PID=$!
    BLOCK_RUNNING=false
    
    # Attendre que BLOCK démarre
    echo -e "${BLUE}⏳ Attente du démarrage de BLOCK...${NC}"
    sleep 5

    # Vérifier si BLOCK est démarré
    if ! curl -s http://localhost:3001 > /dev/null; then
        echo -e "${YELLOW}⏳ BLOCK prend plus de temps à démarrer, attente supplémentaire...${NC}"
        sleep 5
    fi
fi

# Ouvrir le navigateur
echo -e "${GREEN}🌐 Ouverture du navigateur...${NC}"
sleep 2

# Essayer différents navigateurs
if command -v google-chrome &> /dev/null; then
    google-chrome http://localhost:3001 &
elif command -v firefox &> /dev/null; then
    firefox http://localhost:3001 &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser http://localhost:3001 &
else
    xdg-open http://localhost:3001 &
fi

echo -e "${GREEN}✅ Application BLOCK démarrée avec succès!${NC}"
echo -e "${BLUE}🎨 Interface: ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter l'application${NC}"

# Si le service était déjà en cours d'exécution, ne pas attendre
if [ "$BLOCK_RUNNING" = true ]; then
    echo -e "${BLUE}ℹ️  Le service était déjà en cours d'exécution. Appuyez sur Ctrl+C pour arrêter.${NC}"
    # Attendre indéfiniment
    while true; do
        sleep 1
    done
else
    # Attendre que le processus se termine
    wait
fi 