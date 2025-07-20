export interface Block {
  id: string
  type: 'text' | 'image' | 'file'
  content: string
  order: number
  x?: number
  y?: number
  width?: number
  height?: number
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: 'image' | 'pdf' | 'other'
  size: number
}

export interface Page {
  id: string
  title: string
  blocks: Block[]
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
} 