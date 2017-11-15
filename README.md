# puppeteer-walker
[![npm version][1]][2] [![build status][3]][4]
[![downloads][5]][6] [![js-standard-style][7]][8]

A crawler to go through your given site in a headless chrome using
[puppeteer](https://github.com/GoogleChrome/puppeteer).  Returns an object
containing host, current path, and current DOM object

## Usage

```js
var Walker = require('puppeteer-walker')

var walker = Walker()

walker.on('end', () => console.log('finished walking'))
walker.on('error', (err) => console.log('error', err))
walker.on('page', async (page) => {
  var title = await page.title()
  console.log(`title: ${title}`)
})

walker.walk('https://avocado.choo.io')
```

## API
### `walker = PuppeteerWalker()` 
Create a new walker instance.

### `walker.on('page', async cb(Page))`
Listen to a `page` event. Returns an instance of the puppeteer [Page
Class](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#class-page).
The `callback` has to be an Async Function.

### `walker.on('error', cb(err))`
Listen to `error` events. 

### `walker.on('end', cb)`
Listen to an `end` event. 

### `walker.walk(url)`
Start walking the URL.

## See Also
- [GoogleChrome/puppeteer](https://github.com/GoogleChrome/puppeteer)

## License
[Apache-2.0](./LICENSE)

[1]: https://img.shields.io/npm/v/puppeteer-walker.svg?style=flat-square
[2]: https://npmjs.org/package/puppeteer-walker
[3]: https://img.shields.io/travis/lrlna/puppeteer-walker/master.svg?style=flat-square
[4]: https://travis-ci.org/lrlna/puppeteer-walker
[5]: http://img.shields.io/npm/dm/puppeteer-walker.svg?style=flat-square
[6]: https://npmjs.org/package/puppeteer-walker
[7]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[8]: https://github.com/feross/standard
