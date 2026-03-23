import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    
    // OPTIMISATION: Utiliser LEFT JOIN pour récupérer les attachments en une seule requête
    // au lieu de N+1 queries (une requête par bloc)
    let query = `
      SELECT 
        b.id, 
        b.type,
        b.title,
        b.content, 
        b.x, 
        b.y, 
        b.width, 
        b.height,
        b.page_id,
        b.created_at,
        b.updated_at,
        COALESCE(att.attachments, '[]'::json) AS attachments,
        COALESCE(img.image_dimensions, '[]'::json) AS image_dimensions
      FROM blocks b
      LEFT JOIN LATERAL (
        SELECT json_agg(
            json_build_object(
              'id', a.id,
              'name', a.name,
              'url', a.url,
              'type', a.type
            )
        ) AS attachments
        FROM block_attachments a
        WHERE a.block_id = b.id
      ) att ON true
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', i.id,
            'block_id', i.block_id,
            'attachment_id', i.attachment_id,
            'image_url', i.image_url,
            'image_name', i.image_name,
            'width', i.width,
            'height', i.height,
            'original_width', i.original_width,
            'original_height', i.original_height,
            'position_x', i.position_x,
            'position_y', i.position_y,
            'created_at', i.created_at,
            'updated_at', i.updated_at
          )
        ) AS image_dimensions
        FROM image_dimensions i
        WHERE i.block_id = b.id
      ) img ON true
    `;
    
    const queryParams: any[] = [];
    
    // Filtrer par page_id si fourni (OPTIMISATION: filtre côté serveur au lieu de côté client)
    if (pageId) {
      query += ' WHERE b.page_id = $1';
      queryParams.push(parseInt(pageId));
    }
    
    query += `
      ORDER BY b.created_at DESC
    `;
    
    const result = await pool.query(query, queryParams);
    
    // Transformer les résultats pour correspondre au format attendu
    const blocks = result.rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      x: row.x,
      y: row.y,
      width: row.width,
      height: row.height,
      page_id: row.page_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      attachments: Array.isArray(row.attachments) ? row.attachments : [],
      image_dimensions: Array.isArray(row.image_dimensions) ? row.image_dimensions : []
    }));
    
    return NextResponse.json(blocks);
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
      `INSERT INTO blocks (type, title, content, x, y, width, height, page_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      ['text', '', content || '', x || 50, y || 50, width || 300, height || 200, page_id || 1]
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