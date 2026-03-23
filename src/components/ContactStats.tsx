'use client';

import React from 'react';
import { ProfessionalContact } from '../types/contacts';

interface ContactStatsProps {
  contacts: ProfessionalContact[];
}

export default function ContactStats({ contacts }: ContactStatsProps) {
  const stats = {
    total: contacts.length,
    withEmail: contacts.filter(c => c.email || c.email_reconstruit).length,
    withPhone: contacts.filter(c => c.telephone || c.telephone_mobile).length,
    fromForm: contacts.filter(c => c.source_donnees === 'formulaire_manuel').length,
    fromImport: contacts.filter(c => c.source_donnees === 'import_masse').length,
    verified: contacts.filter(c => c.statut === 'verifie').length
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        <div className="text-sm text-gray-600">Total</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-blue-600">{stats.withEmail}</div>
        <div className="text-sm text-gray-600">Avec email</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-green-600">{stats.withPhone}</div>
        <div className="text-sm text-gray-600">Avec téléphone</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-purple-600">{stats.fromForm}</div>
        <div className="text-sm text-gray-600">Via formulaire</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-orange-600">{stats.fromImport}</div>
        <div className="text-sm text-gray-600">Importés</div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-2xl font-bold text-indigo-600">{stats.verified}</div>
        <div className="text-sm text-gray-600">Vérifiés</div>
      </div>
    </div>
  );
}

