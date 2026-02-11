import { PDFDocument, StandardFonts,cmyk, rgb } from 'pdf-lib'
import fs from 'fs'

async function createPdf() {
 // US Letter size in PDF points
  const LETTER_WIDTH = 792;
  const LETTER_HEIGHT = 612;
  const pdfDoc = await PDFDocument.create()
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)

  // 2. Add a Letter-sized page
  const page = pdfDoc.addPage([LETTER_WIDTH, LETTER_HEIGHT]);
  const { width, height } = page.getSize()
	const imageBytes = fs.readFileSync('./spread.png');
  const image = await pdfDoc.embedPng(imageBytes);
  // (Optional) get scaled dimensions  
  // const jpgDims = jpgImage.scale(0.5); // scale to 50%

  // 4. Draw the image on the page
	page.drawImage(image, {
    x: 0,
    y: 0,
    width: LETTER_WIDTH,
    height: LETTER_HEIGHT,
  });

  const fontSize = 12 
  page.drawText('Checking this stuff, looks promising', {
    x: 50,
    y: height - 4 * fontSize,
    size: fontSize,
    font: timesRomanFont,
		lineHeight: 14,
    color: cmyk(0,1,0,0),
  })

  const pdfBytes = await pdfDoc.save()
	let b = Buffer.from(pdfBytes)
	fs.writeFileSync('./test.pdf', b)
}

createPdf()

// async function createPdf() {
// 	let  PDFDocument  = pdf.PDFDocument
//   const pdfDoc = await PDFDocument.create()

//   const page = pdfDoc.addPage()
//   const { width, height } = page.getSize()
//   const fontSize = 30
//   page.drawText('Creating PDFs in JavaScript is awesome!', {
//     x: 50,
//     y: height - 4 * fontSize,
//     size: fontSize,
//     // color: rgb(0, 0.53, 0.71),
//   })

//   const pdfBytes = await pdfDoc.save()
// 	console.log(pdfBytes)
// }

// createPdf()
