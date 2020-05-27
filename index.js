require('dotenv').config()
const debug = require('debug')('sendgrid')
const SendGrid = require('./lib/sendgrid')

const f = async () => {
  const apiKey = process.env.SENDGRID_API_KEY
  debug(`api key ${apiKey}`)
  const sg = new SendGrid(apiKey)
  const contacts = await sg.getContacts()
  debug(`got contacts: ${contacts}`)
}

f()
