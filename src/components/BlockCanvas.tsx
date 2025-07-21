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
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'BLOCK',
    hover: (item: any, monitor) => {
      // Hover feedback handled by visual cues
    },
    drop: (item: any, monitor) => {
      const clientOffset = monitor.getClientOffset();
      
      if (!clientOffset || !item.id || item.blockType !== 'existing') {
        return;
      }

      const canvasElement = document.getElementById('block-canvas');
      if (!canvasElement) {
        return;
      }

      const canvasRect = canvasElement.getBoundingClientRect();
      
      // Calculer la position relative au canvas avec un offset pour centrer approximativement
      const x = Math.max(0, Math.round(clientOffset.x - canvasRect.left - 100));
      const y = Math.max(0, Math.round(clientOffset.y - canvasRect.top - 30));
      
      updateBlockPosition(item.id, x, y);
      
      return { moved: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
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
        backgroundColor: isOver ? '#e3f2fd' : '#fafafa',
        overflow: 'hidden',
        cursor: 'default',
        border: isOver ? '3px dashed #2196f3' : '1px solid #e0e0e0',
        transition: 'all 0.2s ease',
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
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.2s ease',
          }}
          onClick={() => createNewBlock(100, 100)}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0056b3';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#007bff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ➕ Nouveau bloc
        </div>
      </div>
      
      {/* Info du canvas */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          padding: '10px 14px',
          backgroundColor: isOver ? '#e8f5e8' : 'rgba(248, 249, 250, 0.95)',
          border: isOver ? '2px solid #4caf50' : '1px solid rgba(222, 226, 230, 0.8)',
          borderRadius: '6px',
          fontSize: '12px',
          maxWidth: '200px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(4px)',
        }}
      >
        Blocs: <strong>{blocks.length}</strong>
        {isOver && <div style={{ color: '#4caf50', fontWeight: 'bold', marginTop: '4px' }}>
          💡 Relâchez pour déposer !
        </div>}
      </div>
    </div>
  );
}; 