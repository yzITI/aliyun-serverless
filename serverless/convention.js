const crypto = require('crypto')
const https = require('https')
const { salt } = require('./config')

const RSAKey = { pk: '', sk: '' }
const RSA = {
  generate (l = 2048) {
    const key = crypto.generateKeyPairSync('rsa', { modulusLength: l })
    return {
      pk: key.publicKey.export({ type: 'pkcs1', format: 'pem' }),
      sk: key.privateKey.export({ type: 'pkcs8', format: 'pem' })
    }
  },
  encrypt: (sk, data) => crypto.privateEncrypt({ key: sk, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(data)).toString('base64').replace(/\//g, '_').replace(/\+/g, '-'),
  decrypt: (pk, data) => crypto.publicDecrypt({ key: pk, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(data.replace(/\_/g, '/').replace(/\-/g, '+'), 'base64')).toString(),
  setKey (k) {
    RSAKey.pk = k.pk
    RSAKey.sk = k.sk
  }
}

const request = (m, url, headers = {}, body = {}) => new Promise((r, rej) => {
  const req = https.request(url, { method: m, headers: { ...headers, 'Content-Type': 'application/json' } }, res => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => { r(data) })
  })
  if (m == 'POST' || m == 'PUT') req.write(JSON.stringify(body))
  req.on('error', rej)
  req.end()
})

module.exports = {
  RSA, request,
  random: (len = 32) => crypto.randomBytes(len).toString('base64').replace(/\//g, '_').replace(/\+/g, '-'),
  md5: (msg) => crypto.createHash('md5').update(msg).digest('base64').substr(7, 10).replace(/\//g, '_').replace(/\+/g, '-'),
  sha256: (msg) => crypto.createHash('sha256').update(msg + salt).digest('base64'),
  sign: d => String(d).length < 255 && RSA.encrypt(RSAKey.sk, String(d)),
  verify: (t, lag = 0) => {
    try {
      const d = RSA.decrypt(RSAKey.pk, t).split(',')
      return d[0] > Date.now()-lag && d
    } catch { return false }
  }
}
