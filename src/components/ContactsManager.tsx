'use client';

import React, { useState, useEffect } from 'react';
import { ProfessionalContact, ContactFilters } from '../types/contacts';
import ContactList from './ContactList';
import ContactForm from './ContactForm';
import ContactFilters from './ContactFilters';
import ContactStats from './ContactStats';
import ImportContacts from './ImportContacts';

interface ContactsManagerProps {
  className?: string;
}

export default function ContactsManager({ className = '' }: ContactsManagerProps) {
  const [contacts, setContacts] = useState<ProfessionalContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<ProfessionalContact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [filters, setFilters] = useState<ContactFilters>({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Charger les contacts
  const fetchContacts = async (page = 1, newFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...newFilters
      });

      const response = await fetch(`/api/contacts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts);
        setPagination(data.pagination);
      } else {
        console.error('Erreur lors du chargement des contacts');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Créer un nouveau contact
  const createContact = async (contact: ProfessionalContact) => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });

      if (response.ok) {
        const newContact = await response.json();
        setContacts(prev => [newContact, ...prev]);
        setShowForm(false);
        return { success: true, contact: newContact };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: 'Erreur réseau' };
    }
  };

  // Mettre à jour un contact
  const updateContact = async (id: number, updates: Partial<ProfessionalContact>) => {
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedContact = await response.json();
        setContacts(prev => prev.map(c => c.id === id ? updatedContact : c));
        setSelectedContact(updatedContact);
        return { success: true, contact: updatedContact };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: 'Erreur réseau' };
    }
  };

  // Supprimer un contact
  const deleteContact = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return false;
    }

    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setContacts(prev => prev.filter(c => c.id !== id));
        if (selectedContact?.id === id) {
          setSelectedContact(null);
        }
        return true;
      } else {
        console.error('Erreur lors de la suppression');
        return false;
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      return false;
    }
  };

  // Reconstruire l'email d'un contact
  const reconstructEmail = async (id: number) => {
    try {
      const response = await fetch(`/api/contacts/${id}/reconstruct-email`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        setContacts(prev => prev.map(c => c.id === id ? result.contact : c));
        if (selectedContact?.id === id) {
          setSelectedContact(result.contact);
        }
        return { success: true, result };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: 'Erreur réseau' };
    }
  };

  // Rechercher le téléphone d'un contact
  const searchPhone = async (id: number) => {
    try {
      const response = await fetch(`/api/contacts/${id}/search-phone`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        setContacts(prev => prev.map(c => c.id === id ? result.contact : c));
        if (selectedContact?.id === id) {
          setSelectedContact(result.contact);
        }
        return { success: true, result };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      return { success: false, error: 'Erreur réseau' };
    }
  };

  // Envoyer un email à un contact
  const sendEmail = (contact: ProfessionalContact) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactsManager.tsx:sendEmail:entry',message:'Fonction sendEmail appelée',data:{contactId:contact.id,email:contact.email,emailReconstruit:contact.email_reconstruit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Déterminer l'adresse email à utiliser
    const emailAddress = contact.email || contact.email_reconstruit;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactsManager.tsx:sendEmail:emailCheck',message:'Vérification adresse email',data:{emailAddress,hasEmail:!!contact.email,hasEmailReconstruit:!!contact.email_reconstruit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (!emailAddress) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactsManager.tsx:sendEmail:noEmail',message:'Aucune adresse email disponible',data:{contactId:contact.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      alert('Aucune adresse email disponible pour ce contact');
      return;
    }
    
    // Construire le lien mailto
    const subject = encodeURIComponent(`Contact - ${contact.entreprise || 'BLOCK'}`);
    const body = encodeURIComponent(`Bonjour ${contact.prenom || contact.nom},\n\n`);
    const mailtoLink = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactsManager.tsx:sendEmail:mailtoLink',message:'Lien mailto créé',data:{mailtoLink,emailAddress,subject,bodyLength:body.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    try {
      // Ouvrir le client email
      window.location.href = mailtoLink;
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactsManager.tsx:sendEmail:windowLocation',message:'window.location.href appelé',data:{mailtoLink},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Afficher le message "envoyé" (mais ce n'est qu'une indication que le client email s'est ouvert)
      const messageDiv = document.createElement('div');
      messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ECC71;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      `;
      messageDiv.textContent = '📧 Email envoyé';
      document.body.appendChild(messageDiv);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactsManager.tsx:sendEmail:messageDisplayed',message:'Message envoyé affiché',data:{emailAddress},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      
      setTimeout(() => {
        if (document.body.contains(messageDiv)) {
          document.body.removeChild(messageDiv);
        }
      }, 3000);
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactsManager.tsx:sendEmail:success',message:'Fonction sendEmail terminée avec succès',data:{emailAddress},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/485b1759-96a2-4c35-aaf6-063ed38ff96c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ContactsManager.tsx:sendEmail:error',message:'Erreur lors de l\'envoi d\'email',data:{error:String(error),emailAddress},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.error('Erreur lors de l\'envoi d\'email:', error);
      alert('Erreur lors de l\'ouverture du client email');
    }
  };

  // Appliquer les filtres
  const applyFilters = (newFilters: ContactFilters) => {
    setFilters(newFilters);
    fetchContacts(1, newFilters);
  };

  // Changer de page
  const changePage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    fetchContacts(page, filters);
  };

  return (
    <div className={`contacts-manager ${className}`}>
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Base de Contacts Professionnels
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImport(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Importer
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Nouveau Contact
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <ContactStats contacts={contacts} />
      </div>

      {/* Filtres */}
      <ContactFilters
        filters={filters}
        onApplyFilters={applyFilters}
        className="mb-6"
      />

      {/* Contenu principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des contacts */}
        <div className="lg:col-span-2">
          <ContactList
            contacts={contacts}
            loading={loading}
            selectedContact={selectedContact}
            onSelectContact={setSelectedContact}
            onDeleteContact={deleteContact}
            onReconstructEmail={reconstructEmail}
            onSearchPhone={searchPhone}
            pagination={pagination}
            onPageChange={changePage}
          />
        </div>

        {/* Détails du contact sélectionné */}
        <div className="lg:col-span-1">
          {selectedContact ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Détails du Contact</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nom</label>
                  <p className="text-gray-900">{selectedContact.nom_complet || selectedContact.nom}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Entreprise</label>
                  <p className="text-gray-900">{selectedContact.entreprise}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Poste</label>
                  <p className="text-gray-900">{selectedContact.intitule_poste || 'Non spécifié'}</p>
                </div>
                {selectedContact.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedContact.email}</p>
                  </div>
                )}
                {selectedContact.email_reconstruit && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email Reconstruit</label>
                    <p className="text-gray-900">
                      {selectedContact.email_reconstruit}
                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        {selectedContact.confiance_email}% confiance
                      </span>
                    </p>
                  </div>
                )}
                {selectedContact.telephone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Téléphone</label>
                    <p className="text-gray-900">{selectedContact.telephone}</p>
                  </div>
                )}
                
                <div className="pt-4 space-y-2">
                  {(selectedContact.email || selectedContact.email_reconstruit) && (
                    <button
                      onClick={() => sendEmail(selectedContact)}
                      className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                      📧 Envoyer Email
                    </button>
                  )}
                  <button
                    onClick={() => reconstructEmail(selectedContact.id!)}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Reconstruire Email
                  </button>
                  <button
                    onClick={() => searchPhone(selectedContact.id!)}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Rechercher Téléphone
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
              Sélectionnez un contact pour voir les détails
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showForm && (
        <ContactForm
          contact={null}
          onSubmit={createContact}
          onClose={() => setShowForm(false)}
        />
      )}

      {showImport && (
        <ImportContacts
          onImportComplete={() => {
            setShowImport(false);
            fetchContacts();
          }}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}












