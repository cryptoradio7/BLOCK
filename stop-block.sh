#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Arrêt de l'application BLOCK...${NC}"

# Fonction pour arrêter les processus BLOCK
stop_block_processes() {
    local found=false
    
    # Chercher les processus liés à BLOCK
    if pgrep -f "next dev.*3001" > /dev/null; then
        echo -e "${YELLOW}📍 Arrêt du serveur Next.js BLOCK...${NC}"
        pkill -f "next dev.*3001"
        found=true
    fi
    
    if pgrep -f "npm run dev" > /dev/null; then
        echo -e "${YELLOW}📍 Arrêt des processus npm...${NC}"
        pkill -f "npm run dev"
        found=true
    fi
    
    if pgrep -f "node.*BLOCK" > /dev/null; then
        echo -e "${YELLOW}📍 Arrêt des processus Node.js BLOCK...${NC}"
        pkill -f "node.*BLOCK"
        found=true
    fi
    
    # Vérifier spécifiquement le port 3001
    local port_process=$(lsof -ti:3001 2>/dev/null)
    if [ ! -z "$port_process" ]; then
        echo -e "${YELLOW}📍 Libération du port 3001...${NC}"
        kill -9 $port_process 2>/dev/null
        found=true
    fi
    
    return $found
}

# Arrêter les processus
if stop_block_processes; then
    sleep 2
    
    # Vérifier si l'application est vraiment arrêtée
    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${RED}⚠️  L'application semble toujours fonctionner${NC}"
        echo -e "${YELLOW}🔄 Tentative d'arrêt forcé...${NC}"
        
        # Arrêt forcé
        sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null
        sleep 1
        
        if curl -s http://localhost:3001 > /dev/null 2>&1; then
            echo -e "${RED}❌ Impossible d'arrêter l'application${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ Application BLOCK arrêtée avec succès (arrêt forcé)${NC}"
        fi
    else
        echo -e "${GREEN}✅ Application BLOCK arrêtée avec succès${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  Aucun processus BLOCK en cours d'exécution${NC}"
fi

# Nettoyer les fichiers temporaires
if [ -f "/tmp/block-app.log" ]; then
    rm -f /tmp/block-app.log
    echo -e "${BLUE}🧹 Fichiers temporaires nettoyés${NC}"
fi

echo -e "${GREEN}🎯 Terminé!${NC}" 