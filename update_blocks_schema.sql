-- Mise à jour du schéma pour les blocs avec attachments

-- Table blocks (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),
  content TEXT,
  x INTEGER NOT NULL DEFAULT 0,
  y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 300,
  height INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table block_attachments (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS block_attachments (
  id SERIAL PRIMARY KEY,
  block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_blocks_created_at ON blocks(created_at);
CREATE INDEX IF NOT EXISTS idx_block_attachments_block_id ON block_attachments(block_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blocks_updated_at 
    BEFORE UPDATE ON blocks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 