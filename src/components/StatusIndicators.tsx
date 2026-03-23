'use client';

import React from 'react';
import { ProfessionalContact } from '../types/contacts';

interface StatusIndicatorsProps {
  contact: ProfessionalContact;
  className?: string;
}

export default function StatusIndicators({ contact, className = '' }: StatusIndicatorsProps) {
  // Ne pas afficher les indicateurs pour les contacts importés
  if (contact.source_donnees !== 'formulaire_manuel' || !contact.status_indicators) {
    return null;
  }

  const { url_status, dns_status, mx_status } = contact.status_indicators;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'unavailable':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      case 'checking':
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'unavailable':
        return 'Non disponible';
      case 'checking':
        return 'Vérification...';
      default:
        return 'Inconnu';
    }
  };


  return null;
}
