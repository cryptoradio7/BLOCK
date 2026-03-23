'use client';

import React, { useState } from 'react';

interface ImportContactsProps {
  onImportComplete: () => void;
  onClose: () => void;
}

export default function ImportContacts({ onImportComplete, onClose }: ImportContactsProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        onImportComplete();
      } else {
        setError(data.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/contacts/import/template');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_contacts.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Erreur lors du téléchargement du template');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Importer des Contacts
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-semibold">Import terminé !</h3>
              <p>{result.message}</p>
              {result.results && (
                <div className="mt-2 text-sm">
                  <p>• {result.results.imported} contacts importés</p>
                  <p>• {result.results.errors} erreurs</p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fichier CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format attendu : nom, entreprise, intitule_poste, email, telephone, site_web_entreprise
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Télécharger le template
              </button>
              
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Import en cours...' : 'Importer'}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Instructions
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Le fichier doit être au format CSV</li>
              <li>• La première ligne doit contenir les en-têtes</li>
              <li>• Les colonnes obligatoires : nom, entreprise</li>
              <li>• Les colonnes optionnelles : prenom, intitule_poste, email, telephone, site_web_entreprise, etc.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

