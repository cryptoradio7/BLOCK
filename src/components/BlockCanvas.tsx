'use client';

import { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { EditableBlock, BlockType } from './EditableBlock';

export const BlockCanvas = () => {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les blocs depuis l'API
  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const response = await fetch('/api/blocks');
      if (response.ok) {
        const data = await response.json();
        // Transformer les données pour correspondre au type BlockType
        const transformedBlocks = data.map((block: any) => ({
          id: block.id,
          x: block.x || 0,
          y: block.y || 0,
          width: block.width || 300,
          height: block.height || 200,
          title: block.title || '',
          content: block.content || '',
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

  // Drop zone pour créer de nouveaux blocs
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'BLOCK',
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        const canvasRect = document.getElementById('block-canvas')?.getBoundingClientRect();
        if (canvasRect) {
          const x = offset.x - canvasRect.left;
          const y = offset.y - canvasRect.top;
          
          // Si c'est un nouveau bloc (pas de position initiale)
          if (!item.x && !item.y) {
            createNewBlock(x, y);
          } else {
            // Mise à jour de la position d'un bloc existant
            updateBlockPosition(item.id, x, y);
          }
        }
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
          title: 'Nouveau bloc',
          content: '',
          x,
          y,
          width: 300,
          height: 200,
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
          title: newBlock.title || '',
          content: newBlock.content || '',
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
      
      {/* Zone de drop pour créer de nouveaux blocs */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
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
  );
}; 