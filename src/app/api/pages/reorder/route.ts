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

    console.log('📋 Réorganisation des pages - nouvel ordre:', pageIds)

    // Mettre à jour l'order_index de chaque page selon sa nouvelle position
    const promises = pageIds.map((pageId: string, index: number) => {
      const newOrderIndex = index + 1 // Commencer à 1 pour un ordre plus lisible
      
      console.log(`📝 Page ${pageId} → order_index: ${newOrderIndex}`)
      
      return pool.query(
        'UPDATE pages SET order_index = $1 WHERE id = $2',
        [newOrderIndex, pageId]
      )
    })

    await Promise.all(promises)

    console.log('✅ Ordre des pages sauvegardé en base de données')

    return NextResponse.json({ 
      success: true, 
      message: 'Ordre des pages mis à jour',
      newOrder: pageIds 
    })
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'ordre des pages:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'ordre des pages' },
      { status: 500 }
    )
  }
} 