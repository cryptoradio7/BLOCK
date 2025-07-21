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
}: EditableBlockProps) => {
  const [localContent, setLocalContent] = useState(block.content);
  const [localTitle, setLocalTitle] = useState(block.title || '');
  const [localSize, setLocalSize] = useState({ width: block.width, height: block.height });
  const [isResizing, setIsResizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchroniser la taille locale quand le bloc change de l'extérieur
  useEffect(() => {
    if (!isResizing) {
      setLocalSize({ width: block.width, height: block.height });
    }
  }, [block.width, block.height, isResizing]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce((updatedBlock: Partial<BlockType>) => {
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

  // Drop pour les fichiers désactivé temporairement pour éviter les conflits
  // const [{ canDrop }, drop] = useDrop(() => ({
  //   accept: ['FILE', 'IMAGE'],
  //   drop: (item: { files: FileList }) => handleFileUpload(item.files),
  //   collect: (monitor) => ({
  //     canDrop: !!monitor.canDrop(),
  //   }),
  // }));
  const canDrop = false;

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    debouncedSave({ content: newContent });
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
      minConstraints={[200, 100]}
      maxConstraints={[800, 600]}
      resizeHandles={['se']}
    >
      <div
        ref={(node) => {
          drag(node);
        }}
        className={`draggable-block ${isDragging ? 'is-dragging' : ''}`}
        style={{
          opacity: isDragging ? 0.5 : 1,
          backgroundColor: canDrop ? '#f0f8ff' : 'white',
          border: isResizing ? '2px solid #007bff' : (isDragging ? '3px solid #ff9800' : '2px solid #e0e0e0'),
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
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging) {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }
        }}
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
            placeholder="Titre du bloc..."
            onMouseDown={(e) => e.stopPropagation()} // Empêcher le drag
            onDragStart={(e) => e.preventDefault()} // Empêcher le drag natif
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
          
          {/* Indicateur de drag dans le coin */}
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            fontSize: '16px',
            color: isDragging ? '#ff9800' : '#666',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #e0e0e0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            {isDragging ? '🚀' : '⬌'}
          </div>
        </div>
        
        {/* Content area */}
        <textarea
          value={localContent}
          onChange={handleContentChange}
          placeholder="Contenu du bloc..."
          onMouseDown={(e) => e.stopPropagation()} // Empêcher le drag
          style={{
            width: '100%',
            height: '60%',
            border: 'none',
            resize: 'none',
            outline: 'none',
            fontSize: '14px',
            lineHeight: '1.5',
            backgroundColor: 'transparent',
            fontFamily: 'inherit',
            cursor: 'text',
          }}
        />
        
        {/* Attachments */}
        {block.attachments.length > 0 && (
          <div 
            style={{ marginTop: '12px', borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}
            onMouseDown={(e) => e.stopPropagation()} // Empêcher le drag
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
              Fichiers joints ({block.attachments.length})
            </h4>
            {block.attachments.map((file) => (
              <div key={file.id} style={{ fontSize: '12px', marginBottom: '4px' }}>
                📎 {file.name}
              </div>
            ))}
          </div>
        )}
        
        {/* File upload button */}
        <div 
          style={{ marginTop: '12px' }}
          onMouseDown={(e) => e.stopPropagation()} // Empêcher le drag
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            multiple
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            📎 Ajouter un fichier
          </button>
        </div>
      </div>
    </Resizable>
  );
}; 