const debug = require('debug')('sendgrid')
const bent = require('bent')
const asyncSleep = require('./util/async_sleep')
const asyncGunzip = require('./util/async_gunzip')

const SENDGRID_API_BASE = 'https://api.sendgrid.com/v3'
const SENDGRID_CONTACTS_EXPORT_ENDPOINT = `${SENDGRID_API_BASE}/marketing/contacts/exports`

class SendGrid {
  constructor (apiKey) {
    const reqHeader = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
    this._apiMethods = {
      doExportContacts: bent('POST', SENDGRID_CONTACTS_EXPORT_ENDPOINT, 'json', 202, reqHeader),
      checkExportStatus: bent('GET', SENDGRID_CONTACTS_EXPORT_ENDPOINT, 'json', 200, reqHeader),
      get: bent('GET', 200) // NOTE: we need a raw, non-authorized GET to download the data files
    }
  }

  async getContacts (opts = {}) {
    const exportOpts = Object.assign({ file_type: 'json' }, opts)
    debug(`POST ${SENDGRID_CONTACTS_EXPORT_ENDPOINT} with body=${JSON.stringify(exportOpts)}`)
    let responseJSON = await this._apiMethods.doExportContacts('', exportOpts)
    debug(`... response: ${JSON.stringify(responseJSON)}`)
    const jobId = responseJSON.id
    debug(`jobId = ${jobId}`)

    do {
      debug('waiting for sendgrid...')
      debug(`GET ${SENDGRID_CONTACTS_EXPORT_ENDPOINT}/${jobId}`)
      responseJSON = await this._apiMethods.checkExportStatus(`/${jobId}`)
      debug(`... response: ${JSON.stringify(responseJSON)}`)

      switch (responseJSON.status) {
        case 'failure':
          return Promise.reject(responseJSON.message)
        case 'ready':
          debug(`got download urls: ${responseJSON.urls}`)
          break
        default:
          await asyncSleep(5000)
      }
    } while (responseJSON.status === 'pending')

    const contactsJSON = []
    for (const url of responseJSON.urls) {
      debug(`GET ${url}`)
      const response = await this._apiMethods.get(url)
      const responseJSON = JSON.parse(await asyncGunzip(await response.arrayBuffer()))
      debug(responseJSON)
      contactsJSON.splice(0, 0, ...responseJSON)
    }

    return contactsJSON
  }
}

module.exports = SendGrid
