const INTERVAL = 10 // min
const URL = [
  'https://sas.aauth.link/auth'
]

const axios = require('axios')
setInterval(() => {
  const h = (new Date()).getHours()
  if (h < 8 || h >= 22) return
  for (const u of URL) axios.get(u).catch(() => {})
}, INTERVAL * 60e3)
