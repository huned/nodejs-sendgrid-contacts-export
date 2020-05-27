require('dotenv').config()
const debug = require('debug')('sendgrid')
const SendGrid = require('./lib/sendgrid')

const apiKey = process.env.SENDGRID_API_KEY
debug(`api key ${apiKey}`)

const sg = new SendGrid(apiKey)
sg.getContacts()
  .then(contacts => {
    process.stdout.write(require('util').inspect(contacts, { depth: null }))
    process.stdout.write('\n')
  })
