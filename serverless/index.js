const s = require('./store')
const h = require('./handler')

module.exports = {
  A: h.A,
  C: require('./convention'),
  E: {
    initializer: s.init,
    handler: h.handler
  },
  S: s.store
}
