'use client'

import { useState } from 'react'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  onPrint?: () => void
  onExportPDF?: () => void
}

export default function Toolbar({ onPrint, onExportPDF }: ToolbarProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  const handleExportPDF = async () => {
    if (onExportPDF) {
      setIsExporting(true)
      try {
        await onExportPDF()
      } finally {
        setIsExporting(false)
      }
    }
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLeft}>
        <h1 className={styles.title}>BLOCK</h1>
      </div>
      
      <div className={styles.toolbarRight}>
        <button 
          className={styles.toolbarButton}
          onClick={handlePrint}
          title="Imprimer"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 6,2 18,2 18,9"></polyline>
            <path d="M6,18H4a2,2 0 0,1-2-2V11a2,2 0 0,1,2-2H20a2,2 0 0,1,2,2v5a2,2 0 0,1-2,2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Imprimer
        </button>
        
        <button 
          className={`${styles.toolbarButton} ${isExporting ? styles.loading : ''}`}
          onClick={handleExportPDF}
          disabled={isExporting}
          title="Exporter en PDF"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          {isExporting ? 'Export...' : 'PDF'}
        </button>
      </div>
    </div>
  )
} 