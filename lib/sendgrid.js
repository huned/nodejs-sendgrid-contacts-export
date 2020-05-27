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

      // NOTE: We need a raw, non-authorized GET to download the data files.
      // SendGrid's documentation seems inconsistent with the way it works for
      // downloading bulk export job results. Using an Authorization header
      // results in a 405 response code when trying to download export results.
      get: bent('GET', 200)
    }
  }

  async getContacts (opts = {}) {
    //
    // Step 1: Trigger the contacts batch export job.
    //
    const exportOpts = Object.assign({ file_type: 'json' }, opts)
    debug(`POST ${SENDGRID_CONTACTS_EXPORT_ENDPOINT} with body=${JSON.stringify(exportOpts)}`)
    let responseJSON = await this._apiMethods.doExportContacts('', exportOpts)
    debug(`... response: ${JSON.stringify(responseJSON)}`)
    const jobId = responseJSON.id

    //
    // Step 2: Wait for SendGrid to finish the job.
    //
    do {
      debug('waiting for sendgrid to finish export...')
      await asyncSleep(10000) // 10s seems to give sendgrid enough time to finish

      debug(`GET ${SENDGRID_CONTACTS_EXPORT_ENDPOINT}/${jobId}`)
      responseJSON = await this._apiMethods.checkExportStatus(`/${jobId}`)
      debug(`... response: ${JSON.stringify(responseJSON)}`)

      switch (responseJSON.status) {
        case 'failure':
          return Promise.reject(responseJSON.message)
        case 'ready':
          break
        default:
      }
    } while (responseJSON.status === 'pending')

    //
    // Step 3. Get the job results and store them in one array.
    //
    const contactsJSON = []
    for (const url of responseJSON.urls) {
      debug(`GET ${url}`)
      const response = await this._apiMethods.get(url)
      const gzipped = await response.arrayBuffer()
      const gunzipped = await asyncGunzip(gzipped)
      debug(`... response: ${JSON.stringify(gunzipped)}`)
      // NOTE: The json file from SendGrid isn't valid JSON... work around that.
      // We trim off the final '\n', then split records delimited by '\n'
      // (not ','), then parse each record into a JSON object.
      const records = gunzipped.trim().split('\n').map(s => JSON.parse(s))
      contactsJSON.push(...records)
    }

    debug(contactsJSON)
    return contactsJSON
  }
}

module.exports = SendGrid
