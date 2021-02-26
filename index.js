const m = require('./model')

module.exports = {
  I: m.init,
  M: m.model,
  H: require('./handler'),
  C: require('./convention')
}
