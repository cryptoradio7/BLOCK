// Utilitaires pour la recherche automatique de numéros de téléphone

import { ProfessionalContact, PhoneSearchResult } from '../types/contacts';

export class PhoneSearcher {
  private static searchServices = [
    {
      name: 'Yellow Pages Luxembourg',
      url: 'https://www.yellowpages.lu',
      country: 'Luxembourg',
      active: true
    },
    {
      name: 'Yellow Pages Switzerland',
      url: 'https://www.yellowpages.ch',
      country: 'Switzerland',
      active: true
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com',
      country: 'both',
      active: true
    },
    {
      name: 'Company Website',
      url: '',
      country: 'both',
      active: true
    },
    {
      name: 'Google Search',
      url: 'https://www.google.com',
      country: 'both',
      active: true
    }
  ];

  /**
   * Recherche le numéro de téléphone d'un contact
   */
  static async searchPhoneNumber(contact: ProfessionalContact): Promise<PhoneSearchResult[]> {
    const results: PhoneSearchResult[] = [];
    
    // Recherche sur le site web de l'entreprise
    if (contact.site_web_entreprise) {
      const companyResult = await this.searchOnCompanyWebsite(contact);
      if (companyResult) {
        results.push(companyResult);
      }
    }
    
    // Recherche sur LinkedIn
    if (contact.linkedin_url) {
      const linkedinResult = await this.searchOnLinkedIn(contact);
      if (linkedinResult) {
        results.push(linkedinResult);
      }
    }
    
    // Recherche sur les pages jaunes
    const yellowPagesResult = await this.searchOnYellowPages(contact);
    if (yellowPagesResult) {
      results.push(yellowPagesResult);
    }
    
    // Recherche Google
    const googleResult = await this.searchOnGoogle(contact);
    if (googleResult) {
      results.push(googleResult);
    }
    
    return results;
  }

  /**
   * Recherche sur le site web de l'entreprise
   */
  private static async searchOnCompanyWebsite(contact: ProfessionalContact): Promise<PhoneSearchResult | null> {
    try {
      if (!contact.site_web_entreprise) return null;
      
      // Note: Cette fonction nécessiterait un service de scraping
      // Pour l'instant, on simule la recherche
      console.log('Recherche sur le site web:', contact.site_web_entreprise);
      
      return {
        telephone: undefined, // À implémenter avec un service de scraping
        service_utilise: 'Company Website',
        source_url: contact.site_web_entreprise,
        confiance: 60
      };
    } catch (error) {
      console.error('Erreur recherche site web:', error);
      return null;
    }
  }

  /**
   * Recherche sur LinkedIn
   */
  private static async searchOnLinkedIn(contact: ProfessionalContact): Promise<PhoneSearchResult | null> {
    try {
      if (!contact.linkedin_url) return null;
      
      // Note: LinkedIn nécessite une API ou un scraping spécialisé
      console.log('Recherche sur LinkedIn:', contact.linkedin_url);
      
      return {
        telephone: undefined, // À implémenter avec l'API LinkedIn
        service_utilise: 'LinkedIn',
        source_url: contact.linkedin_url,
        confiance: 70
      };
    } catch (error) {
      console.error('Erreur recherche LinkedIn:', error);
      return null;
    }
  }

  /**
   * Recherche sur les pages jaunes
   */
  private static async searchOnYellowPages(contact: ProfessionalContact): Promise<PhoneSearchResult | null> {
    try {
      const country = contact.pays || 'Luxembourg';
      const service = this.searchServices.find(s => 
        s.country === country || s.country === 'both'
      );
      
      if (!service) return null;
      
      // Construire la requête de recherche
      const searchQuery = this.buildSearchQuery(contact);
      const searchUrl = `${service.url}/search?q=${encodeURIComponent(searchQuery)}`;
      
      console.log('Recherche pages jaunes:', searchUrl);
      
      return {
        telephone: undefined, // À implémenter avec un service de scraping
        service_utilise: service.name,
        source_url: searchUrl,
        confiance: 50
      };
    } catch (error) {
      console.error('Erreur recherche pages jaunes:', error);
      return null;
    }
  }

  /**
   * Recherche sur Google
   */
  private static async searchOnGoogle(contact: ProfessionalContact): Promise<PhoneSearchResult | null> {
    try {
      const searchQuery = this.buildGoogleSearchQuery(contact);
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      console.log('Recherche Google:', searchUrl);
      
      return {
        telephone: undefined, // À implémenter avec un service de scraping
        service_utilise: 'Google Search',
        source_url: searchUrl,
        confiance: 40
      };
    } catch (error) {
      console.error('Erreur recherche Google:', error);
      return null;
    }
  }

  /**
   * Construit une requête de recherche pour les pages jaunes
   */
  private static buildSearchQuery(contact: ProfessionalContact): string {
    const parts: string[] = [];
    
    if (contact.nom) {
      parts.push(contact.nom);
    }
    
    if (contact.entreprise) {
      parts.push(contact.entreprise);
    }
    
    if (contact.ville) {
      parts.push(contact.ville);
    }
    
    return parts.join(' ');
  }

  /**
   * Construit une requête de recherche Google
   */
  private static buildGoogleSearchQuery(contact: ProfessionalContact): string {
    const parts: string[] = [];
    
    if (contact.nom) {
      parts.push(`"${contact.nom}"`);
    }
    
    if (contact.entreprise) {
      parts.push(contact.entreprise);
    }
    
    // Ajouter des mots-clés pour la recherche de téléphone
    parts.push('téléphone', 'phone', 'contact');
    
    if (contact.pays) {
      parts.push(contact.pays);
    }
    
    return parts.join(' ');
  }

  /**
   * Valide un numéro de téléphone
   */
  static validatePhoneNumber(phone: string): boolean {
    if (!phone) return false;
    
    // Nettoyer le numéro
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // Formats acceptés pour Luxembourg et Suisse
    const luxembourgPattern = /^(\+352|352)?[0-9]{8}$/;
    const switzerlandPattern = /^(\+41|41)?[0-9]{9}$/;
    
    return luxembourgPattern.test(cleanPhone) || switzerlandPattern.test(cleanPhone);
  }

  /**
   * Formate un numéro de téléphone
   */
  static formatPhoneNumber(phone: string, country: string = 'Luxembourg'): string {
    if (!phone) return '';
    
    // Nettoyer le numéro
    let cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // Ajouter le préfixe pays si nécessaire
    if (country === 'Luxembourg' && !cleanPhone.startsWith('352') && !cleanPhone.startsWith('+352')) {
      cleanPhone = '+352' + cleanPhone;
    } else if (country === 'Switzerland' && !cleanPhone.startsWith('41') && !cleanPhone.startsWith('+41')) {
      cleanPhone = '+41' + cleanPhone;
    }
    
    // Formater selon le pays
    if (country === 'Luxembourg') {
      // Format: +352 XX XX XX XX
      return cleanPhone.replace(/(\+352)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    } else if (country === 'Switzerland') {
      // Format: +41 XX XXX XX XX
      return cleanPhone.replace(/(\+41)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    
    return cleanPhone;
  }

  /**
   * Extrait les numéros de téléphone d'un texte
   */
  static extractPhoneNumbers(text: string): string[] {
    const phonePatterns = [
      // Luxembourg: +352 XX XX XX XX ou 352 XX XX XX XX
      /(\+352|352)\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}/g,
      // Suisse: +41 XX XXX XX XX ou 41 XX XXX XX XX
      /(\+41|41)\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}/g,
      // Formats génériques
      /(\+?\d{1,3})\s*[\-\(]?\d{1,4}[\)\s\-]?\d{1,4}[\)\s\-]?\d{1,4}/g
    ];
    
    const phones: string[] = [];
    
    phonePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phones.push(...matches);
      }
    });
    
    return [...new Set(phones)]; // Supprimer les doublons
  }

  /**
   * Calcule un score de confiance pour un numéro de téléphone trouvé
   */
  static calculatePhoneConfidence(
    contact: ProfessionalContact,
    phone: string,
    source: string
  ): number {
    let confidence = 30; // Confiance de base
    
    // Bonus selon la source
    switch (source) {
      case 'Company Website':
        confidence += 30;
        break;
      case 'LinkedIn':
        confidence += 25;
        break;
      case 'Yellow Pages Luxembourg':
      case 'Yellow Pages Switzerland':
        confidence += 20;
        break;
      case 'Google Search':
        confidence += 15;
        break;
    }
    
    // Bonus si le numéro est valide
    if (this.validatePhoneNumber(phone)) {
      confidence += 20;
    }
    
    // Bonus si on a des informations complètes sur le contact
    if (contact.nom && contact.entreprise && contact.ville) {
      confidence += 15;
    }
    
    return Math.min(100, confidence);
  }
}

// Services de recherche de téléphones disponibles
export const phoneSearchServices = {
  // Service de scraping web (nécessiterait une API externe)
  async scrapeWebsite(url: string): Promise<string | null> {
    // Implémentation avec un service comme ScrapingBee, ScraperAPI, etc.
    console.log('Scraping website:', url);
    return null;
  },
  
  // Service de recherche d'API (nécessiterait des clés API)
  async searchWithAPI(query: string, service: string): Promise<string | null> {
    // Implémentation avec des APIs comme Google Custom Search, etc.
    console.log('API search:', service, query);
    return null;
  }
};


