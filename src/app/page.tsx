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

  const loadPages = async () => {
    try {
      const response = await fetch('/api/pages')
      if (response.ok) {
        const pagesData = await response.json()
        setPages(pagesData)
        if (pagesData.length > 0 && !currentPageId) {
          setCurrentPageId(pagesData[0].id)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des pages:', error)
    } finally {
      setLoading(false)
    }
  }

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

  // Fonction dédiée pour sauvegarder le titre d'une page
  const updatePageTitle = async (pageId: string, newTitle: string) => {
    try {
      console.log('💾 Sauvegarde titre page:', { pageId, newTitle })
      
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
        console.log('✅ Titre de page sauvegardé:', newTitle)
        
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
      } else {
        console.log('✅ Ordre des pages sauvegardé')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la réorganisation des pages:', error)
      // En cas d'erreur, recharger les pages
      loadPages()
    }
  }

  const currentPage = pages.find(page => page.id === currentPageId)



  // Fonction d'export PDF - Version simplifiée qui fonctionne
  const handleExportPDF = async () => {
    console.log('📄 Export PDF en cours...')
    
    // Notification de début d'export
    const notification = document.createElement('div')
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,123,255,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `
    notification.textContent = '📄 Préparation du PDF...'
    document.body.appendChild(notification)
    
    try {
      // Méthode simple : utiliser l'impression du navigateur pour générer un PDF
      // L'utilisateur pourra choisir "Enregistrer en PDF" dans la boîte d'impression
      
      // Préparer le titre du document pour le PDF
      const originalTitle = document.title
      document.title = `BLOCK - ${currentPage?.title || 'Page'} - ${new Date().toLocaleDateString()}`
      
      // Ajouter des styles PDF optimisés
      const pdfStyles = document.createElement('style')
      pdfStyles.id = 'pdf-export-styles'
      pdfStyles.innerHTML = `
        @media print {
          @page { 
            margin: 1.5cm;
            size: A4;
          }
          
          body { 
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-family: 'Arial', sans-serif !important;
            font-size: 12pt !important;
            line-height: 1.4 !important;
          }
          
          .sidebar, .toolbar, .show-sidebar-button, .add-block-button,
          button, .react-resizable-handle, [title*="Supprimer"],
          .image-delete-button { 
            display: none !important; 
          }
          
          .main-content { 
            margin-left: 0 !important; 
            width: 100% !important;
            padding: 0 !important;
          }
          
          #block-canvas {
            position: static !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .draggable-block { 
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 0 15pt 0 !important;
            padding: 12pt !important;
            border: 1pt solid #ddd !important;
            border-radius: 3pt !important;
            page-break-inside: avoid;
            box-shadow: none !important;
            transform: none !important;
            display: block !important;
            background: white !important;
          }
          
          .draggable-block [contenteditable] {
            border: none !important;
            padding: 6pt !important;
            font-size: 11pt !important;
            line-height: 1.3 !important;
            background: transparent !important;
          }
          
          .draggable-block input[type="text"] {
            border: none !important;
            border-bottom: 1pt solid #999 !important;
            font-size: 13pt !important;
            font-weight: bold !important;
            margin-bottom: 8pt !important;
            background: transparent !important;
            color: #000 !important;
          }
          
          .draggable-block img {
            max-width: 100% !important;
            height: auto !important;
            page-break-inside: avoid;
            margin: 5pt 0 !important;
          }
          
          /* Titre de page en en-tête */
          #block-canvas::before {
            content: "${currentPage?.title || 'BLOCK - Page'} - ${new Date().toLocaleDateString('fr-FR')}";
            display: block;
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            margin-bottom: 20pt;
            padding-bottom: 10pt;
            border-bottom: 2pt solid #333;
            color: #333;
          }
        }
      `
      document.head.appendChild(pdfStyles)
      
      // Mettre à jour la notification
      notification.textContent = '🖨️ Cliquez sur "Enregistrer en PDF" dans la boîte d\'impression'
      notification.style.background = '#28a745'
      
      // Déclencher l'impression (l'utilisateur pourra choisir PDF)
      setTimeout(() => {
        window.print()
        
        // Nettoyer après impression
        setTimeout(() => {
          document.title = originalTitle
          const stylesElement = document.getElementById('pdf-export-styles')
          if (stylesElement) {
            document.head.removeChild(stylesElement)
          }
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 2000)
        
      }, 1000)
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export PDF:', error)
      notification.textContent = '❌ Erreur lors de la préparation PDF'
      notification.style.background = '#dc3545'
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 4000)
    }
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