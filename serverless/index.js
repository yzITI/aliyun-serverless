const s = require('./store')
const h = require('./handler')

module.exports = {
  A: h.A,
  C: require('./convention'),
  E: (init) => ({
    async initializer (ctx, callback) {
      await s.init(ctx)
      if (init) await init(ctx)
      callback(null, '')
    },
    handler: h.handler
  }),
  S: s.store
}
