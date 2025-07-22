'use client'

import { useState } from 'react'
import { Page } from '@/types'
import Logo from './Logo'
import styles from './Sidebar.module.css'

interface SidebarProps {
  pages: Page[]
  currentPageId: string
  onPageSelect: (pageId: string) => void
  onAddPage: (title?: string) => void
  onPagesReorder: (pages: Page[]) => void
  onUpdatePageTitle: (pageId: string, newTitle: string) => void
  onDeletePage?: (pageId: string) => void
  visible: boolean
  onToggleVisibility: () => void
}

export default function Sidebar({ 
  pages, 
  currentPageId, 
  onPageSelect, 
  onAddPage, 
  onPagesReorder, 
  onUpdatePageTitle,
  onDeletePage, 
  visible, 
  onToggleVisibility 
}: SidebarProps) {
  const [isAddingPage, setIsAddingPage] = useState(false)
  const [newPageTitle, setNewPageTitle] = useState('')
  const [draggedPage, setDraggedPage] = useState<Page | null>(null)
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleAddPage = () => {
    if (newPageTitle.trim()) {
      onAddPage(newPageTitle.trim())
      setNewPageTitle('')
      setIsAddingPage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPage()
    } else if (e.key === 'Escape') {
      setIsAddingPage(false)
      setNewPageTitle('')
    }
  }

  const handleDragStart = (e: React.DragEvent, page: Page) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', page.id)
    setDraggedPage(page)
  }

  const handleDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (!draggedPage) {
      return
    }
    
    if (draggedPage.id === pageId) {
      return
    }
    
    setDragOverPageId(pageId)
  }

  const handleDragEnter = (e: React.DragEvent, pageId: string) => {
    e.preventDefault()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Ne pas réinitialiser si on survole un enfant
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverPageId(null)
    }
  }

  const handleDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!draggedPage) {
      return
    }
    
    if (draggedPage.id === targetPageId) {
      return
    }
    
    const draggedIndex = pages.findIndex(p => p.id === draggedPage.id)
    const targetIndex = pages.findIndex(p => p.id === targetPageId)

    if (draggedIndex === -1 || targetIndex === -1) {
      return
    }

    const reorderedPages = [...pages]
    const [movedPage] = reorderedPages.splice(draggedIndex, 1)
    reorderedPages.splice(targetIndex, 0, movedPage)

    onPagesReorder(reorderedPages)
    setDraggedPage(null)
    setDragOverPageId(null)
  }

  const handleDragEnd = () => {
    setDraggedPage(null)
    setDragOverPageId(null)
  }

  const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation()
    if (onDeletePage) {
      onDeletePage(pageId)
    }
  }

  const handleEditPage = (e: React.MouseEvent, page: Page) => {
    e.stopPropagation()
    setEditingPageId(page.id)
    setEditingTitle(page.title)
  }

  const handleSaveEdit = () => {
    if (editingPageId && editingTitle.trim()) {
      onUpdatePageTitle(editingPageId, editingTitle.trim())
      setEditingPageId(null)
      setEditingTitle('')
    }
  }

  const handleCancelEdit = () => {
    setEditingPageId(null)
    setEditingTitle('')
  }

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }



  return (
    <div className={`${styles.sidebar} ${!visible ? styles.hidden : ''}`}>
      <div className={styles.header}>
        <Logo />
        <div className={styles.headerButtons}>
          <button 
            className={styles.addButton}
            onClick={() => setIsAddingPage(true)}
            title="Ajouter une page"
          >
            +
          </button>
          <button 
            className={styles.hideButton}
            onClick={onToggleVisibility}
            title="Masquer la sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {isAddingPage && (
        <div className={styles.addPageForm}>
          <input
            type="text"
            placeholder="Nom de la page"
            value={newPageTitle}
            onChange={(e) => setNewPageTitle(e.target.value)}
            onKeyDown={handleKeyPress}
            autoFocus
          />
        </div>
      )}

      <div className={styles.pageList}>
        {pages.map((page) => (
          <div
            key={page.id}
            className={`${styles.pageItem} ${
              page.id === currentPageId ? styles.active : ''
            } ${draggedPage?.id === page.id ? styles.dragging : ''} ${
              dragOverPageId === page.id ? styles.dragOver : ''
            }`}
            onClick={() => onPageSelect(page.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, page)}
            onDragOver={(e) => handleDragOver(e, page.id)}
            onDragEnter={(e) => handleDragEnter(e, page.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, page.id)}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.pageContent} style={{ pointerEvents: draggedPage?.id === page.id ? 'none' : 'auto' }}>
              <div className={styles.pageInfo}>
                {editingPageId === page.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleEditKeyPress}
                    onBlur={handleSaveEdit}
                    className={styles.editInput}
                    autoFocus
                    onDragStart={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span 
                    className={styles.pageTitle}
                    onClick={(e) => handleEditPage(e, page)}
                    title="Cliquez pour modifier le titre"
                    onDragStart={(e) => e.stopPropagation()}
                  >
                    {page.title}
                  </span>
                )}
              </div>
              <div 
                className={styles.dragHandle}
                onDragStart={(e) => e.stopPropagation()}
                style={{ pointerEvents: 'none' }}
              >
                ⋮⋮
              </div>
            </div>
            
            <div className={styles.pageActions} style={{ pointerEvents: draggedPage?.id === page.id ? 'none' : 'auto' }}>
              {onDeletePage && pages.length > 1 && (
                <button
                  className={styles.deleteButton}
                  onClick={(e) => handleDeletePage(e, page.id)}
                  onDragStart={(e) => e.stopPropagation()}
                  title="Supprimer la page"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 