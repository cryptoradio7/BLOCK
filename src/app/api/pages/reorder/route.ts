import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageIds } = body

    if (!Array.isArray(pageIds)) {
      return NextResponse.json(
        { error: 'pageIds doit être un tableau' },
        { status: 400 }
      )
    }

    // Mettre à jour l'ordre des pages en utilisant l'updated_at comme indicateur d'ordre
    // Plus l'updated_at est récent, plus la page apparaît en haut
    const promises = pageIds.map((pageId: string, index: number) => {
      // Utiliser un timestamp décroissant pour l'ordre
      const orderTimestamp = new Date(Date.now() + (pageIds.length - index) * 1000)
      
      return pool.query(
        'UPDATE pages SET updated_at = $1 WHERE id = $2',
        [orderTimestamp, pageId]
      )
    })

    await Promise.all(promises)

    return NextResponse.json({ success: true, message: 'Ordre des pages mis à jour' })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'ordre des pages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'ordre des pages' },
      { status: 500 }
    )
  }
} 