'use client';

import { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { EditableBlock, BlockType } from './EditableBlock';

interface BlockCanvasProps {
  pageId?: number;
}

export const BlockCanvas = ({ pageId = 1 }: BlockCanvasProps) => {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les blocs depuis l'API
  useEffect(() => {
    fetchBlocks();
  }, [pageId]);

  const fetchBlocks = async () => {
    try {
      const response = await fetch('/api/blocks');
      if (response.ok) {
        const data = await response.json();
        // Transformer les données pour correspondre au type BlockType et filtrer par page
        const transformedBlocks = data
          .filter((block: any) => block.page_id === pageId)
          .map((block: any) => ({
            id: block.id,
            x: block.x || 0,
            y: block.y || 0,
            width: block.width || 300,
            height: block.height || 200,
            content: block.content || '',
            type: block.type || 'text',
            page_id: block.page_id,
            attachments: [], // Pour l'instant, pas d'attachments
          }));
        setBlocks(transformedBlocks);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des blocs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Drop zone pour déplacer les blocs
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'BLOCK',
    hover: (item: any, monitor) => {
      console.log('🔄 Hovering with:', item);
    },
    drop: (item: any, monitor) => {
      console.log('📦 Drop event received:', item);
      const offset = monitor.getClientOffset();
      console.log('📍 Drop offset:', offset);
      
      if (offset && item.id && item.blockType === 'existing') {
        const canvasRect = document.getElementById('block-canvas')?.getBoundingClientRect();
        console.log('📐 Canvas rect:', canvasRect);
        
        if (canvasRect) {
          const x = offset.x - canvasRect.left - 150;
          const y = offset.y - canvasRect.top - 50;
          
                     const intX = Math.round(Math.max(0, x));
           const intY = Math.round(Math.max(0, y));
           console.log('🎯 Moving block', item.id, 'to:', { x: intX, y: intY });
           updateBlockPosition(item.id, intX, intY);
        }
      } else {
        console.log('❌ Drop conditions not met:', { offset, id: item.id, blockType: item.blockType });
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const createNewBlock = async (x: number, y: number) => {
    try {
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Contenu du bloc...',
          x,
          y,
          width: 300,
          height: 200,
          page_id: pageId,
        }),
      });

      if (response.ok) {
        const newBlock = await response.json();
        setBlocks(prev => [...prev, {
          id: newBlock.id,
          x: newBlock.x,
          y: newBlock.y,
          width: newBlock.width,
          height: newBlock.height,
          content: newBlock.content || '',
          type: newBlock.type || 'text',
          page_id: newBlock.page_id,
          attachments: [],
        }]);
      }
    } catch (error) {
      console.error('Erreur lors de la création du bloc:', error);
    }
  };

  const updateBlockPosition = async (id: number, x: number, y: number) => {
    const block = blocks.find(b => b.id === id);
    if (block) {
      const updatedBlock = { ...block, x, y };
      setBlocks(prev => prev.map(b => b.id === id ? updatedBlock : b));
      
      try {
        await fetch(`/api/blocks/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedBlock),
        });
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la position:', error);
      }
    }
  };

  const updateBlock = async (updatedBlock: BlockType) => {
    setBlocks(prev => prev.map(b => b.id === updatedBlock.id ? updatedBlock : b));
    
    try {
      await fetch(`/api/blocks/${updatedBlock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBlock),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du bloc:', error);
    }
  };

  if (loading) {
    return <div>Chargement des blocs...</div>;
  }

  return (
    <div
      id="block-canvas"
      ref={(node) => {
        if (node) drop(node);
      }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: isOver ? '#f0f8ff' : '#fafafa',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {blocks.map((block) => (
        <EditableBlock
          key={block.id}
          block={block}
          onUpdate={updateBlock}
          onMove={updateBlockPosition}
        />
      ))}
      
      {/* Actions */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
        <div
          style={{
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          onClick={() => createNewBlock(100, 100)}
        >
          ➕ Nouveau bloc
        </div>
        <div
          style={{
            padding: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          onClick={() => {
            console.log('🧪 Test: Current blocks:', blocks);
            console.log('🧪 Test: Page ID:', pageId);
          }}
        >
          🧪 Test Debug
        </div>
      </div>
      
      {/* Info de debug */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px',
          backgroundColor: isOver ? '#d4edda' : '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '4px',
          fontSize: '12px',
          maxWidth: '200px',
        }}
      >
        Blocs: {blocks.length}<br/>
        Drop zone: {isOver ? 'Active' : 'Inactive'}<br/>
        Page ID: {pageId}
      </div>
    </div>
  );
}; 