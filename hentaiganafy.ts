// const fs=require('fs')
// fs.readFileSync('./rois.tsv')

// let response = await fetch("./rois.json")
// console.log(response)

interface Table {
	[entry:string]:string
}
interface HentaiganaTable {
	[hiragana:string]:[string,string,string][]
}

function _remap(s:string,table:Table){
	let t=''
	for(let i = 0; i<s.length; i++){
		const c=s[i]
		t+=(table[c]??c)
	}
	return t
}
const hentaiganaTable = Deno.readTextFileSync("./rois.json")

const hira2hentai : HentaiganaTable = JSON.parse(hentaiganaTable)

function randomEntry(a:Array<any>){
	return a[Math.random()*a.length]
}

function hentaiganafy(s:string){
	let t=''
	for(let i = 0; i<s.length; i++){
		let c=s[i]
		const options = hentaiganaTable[c]
		if(options){
			let entry = randomEntry(options)
			c=entry[0]
		}
		t+=c
	}
	return t
}

const input = prompt()??'わかりますか?'

const output = hentaiganafy(input)

alert(output)
