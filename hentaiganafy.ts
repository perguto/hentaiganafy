// const fs=require('fs')
// fs.readFileSync('./rois.tsv')

// let response = await fetch("./rois.json")
// console.log(response)

// (()=>{

interface Dict {
	[entry:string]:string
}

function reverseDict(dict:Dict){
	const p:Dict = {}
	for (const [k,v] of Object.entries(dict)){
		p[v]=k
	}
	return p
}

function _remap(s:string,dict:Dict){
	let t=''
	for(let i = 0; i<s.length; i++){
		const c=s[i]
		t+=(dict[c]??c)
	}
	return t
}


interface IndexDict {
	[hiragana:string]:number[],
}



const hira2romDict : Dict = { 
	"あ":"a",
	"い":"i",
	"う":"u",
	"え":"e",
	"お":"o",
	"か":"ka",
	"き":"ki",
	"く":"ku",
	"け":"ke",
	"こ":"ko",
	"さ":"sa",
	"し":"si",
	"す":"su",
	"せ":"se",
	"そ":"so",
	"た":"ta",
	"ち":"ti",
	"つ":"tu",
	"て":"te",
	"と":"to",
	"な":"na",
	"に":"ni",
	"ぬ":"nu",
	"ね":"ne",
	"の":"no",
	"は":"ha",
	"ひ":"hi",
	"ふ":"hu",
	"へ":"he",
	"ほ":"ho",
	"ま":"ma",
	"み":"mi",
	"む":"mu",
	"め":"me",
	"も":"mo",
	"や":"ya",
	"ゆ":"yu",
	"よ":"yo",
	"ら":"ra",
	"り":"ri",
	"る":"ru",
	"れ":"re",
	"ろ":"ro",
	"わ":"wa",
	"ゐ":"wi",
	"ゑ":"we",
	"を":"wo",
	"ん":"nn",
}

const rom2hiraDict = reverseDict(hira2romDict)


const hiraStart = 0x3040
const hiraLength = 0x60
const hiraEnd = hiraStart + hiraLength

const kataStart = 0x30A0
const kataLength = 0x60
const kataEnd = kataStart + kataLength

const hira2kataOffset = kataStart - hiraStart

function shiftChars(s : string, offset : number, rangeTest:(codePoint : number) => boolean  = _=>true){
	let t=""
	for(const c of s){
		// Strings are iterated by Unicode code points. This means grapheme clusters will be split, but surrogate pairs will be preserved.
		const codePoint = c.codePointAt(0)
		if(codePoint === undefined){ // only to appease type checker
			break;
		}
		const new_charpoint = codePoint + offset
		if(rangeTest(codePoint)){
			const new_char = String.fromCodePoint(new_charpoint)
			t += new_char
		} else {
			t+=c
		}
	}
	return t
}
function inRange(codePoint:number,inclusiveStart:number,exclusiveEnd:number):boolean {
	if(codePoint>=inclusiveStart && codePoint < exclusiveEnd){
		return true
	} else {
		return false
	}
}

function inHiraRange(codePoint:number):boolean{
	return inRange(codePoint,hiraStart,hiraEnd)
}

function inKataRange(codePoint:number):boolean{
	return inRange(codePoint,kataStart,kataEnd)
}

// function inHiraRange(codePoint:number):boolean {
// 	if(codePoint>=hiraStart && codePoint < hiraEnd){
// 		return true
// 	} else {
// 		return false
// 	}
// }

function hiraToKata(s : string){
	return shiftChars(s,hira2kataOffset,inHiraRange)
}


function kataToHira(s : string){
	return shiftChars(s,-hira2kataOffset,inKataRange)
}

// U+3099
const dakuten = "゙"

// U+309A
const handakuten = "゚"

// U+3099 ◌゙ COMBINING KATAKANA-HIRAGANA VOICED SOUND MARK
// U+309A ◌゚ COMBINING KATAKANA-HIRAGANA SEMI-VOICED SOUND MARK
// U+309B ゛ KATAKANA-HIRAGANA VOICED SOUND MARK
// U+309C ゜ KATAKANA-HIRAGANA SEMI-VOICED SOUND MARK
// U+FF9E ﾞ HALFWIDTH KATAKANA VOICED SOUND MARK
// U+FF9F ﾟ HALFWIDTH KATAKANA SEMI-VOICED SOUND MARK

const hira2small : Dict = {
	"や":"ゃ",
	"ゆ":"ゅ",
	"よ":"ょ",
	"あ":"ぁ",
	"い":"ぃ",
	"う":"ぅ",
	"え":"ぇ",
	"お":"ぉ",
	"つ":"っ",
	//	"":"",
}

const small2hira = reverseDict(hira2small)

const daku2sei : Dict= {
	"g":"k",
	"z":"s",
	"d":"t",
	"b":"h",
	// "":"",
	// "":"",
	// "":"",
}

const handaku2sei : Dict = {
	"p" : "h",
}

const consonants = [..."kgsztdnhbpmrywn"]

function doubleConsonants2Q(s:string){
	let t=""
	for(let i=0;i<s.length;i++){
		const c = s[i]
		if(consonants.includes(c) && c === s[i+1]){
			t+="Q"
		} else {
			t+=c
		}
	}
	return t
}

function rom2hira(s:string) {
	s= doubleConsonants2Q(s)
	s=s.replaceAll(/([kgsztdnhbpmrywn]?y?[aiueo]|nn|Q)/gi,t=> {
		t = t.toLowerCase()
		if(t==="q"){
			return "っ"
		}
		const is_yoon = (t.length === 3)
		const has_dakuten = /[gzdb]/.test(t[0])
		if(has_dakuten){
			// debugger
			t = daku2sei[t[0]]+ t.slice(1)
		}
		const has_handakuten = /p/.test(t[0])
		if(has_handakuten){
			t = handaku2sei[t[0]]+ t.slice(1)
		}
		if(is_yoon){
			t = t[0]+ "i" + t.slice(1)
		}
		let kana = rom2hiraDict[t.slice(0,2)]
		if(has_dakuten){
			kana += dakuten
		} else if(has_handakuten){
			kana += handakuten
		}
		if(is_yoon){
			kana += hira2small[rom2hiraDict[t.slice(2)]]
		}
		return kana
	})
	return s
}

// function stripDakuten(s:string){
// 	return s
// }

function normalize(s:string){
	s=rom2hira(s)
	s=kataToHira(s)
	s=s.normalize("NFD") // separates dakuten from kana
	return s
}
// const hentaiganaDict = globalThis.Deno ?
// 	globalThis.Deno.readTextFileSync("./rois.json")
// :
// 	await fetch("./rois.json").then(r => r.text())

interface HentaiganaDict {
	[hiragana:string]:[string,string,string][]
}

// const hira2hentai : HentaiganaDict = JSON.parse(hentaiganaDict)
const hira2hentai : HentaiganaDict  = 
	{
		"あ": [[ "𛀂","安" ,"U+1B002"],[ "𛀃","愛" ,"U+1B003"],[ "𛀄","阿" ,"U+1B004"],[ "𛀅","惡" ,"U+1B005"]],
		"い": [[ "𛀆","以" ,"U+1B006"],[ "𛀇","伊" ,"U+1B007"],[ "𛀈","意" ,"U+1B008"],[ "𛀉","移" ,"U+1B009"]],
		"う": [[ "𛀊","宇" ,"U+1B00A"],[ "𛀋","宇" ,"U+1B00B"],[ "𛀌","憂" ,"U+1B00C"],[ "𛀍","有" ,"U+1B00D"],[ "𛀎","雲" ,"U+1B00E"]],
		"え": [[ "𛀏","盈" ,"U+1B00F"],[ "𛀐","縁" ,"U+1B010"],[ "𛀑","衣" ,"U+1B011"],[ "𛀒","衣" ,"U+1B012"],[ "𛀓","要" ,"U+1B013"]],
		"お": [[ "𛀔","於" ,"U+1B014"],[ "𛀕","於" ,"U+1B015"],[ "𛀖","隱" ,"U+1B016"]],
		"か": [[ "𛀗","佳" ,"U+1B017"],[ "𛀘","加" ,"U+1B018"],[ "𛀙","可" ,"U+1B019"],[ "𛀚","可" ,"U+1B01A"],[ "𛀛","嘉" ,"U+1B01B"],[ "𛀜","我" ,"U+1B01C"],[ "𛀝","歟" ,"U+1B01D"],[ "𛀞","賀" ,"U+1B01E"],[ "𛀟","閑" ,"U+1B01F"],[ "𛀠","香" ,"U+1B020"],[ "𛀡","駕" ,"U+1B021"],[ "𛀢","家" ,"U+1B022"]],
		"き": [[ "𛀣","喜" ,"U+1B023"],[ "𛀤","幾" ,"U+1B024"],[ "𛀥","幾" ,"U+1B025"],[ "𛀦","支" ,"U+1B026"],[ "𛀧","木" ,"U+1B027"],[ "𛀨","祈" ,"U+1B028"],[ "𛀩","貴" ,"U+1B029"],[ "𛀪","起" ,"U+1B02A"],[ "𛀻","期" ,"U+1B03B"]],
		"く": [[ "𛀫","久" ,"U+1B02B"],[ "𛀬","久" ,"U+1B02C"],[ "𛀭","九" ,"U+1B02D"],[ "𛀮","供" ,"U+1B02E"],[ "𛀯","倶" ,"U+1B02F"],[ "𛀰","具" ,"U+1B030"],[ "𛀱","求" ,"U+1B031"]],
		"け": [[ "𛀲","介" ,"U+1B032"],[ "𛀳","介" ,"U+1B033"],[ "𛀴","希" ,"U+1B034"],[ "𛀵","氣" ,"U+1B035"],[ "𛀶","計" ,"U+1B036"],[ "𛀷","遣" ,"U+1B037"],[ "𛀢","家" ,"U+1B022"]],
		"こ": [[ "𛀸","古" ,"U+1B038"],[ "𛀹","故" ,"U+1B039"],[ "𛀺","許" ,"U+1B03A"],[ "𛀻","期" ,"U+1B03B"],[ "𛂘","子" ,"U+1B098"]],
		"さ": [[ "𛀼","乍" ,"U+1B03C"],[ "𛀽","佐" ,"U+1B03D"],[ "𛀾","佐" ,"U+1B03E"],[ "𛀿","左" ,"U+1B03F"],[ "𛁀","差" ,"U+1B040"],[ "𛁁","散" ,"U+1B041"],[ "𛁂","斜" ,"U+1B042"],[ "𛁃","沙" ,"U+1B043"]],
		"し": [[ "𛁄","之" ,"U+1B044"],[ "𛁅","之" ,"U+1B045"],[ "𛁆","事" ,"U+1B046"],[ "𛁇","四" ,"U+1B047"],[ "𛁈","志" ,"U+1B048"],[ "𛁉","新" ,"U+1B049"]],
		"す": [[ "𛁊","受" ,"U+1B04A"],[ "𛁋","壽" ,"U+1B04B"],[ "𛁌","數" ,"U+1B04C"],[ "𛁍","數" ,"U+1B04D"],[ "𛁎","春" ,"U+1B04E"],[ "𛁏","春" ,"U+1B04F"],[ "𛁐","須" ,"U+1B050"],[ "𛁑","須" ,"U+1B051"]],
		"せ": [[ "𛁒","世" ,"U+1B052"],[ "𛁓","世" ,"U+1B053"],[ "𛁔","世" ,"U+1B054"],[ "𛁕","勢" ,"U+1B055"],[ "𛁖","聲" ,"U+1B056"]],
		"そ": [[ "𛁗","所" ,"U+1B057"],[ "𛁘","所" ,"U+1B058"],[ "𛁙","曾" ,"U+1B059"],[ "𛁚","曾" ,"U+1B05A"],[ "𛁛","楚" ,"U+1B05B"],[ "𛁜","蘇" ,"U+1B05C"],[ "𛁝","處" ,"U+1B05D"]],
		"た": [[ "𛁞","堂" ,"U+1B05E"],[ "𛁟","多" ,"U+1B05F"],[ "𛁠","多" ,"U+1B060"],[ "𛁡","當" ,"U+1B061"]],
		"ち": [[ "𛁢","千" ,"U+1B062"],[ "𛁣","地" ,"U+1B063"],[ "𛁤","智" ,"U+1B064"],[ "𛁥","知" ,"U+1B065"],[ "𛁦","知" ,"U+1B066"],[ "𛁧","致" ,"U+1B067"],[ "𛁨","遲" ,"U+1B068"]],
		"つ": [[ "𛁩","川" ,"U+1B069"],[ "𛁪","川" ,"U+1B06A"],[ "𛁫","津" ,"U+1B06B"],[ "𛁬","都" ,"U+1B06C"],[ "𛁭","徒" ,"U+1B06D"]],
		"て": [[ "𛁮","亭" ,"U+1B06E"],[ "𛁯","低" ,"U+1B06F"],[ "𛁰","傳" ,"U+1B070"],[ "𛁱","天" ,"U+1B071"],[ "𛁲","天" ,"U+1B072"],[ "𛁳","天" ,"U+1B073"],[ "𛁴","帝" ,"U+1B074"],[ "𛁵","弖" ,"U+1B075"],[ "𛁶","轉" ,"U+1B076"],[ "𛂎","而" ,"U+1B08E"]],
		"と": [[ "𛁷","土" ,"U+1B077"],[ "𛁸","度" ,"U+1B078"],[ "𛁹","東" ,"U+1B079"],[ "𛁺","登" ,"U+1B07A"],[ "𛁻","登" ,"U+1B07B"],[ "𛁼","砥" ,"U+1B07C"],[ "𛁭","徒" ,"U+1B06D"],[ "𛁽","等" ,"U+1B07D"]],
		"な": [[ "𛁾","南" ,"U+1B07E"],[ "𛁿","名" ,"U+1B07F"],[ "𛂀","奈" ,"U+1B080"],[ "𛂁","奈" ,"U+1B081"],[ "𛂂","奈" ,"U+1B082"],[ "𛂃","菜" ,"U+1B083"],[ "𛂄","那" ,"U+1B084"],[ "𛂅","那" ,"U+1B085"],[ "𛂆","難" ,"U+1B086"]],
		"に": [[ "𛂇","丹" ,"U+1B087"],[ "𛂈","二" ,"U+1B088"],[ "𛂉","仁" ,"U+1B089"],[ "𛂊","兒" ,"U+1B08A"],[ "𛂋","爾" ,"U+1B08B"],[ "𛂌","爾" ,"U+1B08C"],[ "𛂍","耳" ,"U+1B08D"],[ "𛂎","而" ,"U+1B08E"]],
		"ぬ": [[ "𛂏","努" ,"U+1B08F"],[ "𛂐","奴" ,"U+1B090"],[ "𛂑","怒" ,"U+1B091"]],
		"ね": [[ "𛂒","年" ,"U+1B092"],[ "𛂓","年" ,"U+1B093"],[ "𛂔","年" ,"U+1B094"],[ "𛂕","根" ,"U+1B095"],[ "𛂖","熱" ,"U+1B096"],[ "𛂗","禰" ,"U+1B097"],[ "𛂘","子" ,"U+1B098"]],
		"の": [[ "𛂙","乃" ,"U+1B099"],[ "𛂚","濃" ,"U+1B09A"],[ "𛂛","能" ,"U+1B09B"],[ "𛂜","能" ,"U+1B09C"],[ "𛂝","農" ,"U+1B09D"]],
		"は": [[ "𛂞","八" ,"U+1B09E"],[ "𛂟","半" ,"U+1B09F"],[ "𛂠","婆" ,"U+1B0A0"],[ "𛂡","波" ,"U+1B0A1"],[ "𛂢","盤" ,"U+1B0A2"],[ "𛂣","盤" ,"U+1B0A3"],[ "𛂤","破" ,"U+1B0A4"],[ "𛂥","者" ,"U+1B0A5"],[ "𛂦","者" ,"U+1B0A6"],[ "𛂧","葉" ,"U+1B0A7"],[ "𛂨","頗" ,"U+1B0A8"]],
		"ひ": [[ "𛂩","悲" ,"U+1B0A9"],[ "𛂪","日" ,"U+1B0AA"],[ "𛂫","比" ,"U+1B0AB"],[ "𛂬","避" ,"U+1B0AC"],[ "𛂭","非" ,"U+1B0AD"],[ "𛂮","飛" ,"U+1B0AE"],[ "𛂯","飛" ,"U+1B0AF"]],
		"ふ": [[ "𛂰","不" ,"U+1B0B0"],[ "𛂱","婦" ,"U+1B0B1"],[ "𛂲","布" ,"U+1B0B2"]],
		"へ": [[ "𛂳","倍" ,"U+1B0B3"],[ "𛂴","弊" ,"U+1B0B4"],[ "𛂵","弊" ,"U+1B0B5"],[ "𛂶","遍" ,"U+1B0B6"],[ "𛂷","邊" ,"U+1B0B7"],[ "𛂸","邊" ,"U+1B0B8"],[ "𛂹","部" ,"U+1B0B9"]],
		"ほ": [[ "𛂺","保" ,"U+1B0BA"],[ "𛂻","保" ,"U+1B0BB"],[ "𛂼","報" ,"U+1B0BC"],[ "𛂽","奉" ,"U+1B0BD"],[ "𛂾","寶" ,"U+1B0BE"],[ "𛂿","本" ,"U+1B0BF"],[ "𛃀","本" ,"U+1B0C0"],[ "𛃁","豐" ,"U+1B0C1"]],
		"ま": [[ "𛃂","万" ,"U+1B0C2"],[ "𛃃","末" ,"U+1B0C3"],[ "𛃄","末" ,"U+1B0C4"],[ "𛃅","滿" ,"U+1B0C5"],[ "𛃆","滿" ,"U+1B0C6"],[ "𛃇","萬" ,"U+1B0C7"],[ "𛃈","麻" ,"U+1B0C8"],[ "𛃖","馬" ,"U+1B0D6"]],
		"み": [[ "𛃉","三" ,"U+1B0C9"],[ "𛃊","微" ,"U+1B0CA"],[ "𛃋","美" ,"U+1B0CB"],[ "𛃌","美" ,"U+1B0CC"],[ "𛃍","美" ,"U+1B0CD"],[ "𛃎","見" ,"U+1B0CE"],[ "𛃏","身" ,"U+1B0CF"]],
		"む": [[ "𛃐","武" ,"U+1B0D0"],[ "𛃑","無" ,"U+1B0D1"],[ "𛃒","牟" ,"U+1B0D2"],[ "𛃓","舞" ,"U+1B0D3"],[ "𛄝","无" ,"U+1B11D"],[ "𛄞","无" ,"U+1B11E"]],
		"め": [[ "𛃔","免" ,"U+1B0D4"],[ "𛃕","面" ,"U+1B0D5"],[ "𛃖","馬" ,"U+1B0D6"]],
		"も": [[ "𛃗","母" ,"U+1B0D7"],[ "𛃘","毛" ,"U+1B0D8"],[ "𛃙","毛" ,"U+1B0D9"],[ "𛃚","毛" ,"U+1B0DA"],[ "𛃛","茂" ,"U+1B0DB"],[ "𛃜","裳" ,"U+1B0DC"],[ "𛄝","无" ,"U+1B11D"],[ "𛄞","无" ,"U+1B11E"]],
		"や": [[ "𛃝","也" ,"U+1B0DD"],[ "𛃞","也" ,"U+1B0DE"],[ "𛃟","屋" ,"U+1B0DF"],[ "𛃠","耶" ,"U+1B0E0"],[ "𛃡","耶" ,"U+1B0E1"],[ "𛃢","夜" ,"U+1B0E2"]],
		"ゆ": [[ "𛃣","游" ,"U+1B0E3"],[ "𛃤","由" ,"U+1B0E4"],[ "𛃥","由" ,"U+1B0E5"],[ "𛃦","遊" ,"U+1B0E6"]],
		"よ": [[ "𛃧","代" ,"U+1B0E7"],[ "𛃨","余" ,"U+1B0E8"],[ "𛃩","與" ,"U+1B0E9"],[ "𛃪","與" ,"U+1B0EA"],[ "𛃫","與" ,"U+1B0EB"],[ "𛃬","餘" ,"U+1B0EC"],[ "𛃢","夜" ,"U+1B0E2"]],
		"ら": [[ "𛃭","羅" ,"U+1B0ED"],[ "𛃮","良" ,"U+1B0EE"],[ "𛃯","良" ,"U+1B0EF"],[ "𛃰","良" ,"U+1B0F0"],[ "𛁽","等" ,"U+1B07D"]],
		"り": [[ "𛃱","利" ,"U+1B0F1"],[ "𛃲","利" ,"U+1B0F2"],[ "𛃳","李" ,"U+1B0F3"],[ "𛃴","梨" ,"U+1B0F4"],[ "𛃵","理" ,"U+1B0F5"],[ "𛃶","里" ,"U+1B0F6"],[ "𛃷","離" ,"U+1B0F7"]],
		"る": [[ "𛃸","流" ,"U+1B0F8"],[ "𛃹","留" ,"U+1B0F9"],[ "𛃺","留" ,"U+1B0FA"],[ "𛃻","留" ,"U+1B0FB"],[ "𛃼","累" ,"U+1B0FC"],[ "𛃽","類" ,"U+1B0FD"]],
		"れ": [[ "𛃾","禮" ,"U+1B0FE"],[ "𛃿","禮" ,"U+1B0FF"],[ "𛄀","連" ,"U+1B100"],[ "𛄁","麗" ,"U+1B101"]],
		"ろ": [[ "𛄂","呂" ,"U+1B102"],[ "𛄃","呂" ,"U+1B103"],[ "𛄄","婁" ,"U+1B104"],[ "𛄅","樓" ,"U+1B105"],[ "𛄆","路" ,"U+1B106"],[ "𛄇","露" ,"U+1B107"]],
		"わ": [[ "𛄈","倭" ,"U+1B108"],[ "𛄉","和" ,"U+1B109"],[ "𛄊","和" ,"U+1B10A"],[ "𛄋","王" ,"U+1B10B"],[ "𛄌","王" ,"U+1B10C"]],
		"ゐ": [[ "𛄍","井" ,"U+1B10D"],[ "𛄎","井" ,"U+1B10E"],[ "𛄏","居" ,"U+1B10F"],[ "𛄐","爲" ,"U+1B110"],[ "𛄑","遺" ,"U+1B111"]],
		"ゑ": [[ "𛄒","惠" ,"U+1B112"],[ "𛄓","衞" ,"U+1B113"],[ "𛄔","衞" ,"U+1B114"],[ "𛄕","衞" ,"U+1B115"]],
		"を": [[ "𛄖","乎" ,"U+1B116"],[ "𛄗","乎" ,"U+1B117"],[ "𛄘","尾" ,"U+1B118"],[ "𛄙","緒" ,"U+1B119"],[ "𛄚","越" ,"U+1B11A"],[ "𛄛","遠" ,"U+1B11B"],[ "𛄜","遠" ,"U+1B11C"],[ "𛀅","惡" ,"U+1B005"]],
		"ん": [[ "𛄝","无" ,"U+1B11D"],[ "𛄞","无" ,"U+1B11E"]]
	}


const easyIndices : IndexDict = { 
	"あ":[0],
	"い":[0],
	"う":[1,0],
	"え":[2],
	"お":[1,0],
	"か":[1],
	"き":[2],
	"く":[1,0],
	"け":[4],
	"こ":[0],
	"さ":[4],
	"し":[1],
	"す":[5],
	"せ":[2],
	"そ":[0],
	"た":[1],//none easy
	"ち":[4],
	"つ":[1],
	"て":[4],
	"と":[0],//from tuti, none easy
	"な":[4,2],
	"に":[1],
	"ぬ":[1],
	"ね":[4,3],
	"の":[0],
	"は":[3],// 0 katakana-like,
	"ひ":[6],
	"ふ":[0],
	"へ":[6],
	"ほ":[0,1],//both etymological, none easy, 1  more reduced
	"ま":[2],
	"み":[3],
	"む":[0],
	"め":[1],
	"も":[1],
	"や":[1,0],
	"ゆ":[1],
	"よ":[3,2],
	"ら":[3],
	"り":[0,1],//1 more reduced but harder
	"る":[2],
	"れ":[1],
	"ろ":[0,1],
	"わ":[2],
	"ゐ":[3],
	"ゑ":[0],
	"を":[5,6],
	"ん":[1],
}

const hentai2kanji :Dict = {}
const kanji2hentai :Dict = {}
const kanji2hira :Dict = {}

const hentai2hira :Dict = {}
for(const hira in hira2hentai){
	for(const [hentai,kanji,codepoint] of hira2hentai[hira]){
		hentai2kanji[hentai]=kanji
		hentai2hira[hentai]=hira
		kanji2hentai[kanji]=hentai
		kanji2hira[kanji]=hira
	}
}

function randomEntry<T>(a:Array<T>):T{
	return a[Math.floor(Math.random()*a.length)]
}

type Output = "kana" | "kanji" | "codepoint"
type Choice = "random" | "easy" | "easiest"  | number[]

function hentaiganafy(s:string,choice : Choice = "random",output :Output="kana"){
	const pos = {
		"kana" : 0,
		"kanji" : 1,
		"codepoint" : 2,
	}[output]

	s=normalize(s)
	let t=''
	for(let i = 0; i<s.length; i++){
		let c=s[i]
		c = small2hira[c] ?? c
		const options = hira2hentai[c]
		if(options){
			let entry
			if(choice==="random"){
				entry = randomEntry(options)
			} else if(choice==="easy"){
				entry = options[randomEntry(easyIndices[c])]
			} else if(choice === "easiest") {
				entry = options[easyIndices[c][0]]
			} else if(choice instanceof Array) {
				entry = options[choice[i]]
			}
			debugger
			c=entry[pos]
		}
		t+=c
	}
	return t
}

const input = //prompt()??
	'わかりますか?'

const test_hentaigana = hentaiganafy('pa')

const test_katakana = hiraToKata(input)
const test_hiragana = kataToHira(test_katakana)


console.log(test_katakana)
console.log(test_hiragana)
console.log(test_hentaigana)

//
// })()
