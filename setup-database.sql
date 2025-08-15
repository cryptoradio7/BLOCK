-- Script de configuration de la base de données BLOCK
-- Exécuter ce script pour créer toutes les tables nécessaires

-- Table des pages
CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des blocs
CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) DEFAULT 'text',
    title VARCHAR(255),
    content TEXT,
    x INTEGER DEFAULT 50,
    y INTEGER DEFAULT 50,
    width INTEGER DEFAULT 300,
    height INTEGER DEFAULT 200,
    page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des pièces jointes
CREATE TABLE IF NOT EXISTS block_attachments (
    id SERIAL PRIMARY KEY,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(100),
    size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
CREATE INDEX IF NOT EXISTS idx_blocks_page_id ON blocks(page_id);
CREATE INDEX IF NOT EXISTS idx_blocks_created_at ON blocks(created_at);
CREATE INDEX IF NOT EXISTS idx_pages_order_index ON pages(order_index);
CREATE INDEX IF NOT EXISTS idx_attachments_block_id ON block_attachments(block_id);
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

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_pages_updated_at 
    BEFORE UPDATE ON pages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at 
    BEFORE UPDATE ON blocks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_dimensions_updated_at 
    BEFORE UPDATE ON image_dimensions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer une page par défaut
INSERT INTO pages (title, order_index) 
VALUES ('Page 1', 1) 
ON CONFLICT DO NOTHING;

-- Commentaires pour documenter la structure
COMMENT ON TABLE pages IS 'Pages de l''application BLOCK';
COMMENT ON TABLE blocks IS 'Blocs de contenu dans les pages';
COMMENT ON TABLE block_attachments IS 'Pièces jointes des blocs';
COMMENT ON TABLE image_dimensions IS 'Stocke les dimensions et positions des images dans le contenu des blocs';
