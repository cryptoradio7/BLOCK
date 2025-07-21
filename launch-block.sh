#!/bin/bash

# Définir le répertoire de base
BLOCK_DIR="/home/egx/Bureau/APPS/BLOCK"

# Icône de l'application
ICON="$BLOCK_DIR/blocks-icon.png"

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
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "node.*3001" 2>/dev/null
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Vérifier si le répertoire existe
if [ ! -d "$BLOCK_DIR" ]; then
    echo -e "${RED}❌ Répertoire BLOCK non trouvé: $BLOCK_DIR${NC}"
    exit 1
fi

# Aller dans le répertoire BLOCK
cd "$BLOCK_DIR"

# Vérifier si package.json existe
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json non trouvé dans $BLOCK_DIR${NC}"
    exit 1
fi

# Vérifier si les dépendances sont installées
echo -e "${BLUE}📦 Vérification des dépendances...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installation des dépendances...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erreur lors de l'installation des dépendances${NC}"
        exit 1
    fi
fi

# Vérifier si l'application est déjà en cours d'exécution
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application BLOCK déjà en cours d'exécution sur le port 3001${NC}"
    APP_RUNNING=true
else
    echo -e "${GREEN}🔧 Démarrage de l'application BLOCK...${NC}"
    
    # Démarrer l'application en arrière-plan
    npm run dev > /tmp/block-app.log 2>&1 &
    APP_PID=$!
    APP_RUNNING=false
    
    # Attendre que l'application démarre
    echo -e "${BLUE}⏳ Attente du démarrage de l'application...${NC}"
    sleep 8

    # Vérifier si l'application est démarrée
    if ! curl -s http://localhost:3001 > /dev/null; then
        echo -e "${YELLOW}⏳ L'application prend plus de temps à démarrer, attente supplémentaire...${NC}"
        sleep 5
        
        if ! curl -s http://localhost:3001 > /dev/null; then
            echo -e "${RED}❌ Erreur: L'application n'a pas pu démarrer${NC}"
            echo -e "${YELLOW}📋 Logs de l'application:${NC}"
            tail -20 /tmp/block-app.log
            exit 1
        fi
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
echo -e "${BLUE}🎨 Application: ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter l'application${NC}"

# Si l'application était déjà en cours d'exécution, ne pas attendre
if [ "$APP_RUNNING" = true ]; then
    echo -e "${BLUE}ℹ️  L'application était déjà en cours d'exécution.${NC}"
    # Attendre 5 secondes puis se fermer
    sleep 5
    exit 0
else
    # Attendre que le processus se termine
    wait $APP_PID
fi 