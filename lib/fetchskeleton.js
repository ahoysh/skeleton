const downloadUrl = require('download')
const fs = require('fs')

class FetchSkeleton {

  /**
   * Download `repo` to `dest` and callback `fn(err)`.
   *
   * @param {String} repo
   * @param {Object} opts
   */
  async download(repo, opts) {
    opts = opts || {}
    repo = this.normalize(repo)
    let url = repo.url || this.getUrl(repo)
    let dest = fs.mkdtempSync('/tmp/skel-')
    let downloadOptions = {
      extract: true,
      strip: 1,
      mode: '666',
      ...opts,
      headers: {
        accept: 'application/zip',
        ...(opts.headers || {})
      }
    }
    console.log(dest)
    await downloadUrl(url, dest, downloadOptions)
    return dest
  }

  /**
   * Normalize a repo string.
   *
   * @param {String} repo
   * @return {Object}
   */
  normalize(repo) {
    let regex = /^(?:(direct):([^#]+)(?:#(.+))?)$/
    let match = regex.exec(repo)

    if (match) {
      let url = match[2]
      let directCheckout = match[3] || 'master'

      return {
        type: 'direct',
        url: url,
        checkout: directCheckout
      }
    } else {
      regex = /^(?:(gh|gl|bb|github|gitlab|bitbucket):)?(?:(.+):)?([^/]+)\/([^#]+)(?:#(.+))?$/
      match = regex.exec(repo)
      let type = match[1] || 'github'
      let origin = match[2] || null
      let owner = match[3]
      let name = match[4]
      let checkout = match[5] || 'master'
      if (origin == null) {
        if (type === 'github' || type === 'gh') {
          origin = 'github.com'
          type = 'github'
        } else if (type === 'gitlab' || type === 'gl') {
          origin = 'gitlab.com'
          type = 'gitlab'
        } else if (type === 'bitbucket' || type === 'bb') {
          origin = 'bitbucket.org'
          type = 'bitbucket'
        }
      }
      return {
        type: type,
        origin: origin,
        owner: owner,
        name: name,
        checkout: checkout
      }
    }
  }

  /**
   * Adds protocol to url in none specified
   *
   * @param {String} origin
   * @return {String}
   */
  addProtocol(origin) {
    if (!/^(f|ht)tps?:\/\//i.test(origin)) {
      origin = 'https://' + origin
    }
    return origin
  }

  /**
   * Return a zip or git url for a given `repo`.
   *
   * @param {Object} repo
   * @return {String}
   */
  getUrl(repo) {
    let url

    // Get origin with protocol and add trailing slash or colon (for ssh)
    let origin = this.addProtocol(repo.origin)
    if (/^git@/i.test(origin)) {
      origin = origin + ':'
    } else {
      origin = origin + '/'
    }

    // Build url
    if (repo.type === 'github') {
      url = origin + repo.owner + '/' + repo.name + '/archive/' + repo.checkout + '.zip'
    } else if (repo.type === 'gitlab') {
      url = origin + repo.owner + '/' + repo.name + '/repository/archive.zip?ref=' + repo.checkout
    } else if (repo.type === 'bitbucket') {
      url = origin + repo.owner + '/' + repo.name + '/get/' + repo.checkout + '.zip'
    }
    return url
  }

}

module.exports = FetchSkeleton;
