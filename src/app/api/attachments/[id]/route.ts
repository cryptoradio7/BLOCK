import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attachmentId = parseInt(params.id);

    // Récupérer les informations de l'attachment avant suppression
    const attachmentResult = await pool.query(
      'SELECT * FROM block_attachments WHERE id = $1',
      [attachmentId]
    );

    if (attachmentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pièce jointe non trouvée' },
        { status: 404 }
      );
    }

    const attachment = attachmentResult.rows[0];
    
    // Supprimer le fichier physique
    try {
      const filePath = join(process.cwd(), 'public', attachment.url);
      await unlink(filePath);
      console.log('🗑️ Fichier supprimé:', filePath);
    } catch (fileError) {
      console.warn('⚠️ Impossible de supprimer le fichier physique:', attachment.url);
      // On continue même si le fichier physique n'existe pas
    }

    // Supprimer l'entrée de la base de données
    await pool.query(
      'DELETE FROM block_attachments WHERE id = $1',
      [attachmentId]
    );

    console.log('✅ Pièce jointe supprimée:', { id: attachmentId, name: attachment.name });

    return NextResponse.json({ 
      success: true, 
      message: 'Pièce jointe supprimée avec succès',
      deletedAttachment: {
        id: attachment.id,
        name: attachment.name,
        url: attachment.url
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la pièce jointe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la pièce jointe' },
      { status: 500 }
    );
  }
} 