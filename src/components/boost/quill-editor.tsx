'use client'

import { useEffect, useRef } from 'react'
import 'quill/dist/quill.snow.css'

const TOOLBAR = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
] as const

type QuillInstance = {
  root: { innerHTML: string }
  on: (event: string, handler: () => void) => void
}

/**
 * Quill JS touches `document` on import — load only in the browser.
 * Top-level `import Quill from 'quill'` 500s Next SSR (product/blog edit).
 */
export function QuillEditor({
  name,
  defaultValue = '',
  placeholder = 'Escreve aqui…',
  minHeight = 180,
}: {
  name: string
  defaultValue?: string
  placeholder?: string
  minHeight?: number
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const hiddenRef = useRef<HTMLInputElement>(null)
  const quillRef = useRef<QuillInstance | null>(null)

  useEffect(() => {
    if (!hostRef.current || quillRef.current) return
    let cancelled = false

    void (async () => {
      const { default: Quill } = await import('quill')
      if (cancelled || !hostRef.current || quillRef.current) return

      const editorHost = document.createElement('div')
      editorHost.style.minHeight = `${minHeight}px`
      hostRef.current.innerHTML = ''
      hostRef.current.appendChild(editorHost)

      const quill = new Quill(editorHost, {
        theme: 'snow',
        placeholder,
        modules: { toolbar: TOOLBAR },
      }) as QuillInstance

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
    })()

    return () => {
      cancelled = true
      quillRef.current = null
      if (hostRef.current) hostRef.current.innerHTML = ''
    }
    // Mount once; defaultValue is initial only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Flush Quill → hidden input on form submit (covers race before text-change).
  useEffect(() => {
    const form = hiddenRef.current?.form
    if (!form) return
    const onSubmit = () => {
      const quill = quillRef.current
      if (quill && hiddenRef.current) {
        hiddenRef.current.value = quill.root.innerHTML
      }
    }
    form.addEventListener('submit', onSubmit)
    return () => form.removeEventListener('submit', onSubmit)
  }, [])

  return (
    <div className="boost-quill rounded-xl border border-slate-700 bg-slate-950 [&_.ql-toolbar]:rounded-t-xl [&_.ql-container]:rounded-b-xl [&_.ql-editor]:min-h-[160px]">
      <div ref={hostRef} />
      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        defaultValue={defaultValue}
      />
    </div>
  )
}
