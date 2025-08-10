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
        
        console.log('🎯 Blocs filtrés pour page', pageId, ':', sortedBlocks.length);
        console.log('📝 Blocs triés pour lecture:', sortedBlocks.map((b: any) => ({ 
          id: b.id, 
          title: b.title, 
          position: `(${b.x}, ${b.y})`,
          content_preview: b.content.substring(0, 50) 
        })));
        
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

  // 🖨️ Fonction d'impression des blocs dans l'ordre de lecture
  const printBlocksInOrder = () => {
    if (blocks.length === 0) {
      alert('Aucun bloc à imprimer !');
      return;
    }

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour l\'impression');
      return;
    }

    // Préparer le contenu HTML pour l'impression
    const printContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Impression - Page ${pageId}</title>
        <style>
          @media print {
            body { margin: 20px; font-family: Arial, sans-serif; }
            .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .print-block { 
              margin-bottom: 30px; 
              page-break-inside: avoid; 
              border: 1px solid #ddd; 
              padding: 20px; 
              border-radius: 8px;
            }
            .block-number { 
              display: inline-block; 
              background: #007bff; 
              color: white; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              text-align: center; 
              line-height: 30px; 
              font-weight: bold; 
              margin-right: 15px; 
              vertical-align: top;
            }
            .block-title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 15px; 
              color: #333;
              display: inline-block;
              vertical-align: top;
              margin-top: 5px;
            }
            .block-content { 
              line-height: 1.6; 
              color: #555; 
              margin-left: 45px;
            }
            .block-content img { max-width: 100%; height: auto; margin: 10px 0; }
            .print-footer { 
              margin-top: 40px; 
              text-align: center; 
              color: #666; 
              font-size: 12px; 
              border-top: 1px solid #ddd; 
              padding-top: 20px;
            }
            @page { margin: 2cm; }
          }
          @media screen {
            body { margin: 40px; font-family: Arial, sans-serif; background: #f5f5f5; }
            .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; background: white; padding: 20px; border-radius: 8px; }
            .print-block { 
              margin-bottom: 30px; 
              border: 1px solid #ddd; 
              padding: 20px; 
              border-radius: 8px; 
              background: white; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .block-number { 
              display: inline-block; 
              background: #007bff; 
              color: white; 
              width: 30px; 
              height: 30px; 
              border-radius: 50%; 
              text-align: center; 
              line-height: 30px; 
              font-weight: bold; 
              margin-right: 15px; 
              vertical-align: top;
            }
            .block-title { 
              font-size: 18px; 
              font-weight: bold; 
              margin-bottom: 15px; 
              color: #333;
              display: inline-block;
              vertical-align: top;
              margin-top: 5px;
            }
            .block-content { 
              line-height: 1.6; 
              color: #555; 
              margin-left: 45px;
            }
            .block-content img { max-width: 100%; height: auto; margin: 10px 0; }
            .print-footer { 
              margin-top: 40px; 
              text-align: center; 
              color: #666; 
              font-size: 12px; 
              border-top: 1px solid #ddd; 
              padding-top: 20px; 
              background: white; 
              padding: 20px; 
              border-radius: 8px;
            }
            .print-button { 
              position: fixed; 
              top: 20px; 
              right: 20px; 
              padding: 15px 25px; 
              background: #28a745; 
              color: white; 
              border: none; 
              border-radius: 8px; 
              cursor: pointer; 
              font-size: 16px; 
              font-weight: bold;
              box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
            }
            .print-button:hover { background: #218838; transform: translateY(-2px); }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>📄 Page ${pageId} - Ordre de Lecture</h1>
          <p>Impression générée le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
          <p><strong>${blocks.length} blocs</strong> dans l'ordre de lecture naturel</p>
        </div>

        ${blocks.map((block, index) => `
          <div class="print-block">
            <div class="block-number">${index + 1}</div>
            <div class="block-title">${block.title || `Bloc ${block.id}`}</div>
            <div class="block-content">
              ${block.content || '<em>Aucun contenu</em>'}
              ${block.attachments && block.attachments.length > 0 ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                  <strong>📎 Pièces jointes :</strong>
                  ${block.attachments.map(att => `
                    <div style="margin: 5px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                      ${att.type === 'image' ? '🖼️' : '📄'} ${att.name}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}

        <div class="print-footer">
          <p>📋 Document généré par Agile Vision BLOCK</p>
          <p>Ordre de lecture respecté : haut à gauche → bas à droite</p>
        </div>

        <button class="print-button" onclick="window.print()">🖨️ Imprimer</button>
      </body>
      </html>
    `;

    // Écrire le contenu et lancer l'impression
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    console.log('🖨️ Fenêtre d\'impression ouverte avec', blocks.length, 'blocs dans l\'ordre');
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

      {/* Bouton d'impression - visible seulement s'il y a des blocs */}
      {blocks.length > 0 && (
        <button
          onClick={printBlocksInOrder}
          title="Imprimer les blocs dans l'ordre de lecture"
          style={{
            position: 'fixed',
            bottom: '30px',
            right: '110px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.4)',
            zIndex: 1000,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0056b3';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#007bff';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
          }}
        >
          🖨️
        </button>
      )}

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