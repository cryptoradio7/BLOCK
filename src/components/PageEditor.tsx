'use client'

import { useState, useRef, useEffect } from 'react'
import { Page } from '@/types'
import styles from './PageEditor.module.css'

interface PageEditorProps {
  page: Page
  onPageUpdate: (page: Page) => void
}

export default function PageEditor({ page, onPageUpdate }: PageEditorProps) {
  const [loading, setLoading] = useState(true)

  // Charger les données de la page
  useEffect(() => {
    loadPageData()
  }, [page.id])

  const loadPageData = async () => {
    try {
      setLoading(true)
      // Ici on peut charger d'autres données de la page si nécessaire
      console.log('Chargement de la page:', page.id)
    } catch (error) {
      console.error('Erreur lors du chargement de la page:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePage = () => {
    onPageUpdate({
      ...page,
      updatedAt: new Date()
    })
  }

  if (loading) {
    return (
      <div className={styles.pageEditor}>
        <div className={styles.loadingState}>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageEditor}>
      <div className={styles.pageContent}>
        <div className={styles.emptyState}>
          <h2>Page : {page.title}</h2>
          <p>Cette page est vide pour le moment</p>
          <p>Les fonctionnalités de blocs ont été supprimées</p>
        </div>
      </div>
    </div>
  )
} 