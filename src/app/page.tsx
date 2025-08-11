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
    } else {
      console.log('⚠️ Page non trouvée:', { currentPageId, pagesCount: pages.length });
    }
  }, [currentPageId, currentPage, pages]);

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

  // Fonction d'export PDF avec diagnostic complet des page_id
  const handleExportPDF = async () => {
    console.log('📄 Export PDF - DIAGNOSTIC COMPLET...')
    
    try {
      // Vérifier que currentPageId est défini
      if (!currentPageId) {
        alert('❌ Aucune page sélectionnée !')
        return
      }

      // 🔍 ÉTAPE 1: Récupérer les données des blocs depuis l'API
      const response = await fetch('/api/blocks')
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status} ${response.statusText}`)
      }
      
      const allBlocksData = await response.json()
      
      console.log(`📄 Page courante: ID="${currentPageId}" (type: ${typeof currentPageId}), Titre="${currentPage?.title}"`)
      console.log(`📦 Blocs API total: ${allBlocksData.length}`)
      
      // Vérifier que allBlocksData est un tableau
      if (!Array.isArray(allBlocksData)) {
        throw new Error('Les données reçues ne sont pas un tableau')
      }
      
      // 🔍 DIAGNOSTIC: Analyser TOUS les blocs avec leurs page_id
      console.log('\n🔍 DIAGNOSTIC COMPLET DE TOUS LES BLOCS:')
      allBlocksData.forEach((block: any, index: number) => {
        const preview = block.content ? block.content.substring(0, 50).replace(/<[^>]*>/g, '') : 'vide'
        const isCurrentPage = block.page_id === parseInt(currentPageId)
        const pageIdType = typeof block.page_id
        console.log(`${isCurrentPage ? '✅' : '❌'} BLOC ${index + 1}: page_id=${block.page_id} (${pageIdType}) | "${preview}..."`)
      })
      
      // 🔍 PROBLÈME POTENTIEL: Vérifier le bloc "git add., commit, push"
      const gitAddBlock = allBlocksData.find((block: any) => 
        block.content && block.content.includes('git add')
      )
      
      if (gitAddBlock) {
        console.log('\n🚨 BLOC PROBLÉMATIQUE TROUVÉ:')
        console.log(`  - ID: ${gitAddBlock.id}`)
        console.log(`  - page_id: ${gitAddBlock.page_id} (type: ${typeof gitAddBlock.page_id})`)
        console.log(`  - currentPageId: ${currentPageId} (type: ${typeof currentPageId})`)
        console.log(`  - Égalité stricte: ${gitAddBlock.page_id === parseInt(currentPageId)}`)
        console.log(`  - Contenu: "${gitAddBlock.content.substring(0, 100)}..."`)
      }
      
      // 🔍 ÉTAPE 2: Filtrer avec diagnostic
      const currentPageBlocksData = allBlocksData.filter((block: any) => {
        // Vérifier que block.page_id existe et est valide
        if (block.page_id === null || block.page_id === undefined) {
          console.log(`🚫 EXCLU: Bloc sans page_id, contenu="${block.content?.substring(0, 30)}..."`)
          return false
        }
        
        const isMatch = block.page_id === parseInt(currentPageId)
        if (!isMatch) {
          console.log(`🚫 EXCLU: Bloc page_id=${block.page_id}, contenu="${block.content?.substring(0, 30)}..."`)
        }
        return isMatch
      })
      
      console.log(`\n📋 Blocs APRÈS FILTRAGE: ${currentPageBlocksData.length}/${allBlocksData.length}`)
      
      if (currentPageBlocksData.length === 0) {
        alert(`❌ Aucun bloc sur la page "${currentPage?.title}" après filtrage !`)
        return
      }
      
      console.log('\n✅ BLOCS GARDÉS POUR IMPRESSION:')
      currentPageBlocksData.forEach((block: any, index: number) => {
        const preview = block.content ? block.content.substring(0, 50).replace(/<[^>]*>/g, '') : 'vide'
        console.log(`  ${index + 1}. "${preview}..." (page_id: ${block.page_id})`)
      })
      
      // 🔍 ÉTAPE 3: Masquer TOUS les blocs existants
      const allDOMBlocks = document.querySelectorAll('.draggable-block')
      allDOMBlocks.forEach((block: Element) => {
        const element = block as HTMLElement
        element.style.display = 'none'
      })
      console.log(`🙈 ${allDOMBlocks.length} blocs DOM masqués`)
      
      // Masquer aussi le canvas original
      const blockCanvas = document.getElementById('block-canvas')
      if (blockCanvas) {
        (blockCanvas as HTMLElement).style.display = 'none'
      }
      
      // 🔍 ÉTAPE 4: Créer un conteneur temporaire avec SEULEMENT les blocs de la page courante
      const printContainer = document.createElement('div')
      printContainer.id = 'print-only-container'
      printContainer.className = 'printing-active'
      
      // Ajouter le titre REPORTING et la date avec design professionnel
      const currentDate = new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      const headerDiv = document.createElement('div')
      headerDiv.style.cssText = `
        text-align: center;
        margin-bottom: 12pt;
        margin-left: -10pt;
        margin-right: -10pt;
        padding: 12pt 0;
        background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%);
        color: white;
        border-radius: 0;
        box-shadow: 0 6pt 20pt rgba(30, 58, 138, 0.4);
        font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
        position: relative;
        overflow: hidden;
      `
                headerDiv.innerHTML = `
            <div style="font-size: 28pt; font-weight: 800; margin-bottom: 8pt; text-shadow: 0 3pt 6pt rgba(0,0,0,0.4); letter-spacing: 1.5pt; text-transform: uppercase; font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif; position: relative; z-index: 2;">
              📊 REPORTING
            </div>
            <div style="font-size: 14pt; opacity: 0.95; font-weight: 500; text-shadow: 0 1pt 3pt rgba(0,0,0,0.3); letter-spacing: 0.5pt; font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif; position: relative; z-index: 2;">
              ${currentDate}
            </div>
          `
      printContainer.appendChild(headerDiv)
      
      // 🔍 ÉTAPE 5: Trier les blocs dans l'ordre spécifique pour l'impression
      const orderKeywords = [
        'SYNTHESE ECHANGE FABRICE MICHEAU',
        'REPONSE AUX QUESTIONS DE FABRICE', 
        'ACTIONS',
        'VIDEOS A VOIR'
      ]
      
      // Fonction pour déterminer l'ordre et le style d'un bloc
      const getBlockOrder = (block: any) => {
        const title = (block.title || '').toUpperCase()
        const content = (block.content || '').toUpperCase()
        const fullText = title + ' ' + content
        
        for (let i = 0; i < orderKeywords.length; i++) {
          if (fullText.includes(orderKeywords[i])) {
            return i
          }
        }
        return orderKeywords.length // Les autres blocs à la fin
      }
      
      // Fonction pour obtenir le style et l'icône selon le type de bloc
      const getBlockStyle = (block: any) => {
        const title = (block.title || '').toUpperCase()
        const content = (block.content || '').toUpperCase()
        const fullText = title + ' ' + content
        
        if (fullText.includes('SYNTHESE ECHANGE FABRICE MICHEAU')) {
          return {
            bgColor: '#1e3a8a',
            icon: '📋',
            label: 'SYNTHÈSE'
          }
        } else if (fullText.includes('REPONSE AUX QUESTIONS DE FABRICE')) {
          return {
            bgColor: '#059669',
            icon: '❓',
            label: 'QUESTIONS'
          }
        } else if (fullText.includes('ACTIONS')) {
          return {
            bgColor: '#374151',
            icon: '⚡',
            label: 'ACTIONS'
          }
        } else if (fullText.includes('VIDEOS A VOIR')) {
          return {
            bgColor: '#7c3aed',
            icon: '🎥',
            label: 'VIDÉOS'
          }
        } else {
          return {
            bgColor: '#374151',
            icon: '📝',
            label: 'AUTRE'
          }
        }
      }
      
      // Trier les blocs selon l'ordre spécifique
      const sortedBlocks = [...currentPageBlocksData].sort((a, b) => {
        const orderA = getBlockOrder(a)
        const orderB = getBlockOrder(b)
        return orderA - orderB
      })
      
      console.log('\n📋 BLOCS TRIÉS POUR IMPRESSION:')
      sortedBlocks.forEach((block: any, index: number) => {
        const order = getBlockOrder(block)
        const preview = block.title || block.content?.substring(0, 30) || 'vide'
        console.log(`  ${index + 1}. [Ordre ${order}] "${preview}..."`)
      })
      
      // Générer le HTML des blocs triés avec couleurs et icônes
      sortedBlocks.forEach((block: any, index: number) => {
        const blockStyle = getBlockStyle(block)
        const blockDiv = document.createElement('div')
        blockDiv.className = 'draggable-block print-block'
        blockDiv.style.cssText = `
          margin-bottom: 20pt;
          margin-left: 0;
          margin-right: 0;
          border-radius: 0;
          overflow: hidden;
          box-shadow: 0 4pt 12pt rgba(0,0,0,0.08);
          border: 1pt solid #e2e8f0;
          background: white;
          page-break-inside: avoid;
          break-inside: avoid;
          width: 100%;
          page-break-after: auto;
        `
        blockDiv.innerHTML = `
          <div style="
            background-color: ${blockStyle.bgColor};
            color: white;
            font-weight: 600;
            padding: 6pt 0;
            font-size: 11pt;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            display: flex;
            align-items: center;
            gap: 8pt;
            border-radius: 0;
            box-shadow: 0 2pt 4pt rgba(0,0,0,0.2);
            font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
          ">
            <span style="font-size: 14pt;">${blockStyle.icon}</span>
            <span style="font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;">${block.title || `Bloc ${index + 1}`}</span>
          </div>
          <div style="
            min-height: auto;
            line-height: 1.4;
            font-size: 9pt;
            padding: 8pt 0;
            background: white;
            color: #374151;
            font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif;
            font-weight: 400;
            border-radius: 0;
          ">
            ${block.content || 'Contenu vide'}
          </div>
        `
        printContainer.appendChild(blockDiv)
        
        // Si c'est le dernier bloc, ne pas forcer le saut de page
        if (index === sortedBlocks.length - 1) {
          blockDiv.style.pageBreakAfter = 'auto'
        }
      })
      
      // Nettoyer les espaces vides dans le conteneur
      const emptyElements = printContainer.querySelectorAll('div:empty')
      emptyElements.forEach(el => el.remove())
      
      // 🔍 ÉTAPE 6: Injecter dans le body en haut
      printContainer.style.position = 'static'
      printContainer.style.top = '0'
      printContainer.style.left = '0'
      printContainer.style.margin = '0'
      printContainer.style.padding = '0' // ZÉRO padding pour largeur 100%
      printContainer.style.height = 'auto'
      printContainer.style.minHeight = 'auto'
      printContainer.style.width = '100%' // Forcer la largeur maximale
      printContainer.style.background = '#e2e8f0' // Fond gris plus foncé
      printContainer.style.backgroundColor = '#e2e8f0' // Forcer la couleur de fond
      
      // Forcer aussi le fond sur le body et html
      document.body.style.background = '#e2e8f0'
      document.documentElement.style.background = '#e2e8f0'
      document.body.insertBefore(printContainer, document.body.firstChild)
      
      // 🔍 ÉTAPE 7: Appliquer les styles print
      document.body.classList.add('printing')
      await new Promise(resolve => setTimeout(resolve, 300))
      
      console.log(`🖨️ IMPRESSION: ${currentPageBlocksData.length} blocs propres prêts !`)
      window.print()
      
      // 🔍 ÉTAPE 8: Nettoyer après impression
      setTimeout(() => {
        // Supprimer le conteneur temporaire
        const container = document.getElementById('print-only-container')
        if (container) {
          container.remove()
        }
        
        // Nettoyer tous les éléments temporaires d'impression
        const printElements = document.querySelectorAll('.print-block, .printing-active')
        printElements.forEach(el => el.remove())
        
        // Restaurer les blocs originaux
        allDOMBlocks.forEach((block: Element) => {
          const element = block as HTMLElement
          element.style.display = ''
        })
        
        // Restaurer le canvas original
        if (blockCanvas) {
          (blockCanvas as HTMLElement).style.display = ''
        }
        
        document.body.classList.remove('printing')
        console.log('✅ Impression terminée, DOM restauré')
      }, 1000)
      
    } catch (error) {
      console.error('❌ Erreur export PDF:', error)
      
      // Afficher un message d'erreur plus détaillé
      let errorMessage = '❌ Erreur lors de l\'export PDF.'
      if (error instanceof Error) {
        errorMessage += ` Détails: ${error.message}`
      }
      
      alert(errorMessage)
      
      // Nettoyer en cas d'erreur
      try {
        const container = document.getElementById('print-only-container')
        if (container) {
          container.remove()
        }
        
        const allDOMBlocks = document.querySelectorAll('.draggable-block')
        allDOMBlocks.forEach((block: Element) => {
          const element = block as HTMLElement
          element.style.display = ''
        })
        
        const blockCanvas = document.getElementById('block-canvas')
        if (blockCanvas) {
          (blockCanvas as HTMLElement).style.display = ''
        }
        
        document.body.classList.remove('printing')
      } catch (cleanupError) {
        console.error('❌ Erreur lors du nettoyage:', cleanupError)
      }
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
          {!currentPage && (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p>Page non trouvée: {currentPageId}</p>
              <p>Pages disponibles: {pages.map(p => p.id).join(', ')}</p>
            </div>
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