# puppeteer-walker

A crawler to go through your given site in a headless chrome using puppeteer.
Returns an object containing host, current path, and current DOM object

## usage

```js
var PuppeteerWalker = require('puppeteer-walker')

var walker = new PuppeteerWalker()

walker.on('page', function (page) {
  var url = page.url
  console.log(`url: ${url}`)
})

walker.on('error', function (err) {
  console.log('error', err)
  throw err
})

walker.on('end', fucntion () {
  console.log('finished walking')
})

walker.walk('https://avocado.choo.io')
```
