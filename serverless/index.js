const s = require('./store')
const c = require('./convention')
const h = require('./handler')

module.exports = {
  A: h.A,
  C: c,
  E: {
    async initializer (ctx, callback) {
      await s.init(ctx)
      if (c.init) await c.init()
      callback(null, '')
    },
    handler: h.handler
  },
  S: s.store
}
