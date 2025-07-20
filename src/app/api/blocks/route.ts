import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        type,
        content, 
        x, 
        y, 
        width, 
        height,
        page_id,
        created_at,
        updated_at
      FROM blocks 
      ORDER BY created_at DESC
    `);
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des blocs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des blocs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, x, y, width, height, page_id } = body;

    const result = await pool.query(
      `INSERT INTO blocks (type, content, x, y, width, height, page_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      ['text', content || '', x || 0, y || 0, width || 300, height || 200, page_id || 1]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la création du bloc:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du bloc' },
      { status: 500 }
    );
  }
} 