var Walker = require('./')

var walker = Walker()

walker.on('page', function (page) {
  console.log(page.url)
})

walker.on('error', function (err) {
  console.log('error', err)
})

walker.start('https://avocado.choo.io')
