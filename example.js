var Walker = require('./')

var walker = Walker()

walker.on('end', () => console.log('finished walking'))
walker.on('error', (err) => console.log('error', err))
walker.on('page', async (page) => {
  var title = await page.title()
  console.log(`title: ${title}`)
})

walker.walk('https://avocado.choo.io')
