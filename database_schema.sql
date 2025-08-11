-- Structure de base de données pour BLOCK avec gestion des dimensions d'images
-- Ce fichier doit être exécuté pour mettre à jour votre base de données

-- Table pour stocker les dimensions des images dans le contenu des blocs
CREATE TABLE IF NOT EXISTS image_dimensions (
    id SERIAL PRIMARY KEY,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    attachment_id INTEGER REFERENCES block_attachments(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_name TEXT NOT NULL,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    original_width INTEGER,
    original_height INTEGER,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte d'unicité pour éviter les doublons
    UNIQUE(block_id, image_url)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_image_dimensions_block_id ON image_dimensions(block_id);
CREATE INDEX IF NOT EXISTS idx_image_dimensions_attachment_id ON image_dimensions(attachment_id);
CREATE INDEX IF NOT EXISTS idx_image_dimensions_url ON image_dimensions(image_url);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_image_dimensions_updated_at 
    BEFORE UPDATE ON image_dimensions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documenter la structure
COMMENT ON TABLE image_dimensions IS 'Stocke les dimensions et positions des images dans le contenu des blocs';
COMMENT ON COLUMN image_dimensions.block_id IS 'ID du bloc contenant l''image';
COMMENT ON COLUMN image_dimensions.attachment_id IS 'ID de l''attachment si l''image provient des pièces jointes';
COMMENT ON COLUMN image_dimensions.image_url IS 'URL de l''image (chemin relatif)';
COMMENT ON COLUMN image_dimensions.image_name IS 'Nom original du fichier image';
COMMENT ON COLUMN image_dimensions.width IS 'Largeur actuelle de l''image en pixels';
COMMENT ON COLUMN image_dimensions.height IS 'Hauteur actuelle de l''image en pixels';
COMMENT ON COLUMN image_dimensions.original_width IS 'Largeur originale de l''image';
COMMENT ON COLUMN image_dimensions.original_height IS 'Hauteur originale de l''image';
COMMENT ON COLUMN image_dimensions.position_x IS 'Position X relative dans le bloc';
COMMENT ON COLUMN image_dimensions.position_y IS 'Position Y relative dans le bloc';
