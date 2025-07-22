'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Toolbar from '@/components/Toolbar'
import { BlockCanvas } from '@/components/BlockCanvas'
import { DndProvider } from '@/components/DndProvider'
import { Page } from '@/types'

export default function Home() {
  const [pages, setPages] = useState<Page[]>([])
  const [currentPageId, setCurrentPageId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(true)

  // Charger les pages au démarrage
  useEffect(() => {
    loadPages()
  }, [])

  // Sauvegarder la page courante dans localStorage à chaque changement
  useEffect(() => {
    if (currentPageId) {
      localStorage.setItem('lastVisitedPageId', currentPageId)
      console.log('💾 Page sauvegardée:', currentPageId)
    }
  }, [currentPageId])

  const loadPages = async () => {
    try {
      const response = await fetch('/api/pages')
      if (response.ok) {
        const pagesData = await response.json()
        setPages(pagesData)
        
        if (pagesData.length > 0 && !currentPageId) {
          // ⚠️ FORCER LA PAGE PROJECT MANAGEMENT (id=2) où sont vos blocs
          console.log('🚨 Force navigation vers page PROJECT MANAGEMENT (id=2)')
          setCurrentPageId('2')
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentPage = pages.find(page => page.id === currentPageId)
  
  // Debug: Log de la page actuelle
  useEffect(() => {
    if (currentPageId && currentPage) {
      console.log('📄 Page active:', { id: currentPageId, title: currentPage.title });
    }
  }, [currentPageId, currentPage]);

  const addPage = async (title?: string) => {
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title || `Nouvelle page ${pages.length + 1}`
        })
      })

      if (response.ok) {
        const newPage = await response.json()
        setPages([...pages, newPage])
        setCurrentPageId(newPage.id)
      }
    } catch (error) {
      console.error('Erreur lors de la création de la page:', error)
    }
  }

  const deletePage = async (pageId: string) => {
    if (pages.length <= 1) return // Empêche de supprimer la dernière page
    
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedPages = pages.filter(page => page.id !== pageId)
        setPages(updatedPages)
        
        // Si la page supprimée était sélectionnée, sélectionner la première page
        if (currentPageId === pageId) {
          setCurrentPageId(updatedPages[0].id)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la page:', error)
    }
  }

  const updatePageTitle = async (pageId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle })
      })

      if (!response.ok) {
        console.error('❌ Erreur lors de la sauvegarde du titre de la page:', pageId)
        throw new Error('Erreur API')
      } else {
        // Mettre à jour l'état local
        setPages(prevPages => 
          prevPages.map(page => 
            page.id === pageId ? { ...page, title: newTitle } : page
          )
        )
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du titre:', error)
      // En cas d'erreur, recharger les pages
      loadPages()
    }
  }

  const reorderPages = async (reorderedPages: Page[]) => {
    try {
      // Vérifier s'il y a des changements de titre
      const titleChanges = reorderedPages.filter(newPage => {
        const oldPage = pages.find(p => p.id === newPage.id)
        return oldPage && oldPage.title !== newPage.title
      })

      // Mettre à jour l'état local immédiatement pour une réponse rapide
      setPages(reorderedPages)

      // Sauvegarder les changements de titre d'abord
      for (const changedPage of titleChanges) {
        await updatePageTitle(changedPage.id, changedPage.title)
      }
      
      // Puis sauvegarder l'ordre en base de données
      const pageIds = reorderedPages.map(page => page.id)
      const response = await fetch('/api/pages/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageIds })
      })

      if (!response.ok) {
        console.error('❌ Erreur lors de la sauvegarde de l\'ordre des pages')
        // En cas d'erreur, recharger les pages pour remettre l'ordre correct
        loadPages()
      }
    } catch (error) {
      console.error('❌ Erreur lors de la réorganisation des pages:', error)
      // En cas d'erreur, recharger les pages
      loadPages()
    }
  }

  // Fonction d'export PDF simplifiée
  const handleExportPDF = async () => {
    console.log('📄 Export PDF en cours...')
    window.print()
  }

  if (loading) {
    return <div className="app">Chargement...</div>
  }

  return (
    <DndProvider>
      <div className="app">
        <Sidebar 
          pages={pages} 
          currentPageId={currentPageId}
          onPageSelect={setCurrentPageId}
          onAddPage={addPage}
          onPagesReorder={reorderPages}
          onUpdatePageTitle={updatePageTitle}
          onDeletePage={deletePage}
          visible={sidebarVisible}
          onToggleVisibility={() => setSidebarVisible(!sidebarVisible)}
        />
        <div className={`main-content ${!sidebarVisible ? 'sidebar-hidden' : ''}`}>
          <Toolbar 
            onExportPDF={handleExportPDF}
          />
          
          {/* Bouton d'urgence pour voir les blocs */}
          {currentPageId !== '2' && (
            <div style={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              zIndex: 1000,
              backgroundColor: '#ff6b6b',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(255,107,107,0.4)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              <button
                onClick={() => {
                  console.log('🚨 Bouton urgence : navigation vers page PROJECT MANAGEMENT')
                  setCurrentPageId('2')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🚨 Voir mes blocs (PROJECT MANAGEMENT)
              </button>
            </div>
          )}
          
          {currentPage && (
            <BlockCanvas pageId={parseInt(currentPageId)} />
          )}
          {!sidebarVisible && (
            <button 
              className="show-sidebar-button"
              onClick={() => setSidebarVisible(true)}
              title="Afficher la sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    </DndProvider>
  )
} 