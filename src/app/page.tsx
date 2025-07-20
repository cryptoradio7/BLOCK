'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Toolbar from '@/components/Toolbar'
import PageEditor from '@/components/PageEditor'

export default function Home() {
  const [pages, setPages] = useState([
    { id: '1', title: 'Page d\'accueil', blocks: [] }
  ])
  const [currentPageId, setCurrentPageId] = useState('1')

  const addPage = (title?: string) => {
    const newPage = {
      id: Date.now().toString(),
      title: title || `Nouvelle page ${pages.length + 1}`,
      blocks: []
    }
    setPages([...pages, newPage])
  }

  const deletePage = (pageId: string) => {
    if (pages.length <= 1) return // Empêche de supprimer la dernière page
    
    const updatedPages = pages.filter(page => page.id !== pageId)
    setPages(updatedPages)
    
    // Si la page supprimée était sélectionnée, sélectionner la première page
    if (currentPageId === pageId) {
      setCurrentPageId(updatedPages[0].id)
    }
  }

  const currentPage = pages.find(page => page.id === currentPageId)

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