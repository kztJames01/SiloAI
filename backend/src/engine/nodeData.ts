const SECRET_RE = /api[_-]?key|authorization|secret|password|token|cookie|credential|refresh/i
const LOG_HIDE = new Set(['systemprompt', 'prompt', 'messages', 'customtemplate', 'task', 'content'])
const PATH_OK = /^[A-Za-z0-9_.-]+$/

export function isSecretKey(key: string) {
  return SECRET_RE.test(key)
}

function hideInLog(key: string) {
  return isSecretKey(key) || LOG_HIDE.has(key.toLowerCase())
}

export function flattenNodeData(node: any) {
  const d = node?.data && typeof node.data === 'object' ? node.data : {}
  const config = d.config && typeof d.config === 'object' ? d.config : {}
  return {
    ...d,
    ...config,
    prompt: d.prompt || config.prompt,
    label: d.label,
    type: node?.type,
  }
}

function lookup(root: any, path: string) {
  if (!path || !PATH_OK.test(path)) return undefined
  const parts = path.split('.')
  let cur = root
  for (const p of parts) {
    if (p === '__proto__' || p === 'constructor' || p === 'prototype') return undefined
    if (cur == null) return undefined
    cur = cur[p]
  }
  return cur
}

export function interpolateString(str: string, bag: Record<string, any>) {
  return str.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, raw) => {
    const path = String(raw).trim()
    if (!PATH_OK.test(path)) return ''
    const last = path.split('.').pop() || ''
    if (isSecretKey(last) || isSecretKey(path)) return ''
    const val = lookup(bag, path)
    if (val == null) return ''
    if (typeof val === 'object') {
      try { return JSON.stringify(val) } catch { return '' }
    }
    return String(val)
  })
}

export function interpolateDeep(value: any, bag: Record<string, any>, depth = 0): any {
  if (depth > 8) return value
  if (typeof value === 'string') return interpolateString(value, bag)
  if (Array.isArray(value)) return value.map((v) => interpolateDeep(v, bag, depth + 1))
  if (value && typeof value === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = interpolateDeep(v, bag, depth + 1)
    }
    return out
  }
  return value
}

export function buildInterpBag(context: { data: Record<string, any>; previousNodeData?: any }) {
  return {
    input: context.data?.input,
    prev: context.previousNodeData,
    previous: context.previousNodeData,
    ...context.data,
  }
}

function stripQuotes(s: string) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  return s
}

export function evalSimpleCondition(condition: any): boolean {
  if (typeof condition === 'boolean') return condition
  if (typeof condition === 'number') return condition !== 0
  if (condition == null) return false
  const s = String(condition).trim()
  if (!s || s === 'false' || s === '0' || s === 'null' || s === 'undefined') return false
  if (s === 'true') return true

  const cmp = s.match(/^([\s\S]+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*([\s\S]+)$/)
  if (cmp) {
    const left = stripQuotes(cmp[1].trim())
    const right = stripQuotes(cmp[3].trim())
    const op = cmp[2]
    if (op === '===' || op === '==') return left === right
    if (op === '!==' || op === '!=') return left !== right
    const ln = Number(left)
    const rn = Number(right)
    if (Number.isNaN(ln) || Number.isNaN(rn)) return false
    if (op === '>') return ln > rn
    if (op === '<') return ln < rn
    if (op === '>=') return ln >= rn
    return ln <= rn
  }

  if (/===|!==|==|!=|>=|<=|>|</.test(s)) return false
  return true
}

export function redactForLog(value: any, depth = 0): any {
  if (depth > 6) return '[truncated]'
  if (typeof value === 'string') {
    if (value.length > 4000) return value.slice(0, 4000) + '…'
    return value
  }
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redactForLog(v, depth + 1))
  if (value && typeof value === 'object') {
    const out: any = {}
    for (const [k, v] of Object.entries(value)) {
      if (hideInLog(k)) {
        out[k] = '[redacted]'
        continue
      }
      out[k] = redactForLog(v, depth + 1)
    }
    return out
  }
  return value
}
