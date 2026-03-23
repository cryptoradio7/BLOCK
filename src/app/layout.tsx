import type { Metadata } from 'next'
import '@/styles/globals.css'
import { DndProvider } from '@/components/DndProvider'
import FetchInterceptor from '@/components/FetchInterceptor'

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
        <FetchInterceptor />
        <DndProvider>
          {children}
        </DndProvider>
      </body>
    </html>
  )
} 