'use client';

import React from 'react';
import { ProfessionalContact } from '../types/contacts';

interface ContactListProps {
  contacts: ProfessionalContact[];
  loading: boolean;
  selectedContact: ProfessionalContact | null;
  onSelectContact: (contact: ProfessionalContact) => void;
  onDeleteContact: (id: number) => Promise<boolean>;
  onReconstructEmail: (id: number) => Promise<{ success: boolean; error?: string }>;
  onSearchPhone: (id: number) => Promise<{ success: boolean; error?: string }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export default function ContactList({
  contacts,
  loading,
  selectedContact,
  onSelectContact,
  onDeleteContact,
  onReconstructEmail,
  onSearchPhone,
  pagination,
  onPageChange
}: ContactListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">Aucun contact trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Liste des contacts */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Contacts ({pagination.total})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => onSelectContact(contact)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {contact.nom_complet || `${contact.prenom || ''} ${contact.nom}`.trim()}
                      </h3>
                      <p className="text-sm text-gray-600">{contact.entreprise}</p>
                      {contact.intitule_poste && (
                        <p className="text-sm text-gray-500">{contact.intitule_poste}</p>
                      )}
                    </div>
                    
                    {/* Badge source */}
                    <div className="flex-shrink-0">
                      {contact.source_donnees === 'formulaire_manuel' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Formulaire
                        </span>
                      )}
                      {contact.source_donnees === 'import_masse' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Import
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Informations de contact */}
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                    {contact.email && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {contact.email}
                      </span>
                    )}
                    {contact.telephone && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {contact.telephone}
                      </span>
                    )}
                    {contact.site_web_entreprise && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        {contact.site_web_entreprise}
                      </span>
                    )}
                  </div>
                  
                </div>
                
                {/* Actions */}
                <div className="flex-shrink-0 ml-4">
                  <div className="flex space-x-2">
                    {contact.site_web_entreprise && !contact.email && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReconstructEmail(contact.id!);
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        title="Reconstruire l'email"
                      >
                        Email
                      </button>
                    )}
                    {!contact.telephone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSearchPhone(contact.id!);
                        }}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                        title="Rechercher le téléphone"
                      >
                        Tél
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
                          onDeleteContact(contact.id!);
                        }
                      }}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      title="Supprimer le contact"
                    >
                      Suppr
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} sur {pagination.totalPages} 
              ({pagination.total} contacts au total)
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              
              {[...Array(pagination.totalPages)].map((_, i) => {
                const page = i + 1;
                const isCurrentPage = page === pagination.page;
                const isNearCurrentPage = Math.abs(page - pagination.page) <= 2;
                
                if (!isNearCurrentPage && page !== 1 && page !== pagination.totalPages) {
                  return null;
                }
                
                if (!isNearCurrentPage && page === pagination.totalPages && pagination.page > 3) {
                  return (
                    <React.Fragment key={page}>
                      <span className="px-2 text-gray-500">...</span>
                      <button
                        onClick={() => onPageChange(page)}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      isCurrentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
