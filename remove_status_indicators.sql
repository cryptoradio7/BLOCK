-- Supprimer les indicateurs de statut de tous les contacts
UPDATE professional_contacts 
SET status_indicators = NULL
WHERE status_indicators IS NOT NULL;

-- Supprimer la colonne status_indicators de la table
ALTER TABLE professional_contacts 
DROP COLUMN IF EXISTS status_indicators;

-- Supprimer l'index associé
DROP INDEX IF EXISTS idx_professional_contacts_status_indicators;

