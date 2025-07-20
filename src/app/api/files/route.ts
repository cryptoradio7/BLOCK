import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Simulation du stockage de fichier
    // En production, vous utiliseriez un service comme AWS S3, Cloudinary, etc.
    const fileInfo = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      url: `/uploads/${file.name}`, // URL simulée
      uploadedAt: new Date()
    }

    return NextResponse.json(fileInfo, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement du fichier' },
      { status: 500 }
    )
  }
} 