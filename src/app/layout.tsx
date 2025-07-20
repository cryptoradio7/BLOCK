import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Agile Vision BLOCK - Gestionnaire de Pages',
  description: 'Application moderne de gestion de pages et blocs par Agile Vision',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  )
} 