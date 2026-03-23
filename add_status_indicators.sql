-- Ajouter la colonne status_indicators à la table professional_contacts
ALTER TABLE professional_contacts 
ADD COLUMN IF NOT EXISTS status_indicators JSONB;

-- Créer un index pour les requêtes sur les indicateurs de statut
CREATE INDEX IF NOT EXISTS idx_professional_contacts_status_indicators 
ON professional_contacts USING GIN (status_indicators);

-- Mettre à jour les contacts existants créés via formulaire pour avoir des indicateurs par défaut
UPDATE professional_contacts 
SET status_indicators = '{"url_status": "unavailable", "dns_status": "unavailable", "mx_status": "unavailable"}'::jsonb
WHERE source_donnees = 'formulaire_manuel' 
AND status_indicators IS NULL;

