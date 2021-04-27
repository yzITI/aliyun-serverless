const crypto = require('crypto')
const staticSalt = 'XYZSAS_STATIC_SALT'
const hmac = (data) => {
  const h = crypto.createHmac('sha256', process.env.salt + staticSalt)
  for (const d of data) h.update(String(d))
  return h.digest('base64')
}

module.exports = {
  random: (len = 32) => crypto.randomBytes(len).toString('base64').replace(/\//g, '_').replace(/\+/g, '-'),
  md5: (msg) => crypto.createHash('md5').update(msg).digest('base64').substr(7, 10).replace(/\//g, '_').replace(/\+/g, '-'),
  sha256: (msg) => crypto.createHash('sha256').update(msg + staticSalt).digest('base64'),
  sign: (data) => data.join('.') + '.' + hmac(data),
  verify: (t, expire = 28800e3) => {
    const r = String(t).split('.')
    return r.length > 1 && r[0] > Date.now() - expire && r.pop() === hmac(r) && r
  },
  permit: (groups, userGroup, isAdmin = false) => {
    const gs = groups.split(',')
    for (const g of gs) {
      if (!isAdmin && userGroup.indexOf(g) === 0) return true
      if (isAdmin && g.indexOf(userGroup) !== 0) return false
    }
    return isAdmin
  },
  pErr: ['<h1>参数错误，请<a href="https://github.com/xyzsas/docs/blob/master/API.md">阅读文档</a></h1>', 400]
}
