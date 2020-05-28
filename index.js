require('dotenv').config()
const debug = require('debug')('sendgrid')
const SendGrid = require('./lib/sendgrid')

const apiKey = process.env.SENDGRID_API_KEY
debug(`api key ${apiKey}`)

const getOpts = () => {
  const opts = {}
  if (process.env.SENDGRID_LIST_IDS) {
    opts.list_ids = process.env.SENDGRID_LIST_IDS.split(',').map(s => s.trim())
  }
  if (process.env.SENDGRID_SEGMENT_IDS) {
    opts.segment_ids = process.env.SENDGRID_SEGMENT_IDS.split(',').map(s => s.trim())
  }
  return opts
}

const sg = new SendGrid(apiKey)
sg.getContacts(getOpts())
  .then(contacts => {
    process.stdout.write(require('util').inspect(contacts, { depth: null }))
    process.stdout.write('\n')
  })
