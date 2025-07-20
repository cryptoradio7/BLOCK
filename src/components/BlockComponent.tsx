'use client'

import { useState, useRef } from 'react'
import { Block, Attachment } from '@/types'
import styles from './BlockComponent.module.css'

interface BlockComponentProps {
  block: Block
  onUpdate: (updates: Partial<Block>) => void
  onDelete: () => void
  onDragStart: () => void
  isDragging: boolean
}

export default function BlockComponent({ 
  block, 
  onUpdate, 
  onDelete, 
  onDragStart,
  isDragging 
}: BlockComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const blockRef = useRef<HTMLDivElement>(null)

  const handleContentChange = (content: string) => {
    onUpdate({ content })
  }

  const handleTypeChange = (type: Block['type']) => {
    onUpdate({ type })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    const newAttachments: Attachment[] = Array.from(files).map((file, index) => ({
      id: `${block.id}-attachment-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 
            file.type === 'application/pdf' ? 'pdf' : 'other',
      size: file.size
    }))

    onUpdate({ 
      attachments: [...(block.attachments || []), ...newAttachments] 
    })
  }

  const removeAttachment = (attachmentId: string) => {
    const updatedAttachments = block.attachments?.filter(a => a.id !== attachmentId) || []
    onUpdate({ attachments: updatedAttachments })
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    onDragStart()
  }

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    // Désactivé temporairement pour éviter les problèmes
    e.preventDefault()
    e.stopPropagation()
    console.log('Resize disabled for now')
  }

  return (
    <div 
      ref={blockRef}
      className={`${styles.block} ${isDragging ? styles.dragging : ''}`}
      style={{
        width: block.width || 300,
        height: block.height || 200,
        minWidth: 200,
        minHeight: 150
      }}
      draggable={true}
      onDragStart={handleDragStart}
    >
      <div className={styles.blockHeader}>
        <div className={styles.blockControls}>
          <button 
            className={styles.dragHandle}
            title="Déplacer"
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const blockElement = e.currentTarget.closest(`.${styles.block}`) as HTMLElement
              if (blockElement) {
                blockElement.focus()
              }
            }}
          >
            ⋮⋮
          </button>
          
          <select 
            value={block.type}
            onChange={(e) => handleTypeChange(e.target.value as Block['type'])}
            className={styles.typeSelector}
          >
            <option value="text">Texte</option>
            <option value="image">Image</option>
            <option value="file">Fichier</option>
          </select>
        </div>

        <div className={styles.blockActions}>
          <button 
            className={styles.actionButton}
            onClick={() => fileInputRef.current?.click()}
            title="Ajouter des fichiers"
          >
            📎
          </button>
          
          <button 
            className={styles.actionButton}
            onClick={() => setIsEditing(!isEditing)}
            title="Modifier"
          >
            ✏️
          </button>
          
          <button 
            className={styles.actionButton}
            onClick={() => setShowMenu(!showMenu)}
            title="Plus d'options"
          >
            ⋯
          </button>
          
          {showMenu && (
            <div className={styles.dropdownMenu}>
              <button onClick={onDelete}>Supprimer</button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.blockContent}>
        {block.type === 'text' && (
          <div className={styles.textContent}>
            {isEditing ? (
              <textarea
                value={block.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Écrivez votre contenu..."
                className={styles.textArea}
                autoFocus
              />
            ) : (
              <div 
                className={styles.textDisplay}
                onClick={() => setIsEditing(true)}
              >
                {block.content || 'Cliquez pour ajouter du contenu...'}
              </div>
            )}
          </div>
        )}

        {block.type === 'image' && (
          <div className={styles.imageContent}>
            {block.content ? (
              <img src={block.content} alt="Block content" className={styles.image} />
            ) : (
              <div className={styles.imagePlaceholder}>
                <input
                  type="text"
                  placeholder="URL de l'image..."
                  value={block.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className={styles.imageUrlInput}
                />
              </div>
            )}
          </div>
        )}

        {block.attachments && block.attachments.length > 0 && (
          <div className={styles.attachments}>
            <h4>Pièces jointes :</h4>
            {block.attachments.map((attachment) => (
              <div key={attachment.id} className={styles.attachment}>
                <span className={styles.attachmentName}>{attachment.name}</span>
                <button 
                  onClick={() => removeAttachment(attachment.id)}
                  className={styles.removeAttachment}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Poignées de redimensionnement - DÉSACTIVÉES TEMPORAIREMENT */}
      {/*
      <div 
        className={styles.resizeHandle}
        data-direction="e"
        onMouseDown={(e) => handleResizeStart(e, 'e')}
      ></div>
      <div 
        className={styles.resizeHandle}
        data-direction="n"
        onMouseDown={(e) => handleResizeStart(e, 'n')}
      ></div>
      <div 
        className={styles.resizeHandle}
        data-direction="s"
        onMouseDown={(e) => handleResizeStart(e, 's')}
      ></div>
      */}
    </div>
  )
} 