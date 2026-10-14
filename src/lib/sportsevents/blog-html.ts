/**
 * Normaliza conteúdo do blog: plain text / markdown leve → HTML estruturado.
 * Se já for HTML, devolve-o (com wraps mínimos se necessário).
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function looksLikeHtml(input: string): boolean {
  return /<\/?(p|h[1-6]|ul|ol|li|div|section|article|table|blockquote|strong|em|a)\b/i.test(
    input
  )
}

function isHeadingLine(line: string): boolean {
  const t = line.trim()
  if (/^#{1,3}\s+\S/.test(t)) return true
  // "1. Spring Stage (...)" numbered sections
  if (/^\d+\.\s+\S/.test(t) && t.length < 140) return true
  if (
    /^(Summary|Conclusion|Introduction)\b[:\s]/i.test(t) &&
    t.length < 120
  ) {
    return true
  }
  if (/^We Engineer\b/i.test(t) && t.length < 100) return true
  return false
}

function headingText(line: string): string {
  return line
    .trim()
    .replace(/^#{1,3}\s+/, '')
    .replace(/^\d+\.\s+/, '')
}

function isBullet(line: string): boolean {
  return /^\s*([-•*]|\d+\.)\s+\S/.test(line)
}

function bulletText(line: string): string {
  return line.trim().replace(/^([-•*]|\d+\.)\s+/, '')
}

function formatInline(text: string): string {
  let s = escapeHtml(text)
  // [label] or 👉 [BUILD MY CAMP] style CTAs → link placeholder to /construir
  s = s.replace(
    /👉\s*\[([^\]]+)\]/g,
    '<a href="/construir"><strong>👉 $1</strong></a>'
  )
  s = s.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)]+|\/[^)]+)\)/g,
    '<a href="$2">$1</a>'
  )
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(
    /^(Weather Conditions|Best For|Top Destinations|Booking Window):\s*(.*)$/i,
    '<strong>$1:</strong> $2'
  )
  return s
}

/** Converte TSV / lines with tabs into a simple HTML table. */
function tryTable(block: string): string | null {
  const lines = block
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return null
  const split = (l: string) =>
    l.includes('\t') ? l.split('\t') : l.split(/\s{2,}/)
  const rows = lines.map(split)
  if (rows.every((r) => r.length >= 2) && rows[0].length >= 3) {
    const head = rows[0]
    const body = rows.slice(1)
    return [
      '<div class="blog-table-wrap"><table>',
      '<thead><tr>',
      ...head.map((c) => `<th>${formatInline(c)}</th>`),
      '</tr></thead><tbody>',
      ...body.map(
        (r) =>
          `<tr>${r.map((c) => `<td>${formatInline(c)}</td>`).join('')}</tr>`
      ),
      '</tbody></table></div>',
    ].join('')
  }
  return null
}

function preprocessPlainText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\n(?=#{1,3}\s+\S)/g, '\n\n')
    .replace(/\n(?=\d+\.\s+\S)/g, '\n\n')
    .replace(
      /\n(?=(Weather Conditions|Best For|Top Destinations|Booking Window):)/gi,
      '\n\n'
    )
    .replace(/\n(?=(Summary|We Engineer|Conclusion)\b)/gi, '\n\n')
    .replace(/\n(?=Camp Season[\t ])/g, '\n\n')
    .replace(/\n(?=👉)/g, '\n\n')
}

export function plainTextToBlogHtml(raw: string): string {
  const text = preprocessPlainText(raw).trim()
  if (!text) return ''

  const blocks = text.split(/\n{2,}/)
  const out: string[] = []
  let i = 0
  let skippedTitle = false

  while (i < blocks.length) {
    const block = blocks[i].trim()
    i += 1
    if (!block) continue

    const table = tryTable(block)
    if (table) {
      out.push(table)
      continue
    }

    const lines = block.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim())

    // Opening: title + tagline on consecutive lines
    if (!skippedTitle && lines.length >= 2 && lines[0].length > 40 && !isHeadingLine(lines[0])) {
      skippedTitle = true
      // Skip repeating the H1 title; keep tagline + any extra lines
      const rest = lines.slice(1)
      if (rest[0]) {
        out.push(`<p class="blog-lead">${formatInline(rest[0].trim())}</p>`)
      }
      for (const line of rest.slice(1)) {
        out.push(`<p>${formatInline(line.trim())}</p>`)
      }
      continue
    }
    if (!skippedTitle && lines.length === 1 && lines[0].length > 40 && !isHeadingLine(lines[0])) {
      // Lone title block — skip (page already has H1)
      skippedTitle = true
      continue
    }

    // All bullets?
    if (lines.every((l) => isBullet(l))) {
      out.push(
        `<ul>${lines.map((l) => `<li>${formatInline(bulletText(l))}</li>`).join('')}</ul>`
      )
      continue
    }

    // Single-line heading
    if (lines.length === 1 && isHeadingLine(lines[0])) {
      out.push(`<h2>${formatInline(headingText(lines[0]))}</h2>`)
      continue
    }

    // Multi-line: first line heading + rest
    if (lines.length > 1 && isHeadingLine(lines[0])) {
      out.push(`<h2>${formatInline(headingText(lines[0]))}</h2>`)
      const rest = lines.slice(1)
      if (rest.every((l) => isBullet(l))) {
        out.push(
          `<ul>${rest.map((l) => `<li>${formatInline(bulletText(l))}</li>`).join('')}</ul>`
        )
      } else {
        for (const line of rest) {
          const labeled = line.match(
            /^(Weather Conditions|Best For|Top Destinations|Booking Window):\s*(.*)$/i
          )
          if (labeled) {
            out.push(
              `<p><strong>${escapeHtml(labeled[1])}:</strong> ${formatInline(labeled[2])}</p>`
            )
          } else {
            out.push(`<p>${formatInline(line)}</p>`)
          }
        }
      }
      continue
    }

    // Labeled single line
    if (lines.length === 1) {
      const labeled = lines[0].match(
        /^(Weather Conditions|Best For|Top Destinations|Booking Window):\s*(.*)$/i
      )
      if (labeled) {
        out.push(
          `<p><strong>${escapeHtml(labeled[1])}:</strong> ${formatInline(labeled[2])}</p>`
        )
        continue
      }
    }

    const para = lines.map((l) => l.trim()).join(' ')
    if (
      (para.length < 110 && !/[.!?]$/.test(para)) ||
      (/^(Mornings|Afternoons|Nights)\b/i.test(para) && para.length < 160)
    ) {
      out.push(`<p class="blog-lead">${formatInline(para)}</p>`)
    } else {
      out.push(`<p>${formatInline(para)}</p>`)
    }
  }

  return out.join('\n')
}

/** Garante HTML renderizável no site (idempotente). */
export function ensureBlogHtml(input: string): string {
  const raw = (input || '').trim()
  if (!raw) return ''
  if (looksLikeHtml(raw)) return raw
  return plainTextToBlogHtml(raw)
}
