let axios = require('axios')
const cheerio = require('cheerio');


const main = async ()=>{
	let data = await axios.get('https://www.pawschicago.org/our-work/pet-adoption/pets-available/?tx_pawspets_pi1%5Bcatage%5D=1&cHash=f8264aa46eec7d02c56284f60e3c6076')
	console.log('data? ', Object.keys(data))
	const $ = cheerio.load(data.data)
	let catLinks = $('.cats .adopt-pet a')
	let urls = []
	catLinks.each(function(i, cat){
		console.log('cat? ', cat.attribs.href)
		let urlParts = cat.attribs.href.split('/')
		console.log('cat? ', urlParts)
		catName = urlParts[urlParts.length-2] 
		urls.push({url:cat.attribs.href, catName})
	})
	for ( let url of urls ) {
		axios.get(url.url).then(function(data){
			const $$ = cheerio.load(data.data)
			let catBreed = $$('.breed-cat p').text()
			//console.log('breed? ', catBreed)
			if ( catBreed.match(/Long|Medium/) ){
				console.log(`${url.catName}: ${catBreed}`)
			}
		})
	}
}
main()
