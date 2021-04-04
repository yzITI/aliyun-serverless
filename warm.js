const INTERVAL = 10 // min
const URL = [
  'https://sas.aauth.link/auth'
]

const axios = require('axios')
setInterval(() => {
  for (const u of URL) axios.get(u).catch(() => {})
}, INTERVAL * 60e3)
