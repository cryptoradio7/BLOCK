'use client'

import { useState } from 'react'
import styles from './Toolbar.module.css'

interface ToolbarProps {
  onExportPDF?: () => void
}

export default function Toolbar({ onExportPDF }: ToolbarProps) {
  const [isExporting, setIsExporting] = useState(false)

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
      </div>
      
      <div className={styles.toolbarRight}>
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