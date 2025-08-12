import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    // Reconstruire le nom de fichier complet depuis les paramètres
    const filename = params.filename.join('/');
    
    // Chemin vers le fichier dans public/uploads
    const filePath = join(process.cwd(), 'public', 'uploads', filename);
    
    // Vérifier que le fichier existe
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      );
    }
    
    // Vérifier que c'est bien dans le dossier uploads (sécurité)
    const normalizedPath = join(process.cwd(), 'public', 'uploads');
    const requestedPath = join(process.cwd(), 'public', 'uploads', filename);
    
    if (!requestedPath.startsWith(normalizedPath)) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    // Lire le fichier
    const fileBuffer = await readFile(filePath);
    const fileStats = await stat(filePath);
    
    // Déterminer le type MIME basé sur l'extension
    const ext = filename.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'txt':
        contentType = 'text/plain';
        break;
      case 'doc':
      case 'docx':
        contentType = 'application/msword';
        break;
      case 'xls':
      case 'xlsx':
        contentType = 'application/vnd.ms-excel';
        break;
      case 'ppt':
      case 'pptx':
        contentType = 'application/vnd.ms-powerpoint';
        break;
    }
    
    // Retourner le fichier avec les bons headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache 1 an
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la lecture du fichier' },
      { status: 500 }
    );
  }
}


