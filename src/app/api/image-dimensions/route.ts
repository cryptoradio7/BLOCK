import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Récupérer toutes les dimensions d'images pour un bloc
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');
    
    if (blockId) {
      // Récupérer les dimensions pour un bloc spécifique
      const result = await pool.query(
        'SELECT * FROM image_dimensions WHERE block_id = $1 ORDER BY created_at ASC',
        [parseInt(blockId)]
      );
      return NextResponse.json(result.rows);
    } else {
      // Récupérer toutes les dimensions
      const result = await pool.query(
        'SELECT * FROM image_dimensions ORDER BY block_id, created_at ASC'
      );
      return NextResponse.json(result.rows);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des dimensions d\'images:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des dimensions d\'images' },
      { status: 500 }
    );
  }
}

// Créer ou mettre à jour les dimensions d'une image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      block_id, 
      attachment_id, 
      image_url, 
      image_name, 
      width, 
      height, 
      original_width, 
      original_height,
      position_x = 0,
      position_y = 0
    } = body;

    if (!block_id || !image_url || !image_name) {
      return NextResponse.json(
        { error: 'block_id, image_url et image_name sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'image existe déjà pour ce bloc
    const existingResult = await pool.query(
      'SELECT id FROM image_dimensions WHERE block_id = $1 AND image_url = $2',
      [block_id, image_url]
    );

    if (existingResult.rows.length > 0) {
      // Mettre à jour l'existant
      const result = await pool.query(
        `UPDATE image_dimensions 
         SET width = $1, height = $2, original_width = $3, original_height = $4, 
             position_x = $5, position_y = $6, attachment_id = $7, updated_at = CURRENT_TIMESTAMP
         WHERE block_id = $8 AND image_url = $9
         RETURNING *`,
        [width, height, original_width, original_height, position_x, position_y, attachment_id, block_id, image_url]
      );
      
      console.log(`✅ Dimensions d'image mises à jour pour bloc ${block_id}, image ${image_name}`);
      return NextResponse.json(result.rows[0]);
    } else {
      // Créer une nouvelle entrée
      const result = await pool.query(
        `INSERT INTO image_dimensions 
         (block_id, attachment_id, image_url, image_name, width, height, original_width, original_height, position_x, position_y)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [block_id, attachment_id, image_url, image_name, width, height, original_width, original_height, position_x, position_y]
      );
      
      console.log(`✅ Nouvelles dimensions d'image créées pour bloc ${block_id}, image ${image_name}`);
      return NextResponse.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des dimensions d\'image:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde des dimensions d\'image' },
      { status: 500 }
    );
  }
}

// Supprimer les dimensions d'une image
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');
    const imageUrl = searchParams.get('imageUrl');
    
    if (!blockId || !imageUrl) {
      return NextResponse.json(
        { error: 'blockId et imageUrl sont requis' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM image_dimensions WHERE block_id = $1 AND image_url = $2 RETURNING *',
      [parseInt(blockId), imageUrl]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Dimensions d'image supprimées pour bloc ${blockId}, image ${imageUrl}`);
      return NextResponse.json({ success: true, deleted: result.rows[0] });
    } else {
      return NextResponse.json(
        { error: 'Dimensions d\'image non trouvées' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Erreur lors de la suppression des dimensions d\'image:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression des dimensions d\'image' },
      { status: 500 }
    );
  }
}
