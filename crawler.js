const fs = require('fs')
const path = require('path')
const Cr = require('crawler')
const config = require('./config.json')


let	dist = config.dist || './emoji',
		delay = config.delay || 5000
let args = process.argv.slice(2),
		host = 'https://tukaxiu.com',
		page = 1,
		purl

let withQuery = false
args[0] && (withQuery = true)

updatePurl()
getList(purl)

function getList(url){
	console.log(url)
	let cr = new Cr({
		jQuery: 'cheerio',
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0',
			'Referer': 'https://tukaxiu.com'
		},
		callback(err, res, done){
			if(err){
				console.log('err', err)
			}else if(res.statusCode === 200){
				let $ = res.$,
						$listWrapper = $('.img-list'),
						$linkList = $listWrapper.find('a'),
						srcArr = []
				if($linkList.length){
					$linkList.each(function(index, item){
						let $item = $(item),
								detailLink = $item.attr('href'),
								src = $item.find('img').attr('src')
						if(detailLink && src){
							let id = detailLink.match(/[^\/]\d+(?=(.jpg)|(.gif)|(.png)|(.html)$)/i)
							let name = src.match(/[^\/]+(\.\w+)$/i)
							let extension = src.match(/\.\w+$/i)
							srcArr[srcArr.length] = {
								uri: src,
								id: id && id[0],
								name: name && name[0],
								extension: extension && extension[0]
							}
						}
					})
					console.log(`page: ${ page } \n`, srcArr)
					page ++
					updatePurl()
					downImg(srcArr)
					setTimeout(function(){
						getList(purl)
					}, delay)
				}else{
					console.log(`老铁，图片全都在这里了`)
				}
			}else{
				console.log(`??? page ${ page } ??? ${ res.statusCode }`)
			}
			done()
		}
	})
	cr.queue({
		uri: url
	})
}

function downImg(queue){
	let cr = new Cr({
		maxConnections: 10,
		skipDuplicates: true,
		encoding: null,
		jQuery: false,
		rateLimit: 1000,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0',
			'Referer': 'https://tukaxiu.com'
		},
		callback(err, res, done){
			if(err){
				console.log('err', err)
			}else if(res.statusCode === 200){
				console.log(`${ res.options.id } ${ res.options.name } downloaded`)
				!fs.existsSync(dist) && fs.mkdirSync(dist)
				let dir
				if(withQuery){
					dir = path.join(dist, args[0])
					!fs.existsSync(dir) && fs.mkdirSync(dir)
				}else{
					dir = path.join(dist)
				}
				fs.createWriteStream(path.join(dir, `${ res.options.id }${ res.options.extension }`)).write(res.body)
			}else{
				console.log(`??? ${res.options.id} ${res.statusCode}`)
			}
			done()
		}
	})
	cr.queue(queue)
}


function updatePurl(){
	withQuery 
		? (purl = `${ host }/search/${ encodeURI(args[0]) }/${ page }.html`)
		: (purl = `${ host }/list/${ page }.html`)
}