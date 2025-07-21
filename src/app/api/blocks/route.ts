import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    console.log('🔍 GET /api/blocks - Récupération des blocs...');
    
    const result = await pool.query(`
      SELECT 
        id, 
        type,
        title,
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

    // Récupérer les attachments pour chaque bloc
    const blocksWithAttachments = await Promise.all(
      result.rows.map(async (block) => {
        const attachmentsResult = await pool.query(
          'SELECT id, name, url, type FROM block_attachments WHERE block_id = $1',
          [block.id]
        );
        
        return {
          ...block,
          attachments: attachmentsResult.rows
        };
      })
    );
    
    console.log('✅ Blocs avec attachments récupérés:', blocksWithAttachments.length);
    return NextResponse.json(blocksWithAttachments);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des blocs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des blocs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('➕ POST /api/blocks - Création nouveau bloc...');
    
    const body = await request.json();
    const { content, x, y, width, height, page_id } = body;

    const result = await pool.query(
      `INSERT INTO blocks (type, title, content, x, y, width, height, page_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      ['text', '', content || '', x || 50, y || 50, width || 300, height || 200, page_id || 1]
    );

    console.log('✅ Bloc créé avec ID:', result.rows[0].id);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Erreur lors de la création du bloc:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du bloc' },
      { status: 500 }
    );
  }
} 