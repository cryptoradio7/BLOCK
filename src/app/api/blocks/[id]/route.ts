import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      'SELECT * FROM blocks WHERE id = $1',
      [parseInt(params.id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bloc non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du bloc:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du bloc' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, content, x, y, width, height } = body;

    // ⚠️ PROTECTION ANTI-SUPPRESSION : Vérifier le contenu existant
    if (content !== undefined) {
      const currentBlock = await pool.query(
        'SELECT content FROM blocks WHERE id = $1',
        [parseInt(params.id)]
      );
      
      if (currentBlock.rows.length > 0) {
        const existingContent = currentBlock.rows[0].content || '';
        // Si on essaie de remplacer du contenu existant par du vide, ignorer
        if (existingContent.trim() && !content.trim()) {
          console.warn(`⚠️ API Bloc ${params.id}: Tentative de suppression de contenu ignorée`);
          return NextResponse.json(
            { error: 'Suppression de contenu existant non autorisée' },
            { status: 400 }
          );
        }
      }
    }

    // Arrondir les coordonnées pour PostgreSQL
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const roundedWidth = Math.round(width);
    const roundedHeight = Math.round(height);

    console.log(`💾 API Bloc ${params.id}: Mise à jour (contenu: ${content?.length || 0} chars)`);

    const result = await pool.query(
      `UPDATE blocks 
       SET title = $1, content = $2, x = $3, y = $4, width = $5, height = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title || '', content, roundedX, roundedY, roundedWidth, roundedHeight, parseInt(params.id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bloc non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du bloc:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du bloc' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await pool.query(
      'DELETE FROM blocks WHERE id = $1 RETURNING *',
      [parseInt(params.id)]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bloc non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du bloc:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du bloc' },
      { status: 500 }
    );
  }
} 