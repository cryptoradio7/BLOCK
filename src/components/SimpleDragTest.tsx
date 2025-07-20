'use client';

import { useDrag, useDrop } from 'react-dnd';

const SimpleDraggable = ({ id }: { id: number }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TEST',
    item: { id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={(node) => {
        drag(node);
      }}
      style={{
        padding: '20px',
        margin: '10px',
        backgroundColor: isDragging ? 'yellow' : 'lightblue',
        border: '2px solid blue',
        cursor: 'move',
        borderRadius: '8px',
      }}
    >
      Bloc {id} - {isDragging ? 'EN DRAG' : 'GLISSEZ-MOI'}
    </div>
  );
};

const SimpleDropZone = () => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TEST',
    drop: (item: any) => {
      console.log('🎯 SIMPLE DROP RÉUSSI !', item);
      alert(`Bloc ${item.id} déposé avec succès !`);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={(node) => {
        drop(node);
      }}
      style={{
        width: '400px',
        height: '200px',
        border: '3px dashed ' + (isOver ? 'green' : 'gray'),
        backgroundColor: isOver ? 'lightgreen' : 'lightgray',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '20px',
        borderRadius: '8px',
      }}
    >
      {isOver ? '🎯 DÉPOSEZ ICI !' : '📦 Zone de dépôt'}
    </div>
  );
};

export const SimpleDragTest = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>🧪 Test Simple Drag & Drop</h2>
      <SimpleDraggable id={1} />
      <SimpleDraggable id={2} />
      <SimpleDropZone />
      <p>👆 Glissez un bloc bleu vers la zone grise !</p>
    </div>
  );
}; 