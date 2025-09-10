// Utilitaires pour la reconstruction automatique d'emails professionnels

import { ProfessionalContact, EmailPattern, EmailReconstructionResult } from '../types/contacts';

export class EmailReconstructor {
  private static commonPatterns = [
    'prenom.nom',
    'prenom_nom',
    'prenomnom',
    'nom.prenom',
    'nom_prenom',
    'nomprenom',
    'prenom.nom@',
    'prenom_nom@',
    'prenomnom@',
    'nom.prenom@',
    'nom_prenom@',
    'nomprenom@',
    'prenom.nom[0]',
    'prenom[0].nom',
    'nom[0].prenom',
    'prenom[0]nom',
    'nom[0]prenom'
  ];

  /**
   * Extrait le domaine email d'un site web d'entreprise
   */
  static extractDomainFromWebsite(website: string): string | null {
    if (!website) return null;
    
    try {
      // Nettoyer l'URL
      let cleanUrl = website.toLowerCase().trim();
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      const url = new URL(cleanUrl);
      return url.hostname.replace('www.', '');
    } catch (error) {
      console.error('Erreur extraction domaine:', error);
      return null;
    }
  }

  /**
   * Normalise un nom pour la génération d'email
   */
  static normalizeName(name: string): string {
    if (!name) return '';
    
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]/g, '') // Garder seulement lettres et chiffres
      .trim();
  }

  /**
   * Génère les variantes d'email possibles pour un contact
   */
  static generateEmailVariants(contact: ProfessionalContact, domain: string): string[] {
    const variants: string[] = [];
    
    if (!contact.nom || !domain) return variants;
    
    const nomNormalise = this.normalizeName(contact.nom);
    const prenomNormalise = contact.prenom ? this.normalizeName(contact.prenom) : '';
    
    // Patterns de base
    const patterns = [
      // Avec prénom
      prenomNormalise && nomNormalise ? `${prenomNormalise}.${nomNormalise}` : null,
      prenomNormalise && nomNormalise ? `${prenomNormalise}_${nomNormalise}` : null,
      prenomNormalise && nomNormalise ? `${prenomNormalise}${nomNormalise}` : null,
      
      // Avec initiales
      prenomNormalise && nomNormalise ? `${prenomNormalise[0]}.${nomNormalise}` : null,
      prenomNormalise && nomNormalise ? `${prenomNormalise}.${nomNormalise[0]}` : null,
      prenomNormalise && nomNormalise ? `${prenomNormalise[0]}${nomNormalise}` : null,
      
      // Nom seul (si pas de prénom)
      !prenomNormalise ? nomNormalise : null,
      
      // Nom avec initiale
      prenomNormalise && nomNormalise ? `${nomNormalise}.${prenomNormalise[0]}` : null,
      prenomNormalise && nomNormalise ? `${nomNormalise}${prenomNormalise[0]}` : null,
    ];
    
    // Filtrer les patterns valides et ajouter le domaine
    patterns
      .filter(pattern => pattern && pattern.length > 0)
      .forEach(pattern => {
        variants.push(`${pattern}@${domain}`);
      });
    
    return variants;
  }

  /**
   * Reconstruit l'email d'un contact en utilisant les patterns connus
   */
  static async reconstructEmail(
    contact: ProfessionalContact, 
    patterns: EmailPattern[]
  ): Promise<EmailReconstructionResult | null> {
    
    // Extraire le domaine de l'entreprise
    const domain = contact.site_web_entreprise 
      ? this.extractDomainFromWebsite(contact.site_web_entreprise)
      : null;
    
    if (!domain) {
      console.warn('Impossible d\'extraire le domaine pour:', contact.entreprise);
      return null;
    }
    
    // Chercher un pattern spécifique pour cette entreprise
    const specificPattern = patterns.find(p => 
      p.entreprise.toLowerCase().includes(contact.entreprise.toLowerCase()) ||
      contact.entreprise.toLowerCase().includes(p.entreprise.toLowerCase())
    );
    
    if (specificPattern) {
      // Utiliser le pattern spécifique
      const email = this.applyPattern(contact, specificPattern.pattern, domain);
      return {
        email,
        pattern_utilise: specificPattern.pattern,
        confiance: specificPattern.confiance_pattern || 70,
        domaine_entreprise: domain
      };
    }
    
    // Utiliser les patterns génériques
    const variants = this.generateEmailVariants(contact, domain);
    if (variants.length > 0) {
      return {
        email: variants[0], // Premier variant comme suggestion
        pattern_utilise: 'pattern_generique',
        confiance: 40, // Confiance plus faible pour les patterns génériques
        domaine_entreprise: domain
      };
    }
    
    return null;
  }

  /**
   * Applique un pattern spécifique à un contact
   */
  private static applyPattern(contact: ProfessionalContact, pattern: string, domain: string): string {
    const nomNormalise = this.normalizeName(contact.nom);
    const prenomNormalise = contact.prenom ? this.normalizeName(contact.prenom) : '';
    
    let email = pattern;
    
    // Remplacer les placeholders
    email = email.replace(/\{prenom\}/g, prenomNormalise);
    email = email.replace(/\{nom\}/g, nomNormalise);
    email = email.replace(/\{prenom\[0\]\}/g, prenomNormalise[0] || '');
    email = email.replace(/\{nom\[0\]\}/g, nomNormalise[0] || '');
    email = email.replace(/\{domaine\}/g, domain);
    
    // Patterns courants
    if (pattern === 'prenom.nom') {
      email = `${prenomNormalise}.${nomNormalise}@${domain}`;
    } else if (pattern === 'prenom_nom') {
      email = `${prenomNormalise}_${nomNormalise}@${domain}`;
    } else if (pattern === 'prenomnom') {
      email = `${prenomNormalise}${nomNormalise}@${domain}`;
    } else if (pattern === 'nom.prenom') {
      email = `${nomNormalise}.${prenomNormalise}@${domain}`;
    } else if (pattern === 'nom_prenom') {
      email = `${nomNormalise}_${prenomNormalise}@${domain}`;
    } else if (pattern === 'nomprenom') {
      email = `${nomNormalise}${prenomNormalise}@${domain}`;
    } else if (pattern === 'prenom[0].nom') {
      email = `${prenomNormalise[0]}.${nomNormalise}@${domain}`;
    } else if (pattern === 'nom[0].prenom') {
      email = `${nomNormalise[0]}.${prenomNormalise}@${domain}`;
    }
    
    return email;
  }

  /**
   * Valide un email en vérifiant sa syntaxe
   */
  static validateEmailSyntax(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Vérifie si un email existe en testant la connexion SMTP
   */
  static async verifyEmailExists(email: string): Promise<boolean> {
    // Note: Cette fonction nécessiterait une API externe ou un service SMTP
    // Pour l'instant, on retourne false pour éviter les faux positifs
    console.log('Vérification email:', email);
    return false;
  }

  /**
   * Calcule un score de confiance pour un email reconstruit
   */
  static calculateConfidence(
    contact: ProfessionalContact, 
    pattern: EmailPattern, 
    email: string
  ): number {
    let confidence = pattern.confiance_pattern || 50;
    
    // Bonus si on a un prénom
    if (contact.prenom) {
      confidence += 10;
    }
    
    // Bonus si le nom est court (moins de risque d'erreur)
    if (contact.nom && contact.nom.length <= 8) {
      confidence += 5;
    }
    
    // Bonus si le pattern a été vérifié avec succès
    if (pattern.nombre_verifications && pattern.nombre_succes) {
      const successRate = pattern.nombre_succes / pattern.nombre_verifications;
      confidence += Math.floor(successRate * 20);
    }
    
    // Malus si le nom contient des caractères spéciaux
    if (contact.nom && /[^a-zA-Z\s]/.test(contact.nom)) {
      confidence -= 10;
    }
    
    return Math.max(0, Math.min(100, confidence));
  }
}

// Fonctions utilitaires pour l'import de données
export const parseContactFromTable = (row: any): ProfessionalContact => {
  return {
    nom: row.nom || '',
    prenom: extractPrenom(row.nom || ''),
    entreprise: row.entreprise || '',
    intitule_poste: row.intitule_poste || '',
    taille_entreprise: row.taille_entreprise || '',
    site_web_entreprise: row.site_web_entreprise || '',
    linkedin_url: row.linkedin_url || '',
    pays: 'Luxembourg', // Par défaut
    tags: ['import_table']
  };
};

const extractPrenom = (nomComplet: string): string => {
  const parts = nomComplet.trim().split(' ');
  return parts.length > 1 ? parts[0] : '';
};












