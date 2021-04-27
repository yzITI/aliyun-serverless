const util = require('util')
const getJsonBody = util.promisify(require('body/json'))

const R = { GET: [], POST: [], PUT: [], DELETE: [] }
function add (m, r, ...hs) {
  if (!hs.length) return
  const k = ['_path']
  const t = r.split('/')
  let s = t.shift()
  for (const x of t) {
    if (x[0] == ':') {
      k.push(x.substr(1))
      s += '/(.+?)'
    } else s += '/' + x
  }
  R[m].push({ s: new RegExp(s + '$'), k, hs })
}

async function run (hs, req) {
  if (!hs.length) return [`Cannot ${req.method} ${req.path}`, 400]
  for (const h of hs) {
    const res = await h(req)
    if (res) return res
  }
  return ['No Response', 500]
}

exports.handler = async function (req, resp) {
  const m = req.method, p = req.path
  resp.setHeader('content-type', 'text/html;charset=utf-8')
  let hs = []
  for (const r of R[m]) {
    const ma = p.match(r.s)
    if (!ma) continue
    hs = r.hs
    req.params = {}
    for (let i = 0; i < r.k.length; i++) req.params[r.k[i]] = ma[i]
    break
  }
  req.body = await getJsonBody(req).catch(() => undefined)
  try {
    const res = await run(hs, req)
    if (res[1]) resp.setStatusCode(res[1])
    if (typeof res[0] === 'object') {
      resp.setHeader('content-type', 'application/json;charset=utf-8')
      resp.send(JSON.stringify(res[0]))
    } else resp.send(String(res[0]))
  } catch (e) {
    resp.setStatusCode(500)
    resp.send('系统错误：' + e.toString())
  }
}

exports.A = {
  get: (...p) => add('GET', ...p),
  post: (...p) => add('POST', ...p),
  put: (...p) => add('PUT', ...p),
  delete: (...p) => add('DELETE', ...p),
}
