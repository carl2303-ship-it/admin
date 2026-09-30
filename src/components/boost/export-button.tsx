'use client'

import { btnGhost } from './ui'

export function ExportButton({
  filename,
  mime = 'text/csv;charset=utf-8',
  content,
  label = 'Exportar',
}: {
  filename: string
  mime?: string
  content: string
  label?: string
}) {
  return (
    <button
      type="button"
      className={btnGhost}
      onClick={() => {
        if (!content.trim()) {
          window.alert('Nada para exportar')
          return
        }
        const blob = new Blob([content], { type: mime })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = filename
        link.click()
        URL.revokeObjectURL(link.href)
      }}
    >
      {pending ? '…' : label}
    </button>
  )
}
