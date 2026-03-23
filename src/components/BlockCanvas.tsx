'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { EditableBlock, BlockType } from './EditableBlock';

interface BlockCanvasProps {
  pageId?: number;
}

export const BlockCanvas = ({ pageId = 1 }: BlockCanvasProps) => {
  const [blocks, setBlocks] = useState<BlockType[]>([]);
  const [loading, setLoading] = useState(true);
  const [canvasHeight, setCanvasHeight] = useState('200vh');
  const [isExtending, setIsExtending] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Fonction pour étendre dynamiquement le canvas en temps réel
  const extendCanvas = useCallback(() => {
    if (isExtending) {
      return;
    }
    
    setIsExtending(true);
    
    // Ajouter de l'espace en temps réel
    setCanvasHeight(prevHeight => {
      const currentHeight = parseInt(prevHeight);
      const newHeight = currentHeight + 300; // +300px à chaque extension
      return `${newHeight}px`;
    });
    
    // Feedback visuel
    setTimeout(() => {
      setIsExtending(false);
    }, 800);
  }, [isExtending]);

  // Gérer le scroll pour AJOUTER de l'espace en temps réel
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    // Si on est à moins de 150px du bas, AJOUTER de l'espace
    if (scrollHeight - scrollTop - clientHeight < 150) {
      extendCanvas();
    }
  }, [extendCanvas]);

  // Détecter aussi la molette de souris pour une meilleure réactivité
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    // Si on scrolle vers le bas (deltaY positif)
    if (e.deltaY > 0) {
      const target = e.currentTarget;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;
      
      // Si on est proche du bas, étendre immédiatement
      if (scrollHeight - scrollTop - clientHeight < 200) {
        extendCanvas();
      }
    }
  }, [extendCanvas]);

  // Détecter les touches clavier pour étendre le canvas
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Flèche bas ou Page Down
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      const target = e.currentTarget;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;
      
      // Si on est proche du bas, étendre
      if (scrollHeight - scrollTop - clientHeight < 300) {
        extendCanvas();
      }
    }
  }, [extendCanvas]);

  // Calculer la hauteur initiale basée sur les blocs existants
  useEffect(() => {
    if (blocks.length === 0) {
      setCanvasHeight('200vh');
    } else {
      const maxY = Math.max(...blocks.map(block => block.y + block.height));
      const baseHeight = Math.max(maxY + 400, window.innerHeight * 2);
      setCanvasHeight(`${baseHeight}px`);
    }
  }, [blocks]);

  // Charger les blocs depuis l'API
  useEffect(() => {
    fetchBlocks();
  }, [pageId]);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      // OPTIMISATION: Filtrer par pageId côté serveur au lieu de charger tous les blocs
      const response = await fetch(`/api/blocks?pageId=${pageId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Transformer les données pour correspondre au type BlockType
        const transformedBlocks = data.map((block: any) => ({
          id: block.id,
          x: block.x || 0,
          y: block.y || 0,
          width: block.width || 300,
          height: block.height || 200,
          content: block.content || '',
          title: block.title || '',
          type: block.type || 'text',
          page_id: block.page_id,
          attachments: Array.isArray(block.attachments) ? block.attachments : [],
          imageDimensions: Array.isArray(block.image_dimensions) ? block.image_dimensions : [],
        }));
        
        // 🔄 TRI POUR LECTURE NATURELLE : haut à gauche vers bas à droite
        const sortedBlocks = transformedBlocks.sort((a: any, b: any) => {
          // D'abord par Y (ligne), puis par X (colonne)
          if (Math.abs(a.y - b.y) < 50) {
            // Si les blocs sont sur la même ligne (différence Y < 50px), trier par X
            return a.x - b.x;
          }
          // Sinon, trier par Y (ligne)
          return a.y - b.y;
        });
        
        setBlocks(sortedBlocks);
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
      
      if (item.id && item.blockType === 'existing') {
        // Obtenir la position absolue de la souris
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) {
          return;
        }
        
        // Obtenir la position initiale du clic sur le bloc
        const initialClientOffset = monitor.getInitialClientOffset();
        const initialSourceClientOffset = monitor.getInitialSourceClientOffset();
        
        // Trouver le bloc actuel
        const currentBlock = blocks.find(b => b.id === item.id);
        if (!currentBlock) {
          return;
        }
        
        // Obtenir les dimensions du canvas
        const canvasElement = document.getElementById('block-canvas');
        if (!canvasElement) {
          return;
        }
        
        const canvasRect = canvasElement.getBoundingClientRect();
        
        // Calculer l'offset du clic initial dans le bloc
        let clickOffsetX = 0;
        let clickOffsetY = 0;
        
        if (initialClientOffset && initialSourceClientOffset) {
          clickOffsetX = initialClientOffset.x - initialSourceClientOffset.x;
          clickOffsetY = initialClientOffset.y - initialSourceClientOffset.y;
        }
        
        // Position finale = position souris - position clic dans le bloc - position canvas
        const newX = Math.max(0, Math.round(clientOffset.x - canvasRect.left - clickOffsetX));
        const newY = Math.max(0, Math.round(clientOffset.y - canvasRect.top - clickOffsetY));
        
        updateBlockPosition(item.id, newX, newY);
        
        return { moved: true };
      } else {
        return undefined;
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [blocks]);

  const createNewBlock = async (x: number, y: number) => {
    try {
      
      // Utiliser la position exacte passée en paramètre
      const newX = Math.max(0, x);
      const newY = Math.max(0, y);
      
      const requestBody = {
        content: '',
        x: newX,
        y: newY,
        width: 300,
        height: 200,
        page_id: pageId,
      };
      
      const response = await fetch('/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const newBlock = await response.json();
        
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
          imageDimensions: [],
        };
        
        setBlocks(prev => {
          const newBlocks = [...prev, blockForState];
          return newBlocks;
        });
        
      } else {
        console.error('❌ Erreur API:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ ERREUR createNewBlock:', error);
    }
  };

  const updateBlockPosition = async (id: number, x: number, y: number) => {
    const block = blocks.find(b => b.id === id);
    
    if (block) {
      const updatedBlock = { ...block, x, y };
      
      setBlocks(prev => {
        const newBlocks = prev.map(b => b.id === id ? updatedBlock : b);
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
        
        if (!response.ok) {
          console.error('❌ API update failed:', response.statusText);
        }
      } catch (error) {
        console.error('❌ Error updating position:', error);
      }
    } else {
      console.error('❌ Block not found with id:', id);
    }
  };

  const updateBlock = async (updatedBlock: Partial<BlockType>) => {
    setBlocks(prev => prev.map(b => b.id === updatedBlock.id ? { ...b, ...updatedBlock } : b));
    
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
      tabIndex={0} // Permettre la réception des événements clavier
      onClick={() => console.log('🎯 Canvas cliqué - Test des événements')}
      onDoubleClick={(e) => {
        // Créer un nouveau bloc en double-cliquant sur le canvas
        if (e.target === e.currentTarget) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          createNewBlock(x, y);
        }
      }}
      onScroll={handleScroll}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        width: '100%',
        height: canvasHeight, // Utiliser la hauteur dynamique
        minHeight: '300vh', // Hauteur minimum de 3 écrans pour permettre le scroll
        backgroundColor: isOver ? '#f0f8ff' : '#fafafa',
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        overflowY: 'auto', // Scroll vertical
        overflowX: 'hidden', // Pas de scroll horizontal
        cursor: 'default',
        paddingBottom: '100px', // Espace en bas pour faciliter le placement
      }}
    >


      {blocks.map((block, index) => (
        <EditableBlock
          key={block.id}
          block={block}
          readingOrder={index + 1}
          onUpdate={updateBlock}
          onMove={updateBlockPosition}
          onDelete={deleteBlock}
        />
      ))}
      
      {/* Zone de travail étendue - Espace libre pour placer de nouveaux blocs */}
      <div
        style={{
          position: 'absolute',
          top: blocks.length > 0 ? Math.max(...blocks.map(b => b.y + b.height)) + 100 : 200,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '300px',
          border: 'none', // Pas de bordure
          borderRadius: '0', // Pas de bordure arrondie
          backgroundColor: 'transparent', // Transparent
          display: 'none', // Masquer complètement
          zIndex: 1,
        }}
      />

      {/* Bouton flottant pour ajouter un bloc */}
      <button
        className="add-block-button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('🔘 CLIC BOUTON - Création de bloc en cours...');
          
          // Position en haut à gauche de la partie visible
          const canvasElement = document.getElementById('block-canvas');
          if (canvasElement) {
            const canvasRect = canvasElement.getBoundingClientRect();
            const scrollTop = canvasElement.scrollTop;
            
            // Position relative au scroll actuel (partie visible)
            let x = 50; // 50px depuis la gauche
            let y = scrollTop + 50; // 50px depuis le haut de la partie visible
            
            console.log('📍 Position visible (haut-gauche):', { x, y, scrollTop, pageId });
            
            // Appel direct de création
            createNewBlock(x, y).then(() => {
              console.log('✅ BLOC CRÉÉ avec succès !');
              
              // Faire défiler automatiquement vers le nouveau bloc
              setTimeout(() => {
                canvasElement.scrollTo({
                  top: y - 100, // 100px au-dessus du bloc pour le contexte
                  behavior: 'smooth'
                });
              }, 100);
            }).catch((error) => {
              console.error('❌ ERREUR création bloc:', error);
            });
          }
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
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#2ECC71',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(46, 204, 113, 0.4)',
          zIndex: 1000,
          transition: 'all 0.2s ease',
        }}
      >
        +
      </button>

      {/* Indicateur de scroll dynamique - Masqué lors de l'impression */}
      <div 
        className="scroll-indicator"
        style={{
          display: 'none', // Masquer complètement
        }}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Barre de progression d'extension - Visible seulement pendant l'extension */}
      {isExtending && (
        <div
          style={{
            display: 'none', // Masquer complètement
          }}
        />
      )}
    </div>
  );
}; 