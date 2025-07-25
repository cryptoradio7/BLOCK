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
      console.log('🔍 BlockCanvas - Chargement blocs pour page:', pageId);
      const response = await fetch('/api/blocks');
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Tous les blocs récupérés:', data.length);
        console.log('📋 Détails des blocs:', data.map((b: any) => ({ id: b.id, title: b.title, page_id: b.page_id, content_length: b.content?.length || 0 })));
        
        // Transformer les données pour correspondre au type BlockType et filtrer par page
        const allTransformedBlocks = data.map((block: any) => ({
          id: block.id,
          x: block.x || 0,
          y: block.y || 0,
          width: block.width || 300,
          height: block.height || 200,
          content: block.content || '',
          title: block.title || '', // Récupérer le titre depuis la base de données
          type: block.type || 'text',
          page_id: block.page_id,
          attachments: block.attachments || [], // Récupérer les attachments depuis l'API
        }));
        
        const transformedBlocks = allTransformedBlocks.filter((block: any) => block.page_id === pageId);
        
        console.log('🎯 Blocs filtrés pour page', pageId, ':', transformedBlocks.length);
        console.log('📝 Blocs affichés:', transformedBlocks.map((b: any) => ({ id: b.id, title: b.title, content_preview: b.content.substring(0, 50) })));
        
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
      console.log('🚀 DÉBUT createNewBlock:', { x, y, pageId });
      
      const requestBody = {
        content: '',
        x,
        y,
        width: 300,
        height: 200,
        page_id: pageId,
      };
      
      console.log('📤 Envoi requête API:', requestBody);
      
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Réponse API status:', response.status);

      if (response.ok) {
        const newBlock = await response.json();
        console.log('📦 Nouveau bloc reçu:', newBlock);
        
        const blockForState = {
          id: newBlock.id,
          x: newBlock.x,
          y: newBlock.y,
          width: newBlock.width,
          height: newBlock.height,
          content: newBlock.content || '',
          title: newBlock.title || '',
          type: newBlock.type || 'text',
          page_id: newBlock.page_id,
          attachments: [],
        };
        
        console.log('🔄 Ajout au state:', blockForState);
        setBlocks(prev => {
          const newBlocks = [...prev, blockForState];
          console.log('📊 Nouveaux blocs dans state:', newBlocks.length);
          return newBlocks;
        });
        
        console.log('✅ BLOC AJOUTÉ AU STATE !');
      } else {
        console.error('❌ Erreur API:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ ERREUR createNewBlock:', error);
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
        minHeight: '200vh', // Hauteur minimum de 2 écrans pour permettre le scroll
        backgroundColor: isOver ? '#f0f8ff' : '#fafafa',
        overflowY: 'auto', // Scroll vertical
        overflowX: 'hidden', // Pas de scroll horizontal
        cursor: 'default',
        paddingBottom: '100px', // Espace en bas pour faciliter le placement
      }}
    >
      {blocks.length === 0 && !loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          padding: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          border: '2px dashed #ddd',
          maxWidth: '400px'
        }}>
          <h3 style={{ color: '#666', marginBottom: '16px' }}>📋 Page vide</h3>
          <p style={{ color: '#888', marginBottom: '20px', lineHeight: '1.5' }}>
            Cette page ne contient aucun bloc. 
            <br />
            Utilisez le bouton <strong>+</strong> pour créer votre premier bloc
            <br />
            ou vérifiez les autres pages dans la sidebar.
          </p>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              createNewBlock(200, 200)
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2ECC71',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ➕ Créer le premier bloc
          </button>
        </div>
      )}

      {blocks.map((block) => (
        <EditableBlock
          key={block.id}
          block={block}
          onUpdate={updateBlock}
          onMove={updateBlockPosition}
          onDelete={deleteBlock}
        />
      ))}
      
      

      {/* Bouton flottant pour ajouter un bloc */}
      <button
        className="add-block-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔘 CLIC BOUTON - Création de bloc en cours...');
          
          // Position simple et fixe pour test
          const x = 100;
          const y = 100;
          
          console.log('📍 Position:', { x, y, pageId });
          
          // Appel direct de création
          createNewBlock(x, y).then(() => {
            console.log('✅ BLOC CRÉÉ avec succès !');
          }).catch((error) => {
            console.error('❌ ERREUR création bloc:', error);
          });
        }}

        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#27AE60';
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 204, 113, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#2ECC71';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 204, 113, 0.4)';
        }}
        title="Ajouter un nouveau bloc"
      >
        +
      </button>

      {/* Indicateur de scroll en bas */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        backgroundColor: 'rgba(0, 123, 255, 0.8)',
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span>📜</span>
        <span>Zone de travail étendue - Scrollez pour voir plus !</span>
        <span>⬇️</span>
      </div>
    </div>
  );
}; 