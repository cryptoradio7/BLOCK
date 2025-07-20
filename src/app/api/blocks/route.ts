import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { Block } from '@/types'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, content, order, type, attachments } = body

    if (!id) {
      return NextResponse.json(
        { error: 'L\'ID du bloc est requis' },
        { status: 400 }
      )
    }

    // Vérifier si le bloc existe
    const existingBlock = await pool.query(
      'SELECT * FROM blocks WHERE id = $1',
      [id]
    )

    if (existingBlock.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bloc non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le bloc
    const updateFields = []
    const values = []
    let paramCount = 1

    if (content !== undefined) {
      updateFields.push(`content = $${paramCount}`)
      values.push(content)
      paramCount++
    }

    if (order !== undefined) {
      updateFields.push(`"order" = $${paramCount}`)
      values.push(order)
      paramCount++
    }

    if (type !== undefined) {
      updateFields.push(`type = $${paramCount}`)
      values.push(type)
      paramCount++
    }

    if (updateFields.length === 0) {
      return NextResponse.json(existingBlock.rows[0])
    }

    values.push(id)
    const result = await pool.query(
      `UPDATE blocks SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    )

    const updatedBlock: Block = {
      id: result.rows[0].id.toString(),
      type: result.rows[0].type,
      content: result.rows[0].content,
      order: result.rows[0].order,
      attachments: [] // On gérera les attachments séparément
    }

    return NextResponse.json(updatedBlock)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du bloc:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du bloc' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageId, type, content, order } = body

    if (!pageId || !type) {
      return NextResponse.json(
        { error: 'L\'ID de la page et le type sont requis' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      'INSERT INTO blocks (page_id, type, content, "order") VALUES ($1, $2, $3, $4) RETURNING *',
      [pageId, type, content || '', order || 0]
    )

    const newBlock: Block = {
      id: result.rows[0].id.toString(),
      type: result.rows[0].type,
      content: result.rows[0].content,
      order: result.rows[0].order,
      attachments: []
    }

    return NextResponse.json(newBlock, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du bloc:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du bloc' },
      { status: 500 }
    )
  }
} 