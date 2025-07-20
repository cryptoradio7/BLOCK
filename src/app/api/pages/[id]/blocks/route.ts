import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { Block } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pageId = params.id

    const result = await pool.query(`
      SELECT 
        b.id,
        b.type,
        b.content,
        b."order",
        b.created_at as "createdAt",
        b.updated_at as "updatedAt"
      FROM blocks b
      WHERE b.page_id = $1
      ORDER BY b."order" ASC
    `, [pageId])

    const blocks: Block[] = result.rows.map(row => ({
      id: row.id.toString(),
      type: row.type,
      content: row.content,
      order: row.order,
      attachments: [] // On gérera les attachments séparément
    }))

    return NextResponse.json(blocks)
  } catch (error) {
    console.error('Erreur lors de la récupération des blocs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des blocs' },
      { status: 500 }
    )
  }
} 