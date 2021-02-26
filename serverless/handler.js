const util = require('util')
const getJsonBody = util.promisify(require('body/json'))

module.exports = handlers => {
  return (req, resp) => {
    (async function () {
      const m = req.method
      resp.setHeader('content-type', 'text/plain;charset=utf-8')
      if (!handlers[m]) return ['Method not allowed', 400]
      try {
        if (m === 'POST' || m === 'PUT') req.body = await getJsonBody(req)
      } catch { return ['需要JSON格式的请求体', 400] }
      for (const f of handlers[m]) {
        res = await f(req)
        if (res) return res
      }
    })().then(res => {
      if (res[1]) resp.setStatusCode(res[1])
      if (typeof res[0] === 'object') {
        resp.setHeader('content-type', 'application/json;charset=utf-8')
        resp.send(JSON.stringify(res[0]))
      } else resp.send(String(res[0]))
    }).catch(e => {
      resp.setStatusCode(500)
      resp.send('系统错误：' + e.toString())
    })
  }
}
