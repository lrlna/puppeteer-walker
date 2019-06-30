var EventEmitter = require('events').EventEmitter
var puppeteer = require('puppeteer')
var asyncjs = require('async')
var assert = require('assert')
var URL = require('url').URL
var debug = require('debug')

module.exports = Walker

function Walker () {
  if (!(this instanceof Walker)) return new Walker()

  this.debugVisited = debug('puppeteer-walker:visited')
  this.debugError = debug('puppeteer-walker:error')
  this.debugEnd = debug('puppeteer-walker:end')

  EventEmitter.call(this)
}

Walker.prototype = Object.create(EventEmitter.prototype)

Walker.prototype.walk = async function (initialHref, options) {
  assert.equal(typeof initialHref, 'string', 'puppeteer-walker.walk: initialHref needs to be type string')

  var url = new URL(initialHref)
  assert.ok(url.protocol, 'puppeteer-walker.walk: a URL needs to come with a protocol, i.e. https')

  var initialHost = url.hostname
  var visited = new Set()

  try {
    var browser = await puppeteer.launch(options || {})
    var page = await browser.newPage()
  } catch (err) {
    this.emit('error', err)
  }

  var queue = asyncjs.queue(async (href) => {
    // only want to walk url's from same origin
    var queueHost = (new URL(href)).hostname
    if (initialHost !== queueHost) return

    if (!visited.has(href)) {
      try {
        await page.goto(href, { waitUntil: 'domcontentloaded' })
        this.debugVisited(href)
        visited.add(href)

        var emitPage = new Promise((resolve, reject) => {
          this.emit('page', page, resolve, push)
          function push (url) {
            queue.push(escape(url))
          }
        })

        await emitPage

        var newHrefs = await page.$$eval('a', function (anchors) {
          return anchors.map(anchor => anchor.href)
        })
        queue.push(newHrefs.map(escape))
      } catch (err) {
        this.debugError(err)
        this.emit('error', err)
      }
    }
  })

  queue.drain = async () => {
    try {
      await browser.close()
      this.debugEnd('end')
      this.emit('end')
    } catch (err) {
      this.emit('error', err)
    }
  }

  queue.push(escape(initialHref))

  function escape (url) {
    return url.replace(/\/$/, '')
  }
}

Walker.prototype.on = function (event, cb) {
  assert.equal(typeof event, 'string', 'puppeteer-walker.on: event should be type string')
  if (event === 'page') {
    assert.equal(cb.constructor.name, 'AsyncFunction', 'puppeteer-walker.on: cb should be an AsyncFunction')

    var self = this
    EventEmitter.prototype.on.call(this, event, async function (page, resolve, push) {
      try {
        await cb(page, push)
      } catch (err) {
        self.debugError(err)
        self.emit('error', err)
      }
      resolve()
    })
  } else {
    EventEmitter.prototype.on.call(this, event, cb)
  }
}
