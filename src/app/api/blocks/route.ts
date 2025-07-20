import { NextRequest, NextResponse } from 'next/server'
import { Block } from '@/types'

// Simulation d'une base de données en mémoire
let blocks: Block[] = []

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

    const existingBlockIndex = blocks.findIndex(block => block.id === id)
    
    if (existingBlockIndex === -1) {
      return NextResponse.json(
        { error: 'Bloc non trouvé' },
        { status: 404 }
      )
    }

    const updatedBlock: Block = {
      ...blocks[existingBlockIndex],
      content: content !== undefined ? content : blocks[existingBlockIndex].content,
      order: order !== undefined ? order : blocks[existingBlockIndex].order,
      type: type !== undefined ? type : blocks[existingBlockIndex].type,
      attachments: attachments !== undefined ? attachments : blocks[existingBlockIndex].attachments
    }

    blocks[existingBlockIndex] = updatedBlock

    return NextResponse.json(updatedBlock)
  } catch (error) {
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

    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: content || '',
      order: order || 0,
      attachments: []
    }

    blocks.push(newBlock)

    return NextResponse.json(newBlock, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création du bloc' },
      { status: 500 }
    )
  }
} 