import { useState, useCallback, useEffect, useRef } from 'react';

export interface ImageDimensions {
  id?: number;
  block_id: number;
  attachment_id?: number;
  image_url: string;
  image_name: string;
  width: number;
  height: number;
  original_width?: number;
  original_height?: number;
  position_x?: number;
  position_y?: number;
  created_at?: string;
  updated_at?: string;
}

export const useImageDimensions = (blockId: number, initialDimensions: ImageDimensions[] = []) => {
  const [dimensions, setDimensions] = useState<ImageDimensions[]>(initialDimensions);
  const [loading, setLoading] = useState(false);
  const shouldSkipFetchRef = useRef(initialDimensions.length > 0);

  useEffect(() => {
    setDimensions(initialDimensions);
    shouldSkipFetchRef.current = initialDimensions.length > 0;
  }, [blockId, initialDimensions]);

  // Charger les dimensions des images pour un bloc
  const loadImageDimensions = useCallback(async () => {
    if (!blockId) return;
    if (shouldSkipFetchRef.current) {
      shouldSkipFetchRef.current = false;
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/image-dimensions?blockId=${blockId}`);
      if (response.ok) {
        const data = await response.json();
        setDimensions(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des dimensions d\'images:', error);
    } finally {
      setLoading(false);
    }
  }, [blockId]);

  // Sauvegarder ou mettre à jour les dimensions d'une image
  const saveImageDimensions = useCallback(async (imageData: Partial<ImageDimensions>) => {
    if (!blockId) return;
    
    try {
      const response = await fetch('/api/image-dimensions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...imageData,
          block_id: blockId,
        }),
      });

      if (response.ok) {
        const savedDimensions = await response.json();
        
        // Mettre à jour l'état local
        setDimensions(prev => {
          const existingIndex = prev.findIndex(d => d.image_url === imageData.image_url);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = savedDimensions;
            return updated;
          } else {
            return [...prev, savedDimensions];
          }
        });

        return savedDimensions;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des dimensions d\'image:', error);
    }
  }, [blockId]);

  // Supprimer les dimensions d'une image
  const deleteImageDimensions = useCallback(async (imageUrl: string) => {
    if (!blockId) return;
    
    try {
      const response = await fetch(`/api/image-dimensions?blockId=${blockId}&imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Retirer de l'état local
        setDimensions(prev => prev.filter(d => d.image_url !== imageUrl));
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression des dimensions d\'image:', error);
    }
    return false;
  }, [blockId]);

  // Obtenir les dimensions d'une image spécifique
  const getImageDimensions = useCallback((imageUrl: string): ImageDimensions | undefined => {
    return dimensions.find(d => d.image_url === imageUrl);
  }, [dimensions]);

  // Mettre à jour les dimensions d'une image existante
  const updateImageDimensions = useCallback(async (
    imageUrl: string, 
    updates: Partial<Pick<ImageDimensions, 'width' | 'height' | 'position_x' | 'position_y'>>
  ) => {
    const existing = getImageDimensions(imageUrl);
    if (existing) {
      return await saveImageDimensions({
        ...existing,
        ...updates,
      });
    }
  }, [getImageDimensions, saveImageDimensions]);

  return {
    dimensions,
    loading,
    loadImageDimensions,
    saveImageDimensions,
    deleteImageDimensions,
    getImageDimensions,
    updateImageDimensions,
  };
};
