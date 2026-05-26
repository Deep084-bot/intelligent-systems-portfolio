function parseValue(value) {
  const v = value.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^\d+$/.test(v)) return Number(v);
  if (/^\d+\.\d+$/.test(v)) return parseFloat(v);
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) return v.slice(1, -1);
  return v;
}

export function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: text.trim() };

  const yamlBlock = match[1];
  const content = match[2].trim();
  const data = {};
  const lines = yamlBlock.split('\n');
  let currentKey = null;

  for (const line of lines) {
    const indent = line.match(/^(\s*)/)[1].length;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (indent === 0) {
      const colonIdx = line.indexOf(':');
      if (colonIdx < 0) continue;
      currentKey = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if (value === '') {
        data[currentKey] = [];
      } else if (value.startsWith('[') && value.endsWith(']')) {
        try { data[currentKey] = JSON.parse(value); } catch { data[currentKey] = parseValue(value); }
      } else {
        data[currentKey] = parseValue(value);
      }
    } else if (indent > 0 && currentKey && trimmed.startsWith('- ')) {
      if (!Array.isArray(data[currentKey])) data[currentKey] = [];
      data[currentKey].push(parseValue(trimmed.slice(2)));
    }
  }

  return { data, content };
}
