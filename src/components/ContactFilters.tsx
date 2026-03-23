'use client';

import React, { useState } from 'react';
import { ContactFilters } from '../types/contacts';

interface ContactFiltersProps {
  filters: ContactFilters;
  onApplyFilters: (filters: ContactFilters) => void;
  className?: string;
}

export default function ContactFilters({ filters, onApplyFilters, className = '' }: ContactFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ContactFilters>(filters);

  const handleChange = (field: keyof ContactFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleReset = () => {
    const resetFilters: ContactFilters = {};
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex flex-wrap gap-4 items-end">
        {/* Pays */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pays
          </label>
          <select
            value={localFilters.pays || ''}
            onChange={(e) => handleChange('pays', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les pays</option>
            <option value="Luxembourg">Luxembourg</option>
            <option value="France">France</option>
            <option value="Belgique">Belgique</option>
            <option value="Allemagne">Allemagne</option>
          </select>
        </div>

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={localFilters.statut || ''}
            onChange={(e) => handleChange('statut', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="en_attente">En attente</option>
            <option value="verifie">Vérifié</option>
          </select>
        </div>

        {/* Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            value={localFilters.source_donnees || ''}
            onChange={(e) => handleChange('source_donnees', e.target.value || undefined)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les sources</option>
            <option value="formulaire_manuel">Formulaire</option>
            <option value="import_masse">Import</option>
          </select>
        </div>

        {/* Filtres booléens */}
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.has_email || false}
              onChange={(e) => handleChange('has_email', e.target.checked || undefined)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Avec email</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.has_telephone || false}
              onChange={(e) => handleChange('has_telephone', e.target.checked || undefined)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Avec téléphone</span>
          </label>
        </div>

        {/* Boutons */}
        <div className="flex space-x-2">
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Appliquer
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}

