'use client'

import { useState, useRef } from 'react'
import { Page, Block } from '@/types'
import BlockComponent from './BlockComponent'
import styles from './PageEditor.module.css'

interface PageEditorProps {
  page: Page
  onPageUpdate: (page: Page) => void
}

export default function PageEditor({ page, onPageUpdate }: PageEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(page.blocks)
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const addBlock = () => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type: 'text',
      content: '',
      order: blocks.length
    }
    const updatedBlocks = [...blocks, newBlock]
    setBlocks(updatedBlocks)
    updatePage(updatedBlocks)
  }

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    )
    setBlocks(updatedBlocks)
    updatePage(updatedBlocks)
  }

  const deleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId)
    setBlocks(updatedBlocks)
    updatePage(updatedBlocks)
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
        <h2 className={styles.pageTitle}>{page.title}</h2>
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