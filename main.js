require('dotenv').config()
const axios = require('axios')
const cheerio = require('cheerio');
const nodemailer = require('nodemailer')
const sesTransport = require('nodemailer-ses-transport');

var SESCREDENTIALS = {
  accessKeyId: process.env.AWSACCESSKEYID,
  secretAccessKey: process.env.AWSSECRETACCESSKEY
};

var transporter = nodemailer.createTransport(sesTransport({
  accessKeyId: SESCREDENTIALS.accessKeyId,
  secretAccessKey: SESCREDENTIALS.secretAccessKey,
  rateLimit: 5
}));



const main = async ()=>{



	let data = await axios.get('https://www.pawschicago.org/our-work/pet-adoption/pets-available/?tx_pawspets_pi1%5Bcatage%5D=1&cHash=f8264aa46eec7d02c56284f60e3c6076')
	const $ = cheerio.load(data.data)
	let catLinks = $('.cats .adopt-pet a')
	let urls = []
	let notableCats = []
	catLinks.each(function(i, cat){
		let urlParts = cat.attribs.href.split('/')
		catName = urlParts[urlParts.length-2] 
		urls.push({url:cat.attribs.href, catName})
	})

	let promises = []
	for ( let url of urls ) {
		promises.push(axios.get(url.url).then(function(data){
			const $$ = cheerio.load(data.data)
			let catBreed = $$('.breed-cat p').text()
			let catPicSrc = $$('.img-full')[0].attribs.src
			if ( catBreed.match(/Long|Medium/) ){
				console.log(`${url.catName}: ${catBreed}`)
				notableCats.push({...url, catBreed, catPicSrc})
			}
		}))
	}

	await Promise.all(promises)
	console.log('notable cats? ', notableCats)
	if ( notableCats.length ) {

	var mailOptions = {
		from: 'catdad@frivolous.biz',
		to: ['raphael.serota@gmail.com', 'tetelbenton@gmail.com'], // list of receivers
		subject: 'Your daily cats!', // Subject line
		html: notableCats.map(function(cat){
			return `
				<div>
					<a href="${cat.url}"><p>${cat.catName} - ${cat.catBreed}</p></a>
					<img src="${cat.catPicSrc}"
					<hr>
				</div>

			`
		}).join('')
	};

		// send mail with defined transport object
		transporter.sendMail(mailOptions, function(error, info) { if (error) { console.log(error); } else { console.log('Message sent: ', info); } });

	}
}
main()
