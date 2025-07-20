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
    const { content, x, y, width, height } = body;

    // Arrondir les coordonnées pour PostgreSQL
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    const roundedWidth = Math.round(width);
    const roundedHeight = Math.round(height);

    const result = await pool.query(
      `UPDATE blocks 
       SET content = $1, x = $2, y = $3, width = $4, height = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [content, roundedX, roundedY, roundedWidth, roundedHeight, parseInt(params.id)]
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