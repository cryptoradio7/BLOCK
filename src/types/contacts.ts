// Types pour la gestion des contacts professionnels Luxembourg/Suisse

export interface ProfessionalContact {
  id?: number;
  nom: string;
  prenom?: string;
  nom_complet?: string;
  entreprise: string;
  intitule_poste?: string;
  pays?: string;
  region?: string;
  ville?: string;
  code_postal?: string;
  adresse?: string;
  
  // Informations de contact
  email?: string;
  email_reconstruit?: string;
  telephone?: string;
  telephone_mobile?: string;
  linkedin_url?: string;
  site_web_entreprise?: string;
  
  // Informations sur l'entreprise
  taille_entreprise?: string;
  secteur_activite?: string;
  description_entreprise?: string;
  
  // Métadonnées
  source_donnees?: string;
  confiance_email?: number;
  confiance_telephone?: number;
  notes?: string;
  tags?: string[];
  
  // Statut et validation
  statut?: 'actif' | 'inactif' | 'en_attente' | 'verifie';
  date_derniere_verification?: string;
  verifie_par?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface EmailReconstructionAttempt {
  id?: number;
  contact_id: number;
  pattern_utilise: string;
  email_tente: string;
  resultat: 'succes' | 'echec' | 'en_cours';
  date_tentative?: string;
  reponse_serveur?: string;
  notes?: string;
}

export interface PhoneSearchAttempt {
  id?: number;
  contact_id: number;
  service_utilise: string;
  telephone_trouve?: string;
  resultat: 'succes' | 'echec' | 'en_cours';
  date_recherche?: string;
  source_url?: string;
  notes?: string;
}

export interface EmailPattern {
  id?: number;
  entreprise: string;
  domaine_email: string;
  pattern: string;
  exemple_email?: string;
  confiance_pattern?: number;
  nombre_verifications?: number;
  nombre_succes?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContactFilters {
  pays?: string;
  entreprise?: string;
  statut?: string;
  tags?: string[];
  has_email?: boolean;
  has_telephone?: boolean;
  confiance_min?: number;
  date_from?: string;
  date_to?: string;
}

export interface ContactSearchParams {
  query?: string;
  filters?: ContactFilters;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ContactImportData {
  nom: string;
  entreprise: string;
  intitule_poste?: string;
  taille_entreprise?: string;
  site_web_entreprise?: string;
  linkedin_url?: string;
  pays?: string;
  tags?: string[];
}

export interface EmailReconstructionResult {
  email: string;
  pattern_utilise: string;
  confiance: number;
  domaine_entreprise: string;
}

export interface PhoneSearchResult {
  telephone?: string;
  service_utilise: string;
  source_url?: string;
  confiance: number;
}

// Types pour les statistiques
export interface ContactStats {
  total_contacts: number;
  contacts_avec_email: number;
  contacts_avec_telephone: number;
  contacts_verifies: number;
  repartition_pays: Record<string, number>;
  repartition_entreprises: Record<string, number>;
  taux_reussite_emails: number;
  taux_reussite_telephones: number;
}

// Types pour les services de recherche
export interface PhoneSearchService {
  name: string;
  url: string;
  description: string;
  active: boolean;
  rate_limit?: number;
}

export interface EmailValidationService {
  name: string;
  endpoint: string;
  api_key_required: boolean;
  active: boolean;
}


