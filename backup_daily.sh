#!/bin/bash
# /home/egx/Bureau/backups/BLOCK/backup_daily.sh
# Sauvegarde quotidienne de la base de données block_app ET des images avec version Git

DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="block_app"
BACKUP_DB_DIR="/home/egx/Bureau/backups/BLOCK/databases"
BACKUP_IMAGES_DIR="/home/egx/Bureau/backups/BLOCK/images"
IMAGES_SOURCE="/home/egx/Bureau/APPS/block/public/uploads"
LOG_FILE="/home/egx/Bureau/backups/BLOCK/backup_daily.log"

# Récupérer la version Git actuelle
cd /home/egx/Bureau/APPS/block
GIT_VERSION=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git branch --show-current)

# Créer les dossiers s'ils n'existent pas
mkdir -p $BACKUP_DB_DIR
mkdir -p $BACKUP_IMAGES_DIR

# Début de la sauvegarde
echo "🚀 Début de la sauvegarde quotidienne..."
echo "📁 Dossier source images: $IMAGES_SOURCE"
echo "🗄️ Dossier destination DB: $BACKUP_DB_DIR"
echo "🖼️ Dossier destination images: $BACKUP_IMAGES_DIR"
echo ""

echo "[$(date)] Début de la sauvegarde quotidienne..." >> $LOG_FILE
echo "[$(date)] Version Git: $GIT_VERSION (branche: $GIT_BRANCH)" >> $LOG_FILE

# 1. SAUVEGARDE DE LA BASE DE DONNÉES
echo "🗄️ Sauvegarde de la base de données..."
echo "[$(date)] 🗄️ Sauvegarde de la base de données..." >> $LOG_FILE
pg_dump -U egx $DB_NAME > $BACKUP_DB_DIR/block_app_${DATE}_git-${GIT_VERSION}.sql

if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde DB réussie: block_app_${DATE}_git-${GIT_VERSION}.sql"
    echo "[$(date)] ✅ Sauvegarde DB réussie: block_app_${DATE}_git-${GIT_VERSION}.sql" >> $LOG_FILE
    
    # Garder seulement les 14 dernières sauvegardes DB
    ls -t $BACKUP_DB_DIR/block_app_*.sql | tail -n +15 | xargs rm -f 2>/dev/null
    
    # Compter le nombre de sauvegardes DB conservées
    DB_BACKUP_COUNT=$(ls $BACKUP_DB_DIR/block_app_*.sql 2>/dev/null | wc -l)
    echo "📊 $DB_BACKUP_COUNT sauvegardes DB conservées"
    echo "[$(date)] 📊 $DB_BACKUP_COUNT sauvegardes DB conservées" >> $LOG_FILE
else
    echo "❌ ERREUR: Échec de la sauvegarde DB"
    echo "[$(date)] ❌ ERREUR: Échec de la sauvegarde DB" >> $LOG_FILE
fi

# 2. SAUVEGARDE DES IMAGES
echo ""
echo "🖼️ Sauvegarde des images..."
echo "[$(date)] 🖼️ Sauvegarde des images..." >> $LOG_FILE

# Vérifier que le dossier source existe
if [ -d "$IMAGES_SOURCE" ]; then
    # Compter les images avant sauvegarde
    IMAGES_BEFORE=$(find "$BACKUP_IMAGES_DIR" -type f 2>/dev/null | wc -l)
    
    # Synchroniser les images avec rsync (supprime les images supprimées)
    echo "🔄 Synchronisation des images avec rsync..."
    rsync -av --delete "$IMAGES_SOURCE/" "$BACKUP_IMAGES_DIR/" >> $LOG_FILE 2>&1
    
    if [ $? -eq 0 ]; then
        # Compter le nombre d'images après sauvegarde
        IMAGES_AFTER=$(find "$BACKUP_IMAGES_DIR" -type f 2>/dev/null | wc -l)
        IMAGES_DIFF=$((IMAGES_AFTER - IMAGES_BEFORE))
        
        echo "✅ Sauvegarde images réussie: $IMAGES_AFTER images"
        if [ $IMAGES_DIFF -gt 0 ]; then
            echo "📈 Images ajoutées: +$IMAGES_DIFF"
        elif [ $IMAGES_DIFF -lt 0 ]; then
            echo "📉 Images supprimées: $IMAGES_DIFF"
        else
            echo "🔄 Aucun changement d'images"
        fi
        
        echo "[$(date)] ✅ Sauvegarde images réussie: $IMAGES_AFTER images" >> $LOG_FILE
        echo "[$(date)] 📊 Images synchronisées avec la source" >> $LOG_FILE
    else
        echo "❌ ERREUR: Échec de la sauvegarde des images"
        echo "[$(date)] ❌ ERREUR: Échec de la sauvegarde des images" >> $LOG_FILE
    fi
else
    echo "⚠️ ATTENTION: Dossier images source introuvable: $IMAGES_SOURCE"
    echo "[$(date)] ⚠️ ATTENTION: Dossier images source introuvable: $IMAGES_SOURCE" >> $LOG_FILE
fi

echo ""
echo "🎉 Fin de la sauvegarde quotidienne"
echo "[$(date)] Fin de la sauvegarde quotidienne" >> $LOG_FILE
echo "----------------------------------------" >> $LOG_FILE

