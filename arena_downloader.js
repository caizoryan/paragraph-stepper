// download channel and save images to /images
// save data to data.json

import fs from "fs"
import path from "path"

import {Readable} from 'stream'
import {finished} from 'stream/promises'

let host3="https://api.are.na/v3/channels/" 
let headers = {
	"Content-Type": "application/json",
}

export const get_channel = async (slug, page = 1) => {
	return fetch(host3+ slug + `/contents?per=100&page=${page}&sort=position_desc`, { headers })
		.then(async (res) => {
			if (res.status != 200) {
				console.log(res.status)
				console.log(res)
				// notificationpopup("Failed to Get Channel: " + slug + " Status: "+res.status, true)
				return {error: "STATUS: " + res.status}
			}
			let json = await res.json()
			if (json.meta.has_more_pages) {
				let nextPage = json.meta.next_page
				if (nextPage <= 5) await get_channel(slug, nextPage).then(res => json.data = json.data.concat(res.data))
			}

			console.log('Loaded '+json.data.length+ ' blocks' )
			return json
		})
}

get_channel('being-surveilled').then(res => {
	fs.writeFileSync('./data.json', JSON.stringify(res, null, 2))
	res.data.forEach(b => {
		if (b.type == 'Image'){
			// download the image and save to folder...
			downloadFile(b.image.large.src, './images/'+b.id + '.jpg')
			// fs.writeFileSync('./images/'+b.id + '.txt', "This will be image")
		}
	})
})

const downloadFile = async (url, path) => {
  const res = await fetch(url);
  const destination = path;
  const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
};
