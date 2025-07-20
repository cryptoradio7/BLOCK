'use client'

import { useState, useRef, useEffect } from 'react'
import { Page, Block } from '@/types'
import BlockComponent from './BlockComponent'
import styles from './PageEditor.module.css'

interface PageEditorProps {
  page: Page
  onPageUpdate: (page: Page) => void
}

export default function PageEditor({ page, onPageUpdate }: PageEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null)
  const [loading, setLoading] = useState(true)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Charger les blocs de la page
  useEffect(() => {
    loadBlocks()
  }, [page.id])

  const loadBlocks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/pages/${page.id}/blocks`)
      if (response.ok) {
        const blocksData = await response.json()
        setBlocks(blocksData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des blocs:', error)
    } finally {
      setLoading(false)
    }
  }

  const addBlock = async () => {
    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: page.id,
          type: 'text',
          content: '',
          order: blocks.length
        })
      })

      if (response.ok) {
        const newBlock = await response.json()
        const updatedBlocks = [...blocks, newBlock]
        setBlocks(updatedBlocks)
        updatePage(updatedBlocks)
      }
    } catch (error) {
      console.error('Erreur lors de la création du bloc:', error)
    }
  }

  const updateBlock = async (blockId: string, updates: Partial<Block>) => {
    try {
      const response = await fetch('/api/blocks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: blockId,
          ...updates
        })
      })

      if (response.ok) {
        const updatedBlock = await response.json()
        const updatedBlocks = blocks.map(block =>
          block.id === blockId ? { ...block, ...updatedBlock } : block
        )
        setBlocks(updatedBlocks)
        updatePage(updatedBlocks)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du bloc:', error)
    }
  }

  const deleteBlock = async (blockId: string) => {
    try {
      const response = await fetch(`/api/blocks/${blockId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedBlocks = blocks.filter(block => block.id !== blockId)
        setBlocks(updatedBlocks)
        updatePage(updatedBlocks)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du bloc:', error)
    }
  }

  const updatePage = (updatedBlocks: Block[]) => {
    onPageUpdate({
      ...page,
      blocks: updatedBlocks,
      updatedAt: new Date()
    })
  }

  const handleDragStart = (block: Block) => {
    setDraggedBlock(block)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetBlockId?: string) => {
    e.preventDefault()
    if (!draggedBlock) return

    let newOrder: number
    if (targetBlockId) {
      const targetIndex = blocks.findIndex(b => b.id === targetBlockId)
      newOrder = targetIndex
    } else {
      newOrder = blocks.length
    }

    const reorderedBlocks = blocks
      .filter(b => b.id !== draggedBlock.id)
      .map((block, index) => ({
        ...block,
        order: index >= newOrder ? index + 1 : index
      }))

    reorderedBlocks.splice(newOrder, 0, { ...draggedBlock, order: newOrder })
    
    setBlocks(reorderedBlocks)
    updatePage(reorderedBlocks)
    setDraggedBlock(null)
  }

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order)

  return (
    <div className={styles.pageEditor}>
      <div className={styles.pageHeader}>
        <button className={styles.addBlockButton} onClick={addBlock}>
          + Ajouter un bloc
        </button>
      </div>

      <div 
        className={styles.blocksContainer}
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
      >
        {sortedBlocks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun bloc pour le moment</p>
            <button onClick={addBlock}>Créer votre premier bloc</button>
          </div>
        ) : (
          sortedBlocks.map((block, index) => (
            <div
              key={block.id}
              className={styles.blockWrapper}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, block.id)}
            >
              <BlockComponent
                block={block}
                onUpdate={(updates) => updateBlock(block.id, updates)}
                onDelete={() => deleteBlock(block.id)}
                onDragStart={() => handleDragStart(block)}
                isDragging={draggedBlock?.id === block.id}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
} 