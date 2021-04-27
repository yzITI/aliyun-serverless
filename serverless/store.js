const TS = require('tablestore')
const config = require('./config')
let client = null

exports.init = ({ credentials }) => {
  client = new TS.Client({
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    securityToken: credentials.securityToken,
    ...config.tablestore
  })
}

exports.store = (table, pks = ['id'], ver = 0) => {
  const version = ver || 1
  const pk = k => {
    const res = [], ks = (k instanceof Array) ? k : [k]
    for (let i = 0; i < ks.length; i++) res.push({ [pks[i]]: ks[i] })
    return res
  }
  const wrap = (k, row) => {
    const res = {}, ks = (k instanceof Array) ? k : [k]
    for (let i = 0; i < ks.length; i++) res[pks[i]] = ks[i]
    if (ver === 1) res._timestamp = {}
    for (const a of row.attributes) {
      let v = a.columnValue
      if (typeof v === 'object') v = v.toNumber()
      const n = a.columnName, t = Number(a.timestamp)
      if (version === 1) {
        res[n] = v
        if (ver) res._timestamp[n] = t
      } else {
        if (!res[n]) res[n] = {}
        res[n][t] = v
      }
    }
    return res
  }
  const params = (k, cond) => ({ tableName: table, primaryKey: pk(k), condition: cond && new TS.Condition(TS.RowExistenceExpectation[cond], null) })
  const cols = (a, t) => {
    const res = []
    for (const k in a) {
      let cc = {}
      cc[k] = Number.isInteger(a[k]) ? TS.Long.fromNumber(a[k]) : a[k]
      if (t[k]) cc.timestamp = t[k]
      res.push(cc)
    }
    return res
  }
  return {
    client: c => c ? client = c : client,
    async get (k, columns = []) {
      try {
        const { row } = await client.getRow({ ...params(k), columnsToGet: columns, maxVersions: version })
        return wrap(k, row)
      } catch { return false }
    },
    getRange: async (start, end, columns = []) => {
      try {
        let next = start, res = {}
        while (next) {
          const data = await client.getRange({
            tableName: table, columnsToGet: columns,
            maxVersions: version,
            direction: TS.Direction.FORWARD,
            inclusiveStartPrimaryKey: pk(next),
            exclusiveEndPrimaryKey: pk(end)
          })
          for (const r of data.rows) {
            const k = r.primaryKey.map(x => x.value)
            res[k.join('')] = wrap(k, r)
          }
          next = data.nextStartPrimaryKey ? data.nextStartPrimaryKey.map(x => x.value) : false
        }
        return res
      } catch { return false }
    },
    getBatch: async (ks) => {
      try {
        const res = {}
        const _pks = ks.map(x => pk(x))
        const data = await client.batchGetRow({ tables: [{ tableName: table, primaryKey: _pks }] })
        for (const r of data.tables[0]) {
          if (!r.primaryKey || !r.isOk) continue
          const k = r.primaryKey.map(x => x.value)
          res[k.join('')] = wrap(k, r)
        }
        return res
      } catch { return false }
    },
    put: async (k, attributes, timestamps = {}, condition = 'IGNORE') => {
      try {
        await client.putRow({ ...params(k, condition), attributeColumns: cols(attributes, timestamps) })
        return true
      } catch { return false }
    },
    update: async (k, puts, dels = {}, timestamps = {}, condition = 'IGNORE') => {
      try {
        const dA = []
        for (const d in dels) dA.push(d)
        await client.updateRow({ ...params(k, condition), updateOfAttributeColumns: [{ 'PUT': cols(puts, timestamps) }, {'DELETE_ALL': dA }] })
        return true
      } catch { return false }
    },
    delete: async (k, condition = 'IGNORE') => {
      try {
        await client.deleteRow(params(k, condition))
        return true
      } catch { return false }
    }
  }
}
