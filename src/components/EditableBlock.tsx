'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

export type BlockType = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  title?: string;
  type?: string;
  page_id?: number;
  attachments: Array<{
    id: number;
    name: string;
    url: string;
    type: 'image' | 'file';
  }>;
};

interface EditableBlockProps {
  block: BlockType;
  onUpdate: (updatedBlock: BlockType) => void;
  onMove: (id: number, x: number, y: number) => void;
  onDelete: (id: number) => void;
}

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const EditableBlock = ({
  block,
  onUpdate,
  onMove,
  onDelete,
}: EditableBlockProps) => {
  const [localContent, setLocalContent] = useState(block.content);
  const [localTitle, setLocalTitle] = useState(block.title || '');
  const [localSize, setLocalSize] = useState({ width: block.width, height: block.height });
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);


  // Synchroniser la taille locale quand le bloc change de l'extérieur
  useEffect(() => {
    if (!isResizing) {
      setLocalSize({ width: block.width, height: block.height });
    }
  }, [block.width, block.height, isResizing]);

  // Forcer la direction LTR au montage et quand le contenu change
  useEffect(() => {
    const timer = setTimeout(() => {
      const contentDiv = document.querySelector(`[data-block-id="${block.id}"] [contenteditable]`) as HTMLDivElement;
      if (contentDiv) {
        contentDiv.dir = 'ltr';
        contentDiv.style.direction = 'ltr';
        contentDiv.style.textAlign = 'left';
        
        // Nettoyer le HTML de tout attribut de direction RTL
        const cleanContent = contentDiv.innerHTML.replace(/dir\s*=\s*["']rtl["']/gi, 'dir="ltr"');
        if (cleanContent !== contentDiv.innerHTML) {
          contentDiv.innerHTML = cleanContent;
          setLocalContent(cleanContent);
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [block.id, localContent]);



  // Ajouter des boutons de suppression aux images existantes au montage
  useEffect(() => {
    const timer = setTimeout(() => {
      const contentDiv = document.querySelector(`[data-block-id="${block.id}"] [contenteditable]`) as HTMLDivElement;
      if (contentDiv) {
        const images = contentDiv.querySelectorAll('img:not(.processed)');
        if (images.length > 0) {
          images.forEach((element) => {
            const img = element as HTMLImageElement;
            // Marquer comme traité
            img.classList.add('processed');
            
            // Vérifier si l'image n'est pas déjà dans un container
            if (!img.parentElement?.classList.contains('image-container')) {
              // Créer un container pour l'image
              const imageContainer = document.createElement('div');
              imageContainer.className = 'image-container';
              imageContainer.style.cssText = 'display: inline-block; position: relative; margin: 8px 0;';
              
              // Créer le bouton de suppression
              const deleteButton = document.createElement('button');
              deleteButton.className = 'image-delete-button';
              deleteButton.innerHTML = '×';
              deleteButton.title = 'Supprimer cette image';
              deleteButton.onclick = (e) => {
                e.stopPropagation();
                if (confirm('Supprimer cette image ?')) {
                  imageContainer.remove();
                  // FORCER la direction LTR après modification pour bouton image
                  contentDiv.dir = 'ltr';
                  contentDiv.style.direction = 'ltr';
                  contentDiv.style.textAlign = 'left';
                  
                  // Sauvegarder le contenu mis à jour
                  const newContent = contentDiv.innerHTML;
                  setLocalContent(newContent);
                  onUpdate({ ...block, content: newContent });
                }
              };
              
              // Insérer le container avant l'image
              img.parentNode?.insertBefore(imageContainer, img);
              // Déplacer l'image dans le container
              imageContainer.appendChild(img);
              // Ajouter le bouton
              imageContainer.appendChild(deleteButton);
              
              // Ajuster les styles de l'image
              img.style.margin = '0';
            }
          });
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [block.content, block.id]);

  // Debounced save function avec nettoyage du contenu
  const debouncedSave = useCallback(
    debounce((updatedBlock: Partial<BlockType>) => {
      // Nettoyer le contenu avant sauvegarde
      if (updatedBlock.content) {
        const cleanContent = updatedBlock.content
          .replace(/dir\s*=\s*["']rtl["']/gi, 'dir="ltr"')
          .replace(/style\s*=\s*["'][^"']*direction\s*:\s*rtl[^"']*["']/gi, '')
          .replace(/unicode-bidi\s*:\s*bidi-override/gi, '');
        updatedBlock.content = cleanContent;
      }
      onUpdate({ ...block, ...updatedBlock });
    }, 1000),
    [block, onUpdate]
  );

  // Drag for repositioning - simplifié
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'BLOCK',
    item: { id: block.id, blockType: 'existing' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: () => !isResizing, // Seule protection : pas de drag pendant resize
    end: (item, monitor) => {
      console.log('🏁 Fin du drag pour bloc:', block.id, 'dropped:', monitor.didDrop());
    },
  }));

  // État pour le drag and drop de fichiers depuis le bureau
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    const newAttachments = await Promise.all(
      Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('blockId', block.id.toString());
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        return await response.json();
      })
    );

    onUpdate({
      ...block,
      attachments: [...block.attachments, ...newAttachments],
    });
  };

  // Fonction pour gérer le paste d'images dans le titre (vers attachments)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];

    // Parcourir tous les éléments du presse-papier
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Vérifier si c'est un fichier image
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    // Si on a trouvé des images, les uploader
    if (imageFiles.length > 0) {
      e.preventDefault(); // Empêcher le paste normal du texte
      
      try {
        console.log(`📷 Upload de ${imageFiles.length} image(s) en cours vers attachments...`);
        
        // Créer un FileList à partir des fichiers
        const dataTransfer = new DataTransfer();
        imageFiles.forEach(file => dataTransfer.items.add(file));
        
        await handleFileUpload(dataTransfer.files);
        
        console.log(`✅ ${imageFiles.length} image(s) ajoutée(s) aux attachments !`);
      } catch (error) {
        console.error('❌ Erreur lors du collage d\'image:', error);
      }
    }
  };

  // Fonction pour gérer le paste d'images dans le contenu (affichage direct)
  const handlePasteInContent = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];

    // Parcourir tous les éléments du presse-papier
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Vérifier si c'est un fichier image
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    // Si on a trouvé des images, les uploader et les insérer dans le contenu
    if (imageFiles.length > 0) {
      e.preventDefault(); // Empêcher le paste normal
      
      // IMPORTANT: Stocker toutes les références AVANT les opérations asynchrones
      const contentElement = e.currentTarget;
      const currentContent = contentElement?.innerHTML || localContent;
      
      try {
        console.log(`📷 Upload de ${imageFiles.length} image(s) en cours vers contenu...`);
        
        // Notification
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        tempDiv.textContent = `📷 Upload de ${imageFiles.length} image(s)...`;
        document.body.appendChild(tempDiv);

        // Upload des images
        const uploadPromises = imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('blockId', block.id.toString());
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          
          return await response.json();
        });

        const uploadedFiles = await Promise.all(uploadPromises);

        // Insérer les images dans le contenu avec bouton de suppression
        let newContent = currentContent;
        uploadedFiles.forEach((file) => {
          const imageHtml = `
            <div class="image-container" style="display: inline-block; position: relative; margin: 8px 0;">
              <img src="${file.url}" alt="${file.name}" class="resizable" draggable="false" title="Image redimensionnable - utilisez les poignées pour redimensionner" style="max-width: 100%; height: auto; display: block;" />
              <button class="image-delete-button" onclick="this.parentElement.remove(); arguments[0].stopPropagation();" title="Supprimer cette image">×</button>
            </div>
          `;
          newContent += imageHtml;
        });

        // Mettre à jour le contenu en toute sécurité AVEC préservation de la direction
        if (contentElement) {
          contentElement.innerHTML = newContent;
          // FORCER la direction LTR après modification innerHTML
          contentElement.dir = 'ltr';
          contentElement.style.direction = 'ltr';
          contentElement.style.textAlign = 'left';
        }
        setLocalContent(newContent);
        debouncedSave({ content: newContent });

        // Mettre à jour la notification
        tempDiv.textContent = `✅ ${imageFiles.length} image(s) insérée(s) !`;
        tempDiv.style.background = '#28a745';
        
        // Supprimer la notification après 2 secondes
        setTimeout(() => {
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
        }, 2000);
        
        console.log(`✅ ${imageFiles.length} image(s) insérée(s) dans le contenu !`);
      } catch (error) {
        console.error('❌ Erreur lors du collage d\'image:', error);
        
        // Notification d'erreur
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #dc3545;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        tempDiv.textContent = '❌ Erreur lors du collage de l\'image';
        document.body.appendChild(tempDiv);
        
        setTimeout(() => {
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
        }, 3000);
      }
    }
  };

  // Redimensionnement en temps réel (pendant le drag)
  const handleResize = (e: any, { size }: { size: { width: number; height: number } }) => {
    setLocalSize({ width: size.width, height: size.height });
  };

  // Début du redimensionnement
  const handleResizeStart = () => {
    setIsResizing(true);
  };

  // Fin du redimensionnement - sauvegarder en DB
  const handleResizeStop = (e: any, { size }: { size: { width: number; height: number } }) => {
    setIsResizing(false);
    const intWidth = Math.round(size.width);
    const intHeight = Math.round(size.height);
    setLocalSize({ width: intWidth, height: intHeight });
    onUpdate({ ...block, width: intWidth, height: intHeight });
  };

  // Fonction de titre supprimée car non utilisée

  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    
    // Force la direction LTR à chaque modification
    e.currentTarget.dir = 'ltr';
    e.currentTarget.style.direction = 'ltr';
    e.currentTarget.style.textAlign = 'left';
    
    setLocalContent(newContent);
    debouncedSave({ content: newContent });
  };

  // Fonction pour supprimer une pièce jointe
  const handleDeleteAttachment = async (attachmentId: number, attachmentName: string) => {
    try {
      console.log('🗑️ Suppression de la pièce jointe:', { id: attachmentId, name: attachmentName });
      
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      const result = await response.json();
      console.log('✅ Pièce jointe supprimée avec succès:', result);

      // Mettre à jour le bloc pour retirer l'attachment de la liste
      const updatedAttachments = block.attachments.filter(att => att.id !== attachmentId);
      onUpdate({ ...block, attachments: updatedAttachments });

      // Notification temporaire
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      tempDiv.textContent = `🗑️ "${attachmentName}" supprimé`;
      document.body.appendChild(tempDiv);

      setTimeout(() => {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la pièce jointe:', error);
      
      // Notification d'erreur
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      tempDiv.textContent = '❌ Erreur lors de la suppression';
      document.body.appendChild(tempDiv);
      
      setTimeout(() => {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      }, 3000);
    }
  };

  // Fonction pour supprimer une image du contenu
  const handleDeleteImageFromContent = (imgElement: HTMLImageElement) => {
    if (confirm('Supprimer cette image du contenu ?')) {
      imgElement.remove();
      
      // Sauvegarder le nouveau contenu sans l'image
      const contentDiv = imgElement.closest('[contenteditable]') as HTMLDivElement;
      if (contentDiv) {
        // FORCER la direction LTR après suppression d'image
        contentDiv.dir = 'ltr';
        contentDiv.style.direction = 'ltr';
        contentDiv.style.textAlign = 'left';
        
        const newContent = contentDiv.innerHTML;
        setLocalContent(newContent);
        debouncedSave({ content: newContent });
      }

      console.log('🗑️ Image supprimée du contenu');
      
      // Notification
      const tempDiv = document.createElement('div');
      tempDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      `;
      tempDiv.textContent = '🗑️ Image supprimée';
      document.body.appendChild(tempDiv);
      
      setTimeout(() => {
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }
      }, 2000);
    }
  };



  // Gérer les clics sur les images pour améliorer l'UX et permettre la suppression
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'IMG') {
      // Retirer la classe selected de toutes les autres images
      const allImages = e.currentTarget.querySelectorAll('img');
      allImages.forEach(img => img.classList.remove('selected'));
      
      // Ajouter la classe selected à l'image cliquée
      target.classList.add('selected');
      
      console.log('🖼️ Image sélectionnée pour redimensionnement');
    }
  };

  // Gérer les double-clics sur les images pour les supprimer
  const handleContentDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      handleDeleteImageFromContent(target as HTMLImageElement);
    }
  };

  // Gérer les touches de clavier pour supprimer les images sélectionnées
  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selectedImage = e.currentTarget.querySelector('img.selected') as HTMLImageElement;
      if (selectedImage) {
        e.preventDefault();
        handleDeleteImageFromContent(selectedImage);
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  return (
    <Resizable
      width={localSize.width}
      height={localSize.height}
      onResize={handleResize}
      onResizeStart={handleResizeStart}
      onResizeStop={handleResizeStop}
      minConstraints={[50, 30]}
      maxConstraints={[2000, 1500]}
      resizeHandles={['se', 's', 'e']}
    >
      <div
        ref={(node) => {
          drag(node);
        }}
        className={`draggable-block ${isDragging ? 'is-dragging' : ''}`}
        data-block-id={block.id}
        style={{
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: isDragOver ? '#f0f8ff' : 'white',
          border: isDragOver ? '2px dashed #007bff' : (isResizing ? '2px solid #007bff' : (isDragging ? '3px solid #ff9800' : '2px solid #e0e0e0')),
          borderRadius: '8px',
          padding: '16px',
          position: 'absolute',
          left: `${block.x}px`,
          top: `${block.y}px`,
          width: `${localSize.width}px`,
          height: `${localSize.height}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: isDragging ? '0 8px 16px rgba(255, 152, 0, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
          transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
          transform: isDragging ? 'rotate(2deg) scale(1.02)' : 'none',
          zIndex: isDragging ? 1000 : 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onMouseDown={(e) => {
          // Empêcher le drag si on clique sur la poignée de redimensionnement
          const target = e.target as HTMLElement;
          if (target.classList.contains('react-resizable-handle') || 
              target.closest('.react-resizable-handle')) {
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
        }}
        onMouseEnter={(e) => {
          setIsHovered(true);
          if (!isDragging) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          if (!isDragging) {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Vérifier si on quitte vraiment le bloc (pas juste un enfant)
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX;
          const y = e.clientY;
          if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
          }
        }}
        onPaste={handlePaste} // Ajouter l'écouteur de paste
      >
        {/* Header avec titre éditable */}
        <div style={{ 
          marginBottom: '12px', 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center',
          position: 'relative'
        }}>
          <input
            type="text"
            value={localTitle}
            onChange={handleTitleChange}
            placeholder=""
            onMouseDown={(e) => e.stopPropagation()} // Empêcher le drag
            onDragStart={(e) => e.preventDefault()} // Empêcher le drag natif
            onPaste={handlePaste} // Gérer aussi le paste d'images dans le titre

            style={{
              flex: 1,
              fontSize: '14px', 
              color: '#333', 
              fontWeight: 'bold',
              padding: '8px',
              backgroundColor: isDragging ? '#ffeb3b' : (isResizing ? '#e3f2fd' : '#f8f9fa'),
              border: '2px solid ' + (isDragging ? '#ff9800' : '#dee2e6'),
              borderRadius: '4px',
              outline: 'none',
              cursor: 'text',
            }}
          />
          
          {/* Icône poubelle au survol */}
          {isHovered && (
            <div 
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                fontSize: '16px',
                color: '#6c757d',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #e0e0e0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                zIndex: 10,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Êtes-vous sûr de vouloir supprimer ce bloc ?')) {
                  onDelete(block.id);
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#dc3545';
                e.currentTarget.style.backgroundColor = '#fff5f5';
                e.currentTarget.style.borderColor = '#dc3545';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6c757d';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.borderColor = '#e0e0e0';
              }}
            >
              🗑️
            </div>
          )}
        </div>
        
                {/* Content area - Rich text editor */}
        <div
          ref={(el) => {
            if (el) {
              // Force LTR à chaque rendu
              el.dir = 'ltr';
              el.style.direction = 'ltr';
              el.style.textAlign = 'left';
              el.style.unicodeBidi = 'embed';
              
              // Nettoyer le contenu de tout attribut RTL
              const cleanContent = localContent
                .replace(/dir\s*=\s*["']rtl["']/gi, 'dir="ltr"')
                .replace(/direction\s*:\s*rtl/gi, 'direction: ltr')
                .replace(/text-align\s*:\s*right/gi, 'text-align: left');
              
              if (el.innerHTML !== cleanContent) {
                el.innerHTML = cleanContent;
              }
            }
          }}
          contentEditable
          dir="ltr"
          onInput={handleContentChange}
          onClick={handleContentClick}
          onDoubleClick={handleContentDoubleClick}
          onKeyDown={handleContentKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onPaste={handlePasteInContent}
          suppressContentEditableWarning={true}
          style={{
            width: '100%',
            flex: 1,
            minHeight: '60px',
            maxHeight: block.attachments.length > 0 ? 'calc(100% - 150px)' : 'calc(100% - 80px)',
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            lineHeight: '1.5',
            backgroundColor: 'transparent',
            fontFamily: 'inherit',
            cursor: 'text',
            overflow: 'auto',
            padding: '8px',
            direction: 'ltr',
            textAlign: 'left',
            unicodeBidi: 'embed',
          }}
        />
        
        {/* Attachments */}
        {block.attachments.length > 0 ? (
          <div 
            style={{ 
              marginTop: '8px', 
              borderTop: '1px solid #e0e0e0', 
              paddingTop: '8px',
              flexShrink: 0,
              maxHeight: '100px',
              overflow: 'visible'
            }}
            onMouseDown={(e) => e.stopPropagation()} // Empêcher le drag
          >
            <h4 style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#666', fontWeight: 'bold' }}>
              Fichiers joints ({block.attachments.length})
            </h4>
            <div style={{ 
              maxHeight: '90px', 
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#ccc #f1f1f1'
            }}>
              {block.attachments.map((file) => {
                const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
                const icon = isImage ? '🖼️' : '📎';
                
                return (
                  <div 
                    key={file.id} 
                    style={{ 
                      fontSize: '11px', 
                      marginBottom: '3px',
                      cursor: 'pointer',
                      color: '#007bff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      lineHeight: '1.4',
                      position: 'relative',
                      minHeight: '24px',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#f8f9fa'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, '_blank');
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e3f2fd';
                      e.currentTarget.style.borderColor = '#007bff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                    title={`${isImage ? 'Image' : 'Fichier'}: ${file.name}`}
                  >
                    <span style={{ flexShrink: 0, fontSize: '10px' }}>{icon}</span>
                    <span style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      fontWeight: '500'
                    }}>
                      {file.name.length > 25 ? file.name.substring(0, 25) + '...' : file.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAttachment(file.id, file.name);
                      }}
                      style={{
                        width: '16px',
                        height: '16px',
                        border: 'none',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(220, 53, 69, 0.8)',
                        color: 'white',
                        fontSize: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                        marginLeft: '6px',
                        fontWeight: 'bold'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 1)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.8)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title={`Supprimer ${file.name}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div 
            style={{ 
              marginTop: '8px', 
              borderTop: '1px dashed #d0d0d0', 
              paddingTop: '6px',
              textAlign: 'center',
              fontSize: '9px',
              color: '#999',
              fontStyle: 'italic',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            Glissez-déposez des fichiers ici
          </div>
        )}

      </div>
    </Resizable>
  );
}; 