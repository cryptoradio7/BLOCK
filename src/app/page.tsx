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

  // Fonction d'export PDF avec diagnostic complet des page_id
  const handleExportPDF = async () => {
    console.log('📄 Export PDF - DIAGNOSTIC COMPLET...')
    
    try {
      // 🔍 ÉTAPE 1: Récupérer les données des blocs depuis l'API
      const response = await fetch('/api/blocks')
      const allBlocksData = await response.json()
      
      console.log(`📄 Page courante: ID="${currentPageId}" (type: ${typeof currentPageId}), Titre="${currentPage?.title}"`)
      console.log(`📦 Blocs API total: ${allBlocksData.length}`)
      
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
      
      // 🔍 ÉTAPE 4: Créer un conteneur temporaire avec SEULEMENT les blocs de la page courante
      const printContainer = document.createElement('div')
      printContainer.id = 'print-only-container'
      printContainer.className = 'printing-active'
      
      // 🔍 ÉTAPE 5: Générer le HTML des blocs de la page courante
      currentPageBlocksData.forEach((block: any, index: number) => {
        const blockDiv = document.createElement('div')
        blockDiv.className = 'draggable-block print-block'
        blockDiv.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">
            ${block.title || `Bloc ${index + 1}`}
          </div>
          <div style="min-height: 40px; line-height: 1.4;">
            ${block.content || 'Contenu vide'}
          </div>
        `
        printContainer.appendChild(blockDiv)
      })
      
      // 🔍 ÉTAPE 6: Injecter dans le body
      document.body.appendChild(printContainer)
      
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
        
        // Restaurer les blocs originaux
        allDOMBlocks.forEach((block: Element) => {
          const element = block as HTMLElement
          element.style.display = ''
        })
        
        document.body.classList.remove('printing')
        console.log('✅ Impression terminée, DOM restauré')
      }, 1000)
      
    } catch (error) {
      console.error('❌ Erreur export PDF:', error)
      alert('❌ Erreur lors de l\'export PDF. Consultez la console.')
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