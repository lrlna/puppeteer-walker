var EventEmitter = require('events').EventEmitter
var puppeteer = require('puppeteer')
var asyncjs = require('async')
var assert = require('assert')
var URL = require('url').URL
var debug = require('debug')

module.exports = Walker

function Walker () {
  if (!(this instanceof Walker)) return new Walker()

  EventEmitter.call(this)
}

Walker.prototype = Object.create(EventEmitter.prototype)

Walker.prototype.walk = async function (initialHref) {
  var url = new URL(initialHref)

  var debugVisited = debug('puppeteer-walker:visited')
  var debugError = debug('puppeteer-walker:error')
  var debugEnd = debug('puppeteer-walker:end')

  assert.ok(url.protocol, 'puppeteer-walker: a URL needs to come with a protocol, i.e. https')

  var initialHost = url.hostname
  var visited = new Set()

  try {
    var browser = await puppeteer.launch()
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
        debugVisited(href)
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
        debugError(err)
        this.emit('error', err)
      }
    }
  })

  queue.drain = async () => {
    try {
      await browser.close()
      debugEnd('end')
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

    EventEmitter.prototype.on.call(this, event, async function (page, resolve, push) {
      await cb(page, push)
      resolve()
    })
  } else {
    EventEmitter.prototype.on.call(this, event, cb)
  }
}
