'use client';

import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { useImageDimensions, ImageDimensions } from '@/hooks/useImageDimensions';

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
  imageDimensions?: ImageDimensions[];
};

interface EditableBlockProps {
  block: BlockType;
  readingOrder?: number;
  onUpdate: (updatedBlock: Partial<BlockType>) => void;
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

const EditableBlockComponent = ({
  block,
  readingOrder,
  onUpdate,
  onMove,
  onDelete,
}: EditableBlockProps) => {
  const [localContent, setLocalContent] = useState(block.content);
  const [localTitle, setLocalTitle] = useState(block.title || '');
  const [localSize, setLocalSize] = useState({ width: block.width, height: block.height });
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<number | null>(null);
  
  // Hook pour gérer les dimensions des images
  const { 
    dimensions: imageDimensions, 
    loadImageDimensions, 
    saveImageDimensions, 
    deleteImageDimensions,
    getImageDimensions 
  } = useImageDimensions(block.id, block.imageDimensions || []);
  
  // Référence pour le contenu editable
  const contentRef = useRef<HTMLDivElement>(null);

  // Synchroniser le contenu SEULEMENT au montage initial pour éviter les conflits
  useEffect(() => {
      setLocalContent(block.content);
  }, [block.id]); // Seulement quand l'ID change (nouveau bloc)

  // Synchroniser la taille locale quand le bloc change de l'extérieur
  useEffect(() => {
    if (!isResizing) {
      setLocalSize({ width: block.width, height: block.height });
    }
  }, [block.width, block.height, isResizing]);



  // Appliquer les dimensions sauvegardées aux images dans le contenu
  const applySavedImageDimensions = useCallback(() => {
    if (!contentRef.current || imageDimensions.length === 0) return;

    const images = contentRef.current.querySelectorAll('img[data-image-url]');
    images.forEach((img) => {
      const imageUrl = img.getAttribute('data-image-url');
      if (!imageUrl) return;

      const savedDimensions = getImageDimensions(imageUrl);
      if (savedDimensions && savedDimensions.width > 0 && savedDimensions.height > 0) {
        // Appliquer les dimensions sauvegardées
        (img as HTMLImageElement).style.width = `${savedDimensions.width}px`;
        (img as HTMLImageElement).style.height = `${savedDimensions.height}px`;
        
        // Appliquer les positions si disponibles
        if (savedDimensions.position_x !== undefined) {
          (img as HTMLImageElement).style.marginLeft = `${savedDimensions.position_x}px`;
        }
        if (savedDimensions.position_y !== undefined) {
          (img as HTMLImageElement).style.marginTop = `${savedDimensions.position_y}px`;
        }
        
      }
    });
  }, [imageDimensions, getImageDimensions]);

  // Charger les dimensions des images au montage du composant
  useEffect(() => {
    if (imageDimensions.length === 0) {
      loadImageDimensions();
    }
  }, [imageDimensions.length, loadImageDimensions]);

  // Appliquer les dimensions sauvegardées quand elles sont chargées
  useEffect(() => {
    if (imageDimensions.length > 0) {
      // Attendre que le DOM soit prêt
      const timer = setTimeout(() => {
        applySavedImageDimensions();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [imageDimensions, applySavedImageDimensions]);

  // Ajouter des boutons de suppression aux images existantes au montage
  useEffect(() => {
    const timer = setTimeout(() => {
      const contentDiv = document.querySelector(`[data-block-id="${block.id}"] [contenteditable]`) as HTMLDivElement;
      if (contentDiv) {
        const images = contentDiv.querySelectorAll('img:not(.processed)');
        if (images.length > 0) {
          console.log(`🔧 Ajout de boutons de suppression à ${images.length} image(s) dans le bloc ${block.id}`);
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
                e.preventDefault();
                if (confirm('Supprimer cette image ?')) {
                  console.log('🗑️ Suppression d\'image via bouton');
                  // Suppression simple et propre
                  imageContainer.remove();
                  
                  // Synchroniser le nouveau contenu
                  const newContent = contentDiv.innerHTML;
                  setLocalContent(newContent);
                  onUpdate({ ...block, content: newContent });
                  
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
  }, [block.id, block.content]); // ← REMIS block.content pour traiter les nouvelles images

  // Debounced save function avec nettoyage du contenu
  const debouncedSave = useCallback(
    debounce((updatedBlock: Partial<BlockType>) => {
      // ⚠️ PROTECTION ANTI-SUPPRESSION : Ne jamais sauvegarder un contenu complètement vide
      if (updatedBlock.content !== undefined) {
        // Si le nouveau contenu est vide mais qu'on avait du contenu avant, ignorer
        if (!updatedBlock.content.trim() && block.content.trim()) {
          console.warn(`⚠️ Bloc ${block.id}: Sauvegarde de contenu vide ignorée (contenu existant préservé)`);
          return;
        }
        
        // Nettoyer le contenu avant sauvegarde
        const cleanContent = updatedBlock.content
          .replace(/dir\s*=\s*["']rtl["']/gi, 'dir="ltr"')
          .replace(/style\s*=\s*["'][^"']*direction\s*:\s*rtl[^"']*["']/gi, '')
          .replace(/unicode-bidi\s*=\s*bidi-override/gi, '');
        updatedBlock.content = cleanContent;
        
        console.log(`💾 Bloc ${block.id}: Sauvegarde contenu (${cleanContent.length} chars)`);
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

    // Notification pour drag & drop
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 9999;
      box-shadow: 0 2px 8px rgba(0,123,255,0.2);
    `;
    tempDiv.textContent = `📎 ${newAttachments.length} fichier(s) ajouté(s) aux PIÈCES JOINTES !`;
    document.body.appendChild(tempDiv);
    
    setTimeout(() => {
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
    }, 3000);
  };

  // Fonction pour gérer le paste d'images dans le titre (vers attachments)
  // DÉSACTIVÉE pour éviter le double traitement avec handlePasteInContent
  const handlePaste = async (e: React.ClipboardEvent) => {
    // Ne traiter que si on n'est PAS dans le contenu editable
    const target = e.target as HTMLElement;
    if (target.contentEditable === 'true') {
      // Si on est dans le contenu editable, ne rien faire
      // handlePasteInContent s'en occupe
      return;
    }

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
        
        // Notification pour pièces jointes
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #007bff;
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        tempDiv.textContent = `📎 ${imageFiles.length} image(s) ajoutée(s) aux PIÈCES JOINTES !`;
        document.body.appendChild(tempDiv);
        
        setTimeout(() => {
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
        }, 3000);
        
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
        tempDiv.textContent = `📷 Ajout de ${imageFiles.length} image(s) dans le CONTENU...`;
        document.body.appendChild(tempDiv);

        // Upload des images (sans créer d'attachments)
        const uploadPromises = imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('blockId', block.id.toString());
          
          const response = await fetch('/api/upload-content-image', {
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
          // Sauvegarder les dimensions de l'image (sans attachment_id)
          saveImageDimensions({
            image_url: file.url,
            image_name: file.name,
            width: 300, // Largeur par défaut
            height: 200, // Hauteur par défaut
            // Pas d'attachment_id car c'est une image du contenu
          });

          const imageHtml = `
            <div class="image-container" style="display: inline-block; position: relative; margin: 8px 0;">
              <img src="${file.url}" 
                   alt="${file.name}" 
                   class="resizable" 
                   draggable="false" 
                   data-image-url="${file.url}"
                   data-image-name="${file.name}"
                   title="Image redimensionnable - utilisez les poignées pour redimensionner" 
                   style="max-width: 100%; height: auto; display: block;" />
              <button class="image-delete-button" 
                onclick="
                  event.stopPropagation();
                  if (confirm('Supprimer cette image ?')) {
                    const container = this.parentElement;
                    const contentDiv = container.closest('[contenteditable]');
                    const img = container.querySelector('img');
                    
                    // Supprimer les dimensions de la base de données
                    if (img && img.dataset.imageUrl) {
                      fetch('/api/image-dimensions?blockId=${block.id}&imageUrl=' + encodeURIComponent(img.dataset.imageUrl), {
                        method: 'DELETE'
                      }).catch(console.error);
                    }
                    
                    container.remove();
                    
                    // Déclencher manuellement l'événement input pour synchroniser
                    const inputEvent = new Event('input', { bubbles: true });
                    contentDiv.dispatchEvent(inputEvent);
                    
                  }
                " 
                title="Supprimer cette image">×</button>
            </div>
          `;
          newContent += imageHtml;
        });

        // Mettre à jour le contenu en toute sécurité
        if (contentElement) {
          contentElement.innerHTML = newContent;
        }
        setLocalContent(newContent);
        onUpdate({ ...block, content: newContent }); // ← SAUVEGARDE IMMÉDIATE des images collées

        // Mettre à jour la notification
        tempDiv.textContent = `✅ ${imageFiles.length} image(s) insérée(s) dans le CONTENU !`;
        tempDiv.style.background = '#28a745';
        
        // Supprimer la notification après 2 secondes
        setTimeout(() => {
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
        }, 2000);
        

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

    
    
  // Fonction pour nettoyer le contenu HTML
  const cleanHtmlContent = (content: string) => {
    return content
      // Supprimer les caractères invisibles
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      // Supprimer les attributs dir cachés
      .replace(/dir\s*=\s*["'][^"']*["']/gi, '')
      // Supprimer les styles de direction
      .replace(/style\s*=\s*["'][^"']*direction\s*:\s*[^"']*[^"']*["']/gi, '')
      // Nettoyer les balises vides
      .replace(/<([^>]+)>\s*<\/\1>/g, '')
      // Normaliser les espaces
      .replace(/\s+/g, ' ')
      .trim();
  };
    
  const handleContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    const cleanedContent = cleanHtmlContent(newContent);
    setLocalContent(cleanedContent);
    debouncedSave({ content: cleanedContent });
  };



  // Fonction pour supprimer une pièce jointe
  const handleDeleteAttachment = useCallback(async (attachmentId: number, attachmentName: string) => {
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
  }, [block.attachments, onUpdate]);

  // Gestionnaire d'événements clavier pour la suppression
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('🎹 Touche pressée:', event.key, 'selectedAttachmentId:', selectedAttachmentId);
      if (event.key === 'Delete' && selectedAttachmentId !== null) {
        console.log('🗑️ Suppression par clavier déclenchée pour:', selectedAttachmentId);
        event.preventDefault();
        const attachment = block.attachments.find(a => a.id === selectedAttachmentId);
        if (attachment) {
          console.log('✅ Attachment trouvé, suppression...');
          handleDeleteAttachment(selectedAttachmentId, attachment.name);
          setSelectedAttachmentId(null);
        } else {
          console.log('❌ Attachment non trouvé');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAttachmentId, block.attachments, handleDeleteAttachment]);

  // Fonction pour supprimer une image au survol avec confirmation
  const handleHoverDeleteImage = useCallback((attachmentId: number, fileName: string, event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    
    // Ajouter une classe de confirmation visuelle
    target.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
    target.style.border = '2px solid #dc3545';
    target.style.transform = 'scale(1.05)';
    
    // Créer un tooltip de confirmation
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Cliquez pour supprimer';
    tooltip.style.cssText = `
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: #dc3545;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 1000;
      pointer-events: none;
      animation: fadeIn 0.2s ease;
    `;
    
    // Ajouter l'animation CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateX(-50%) translateY(-5px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    target.appendChild(tooltip);
    
    // Supprimer après 2 secondes si pas de clic
    const timeout = setTimeout(() => {
      target.style.backgroundColor = '';
      target.style.border = '';
      target.style.transform = '';
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    }, 2000);
    
    // Gestionnaire de clic pour supprimer
    const handleClick = () => {
      clearTimeout(timeout);
      handleDeleteAttachment(attachmentId, fileName);
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
      target.removeEventListener('click', handleClick);
    };
    
    target.addEventListener('click', handleClick, { once: true });
  }, [handleDeleteAttachment]);

  // Fonction pour supprimer une image du contenu
  const handleDeleteImageFromContent = (imgElement: HTMLImageElement) => {
    console.log('🗑️ Tentative de suppression d\'image:', imgElement.src);
    
    if (confirm('Supprimer cette image du contenu ?')) {
      try {
        // ÉTAPE 1: Supprimer l'image du DOM
        const container = imgElement.closest('.image-container');
        const elementToRemove = container || imgElement;
        
        if (!elementToRemove) {
          console.error('❌ Élément à supprimer non trouvé');
          return;
        }
        
        // ÉTAPE 2: Supprimer les dimensions de la base de données si l'image a un data-image-url
        const imageUrl = imgElement.dataset.imageUrl;
        if (imageUrl) {
          console.log('🗑️ Suppression des dimensions pour:', imageUrl);
          deleteImageDimensions(imageUrl).catch(console.error);
        }
        
        // ÉTAPE 3: Supprimer l'élément du DOM
        elementToRemove.remove();
        console.log('✅ Élément supprimé du DOM');
        
        // ÉTAPE 4: Récupérer le nouveau contenu depuis le DOM
        const contentDiv = elementToRemove.closest('[contenteditable]') as HTMLDivElement;
        if (contentDiv) {
          const newContent = contentDiv.innerHTML;
          console.log('📝 Nouveau contenu:', newContent.length, 'caractères');
          setLocalContent(newContent);
          onUpdate({ ...block, content: newContent });
        }

        // Notification de succès
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
        
      } catch (error) {
        console.error('❌ Erreur lors de la suppression d\'image:', error);
        
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
      
    }
  };



  // Gérer le redimensionnement des images dans le contenu
  const handleImageResize = useCallback((imageElement: HTMLImageElement) => {
    const imageUrl = imageElement.dataset.imageUrl;
    if (!imageUrl) return;

    // Créer un ResizeObserver pour détecter les changements de taille
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        
        // Sauvegarder les nouvelles dimensions
        saveImageDimensions({
          image_url: imageUrl,
          image_name: imageElement.dataset.imageName || 'Image',
          width: Math.round(width),
          height: Math.round(height)
        });
        
        console.log(`📏 Image ${imageUrl} redimensionnée: ${Math.round(width)}x${Math.round(height)}`);
      }
    });

    resizeObserver.observe(imageElement);
    
    // Retourner la fonction de nettoyage
    return () => resizeObserver.disconnect();
  }, [saveImageDimensions]);

  // Gérer les double-clics sur les images pour les supprimer
  const handleContentDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      e.preventDefault();
      handleDeleteImageFromContent(target as HTMLImageElement);
    }
  };

  // Gérer les touches de clavier pour supprimer les images sélectionnées et colorer le texte
  const handleContentKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    console.log(`🔍 KeyDown: ${e.key}, Ctrl: ${e.ctrlKey}, Shift: ${e.shiftKey}, Alt: ${e.altKey}, Code: ${e.code}`);
    
    // Suppression d'images
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const selectedImage = e.currentTarget.querySelector('img.selected') as HTMLImageElement;
      if (selectedImage) {
        e.preventDefault();
        handleDeleteImageFromContent(selectedImage);
      }
    }
    
    // Coloration de texte avec Ctrl + chiffres (UNIQUEMENT les chiffres)
    console.log(`🔍 Test condition: Ctrl=${e.ctrlKey}, Shift=${e.shiftKey}, Alt=${e.altKey}, Key="${e.key}", Code="${e.code}", Regex test=${/^[0-9]$/.test(e.key)}`);
    
    // Accepter les touches normales ET le pavé numérique
    const isNumberKey = /^[0-9]$/.test(e.key) || e.code.startsWith('Numpad');
    
    if (e.ctrlKey && !e.shiftKey && !e.altKey && isNumberKey) {
      console.log(`🎯 Ctrl+${e.key} détecté - Tentative de coloration`);
      
      const selection = window.getSelection();
      console.log(`📝 Selection:`, selection);
      console.log(`📝 RangeCount:`, selection?.rangeCount);
      console.log(`📝 IsCollapsed:`, selection?.isCollapsed);
      
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();
        console.log(`📝 Texte sélectionné: "${selectedText}"`);
        
        if (selectedText.trim()) {
          e.preventDefault();
          console.log(`✅ Prévention du comportement par défaut`);
          
          // Définir les couleurs pour chaque raccourci
          const colorMap: { [key: string]: string } = {
            '1': '#000000', // Noir
            '2': '#ff0000', // Rouge
            '3': '#0000ff', // Bleu
            '4': '#00ff00', // Vert
            '5': '#ffff00', // Jaune
            '6': '#ffa500', // Orange
            '7': '#800080', // Violet
            '8': '#ff00ff', // Magenta
            '9': '#00ffff', // Cyan
            '0': '#808080', // Gris
          };
          
          // Extraire le chiffre (normal ou pavé numérique)
          const digit = e.code.startsWith('Numpad') ? e.code.replace('Numpad', '') : e.key;
          const color = colorMap[digit];
          console.log(`🎨 Couleur sélectionnée: ${color} pour la touche ${e.key} (digit: ${digit})`);
          
          if (color) {
            // Créer un span avec texte coloré
            const span = document.createElement('span');
            span.style.color = color;
            span.style.fontWeight = 'bold';
            
            console.log(`🔧 Span créé avec style:`, span.style.cssText);
            
            // Remplacer le texte sélectionné
            range.deleteContents();
            span.appendChild(document.createTextNode(selectedText));
            range.insertNode(span);
            
            // Mettre à jour la sélection
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Déclencher la sauvegarde
            const contentElement = e.currentTarget;
            const newContent = contentElement.innerHTML;
            setLocalContent(newContent);
            onUpdate({ ...block, content: newContent });
            
            console.log(`🎨 Texte coloré avec Ctrl+${e.key} (${color})`);
            console.log(`💾 Nouveau contenu:`, newContent);
          }
        } else {
          console.log(`❌ Texte sélectionné vide ou espaces uniquement`);
        }
      } else {
        console.log(`❌ Pas de sélection valide`);
      }
    }
    
    // Laisser passer tous les autres raccourcis standards (Ctrl+B, Ctrl+I, etc.)
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setLocalTitle(newTitle);
    debouncedSave({ title: newTitle });
  };

  // Fonction pour supprimer le bloc entier
  const handleDeleteBlock = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce bloc ?')) {
      onDelete(block.id);
    }
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
          if (!isDragging) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              setIsHovered(true);
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            setIsHovered(false);
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
        // Pas de paste au niveau du bloc principal pour éviter les conflits
      >
        {/* Indicateur d'ordre de lecture - toujours visible */}
        {readingOrder && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#007bff',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              zIndex: 10,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              border: '2px solid white',
            }}
            title={`Ordre de lecture: ${readingOrder}`}
          >
            {readingOrder}
          </div>
        )}

        {/* Bouton de suppression du bloc - visible au survol */}
        {isHovered && !isDragging && !isResizing && (
          <button
            className="block-delete-button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleDeleteBlock();
            }}
            onMouseDown={(e) => e.stopPropagation()} // Empêcher le drag
            title="Supprimer ce bloc"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#dc3545',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 10,
            opacity: isDragging ? 0.3 : 0.8,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = '#c82333';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = isDragging ? '0.3' : '0.8';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#dc3545';
          }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        )}

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
            onPaste={handlePaste} // Images dans le titre -> ajoutées aux pièces jointes

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

        </div>


        
                {/* Content area - Rich text editor */}
        <div
          ref={(el) => {
            if (el && el.innerHTML !== localContent) {
              // Synchroniser seulement si le contenu est vraiment différent et l'élément n'a pas le focus
              if (document.activeElement !== el) {
                el.innerHTML = localContent;
              }
            }
          }}
          contentEditable
          onInput={handleContentChange}
          onClick={handleContentClick}
          onDoubleClick={handleContentDoubleClick}
          onKeyDown={handleContentKeyDown}
          onMouseDown={(e) => {
            // Empêcher le drag du bloc lors de la sélection de texte
            e.stopPropagation();
          }}
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
                      overflow: 'visible',
                      lineHeight: '1.4',
                      position: 'relative',
                      minHeight: '24px',
                      border: '1px solid #e0e0e0',
                      backgroundColor: '#f8f9fa'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // Pour les images, supprimer directement
                      const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
                      if (isImage) {
                        if (confirm(`Supprimer l'image "${file.name}" ?`)) {
                          handleDeleteAttachment(file.id, file.name);
                        }
                      } else {
                        // Pour les autres fichiers, ouvrir normalement
                      window.open(file.url, '_blank');
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (selectedAttachmentId !== file.id) {
                      e.currentTarget.style.backgroundColor = '#e3f2fd';
                      e.currentTarget.style.borderColor = '#007bff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedAttachmentId !== file.id) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      }
                    }}
                    title={selectedAttachmentId === file.id 
                      ? `Appuyez sur Suppr pour supprimer "${file.name}"` 
                      : `Cliquez pour sélectionner "${file.name}"`
                    }
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
                        e.preventDefault();
                        handleDeleteAttachment(file.id, file.name);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: '1',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                        marginLeft: '8px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(220, 53, 69, 0.5)',
                        opacity: '1',
                        border: '2px solid #fff',
                        position: 'relative',
                        zIndex: 100
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.backgroundColor = '#c82333';
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.7)';
                      }}
                      onMouseLeave={(e) => {
                        e.stopPropagation();
                        e.currentTarget.style.backgroundColor = '#dc3545';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(220, 53, 69, 0.5)';
                      }}
                      title={`Supprimer ${file.name}`}
                    >
                      ✕
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

// OPTIMISATION: Memoize le composant pour éviter les re-renders inutiles
export const EditableBlock = memo(EditableBlockComponent, (prevProps, nextProps) => {
  // Re-render seulement si le bloc change vraiment (id, contenu, position, taille)
  // Retourne true si les props sont identiques (pas de re-render), false si différentes (re-render)
  const propsEqual = (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.title === nextProps.block.title &&
    prevProps.block.x === nextProps.block.x &&
    prevProps.block.y === nextProps.block.y &&
    prevProps.block.width === nextProps.block.width &&
    prevProps.block.height === nextProps.block.height &&
    prevProps.readingOrder === nextProps.readingOrder &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onMove === nextProps.onMove &&
    prevProps.onDelete === nextProps.onDelete
  );
  return propsEqual;
}); 