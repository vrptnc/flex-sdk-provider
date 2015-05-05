'use strict'

var promisify = require('es6-promisify')
var Download = require('download')
var tmp = require('tmp')
var fs = require('fs')
var path = require('path')

var mkdirp = promisify(require('mkdirp'))
var rimraf = promisify(require('rimraf'))
var mktmpdir = promisify(tmp.dir.bind(tmp))
var rename = promisify(fs.rename)
var stat = promisify(fs.stat)

var ROOT = path.join(__dirname, 'lib', 'flex-sdk')
var VERSIONS = require(path.join(__dirname, 'versions.json'))

var toUrl = function (version) {
  if (!VERSIONS.hasOwnProperty(version)) {
    throw new Error('Unknown version: ' + version)
  }
  return VERSIONS[version]
}

var toPath = function (version) {
  return path.join(ROOT, version)
}

var versions = function () {
  return Object.keys(VERSIONS)
}

var downloadAndExtract = function (url, dir) {
  var dl = new Download({extract: true})
    .get(url)
    .dest(dir)
  return promisify(dl.run.bind(dl))()
}

var download = function (version) {
  var url = toUrl(version)
  var target = toPath(version)
  var tmpdir
  return mkdirp(ROOT)
    .then(function () {
      return mktmpdir()
    })
    .then(function (_tmpdir) {
      tmpdir = _tmpdir
      return downloadAndExtract(url, tmpdir)
    })
    .then(function () {
      return rimraf(target)
    })
    .then(function () {
      return rename(tmpdir, target)
    })
    .then(function () {
      return target
    })
}

var locate = function (version) {
  var dir = toPath(version)
  return stat(dir)
    .then(function () {
      return dir
    })
}

var provision = function (version) {
  return locate(version)
    .catch(function () {
      return download(version)
    })
}

module.exports = {
  versions: versions,
  download: download,
  locate: locate,
  get: provision
}
