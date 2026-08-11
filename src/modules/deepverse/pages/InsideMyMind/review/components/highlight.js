const COLORS = {
  keyword: '#c678dd',
  string: '#98c379',
  number: '#d19a66',
  comment: '#7f848e',
  tag: '#e5c07b',
  property: '#61afef',
  default: '#abb2bf',
}

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'import', 'from', 'export', 'default',
  'async', 'await', 'if', 'else', 'try', 'catch', 'finally', 'new', 'require', 'throw',
  'typeof', 'true', 'false', 'null', 'undefined', 'switch', 'case', 'for', 'of', 'in',
  'while', 'do', 'break', 'continue', 'class', 'extends', 'super', 'this', 'module', 'process',
])

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'INDEX',
  'ON', 'AS', 'NOT', 'NULL', 'PRIMARY', 'KEY', 'TEXT', 'BIGINT', 'BIGSERIAL', 'INT',
  'DEFAULT', 'now', 'BEGIN', 'COMMIT', 'GROUP', 'ORDER', 'BY', 'JOIN', 'AND', 'OR',
  'IN', 'VALUES', 'SET', 'TIMESTAMPTZ', 'UNIQUE', 'REFERENCES',
])

export function tokenize(line, language) {
  const keywords = language === 'sql' ? SQL_KEYWORDS : JS_KEYWORDS
  const tokens = []
  let i = 0

  while (i < line.length) {
    const rest = line.slice(i)

    if (rest.startsWith('//') || rest.startsWith('--')) {
      tokens.push({ text: rest, color: COLORS.comment })
      break
    }
    if (rest.startsWith('/*')) {
      const end = rest.indexOf('*/')
      const len = end === -1 ? rest.length : end + 2
      tokens.push({ text: rest.slice(0, len), color: COLORS.comment })
      i += len
      continue
    }

    const q = rest[0]
    if (q === "'" || q === '"' || q === '`') {
      const end = rest.indexOf(q, 1)
      const len = end === -1 ? rest.length : end + 1
      tokens.push({ text: rest.slice(0, len), color: COLORS.string })
      i += len
      continue
    }

    if (rest[0] === '<') {
      const m = rest.match(/^<(\/)?[A-Za-z][\w.]*/)
      if (m) {
        tokens.push({ text: m[0], color: COLORS.tag })
        i += m[0].length
        continue
      }
    }
    if (rest[0] === '>' && rest[1] === '/') {
      tokens.push({ text: '/>', color: COLORS.tag })
      i += 2
      continue
    }

    const nm = rest.match(/^\d+(?:\.\d+)?/)
    if (nm) {
      tokens.push({ text: nm[0], color: COLORS.number })
      i += nm[0].length
      continue
    }

    const id = rest.match(/^[A-Za-z_$][\w$]*/)
    if (id) {
      const word = id[0]
      tokens.push({ text: word, color: keywords.has(word) ? COLORS.keyword : COLORS.default })
      i += word.length
      continue
    }

    tokens.push({ text: rest[0], color: COLORS.default })
    i += 1
  }

  return tokens
}
