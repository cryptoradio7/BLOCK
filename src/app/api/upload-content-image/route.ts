import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import pool from '@/lib/db';

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

    // IMPORTANT: Ne PAS créer d'entrée dans block_attachments
    // L'image est seulement dans le contenu, pas dans les pièces jointes

    // Si c'est une image, créer les dimensions par défaut
    if (fileType === 'image') {
      try {
        // Lire les dimensions originales de l'image
        const sharp = require('sharp');
        const imageBuffer = Buffer.from(bytes);
        const metadata = await sharp(imageBuffer).metadata();
        
        // Créer les dimensions par défaut (sans attachment_id)
        await pool.query(
          `INSERT INTO image_dimensions 
           (block_id, image_url, image_name, width, height, original_width, original_height)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            blockId, 
            `/uploads/${fileName}`, 
            file.name,
            metadata.width || 300,
            metadata.height || 200,
            metadata.width || 300,
            metadata.height || 200
          ]
        );
        
        console.log(`✅ Dimensions d'image créées pour ${file.name}: ${metadata.width}x${metadata.height}`);
      } catch (error) {
        console.warn(`⚠️ Impossible de lire les dimensions de l'image ${file.name}:`, error);
        // Créer des dimensions par défaut si sharp échoue
        await pool.query(
          `INSERT INTO image_dimensions 
           (block_id, image_url, image_name, width, height, original_width, original_height)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [blockId, `/uploads/${fileName}`, file.name, 300, 200, 300, 200]
        );
      }
    }

    return NextResponse.json({
      id: null, // Pas d'ID d'attachment
      name: file.name,
      url: `/uploads/${fileName}`,
      type: fileType,
      isContentImage: true, // Marqueur pour indiquer que c'est une image du contenu
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload d\'image de contenu:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload de l\'image de contenu' },
      { status: 500 }
    );
  }
}
