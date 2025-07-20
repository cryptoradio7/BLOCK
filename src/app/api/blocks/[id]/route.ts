import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blockId = params.id

    // Vérifier si le bloc existe
    const existingBlock = await pool.query(
      'SELECT * FROM blocks WHERE id = $1',
      [blockId]
    )

    if (existingBlock.rows.length === 0) {
      return NextResponse.json(
        { error: 'Bloc non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le bloc (les attachments seront supprimés automatiquement grâce à CASCADE)
    await pool.query('DELETE FROM blocks WHERE id = $1', [blockId])

    return NextResponse.json({ message: 'Bloc supprimé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la suppression du bloc:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du bloc' },
      { status: 500 }
    )
  }
} 