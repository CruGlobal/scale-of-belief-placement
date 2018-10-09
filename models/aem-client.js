'use strict'

const request = require('request')

class AemClient {
  constructor (baseUrl, username, password) {
    this.baseUrl = baseUrl
    this.username = username
    this.password = password
  }

  /**
   * Updates the given page in AEM with the given score.
   *
   * @param uri a Url object of the page to update
   * @param score an integer value representing the score
   */
  updateScore (uri, score) {
    const path = uri.pathname
    const auth = 'Basic ' + Buffer.from(this.username + ':' + this.password).toString('base64')

    let options = {
      url: `${this.baseUrl}/${path}/_jcr_content`,
      form: this.scoreBody(score),
      headers: {
        'authorization': auth
      }
    }
    return new Promise((resolve, reject) => {
      request.post(options, (err, response, body) => {
        if (err) {
          reject(err)
        } else {
          resolve(response)
        }
      })
    })
  }

  scoreBody (score) {
    return {
      './score': score,
      './contentScoreLastUpdated': new Date()
    }
  }
}

module.exports = AemClient
