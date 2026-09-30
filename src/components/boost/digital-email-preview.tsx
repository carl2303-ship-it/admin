'use client'

import { useState, useTransition } from 'react'
import { getDigitalProductsForEmailPreview } from '@/lib/boost/actions'
import { btnGhost } from './ui'

function buildEmailHtml(
  products: { name: string; download_url: string | null }[]
) {
  const orderNumber = `TEST-${Date.now()}`
  const productsList = products
    .map((p) => {
      if (p.download_url) {
        return `<li style="margin-bottom: 15px;">
          <strong>${escapeHtml(p.name)}</strong><br>
          <a href="${escapeAttr(p.download_url)}" style="display: inline-block; margin-top: 8px; background-color: #007BFF; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Descarregar Produto</a>
        </li>`
      }
      return `<li style="margin-bottom: 15px;">
        <strong>${escapeHtml(p.name)}</strong><br>
        <span style="color: #FF9900;">⚠️ Link de download não configurado</span>
      </li>`
    })
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Os Seus Produtos Digitais - BOOST PADEL</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #111111; padding: 20px; text-align: center;">
    <h1 style="color: #007BFF; margin: 0;">BOOST PADEL</h1>
  </div>
  <div style="padding: 30px; background-color: #f9f9f9;">
    <h2 style="color: #111111;">Obrigado pela sua compra, Cliente Teste!</h2>
    <p>A sua encomenda <strong>#${orderNumber}</strong> foi processada com sucesso.</p>
    <p>Pode descarregar os seus produtos digitais através dos links abaixo:</p>
    <ul style="list-style: none; padding: 0;">${productsList}</ul>
    <div style="margin-top: 30px; padding: 15px; background-color: #FFF9E6; border-left: 4px solid #FF9900;">
      <p style="margin: 0; font-size: 14px;">
        <strong>Nota importante:</strong> Guarde estes links num local seguro. Pode utilizá-los para descarregar os seus produtos a qualquer momento.
      </p>
    </div>
    <p style="margin-top: 30px;">Se tiver alguma questão, não hesite em contactar-nos.</p>
    <p style="margin-top: 20px;">Bons treinos!<br><strong>Equipa BOOST PADEL</strong></p>
  </div>
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
    <p>© ${new Date().getFullYear()} BOOST PADEL. Todos os direitos reservados.</p>
  </div>
</body>
</html>`
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

export function DigitalEmailPreviewButton() {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        className={btnGhost}
        onClick={() => {
          start(async () => {
            setError(null)
            const result = await getDigitalProductsForEmailPreview()
            if (!result.ok) {
              setError(result.error)
              return
            }
            const html = buildEmailHtml(result.products)
            const w = window.open('', '_blank')
            if (!w) {
              setError('Popup bloqueado — permite popups neste site.')
              return
            }
            w.document.write(html)
            w.document.close()
          })
        }}
      >
        {pending ? 'A gerar…' : 'Testar email digital'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
