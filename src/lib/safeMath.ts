/**
 * Safe math expression evaluator — NO eval(), NO Function()
 * Acepta solo: números, +, -, *, /, (, ), espacios, puntos decimales
 * Usa un parser recursivo descent propio
 */

export function safeMath(expr: string): number | null {
  const str = expr.trim()
  if (!str) return null
  // Whitelist estricto: solo dígitos, operadores y paréntesis
  if (!/^[\d\s+\-*/().]+$/.test(str)) return null

  let pos = 0
  const s = str.replace(/\s+/g, '')

  function parseExpr(): number {
    let left = parseTerm()
    while (pos < s.length && (s[pos] === '+' || s[pos] === '-')) {
      const op = s[pos++]
      const right = parseTerm()
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  function parseTerm(): number {
    let left = parseFactor()
    while (pos < s.length && (s[pos] === '*' || s[pos] === '/')) {
      const op = s[pos++]
      const right = parseFactor()
      if (op === '/' && right === 0) throw new Error('División por cero')
      left = op === '*' ? left * right : left / right
    }
    return left
  }

  function parseFactor(): number {
    // Negativo unario
    if (s[pos] === '-') { pos++; return -parseFactor() }
    // Paréntesis
    if (s[pos] === '(') {
      pos++ // consumir '('
      const val = parseExpr()
      if (s[pos] !== ')') throw new Error('Paréntesis no cerrado')
      pos++ // consumir ')'
      return val
    }
    // Número
    const start = pos
    if (pos < s.length && s[pos] === '+') pos++ // ignorar + unario
    while (pos < s.length && /[\d.]/.test(s[pos])) pos++
    if (pos === start) throw new Error(`Token inesperado: ${s[pos]}`)
    return parseFloat(s.slice(start, pos))
  }

  try {
    const result = parseExpr()
    if (pos !== s.length) return null // quedó algo sin parsear
    return isFinite(result) ? result : null
  } catch {
    return null
  }
}
