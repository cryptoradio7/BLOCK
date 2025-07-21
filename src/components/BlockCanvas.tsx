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
      // Hover feedback visuel seulement
    },
    drop: (item: any, monitor) => {
      console.log('📦 Drop event received:', item);
      
      if (item.id && item.blockType === 'existing') {
        // Obtenir la position absolue de la souris
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) {
          console.log('❌ No client offset');
          return;
        }
        
        // Obtenir la position initiale du clic sur le bloc
        const initialClientOffset = monitor.getInitialClientOffset();
        const initialSourceClientOffset = monitor.getInitialSourceClientOffset();
        
        console.log('📍 Client offset:', clientOffset);
        console.log('🔵 Initial client offset:', initialClientOffset);
        console.log('🟡 Initial source offset:', initialSourceClientOffset);
        
        // Trouver le bloc actuel
        const currentBlock = blocks.find(b => b.id === item.id);
        if (!currentBlock) {
          console.log('❌ Block not found');
          return;
        }
        
        // Obtenir les dimensions du canvas
        const canvasElement = document.getElementById('block-canvas');
        if (!canvasElement) {
          console.log('❌ Canvas not found');
          return;
        }
        
        const canvasRect = canvasElement.getBoundingClientRect();
        console.log('📐 Canvas rect:', canvasRect);
        
        // Calculer l'offset du clic initial dans le bloc
        let clickOffsetX = 0;
        let clickOffsetY = 0;
        
        if (initialClientOffset && initialSourceClientOffset) {
          clickOffsetX = initialClientOffset.x - initialSourceClientOffset.x;
          clickOffsetY = initialClientOffset.y - initialSourceClientOffset.y;
        }
        
        console.log('🎯 Click offset in block:', { x: clickOffsetX, y: clickOffsetY });
        
        // Position finale = position souris - position clic dans le bloc - position canvas
        const newX = Math.max(0, Math.round(clientOffset.x - canvasRect.left - clickOffsetX));
        const newY = Math.max(0, Math.round(clientOffset.y - canvasRect.top - clickOffsetY));
        
        console.log('🏁 Final position:', { x: newX, y: newY });
        console.log('📊 From position:', { x: currentBlock.x, y: currentBlock.y });
        
        updateBlockPosition(item.id, newX, newY);
        
        return { moved: true };
      } else {
        console.log('❌ Drop conditions not met:', { 
          id: item.id, 
          blockType: item.blockType 
        });
        return undefined;
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [blocks]);

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
    console.log('🔧 updateBlockPosition called with:', { id, x, y });
    const block = blocks.find(b => b.id === id);
    console.log('🔍 Found block:', block);
    
    if (block) {
      const updatedBlock = { ...block, x, y };
      console.log('📝 Updated block:', updatedBlock);
      
      setBlocks(prev => {
        const newBlocks = prev.map(b => b.id === id ? updatedBlock : b);
        console.log('📊 State updated, new positions:', newBlocks.map(b => ({ id: b.id, x: b.x, y: b.y })));
        return newBlocks;
      });
      
      try {
        const response = await fetch(`/api/blocks/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedBlock),
        });
        console.log('📡 API response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ API update failed:', response.statusText);
        } else {
          console.log('✅ Position saved to database successfully');
        }
      } catch (error) {
        console.error('❌ Error updating position:', error);
      }
    } else {
      console.error('❌ Block not found with id:', id);
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

  const deleteBlock = async (id: number) => {
    try {
      const response = await fetch(`/api/blocks/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBlocks(prev => prev.filter(b => b.id !== id));
        console.log('✅ Bloc supprimé:', id);
      } else {
        console.error('❌ Erreur lors de la suppression du bloc');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du bloc:', error);
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
          onDelete={deleteBlock}
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
      </div>
    </div>
  );
}; 