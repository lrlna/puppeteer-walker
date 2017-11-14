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
  assert.ok(url.parse(initialURL).protocol, 'puppeteer-walker: a URL needs to come with a protocol, i.e. https')

  var initialHost = url.parse(initialURL).hostname
  var visited = new Set()
  visited.add(initialURL)

  try {
    var browser = await puppeteer.launch()
    var page = await browser.newPage()
    var currentPage = await page.goto(initialURL, { waitUntil: 'domcontentloaded' })
    this.emit('page', currentPage)
  } catch (err) {
    this.emit('error', err)
  }

  var queue = asyncjs.queue(async (href, cb) => {
    // only want to walk url's from same origin
    var queueHost = url.parse(href).hostname
    if (initialHost !== queueHost) return cb()

    console.log(cb)

    if (!visited.has(href)) {
      try {
        var newPage = await page.goto(href, { waitUntil: 'domcontentloaded' })
        visited.add(href)

        this.emit('page', newPage)

        var newHrefs = await page.$$eval('a', function (anchors) {
          return anchors.map(anchor => anchor.href)
        })
        queue.push(newHrefs)

        return cb()
      } catch (err) {
        this.emit('error', err)
      }
    }

    cb()
  })

  queue.drain = async () => {
    try {
      await browser.close()
      this.emit('end')
    } catch (err) {
      this.emit('error', err)
    }
  }

  try {
    var hrefs = await page.$$eval('a', function (anchors) {
      return anchors.map(anchor => anchor.href)
    })
    queue.push(hrefs)
  } catch (err) {
    this.emit('error', err)
  }
}
