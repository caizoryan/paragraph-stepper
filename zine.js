import PDFDocument from 'pdfkit'
import fs from 'fs'

let inch = v => v * 72

let title = {
	fontSize: 8,
	font: './font.ttf',
	fillColor: [0, 0, 0, 50],
}

let body = {
	fontSize: 8,
	font: './_font.ttf',
	fillColor: [0, 0, 0, 80],
}

let tag = {
	fontSize: 7,
	fillColor: '#000',
	font: './monument_mono_medium.otf'
}

let line = (doc, x1, y1, x2, y2, strokeColor = 'black', strokeWeight = 1) => {
	doc.lineWidth(strokeWeight)
	doc.strokeColor(strokeColor)

	doc.moveTo(x1, y1)                               // set the current point
		.lineTo(x2, y2)                            // draw a line
		.stroke();                                   // stroke the path
}
let metadata = (doc, block, dims) => {
	let { x, y, width, height } = dims

	line(doc, x, y - inch(.125), x + width, y - inch(.125), [0, 100, 0, 0], .1)

	Object.entries(tag).forEach(([k, v]) => doc[k](v))
	doc.text('TITLE:', x, y, { width })
	y += inch(.125)

	Object.entries(title).forEach(([k, v]) => doc[k](v))
	doc.text(block.title, x, y, { width })
	y += inch(.33)

	Object.entries(tag).forEach(([k, v]) => doc[k](v))
	doc.text('ADDED:', x, y, { width })
	y += inch(.125)

	Object.entries(title).forEach(([k, v]) => doc[k](v))
	doc.text(block.created_at, x, y, { width })
}

let Grid = props => {
	let columnWidth = (() => {
		let n = 1
		let w = props.spreadWidth/2 - (props.margin.inside + props.margin.outside);
		let g = (n - 1) * props.gutter
		return ((w - (props.gutter * (props.columns - 1))) / props.columns) * n + g;
	})()

	let leftPadding = 
		(props.pageWidth - props.spreadWidth)/2

	let topPadding = 
		(props.pageHeight - props.spreadHeight)/2

	let rectoColumns = (() => {
		const cols = []

		for (let i = 0; i < props.columns; i++) {
			const y = topPadding + props.margin.top
			const w = columnWidth

			// outside + gutters + size
			const x = 
				leftPadding
				+ props.spreadWidth/2
				+ props.margin.inside
				+ (i * props.gutter) + i * columnWidth;
			const h = props.spreadHeight
				- (props.margin.top + props.margin.bottom)

			cols.push({ x, y, w, h })
		}

		return cols
	})()

	let versoColumns = (() => {
		/**@type {{x:number, y:number, w:number, h: number}[]}*/
		const cols = []

		for (let i = 0; i < props.columns; i++) {
			const y = topPadding + props.margin.top 
			const w = columnWidth

			// outside + gutters + size
			const x = leftPadding
				+ props.margin.outside 
				+ i * props.gutter 
				+ i * columnWidth;
			const h = props.spreadHeight
				- (props.margin.top + props.margin.bottom)

			cols.push({ x, y, w, h })
		}

		return cols
	})()

	return {
		props,
		leftPadding,topPadding,
		hanglines: props.hanglines.map(e => e+topPadding),
		rectoColumns, versoColumns,
		columns: [rectoColumns, versoColumns],
		columnWidth
	}
}

let grid = Grid({
	margin: {
		top: inch(1/4),
		bottom: inch(1 / 2),
		inside: inch(1 / 3),
		outside: inch(1 / 4),
	},

	gutter: inch(.125/2),
	columns: 8,
	hanglines: [
		inch(.5),
		inch(.5+2/3),

		inch(1.5),
		inch(1.5 + 2 / 3),

		inch(2.5),
		inch(2.5 + 2 / 3),

		inch(3.5),
		inch(3.5 + 2 / 3),

	],

	spreadWidth: inch(8.5),
	spreadHeight: inch(4.5),

	pageWidth: inch(11),
	pageHeight: inch(8.5)
})

console.log(grid.rectoColumns)


let draw_grid = (doc, grid, opts) => {
	let [recto, verso] = grid.columns

	if (opts.frame) {
		let g = grid
		let bg = 'black'

		doc.rect( 0, 0, g.leftPadding, g.props.pageHeight,)
		doc.fill(bg)

		doc.rect( 0, 0, g.leftPadding, g.topPadding)
		doc.fill(bg)

		doc.rect(g.leftPadding+g.props.spreadWidth, 0, g.leftPadding, g.props.pageHeight,)
		doc.fill(bg)

		doc.rect(0, g.topPadding+g.props.spreadHeight, g.props.pageWidth, g.topPadding,)
		doc.fill(bg)

		doc.rect(0, 0, g.props.pageWidth, g.topPadding,)
		doc.fill(bg)
	}

	if (opts.drawGrid){
		let strokeWeight = .5
		let strokeColor = [10, 0, 0, 0]

		doc.lineWidth(strokeWeight)
		doc.strokeColor(strokeColor)

		grid.hanglines.forEach(e => {
			drawLineDocFn({
				points: [{ x: 0, y: e }, { x: grid.props.pageWidth, y: e }],
				stroke: [0, 50, 0, 0],
				strokeStyle: [2],
				strokeWeight: .5,
			})(doc)

		})
		recto.forEach((col) => {
			doc.rect(col.x, col.y, col.w, col.h)
			doc.stroke()
		})

		verso.forEach((col) => {
			doc.rect(col.x, col.y, col.w, col.h)
			doc.stroke()
		})
	}

	if (opts.crops) {
		let g = grid
		drawLineDocFn({
			points: [
				{ x: g.leftPadding - 10, y: g.topPadding },
				{ x: g.leftPadding - 3,  y: g.topPadding }
			],
			stroke: 'black',
			strokeWeight: 1,
		})(doc);

		drawLineDocFn({
			points: [
				{ x: g.leftPadding, y: g.topPadding - 10 },
				{ x: g.leftPadding, y: g.topPadding - 3 }
			],
			stroke: 'black',
			strokeWeight: 1,
		})(doc);

		drawLineDocFn({
			points: [
				{ x: g.leftPadding + g.props.spreadWidth + 3, y: g.topPadding },
				{ x: g.leftPadding + g.props.spreadWidth + 10, y: g.topPadding }
			],
			stroke: 'black',
			strokeWeight: 1,
		})(doc);

		drawLineDocFn({
			points: [
				{ x: g.leftPadding + g.props.spreadWidth, y: g.topPadding - 10 },
				{ x: g.leftPadding + g.props.spreadWidth, y: g.topPadding - 3 }
			],
			stroke: 'black',
			strokeWeight: 1,
		})(doc);

		drawLineDocFn({
			points: [
				{ x: g.leftPadding + g.props.spreadWidth, y: g.topPadding + g.props.spreadHeight + 3 },
				{ x: g.leftPadding + g.props.spreadWidth, y: g.topPadding + g.props.spreadHeight + 10 }
			],
			stroke: 'black',
			strokeWeight: 1,
		})(doc);

		drawLineDocFn({
			points: [
				{ x: g.leftPadding + g.props.spreadWidth + 3, y: g.topPadding + g.props.spreadHeight },
				{ x: g.leftPadding + g.props.spreadWidth + 10, y: g.topPadding + g.props.spreadHeight }
			],
			stroke: 'black',
			strokeWeight: 1,
		})(doc);

		drawLineDocFn({
			points: [
				{ x: g.leftPadding - 10, y: g.topPadding + g.props.spreadHeight },
				{ x: g.leftPadding - 3,  y: g.topPadding + g.props.spreadHeight }
			],
			stroke: 'black',
			strokeWeight: 1,
		})(doc);

		drawLineDocFn({
			points: [
				{ x: g.leftPadding, y: g.topPadding + g.props.spreadHeight + 3 },
				{ x: g.leftPadding, y: g.topPadding + g.props.spreadHeight + 10 }
			],
			stroke: 'black',
			strokeWeight: 1,
		})(doc);
	}
}


let blankpage = (doc) => draw_grid(doc, grid, {crops: true})		
let stylesheet = (doc, t) => Object.entries(t).forEach(([k, v]) => doc[k](v))

let page_number = 1

let cover = [(doc) => {
	doc.image('./cover.png',
		grid.rectoColumns[1].x, -1 * grid.hanglines[2],
		{ width: 200 })

	doc.image('./cover.png',
		grid.rectoColumns[0].x, grid.hanglines[5],
		{ width: 250 })

	doc.save()
	doc.font("./monument_mono_bold.otf")
	doc.fontSize(32)
	doc.fillColor('black')
	doc.text("PARAGRAPH", grid.rectoColumns[1].x, grid.hanglines[3])

	// side_page_thingie(doc, 2)

	doc.restore()
}]

let colophon = (doc) => {
	stylesheet(doc, tag)
	doc.text('COLOPHON', grid.versoColumns[0].x, inch(4))
	stylesheet(doc, body)
	doc.text(`
This publication is typeset using ./monument_mono.otf  and ./marist.ttf by ABC Dinamo. The PDF file was produced with love from a handwritten Javascript file.
`, grid.versoColumns[0].x, inch(4.5), { width: grid.columnWidth*5.1 })
}

let Head = (t, x, y) =>
	["Text", {
		text: t,
		x, y,
		width: grid.columnWidth*(6),
		fontSize: 11,
		fontFamily: './monument_mono_regular.otf',
		fill: [0, 0, 0, 65],
	}]

let Body = (t, x, y) => ["Text", {
	text: t,
	x, y,
	width: grid.columnWidth*(6),
	fontSize: 6,
	fontFamily: './monument_mono_regular.otf',
	fill: [0, 0, 0, 55],
}]

let instructionSheet = [
	Head("EVERY ITERATION", grid.rectoColumns[1].x, grid.hanglines[1]),
	Body(`x. Get the first word from 'words'
x. Check if 'Cursor X' + 'Word Width' is (>) Greater than 'Edge'
+. [If] above condition is true (jump to INCREMENT LINE)
+. [Else] place the word at 'Cursor X' and 'Cursor Y' and increment 'Cursor X' by 'Word Width'
`, grid.rectoColumns[1].x, grid.hanglines[2])
	,
]

let leftAlignedIncrement = [
	Head("INCREMENT LINE", grid.rectoColumns[1].x, grid.hanglines[5]),
	Body(`x. Put current word back in the list
x. Reset 'Cursor X' to 'Start Position X'
x. Increment 'Cursor Y' by 'Leading'
`, grid.rectoColumns[1].x, grid.hanglines[6])
]

let righAlignedIncrement = [
	Head("INCREMENT LINE", grid.rectoColumns[1].x, grid.hanglines[5]),
	Body(`x. Put current word back in the list
x. Increment all previous word's 'X' position by remainder of empty space.
x. Reset 'Cursor X' to 'Start Position X'
x. Increment 'Cursor Y' by 'Leading'
`, grid.rectoColumns[1].x, grid.hanglines[6])
]

let spreads = [
	[
		(doc) => runa(doc, instructionSheet.concat(leftAlignedIncrement)),
		blankpage
	]
]
// spreads.push([basic])
//

let text = `From this sensation trickles emotion and language, and from language flows narrative and meaning, which then flood into identity, society, and the political, commercial, and environment world. But it all must start with form.`

let leftPage = Array(42).fill(0).map((e, i) => {
	return [
		(doc) => draw_grid(doc, grid, {crops: true}),
		// ...[
		// 	i * 2, i * 2 + 1
		// 	// i * 3, i * 3 + 1, i * 3 + 2
		// ].map(ii =>
		(doc) => {
			runa(doc, ParagraphStepper(doc, {
				steps: i,
				x: grid.rectoColumns[1].x,
				// x: ii % 2 == 0 ? grid.verso_columns()[0].x : grid.recto_columns()[0].x,
				y: grid.hanglines[0],
				text,
				width: grid.columnWidth*(5.3),
				height: 150,
				fontFamily: './marist.ttf',
				fontSize: 9.25,
				statsTop: {
					// x: ii % 2 == 0 ? grid.verso_columns()[0].x : grid.recto_columns()[0].x,
					x: grid.versoColumns[1].x,
					y: grid.hanglines[0],
				},
				statsBottom: {
					// x: ii % 2 == 0 ? grid.verso_columns()[0].x : grid.recto_columns()[0].x,
					x: grid.versoColumns[1].x,
					y: grid.hanglines[4],
				}
			}))
		},

		// doc => {
		// 	doc.text('WHART THE CUKSKLSLAK', 50,50)
		// }
	]
})

let rightPage = Array(42).fill(0).map((e, i) => {
	return [
		(doc) => draw_grid(doc, grid, {crops: true}),
		// ...[
		// 	i * 2, i * 2 + 1
		// 	// i * 3, i * 3 + 1, i * 3 + 2
		// ].map(ii =>
		(doc) => {
			runa(doc, ParagraphStepper(doc, {
				steps: i,
				align: 'right',
				x: grid.rectoColumns[1].x,
				// x: ii % 2 == 0 ? grid.verso_columns()[0].x : grid.recto_columns()[0].x,
				y: grid.hanglines[0],
				text,
				width: grid.columnWidth*(5.3),
				height: 150,
				fontFamily: './marist.ttf',
				fontSize: 9.25,
				statsTop: {
					// x: ii % 2 == 0 ? grid.verso_columns()[0].x : grid.recto_columns()[0].x,
					x: grid.versoColumns[1].x,
					y: grid.hanglines[0],
				},
				statsBottom: {
					// x: ii % 2 == 0 ? grid.verso_columns()[0].x : grid.recto_columns()[0].x,
					x: grid.versoColumns[1].x,
					y: grid.hanglines[4],
				}
			}))
		},
	]
})

let boxed = (doc, t, x, y, pad, color = 'black') => {
	doc.save()
	doc.font(tag.font)
	doc.fontSize(6)
	doc.lineWidth(1)
	let bounds = doc.boundsOfString(t, { lineBreak: false })
	doc.undash()
	doc.rect(
		x - pad,
		y - pad,
		bounds.width + pad * 2,
		bounds.height + pad * 2)
		.fillAndStroke("white", color)
	doc.fillColor(color)
	doc.text(t, x, y, { lineBreak: false })
	doc.restore()
}


let ParagraphStepper = (doc, props) => {
	props.fontFamily ? doc.font(props.fontFamily) : 0
	props.fontSize ? doc.fontSize(props.fontSize) : 0
	let align = props.align ? props.align : 'left'

	let edgeLine = {
		stroke: [0, 30, 0, 0],
		strokeWeight: .5,
		strokeStyle: [4, 4],
		points: [{
			x: props.x + props.width,
			y: props.y,
		},
		{
			x: props.x + props.width,
			y: props.y + props.height,
		},
		]
	}

	let lines = [
		["Line", edgeLine],

		[(doc) => boxed(doc, "EDGE: " + (props.x + props.width).toFixed(1),
			props.x + props.width,
			props.y + props.height,
			2)],
	]
	let words = props.text.split(" ")
	let totalWords = words.length
	let leading = props.leading ? props.leading : 12
	let cursorY = props.y
	let cursorX = props.x
	let steps = props.steps
	let crossed = false

	let currentWord = ''
	let currentWordWidth = ""

	let line = (num, x, y, leading) => ({
		x,
		y: y + leading * num,
	})

	let xDataPosition = line(1, props.statsBottom.x, props.statsBottom.y, leading + 2)
	let yDataPosition = line(2, props.statsBottom.x, props.statsBottom.y, leading + 2)

	// let 
	while (words.length > 0 && cursorY < (props.y + props.height) && steps > 0) {
		crossed = false
		let lineOpts = { 
			words, x: props.x, y: cursorY, width: props.width, steps,
			align
		}
		if (props.fontFamily) lineOpts.fontFamily = props.fontFamily
		if (props.fontSize) lineOpts.fontSize = props.fontSize

		let leftOvers = Line(doc, lineOpts)
		// leftOvers.draw.forEach(e => lines.push(e))
		steps = leftOvers.steps
		cursorX = leftOvers.cursorX
		crossed = leftOvers.crossed
		currentWord = leftOvers.currentWord
		currentWordWidth = leftOvers.currentWordWidth.toFixed(1)

		cursorY += leading
	}

	if (crossed) {
		cursorX = props.x
		cursorY += leading
		edgeLine.strokeWeight = 1.2
		edgeLine.stroke = [0, 100, 50, 0]

		// lines.push(['Rect', {
		// 	x: grid.versoColumns[0].x + 2,
		// 	y: xDataPosition.y - 7,
		// 	width: grid.columnWidth*(5.5),
		// 	height: 65,
		// 	stroke: [100, 0, 0, 0],
		// 	strokeWeight: 1,
		// 	fill: 'white',
		// }])
		//
		// // --------------
		// // Start Marker
		// // --------------
		// // --------------
		// lines.push(['Line', {
		// 	stroke: [0, 0, 0, 35],
		// 	strokeWeight: 1,
		// 	strokeStyle: [3],
		// 	points: [
		// 		{
		// 			x: props.x,
		// 			y: grid.hanglines[3]
		// 		},
		// 		{
		// 			x: props.x,
		// 			y: props.y ,
		// 		},
		// 	]
		// }])
		//
		//
		// lines.push(['Line', {
		// 	stroke: 'black',
		// 	strokeWeight: 1,
		// 	strokeStyle: [3],
		// 	points: [
		// 		{
		// 			x: grid.versoColumns[0].x + 8,
		// 			y: grid.hanglines[3]+4
		// 		},
		// 		{
		// 			x: grid.versoColumns[0].x + 8,
		// 			y: xDataPosition.y + 1.5,
		// 		},
		// 	]
		//
		// }])
		//
		// lines.push(['Line', {
		// 	stroke: 'black',
		// 	strokeWeight: 1,
		// 	strokeStyle: [3],
		// 	points: [
		// 		{
		// 			x: grid.rectoColumns[0].x,
		// 			y: grid.hanglines[3]+4,
		// 		},
		// 		{
		// 			x: grid.versoColumns[0].x + 8,
		// 			y: grid.hanglines[3]+4,
		// 		},
		// 	]
		// }])

		// lines.push([(doc) => boxed(doc,
		// 	"Start: " + props.x.toFixed(1),
		// 	grid.rectoColumns[0].x,
		// 	grid.hanglines[3],
		// 	1.5)
		// ])


		lines.push([(doc) => boxed(doc,
			"Reset",
			grid.versoColumns[0].x,
			xDataPosition.y + 1.5,
			1.5,
			[100, 0, 0, 0])
		])


		lines.push([(doc) => boxed(doc,
			"Line",
			grid.versoColumns[0].x,
			yDataPosition.y + 1.5,
			1.5, [100, 0, 0, 0])
		])

		lines.push([(doc) => boxed(doc,
			"+",
			grid.versoColumns[0].x,
			yDataPosition.y + 15,
			1.5)
		])

		lines.push([(doc) => boxed(doc,
			"Leading: " + leading,
			grid.versoColumns[0].x,
			yDataPosition.y + 30,
			1.5)
		])

		lines.push([(doc) => boxed(doc,
			"Reset X to Start Position",
			grid.versoColumns[4].x,
			xDataPosition.y + 1.5,
			1.5, [100, 0, 0, 0])
		])

		lines.push([(doc) => boxed(doc,
			"Increment Y Position by Leading",
			grid.versoColumns[4].x,
			yDataPosition.y + 1.5,
			1, [100, 0, 0, 0])
		])

		//
		// --------------
		// Conditional
		// --------------
		// --------------

		lines.push([(doc) => boxed(doc,
			"When [X + Word Width] > [edge]",
			grid.versoColumns[4].x,
			grid.hanglines[4],
			1.5, [0, 0, 0, 100])
		])
	}

	let wordIndex = totalWords - words.length
	let style = {
		width: 200,
		fontFamily: tag.font,
		fontSize: 7,
	}

	lines.push(["Text", {
		text: "words = [" + words.map(e => '"' + e + '"').join(', ') + "]",
		...line(1, props.statsTop.x, props.statsTop.y, leading),
		...style
	}])

	lines.push(["Text", {
		text: "" + wordIndex + " / " + totalWords + " words",
		...line(0, props.statsTop.x, props.statsTop.y, leading),
		...style,
		fill: [100, 0, 0, 0]
	}])


	let pos = line(0, props.statsBottom.x, props.statsBottom.y, leading)
	lines.push([(doc) => boxed(doc, "Cursor", pos.x, pos.y, 2, 'black')])


	lines.push(["Text", {
		text: "[X] " + cursorX.toFixed(1) + " points",
		...xDataPosition,
		...style
	}])

	lines.push(["Text", {
		text: "[Y] " + cursorY.toFixed(1) + " points",
		...yDataPosition,
		...style
	}])
	//
	let wordPosIndex = 4
	if (crossed) {
		wordPosIndex = 7
	}
	//
	let pos2 = line(wordPosIndex, props.statsBottom.x, props.statsBottom.y, leading)
	lines.push([(doc) => boxed(doc, "Word", pos2.x, pos2.y, 2, 'black')])

	lines.push(["Text", {
		text: '[word] "' + currentWord + '"',
		...line(wordPosIndex + 1, props.statsBottom.x, props.statsBottom.y, leading),
		...style
	}])


	lines.push(["Text", {
		text: "[width] " + currentWordWidth,
		...line(wordPosIndex + 2, props.statsBottom.x, props.statsBottom.y, leading),
		...style
	}])

	lines.push(["Text", {
		text: "[width] " + currentWordWidth,
		...line(wordPosIndex + 2, props.statsBottom.x+50, props.statsBottom.y, leading),
		...style
	}])

	console.log(lines.length)

	return lines
}


let Line = (doc, props) => {
	let words = props.words
	let cursorX = props.x
	let steps = props.steps
	let drawables = []
	let crossed = false

	let currentWord = ''
	let currentWordWidth = 0
	let spaceWidth
	let pad

	while (words.length > 0 && cursorX < (props.x + props.width) && steps != 0) {
		let word = words.shift()
		if (!word) break
		let width = doc.widthOfString(word)
		let height = doc.heightOfString(word)
		 spaceWidth = doc.widthOfString(" ")

		let opts = {
			x: cursorX,
			y: props.y,
			text: word
		}

		if (props.fontFamily) opts.fontFamily = props.fontFamily
		if (props.fontSize) opts.fontSize = props.fontSize

		steps -= 1
		cursorX += width
		currentWord = word
		currentWordWidth = width + spaceWidth

		let randomLiner = () => Math.random() > .5 ? 'round' : 'square'

		let statHeight = 45

		if (
			// false
			steps == 0
		) {
			// X Line
			drawables.push(["Line", {
				stroke: 'black',
				// lineCap: randomLiner(),
				strokeWeight: 1,
				// lineJoin: randomLiner(),
				points: [{
					x: opts.x,
					y: opts.y + height + 2,
				},
				{
					x: opts.x,
					y: opts.y + height + 2 + statHeight,
				},
				{
					x: props.x + grid.columnWidth,
					y: opts.y + height + 2 + statHeight,
				},
				]
			}])
			//
			// // WIDTH LINE
			drawables.push(["Line", {
				stroke: 'black',
				strokeWeight: 4,
				points: [
					{
						x: opts.x + width + spaceWidth + 5,
						y: opts.y + height,
					},

					{
						x: opts.x + width + spaceWidth + 5,
						y: opts.y + height / 2 + statHeight,
					},
					{
						// x: opts.x + width + spaceWidth + 20,

						x: props.x + grid.columnWidth*(3) + 3,
						y: opts.y + height / 2 + statHeight,
						// y: opts.y + height + 18 + statHeight
					},

					{
						x: props.x + grid.columnWidth*(3) + 3,
						y: opts.y + height + 18 + statHeight

					},
				]
			}])

			drawables.push([
				(doc) => boxed(doc,
					"X + WORD WIDTH = " + (opts.x + width + spaceWidth).toFixed(1),
					props.x + grid.columnWidth*(3),
					opts.y + height + 18 + statHeight,
					1.5, crossed ? "red" : 'black'
				)])

			drawables.push([
				(doc) => boxed(doc,
					"X: " + opts.x.toFixed(1),
					props.x + grid.columnWidth*(1),
					opts.y + height + 8 + statHeight,
					1.5
				)])
			// drawables.push(["Text", {
			// 	text: "X: " + opts.x.toFixed(0),
			// 	fontSize: 6,
			// 	fill: 'black',
			// 	fontFamily: tag.font,
			// 	x: props.x + grid.columnWidth*(1),
			// 	y: opts.y + height + 8 + statHeight,
			// }])
		}

		// rectOpts.fill = [0, 0, 80, 0]

	  pad = props.x + props.width - cursorX 
		if (cursorX > props.x + props.width) {
			opts.fill = [0, 100, 50, 0]
			words.unshift(word)
			crossed = true
			pad += currentWordWidth

			// if (false) {
			if (steps == 0) drawables.push(["Text", opts])
			if (steps == 0) drawables.push(["Line", { points: [{ x: opts.x, y: opts.y }, { x: opts.x + width, y: opts.y + height }], stroke: 'blue', strokeWeight: 1 }])
			if (steps == 0) drawables.push(["Line", { points: [{ x: opts.x, y: opts.y + height }, { x: opts.x + width, y: opts.y }], stroke: 'blue', strokeWeight: 1 }])
			// }
			break
		}

		let rectOpts = { ...opts }
		rectOpts.width = width + spaceWidth
		rectOpts.height = height
		// rectOpts.stroke = 'blue'
		rectOpts.fill = [0, 0, 100, 0]
		// if (false) {
		if (steps == 0) drawables.push(["Rect", rectOpts])
		// }

		cursorX += spaceWidth

		drawables.push(["Text", opts])

		if (cursorX > props.x + props.width ) {
			cursorX -= spaceWidth
			break
		}
	}

	if (props.align == 'right') {
		drawables =
		drawables.map(e => {
			if (e[1]?.x && steps!=0) e[1].x += pad
			return e
		})
	}

	return {
		draw: drawables,
		crossed,
		words, steps, cursorX,
		currentWord,
		currentWordWidth,
	}
}


let side_page_thingie = (doc, yOff) => {
	let x = inch(10.8)
	let y = inch(1)

	doc.save()
	doc.rotate(90, { origin: [x, y] })
	doc.font('./monument_mono_bold.otf')
	doc.fontSize(48)

	doc
		.save()
		.rect(x, y, inch(8.5), inch(.25))
		.clip()
	doc.text('PARAGRAPH', x, y - yOff)
	doc.restore()
}

let page_number_fn = (page_number) => (doc) => {
	let pg = page_number
	doc.fontSize(9)
	doc.fillColor([0, 0, 0, 45])
	if (pg - 1 != 0) doc.text((pg - 1) + '', grid.versoColumns[1].x, grid.topPadding+inch(.125))
	doc.text((pg) + '', grid.rectoColumns[1].x, grid.topPadding+inch(.125))

	let yOff = page_number / 2
	// side_page_thingie(doc, yOff)

	doc.restore()

}

// spreads.push(...rightPage)
spreads.push(...leftPage)
// spreads.push([colophon])
// spreads.push([blankpage])
// spreads.push([blankpage])
spreads.push([blankpage])
spreads.push([blankpage])

// page_number += 2
spreads.forEach((e, i) => {
	// if (i < 2) return
	let fn = page_number_fn(page_number)
	e.push(fn)
	page_number += 2
})


let signature1 = spreads.slice(0, 13)
let signature2 = spreads.slice(12, 23)
let signature3 = spreads.slice(22, 33)
let signature4 = spreads.slice(32)
// let signature5 = spreads.slice(42, 53)

let writeSpreads = (spreads, filename) => {
	const doc = new PDFDocument({ layout: 'landscape' });
	doc.pipe(fs.createWriteStream(filename));

	spreads.forEach((spread, i) => {
		// doc.save()
		// doc.translate(inch(.5), inch(.5))

		spread.forEach(item => {
			item(doc)
		})

		// doc.restore()
		if (i != spreads.length - 1) doc.addPage()
	})

	doc.end();
}

let recto_image = (doc, spread, spreads) => {
	doc
		.save()
		.rect(inch(5.5), 0, inch(5.5), inch(8.5))
		.clip()
	spreads[spread].forEach(item => {
		item(doc)
	})
	doc.restore()
}
let verso_image = (doc, spread, spreads) => {
	doc
		.save()
		.rect(0, 0, inch(5.5), inch(8.5))
		.clip()

	spreads[spread].forEach(item => {
		item(doc)
	})

	doc.restore()
}

let pageImage = (doc, spreadNum, spreads) => {
	let spread = Math.floor(spreadNum / 2)
	return spreadNum % 2 == 1
		? recto_image(doc, spread, spreads)
		: verso_image(doc, spread, spreads)
}

let pages = (spreadcount) => {
	if (spreadcount % 2 == 1) {
		return Array(spreadcount).fill(undefined)
			.reduce((acc, _, i) =>
				(acc.push([i * 2, i == spreadcount - 1 ? 0 : i * 2 + 1]), acc), [])
	}

	else console.log("FUCK NOT MULTIPLE OF 4", (spreadcount * 2) - 2)
}
let imposedPages = (pagesArray) => {
	let spreadCount = pagesArray.length
	if (spreadCount % 2 != 1) {
		console.error("FUCK NOT MULTIPLE OF 4", (spreadCount * 2) - 2)
	}
	// get pages
	let last = pagesArray.length - 1
	let pair = (i) => pagesArray[last - i]
	let pairskiplast = (i) => pagesArray[last - i - 1]

	let middle = Math.ceil(last / 2)

	// switch each recto with pair spread recto till middle
	for (let i = 0; i < middle; i++) {
		let f_verso = pagesArray[i][0]
		let p_verso = pair(i)[0]

		pagesArray[i][0] = p_verso
		pair(i)[0] = f_verso
	}

	let pairedup = []

	// pair spreads up with each other
	for (let i = 0; i < middle; i++) {
		pairedup.push(pagesArray[i])
		pairedup.push(pairskiplast(i))
	}

	return pairedup
}


let drawCircleDocFn = (props) => (doc) => {
	doc.save();
	if (props.strokeWeight) doc.lineWidth(props.strokeWeight);
	let x = props.x ? props.x : 0;
	let y = props.y ? props.y : 0;
	doc.circle(x, y, props.radius ? props.radius : 5);
	if (props.stroke && props.fill) doc.fillAndStroke(props.fill, props.stroke);
	else {
		if (props.stroke) doc.stroke(props.stroke);
		if (props.fill) doc.fill(props.fill);
	}

	doc.restore();
};

let availableFonts = ["Times-Roman", "hermit", tag.font, title.font, './marist.ttf', './monument_mono_regular.otf'];

let drawTextDocFn = (props) => (doc) => {
	doc.save();
	let x = props.x;
	let y = props.y;
	let width = props.width ? props.width : 100;
	let height = props.height ? props.height : 100;
	let text = props.text;
	let fontSize = props.fontSize ? props.fontSize : 12;
	let fontFamily = props.fontFamily;
	// let stroke = props.stroke ? true : false;

	if (props.fill) doc.fillColor(props.fill);
	if (fontFamily && availableFonts.includes(fontFamily)) doc.font(fontFamily);
	// if (props.stroke) doc.stroke(props.stroke);
	doc.fontSize(fontSize);
	doc.text(text, x, y, { width, height });

	if (props.boundingBox) {
		doc.rect(x, y, width, height);
		doc.lineWidth(props.boundingBox);

		if (props.boundingBoxFill) {
			doc.fill(props.boundingBox);
		}
		else {
			doc.stroke('black');
		}
	}
	// if (props.stroke && props.fill) doc.fillAndStroke(props.fill, props.stroke);

	doc.restore();
};

let drawImageDocFn = (props) => (doc) => {
	// return;
	doc.save();
	let x = props.x;
	let y = props.y;
	let image = props.image;

	let width = props.width ? props.width : 100;

	if (!props.image) return;
	if (props.fill) doc.fillColor(props.fill);
	// if (props.stroke) doc.stroke(props.stroke);
	doc.image(image, x, y, { width });
	// if (props.stroke && props.fill) doc.fillAndStroke(props.fill, props.stroke);
	// else {
	// }

	doc.restore();
};

let drawImageCanvasFn = (props) => (ctx, canvas) => {
	let x = props.x;
	let y = props.y;
	let image = props.image;

	let width = props.width ? props.width : 100;

	if (!props.image) return;
	if (props.fill) doc.fillColor(props.fill);
	const ratio = img.height / img.width;
	const targetHeight = targetWidth * ratio;

	canvas.width = targetWidth;
	canvas.height = targetHeight;

	ctx.drawImage(img, x, y, targetWidth, targetHeight);
};

let drawLineDocFn = (props) => (doc) => {
	let points = props.points;
	if (props.points.length < 2) return;
	if (props.strokeStyle) doc.dash(props.strokeStyle[0])
	if (props.lineCap) doc.lineCap(props.lineCap)
	if (props.lineJoin) doc.lineJoin(props.lineJoin)
	// let start = points[0];
	// let x1 = start.x;
	// let y1 = start.y;
	//
	// let end = points[1];
	// let x2 = end.x;
	// let y2 = end.y;

	doc.save();
	doc.lineWidth(props.strokeWeight);
	doc.moveTo(points[0].x, points[0].y);
	points.slice(1).filter((e) =>
		e != undefined &&
		typeof e == "object"
	).forEach(
		(e) => doc.lineTo(e.x, e.y),
	);
	// .lineTo(x2, y2);
	if (props.stroke) doc.stroke(props.stroke);
	doc.restore();
	doc.undash()
};

let drawRectDocFn = (props) => (doc) => {
	doc.save();
	if (props.strokeWeight) doc.lineWidth(props.strokeWeight);
	let x = props.x ? props.x : 0;
	let y = props.y ? props.y : 0;
	let width = props.width ? props.width : 0;
	let height = props.height ? props.height : 0;
	doc.rect(x, y, width, height);
	if (props.strokeStyle) doc.dash(props.strokeStyle[0])
	if (props.stroke && props.fill) doc.fillAndStroke(props.fill, props.stroke);
	else {
		if (props.stroke) doc.stroke(props.stroke);
		if (props.fill) doc.fill(props.fill);
	}

	doc.restore();
};

let runa = (doc, drawables) => {
	let fns = {
		"Circle": drawCircleDocFn,
		"Text": drawTextDocFn,
		"Image": drawImageDocFn,
		"Rect": drawRectDocFn,
		"Line": drawLineDocFn,
		"Group": (props) => (doc) => {
			let drawables = props.draw ? props.draw : [];

			drawables.forEach((fn) => {
				if (!fn) return;
				 typeof fn[0] == 'function' 
					? fn[0](doc):
						typeof fns[fn[0]] == "function"
						? fns[fn[0]](fn[1])(doc)
							: console.log("ERROR: Neither a fn nor a key")
			});
		},
	};

	fns.Group({ draw: drawables })(doc);
}
let writeText = (text, x, y, width, height) => doc => {
}

let writeSignature = (signature, filename) => {
	const doc = new PDFDocument({ layout: 'landscape' });
	doc.pipe(fs.createWriteStream(filename));

	let pgs = pages(signature.length)
	let imposed_pages = imposedPages(pgs)
	imposed_pages.forEach(([v, r], i) => {
		pageImage(doc, v, signature)
		pageImage(doc, r, signature)
		if (i != imposed_pages.length - 1) doc.addPage()
	})

	doc.end();
}

let printing = false
if (printing) {
	writeSignature(signature1, 'left_aligned1.pdf')
	writeSignature(signature2, 'left_aligned2.pdf')
	writeSignature(signature3, 'left_aligned3.pdf')
	writeSignature(signature4, 'left_aligned4.pdf')
	// writeSignature(signature5, 'zine_signature5.pdf')
}
else writeSpreads(spreads, "testingNew.pdf")

