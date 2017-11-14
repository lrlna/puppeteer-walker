var EventEmitter = require('events').EventEmitter
var puppeteer = require('puppeteer')
var asyncjs = require('async')
var assert = require('assert')
var url = require('url')

module.exports = Walker

function Walker () {
  if (!(this instanceof Walker)) return new Walker()

  EventEmitter.call(this)
}

Walker.prototype = Object.create(EventEmitter.prototype)

Walker.prototype.start = async function (initialURL) {
  // need to handle errors
  assert.ok(url.parse(initialURL).protocol, 'puppeteer-walker: a URL needs to come with a protocol, i.e. https')

  var initialHost = url.parse(initialURL).hostname
  var visited = new Set()
  visited.add(initialURL)

  try {
    var browser = await puppeteer.launch()
  } catch (err) {
    throw (err)
  }
  try {
    var page = await browser.newPage()
  } catch (err) {
    throw (err)
  }

  try {
    var currentPage = await page.goto(initialURL, { waitUntil: 'domcontentloaded' })
  } catch (err) {
    throw (err)
  }

  this.emit('page', currentPage)

  var queue = asyncjs.queue(async (href, cb) => {
    // only want to walk url's from same origin
    var queueHost = url.parse(href).hostname
    if (initialHost !== queueHost) return cb()

    if (!visited.has(href)) {
      try {
        var newPage = await page.goto(href, { waitUntil: 'domcontentloaded' })
      } catch (err) {
        throw (err)
      }
      visited.add(href)

      this.emit('page', newPage)

      try {
        var newHrefs = await page.$$eval('a', function (anchors) {
          return anchors.map(anchor => anchor.href)
        })
      } catch (err) {
        throw (err)
      }

      queue.push(newHrefs)
      return cb()
    }

    cb()
  })

  queue.drain = async () => {
    try {
      await browser.close()
    } catch (err) {
      throw (err)
    }
    this.emit('end')
  }

  try {
    var hrefs = await page.$$eval('a', function (anchors) {
      return anchors.map(anchor => anchor.href)
    })
  } catch (err) {
    throw (err)
  }

  queue.push(hrefs)
}
