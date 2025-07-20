'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import Toolbar from '@/components/Toolbar'
import PageEditor from '@/components/PageEditor'
import { Page } from '@/types'

export default function Home() {
  const [pages, setPages] = useState<Page[]>([])
  const [currentPageId, setCurrentPageId] = useState<string>('')
  const [loading, setLoading] = useState(true)

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

  const currentPage = pages.find(page => page.id === currentPageId)

  if (loading) {
    return <div className="app">Chargement...</div>
  }

  return (
    <div className="app">
      <Sidebar 
        pages={pages} 
        currentPageId={currentPageId}
        onPageSelect={setCurrentPageId}
        onAddPage={addPage}
        onPagesReorder={setPages}
        onDeletePage={deletePage}
      />
      <div className="main-content">
        <Toolbar />
        {currentPage && (
          <PageEditor 
            page={currentPage}
            onPageUpdate={(updatedPage) => {
              setPages(pages.map(p => 
                p.id === updatedPage.id ? updatedPage : p
              ))
            }}
          />
        )}
      </div>
    </div>
  )
} 