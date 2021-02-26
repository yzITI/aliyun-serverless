const TS = require('tablestore')
let client = null

exports.init = ({ credentials }, callback) => {
  client = new TS.Client({
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    securityToken: credentials.securityToken,
    endpoint: 'http://xyzsas-base.cn-shanghai.vpc.ots.aliyuncs.com',
    instancename: 'base'
  })
  callback(null, '')
}

exports.model = (table, pk = 'id', version = 1) => {
  const wrap = (k, row) => {
    const res = { [pk]: k }
    if (version === 1) res._timestamp = {}
    for (const a of row.attributes) {
      let v = a.columnValue
      if (typeof v === 'object') v = v.toNumber()
      const n = a.columnName, t = Number(a.timestamp)
      if (version === 1) {
        res[n] = v
        res._timestamp[n] = t
      } else {
        if (!res[n]) res[n] = {}
        res[n][t] = v
      }
    }
    return res
  }
  const params = (k, cond) => ({ tableName: table, primaryKey: [{ [pk]: k }], condition: cond && new TS.Condition(TS.RowExistenceExpectation[cond], null) })
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
            inclusiveStartPrimaryKey: [{ [pk]: next }],
            exclusiveEndPrimaryKey: [{ [pk]: end }]
          })
          for (const r of data.rows) {
            const k = r.primaryKey[0].value
            res[k] = wrap(k, r)
          }
          next = data.nextStartPrimaryKey ? data.nextStartPrimaryKey[0].value : false
        }
        return res
      } catch { return false }
    },
    put: async (k, attributes, condition = 'IGNORE') => {
      try {
        const at = attributes
        const columns = []
        for (const a in at) columns.push({ [a]: Number.isInteger(at[a]) ? TS.Long.fromNumber(at[a]) : at[a] })
        await client.putRow({ ...params(k, condition), attributeColumns: columns })
        return true
      } catch { return false }
    },
    update: async (k, puts, deletes = {}, condition = 'IGNORE') => {
      try {
        let pA = [], dA = []
        for (const p in puts) pA.push({ [p]: Number.isInteger(puts[p]) ? TS.Long.fromNumber(puts[p]) : puts[p] })
        for (const d in deletes) dA.push(d)
        await client.updateRow({ ...params(k, condition), updateOfAttributeColumns: [{ 'PUT': pA }, {'DELETE_ALL': dA }] })
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
