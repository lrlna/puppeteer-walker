# puppeteer-walker

A crawler to go through your given site in a headless chrome using puppeteer.
Returns an object containing host, current path, and current DOM object

## usage

```js
var PuppeteerWalker = require('puppeteer-walker')

var walker = new PuppeteerWalker()

walker.on('page', function (page) {
  var title = page.title()
  console.log(`title: ${title}`)
})

walker.on('error', fucntion (err) {
  throw err
})

walker.on('end', fucntion () {
})

walker.walk('avocado.choo.io')
```
