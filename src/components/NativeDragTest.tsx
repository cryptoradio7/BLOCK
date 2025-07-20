'use client';

import { useState } from 'react';

export const NativeDragTest = () => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dropResult, setDropResult] = useState<string>('');

  const handleDragStart = (e: React.DragEvent, item: string) => {
    console.log('🚀 Drag start:', item);
    setDraggedItem(item);
    e.dataTransfer.setData('text/plain', item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Permet le drop
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    console.log('🎯 Dropped:', data);
    setDropResult(`Dropped: ${data} at ${new Date().toLocaleTimeString()}`);
    setDraggedItem(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🧪 Test Drag Natif HTML5</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'Item 1')}
          style={{
            padding: '15px',
            margin: '10px',
            backgroundColor: draggedItem === 'Item 1' ? 'yellow' : 'lightblue',
            border: '2px solid blue',
            cursor: 'move',
            borderRadius: '8px',
            display: 'inline-block',
          }}
        >
          📦 Glissez-moi (Item 1)
        </div>
        
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'Item 2')}
          style={{
            padding: '15px',
            margin: '10px',
            backgroundColor: draggedItem === 'Item 2' ? 'yellow' : 'lightgreen',
            border: '2px solid green',
            cursor: 'move',
            borderRadius: '8px',
            display: 'inline-block',
          }}
        >
          📦 Glissez-moi (Item 2)
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          width: '400px',
          height: '150px',
          border: '3px dashed #999',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          fontSize: '18px',
          margin: '20px 0',
        }}
      >
        🎯 Zone de dépôt (drag natif)
      </div>

      {dropResult && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: 'lightgreen', 
          borderRadius: '5px',
          border: '1px solid green' 
        }}>
          ✅ {dropResult}
        </div>
      )}
    </div>
  );
}; 