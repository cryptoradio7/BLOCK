-- Script pour ajouter les colonnes width et height à la table blocks
-- Base de données: block_app

ALTER TABLE blocks 
ADD COLUMN width INTEGER DEFAULT 300,
ADD COLUMN height INTEGER DEFAULT 200;

-- Vérification que les colonnes ont été ajoutées
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'blocks' 
AND column_name IN ('width', 'height'); 