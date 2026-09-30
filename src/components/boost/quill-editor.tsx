'use client'

import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
] as const

export function QuillEditor({
  name,
  defaultValue = '',
  placeholder = 'Escreva aqui…',
  minHeight = 180,
}: {
  name: string
  defaultValue?: string
  placeholder?: string
  minHeight?: number
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef<HTMLInputElement>(null)
  const quillRef = useRef<Quill | null>(null)

  useEffect(() => {
    if (!hostRef.current || quillRef.current) return

    const editorHost = document.createElement('div')
    editorHost.style.minHeight = `${minHeight}px`
    hostRef.current.innerHTML = ''
    hostRef.current.appendChild(editorHost)

    const quill = new Quill(editorHost, {
      theme: 'snow',
      placeholder,
      modules: { toolbar: TOOLBAR },
    })

    if (defaultValue) {
      quill.root.innerHTML = defaultValue
    }
    if (hiddenRef.current) {
      hiddenRef.current.value = quill.root.innerHTML
    }

    quill.on('text-change', () => {
      if (hiddenRef.current) {
        hiddenRef.current.value = quill.root.innerHTML
      }
    })

    quillRef.current = quill

    return () => {
      quillRef.current = null
      if (hostRef.current) hostRef.current.innerHTML = ''
    }
    // Intentionally mount once; defaultValue is initial only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="boost-quill rounded-xl border border-zinc-300 bg-white [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:rounded-b-xl [&_.ql-editor]:min-h-[160px]">
      <div ref={hostRef} />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  )
}
