import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const blockId = formData.get('blockId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const filePath = join(uploadsDir, fileName);

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Déterminer le type de fichier
    const fileType = file.type.startsWith('image/') ? 'image' : 'file';

    // Sauvegarder dans la base de données
    const result = await pool.query(
      `INSERT INTO block_attachments (block_id, name, url, type) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [blockId, file.name, `/uploads/${fileName}`, fileType]
    );

    return NextResponse.json({
      id: result.rows[0].id,
      name: file.name,
      url: `/uploads/${fileName}`,
      type: fileType,
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    );
  }
} 