import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pageId = params.id

    // Vérifier si la page existe
    const existingPage = await pool.query(
      'SELECT * FROM pages WHERE id = $1',
      [pageId]
    )

    if (existingPage.rows.length === 0) {
      return NextResponse.json(
        { error: 'Page non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer la page (les blocs seront supprimés automatiquement grâce à CASCADE)
    await pool.query('DELETE FROM pages WHERE id = $1', [pageId])

    return NextResponse.json({ message: 'Page supprimée avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression de la page:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la page' },
      { status: 500 }
    )
  }
} 