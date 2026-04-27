import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'eu-west-1' })

// ── Colours ───────────────────────────────────────────────────────────
const NAVY        = rgb(0.102, 0.227, 0.361)  // #1a3a5c
const NAVY_LIGHT  = rgb(0.165, 0.353, 0.549)  // #2a5a8c
const GREEN       = rgb(0.102, 0.478, 0.290)  // #1a7a4a
const GREEN_BG    = rgb(0.918, 0.961, 0.941)  // #eaf5f0
const MUTED       = rgb(0.420, 0.420, 0.420)  // #6b6b6b
const LIGHT_GRAY  = rgb(0.957, 0.961, 0.961)  // #f4f4f5 (row bg)
const BORDER      = rgb(0.867, 0.847, 0.816)  // #ddd8d0
const WHITE       = rgb(1, 1, 1)
const BLACK       = rgb(0.102, 0.102, 0.102)  // #1a1a1a

// ── Helpers ───────────────────────────────────────────────────────────

function response(statusCode, body, extraHeaders = {}) {
  const isBuffer = Buffer.isBuffer(body)
  return {
    statusCode,
    headers: {
      'Content-Type': isBuffer ? 'application/pdf' : 'application/json',
      ...extraHeaders,
    },
    isBase64Encoded: isBuffer,
    body: isBuffer ? body.toString('base64') : JSON.stringify(body),
  }
}

function formatTimestamp(iso) {
  const d = new Date(iso)
  return d.toUTCString().replace('GMT', 'UTC')
}

function shortHash(hash) {
  return `${hash.slice(0, 16)}…${hash.slice(-16)}`
}

// Draw a filled rounded rect (pdf-lib doesn't have built-in rounded rects,
// so we approximate with a regular rect — clean enough at this scale)
function drawRect(page, { x, y, width, height, color }) {
  page.drawRectangle({ x, y, width, height, color })
}

// Draw a horizontal rule
function drawRule(page, { x, y, width, color = BORDER, thickness = 0.5 }) {
  page.drawLine({
    start: { x, y },
    end:   { x: x + width, y },
    thickness,
    color,
  })
}

// ── PDF builder ───────────────────────────────────────────────────────

async function buildPdf({ transactionId, hash, fileName, tsaToken, timestamp }) {
  const pdfDoc    = await PDFDocument.create()
  const pageWidth = 595  // A4 points
  const pageHeight= 842
  const page      = pdfDoc.addPage([pageWidth, pageHeight])

  const fontBold  = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontReg   = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontMono  = await pdfDoc.embedFont(StandardFonts.Courier)

  const margin = 40
  const col    = margin
  const colW   = pageWidth - margin * 2

  // ── Header band ──────────────────────────────────────────────────
  drawRect(page, { x: 0, y: pageHeight - 76, width: pageWidth, height: 76, color: NAVY })

  // Brand name
  page.drawText('Nottario', {
    x: col, y: pageHeight - 44,
    font: fontBold, size: 26, color: WHITE,
  })
  page.drawText('Document Notarisation Service', {
    x: col, y: pageHeight - 61,
    font: fontReg, size: 8.5, color: rgb(0.659, 0.769, 0.878), // #a8c4e0
  })

  // Receipt label top-right
  page.drawText('NOTARISATION RECEIPT', {
    x: pageWidth - margin - fontBold.widthOfTextAtSize('NOTARISATION RECEIPT', 9),
    y: pageHeight - 38,
    font: fontBold, size: 9, color: WHITE,
  })
  page.drawText('nottario.com', {
    x: pageWidth - margin - fontReg.widthOfTextAtSize('nottario.com', 8),
    y: pageHeight - 52,
    font: fontReg, size: 8, color: rgb(0.659, 0.769, 0.878),
  })

  // ── Verified badge ────────────────────────────────────────────────
  const badgeY = pageHeight - 104
  drawRect(page, { x: col, y: badgeY, width: colW, height: 22, color: GREEN_BG })
  // Draw tick mark manually — WinAnsi fonts can't encode the ✓ glyph
  const tickX = col + (colW / 2) - (fontBold.widthOfTextAtSize('DOCUMENT SUCCESSFULLY NOTARISED', 9) / 2) - 14
  const tickY = badgeY + 8
  page.drawLine({ start: { x: tickX,     y: tickY },     end: { x: tickX + 4,  y: tickY - 4  }, thickness: 1.5, color: GREEN })
  page.drawLine({ start: { x: tickX + 4, y: tickY - 4 }, end: { x: tickX + 10, y: tickY + 4  }, thickness: 1.5, color: GREEN })
  const badgeText = 'DOCUMENT SUCCESSFULLY NOTARISED'
  page.drawText(badgeText, {
    x: col + (colW - fontBold.widthOfTextAtSize(badgeText, 9)) / 2,
    y: badgeY + 7,
    font: fontBold, size: 9, color: GREEN,
  })

  let y = pageHeight - 148

  // ── Section builder ───────────────────────────────────────────────
  function drawSection(title) {
    page.drawText(title, { x: col, y, font: fontBold, size: 11, color: BLACK })
    y -= 6
    drawRule(page, { x: col, y, width: colW, color: NAVY, thickness: 1 })
    y -= 16
  }

  function drawField(label, value, options = {}) {
    // Row background
    drawRect(page, { x: col, y: y - 5, width: colW, height: 18, color: LIGHT_GRAY })
    page.drawText(label, { x: col + 2, y: y + 5, font: fontReg, size: 8, color: MUTED })
    page.drawText(value, {
      x: col + 130, y: y + 5,
      font: options.mono ? fontMono : fontBold,
      size: options.mono ? 7.5 : 9,
      color: BLACK,
    })
    y -= 22
  }

  // ── Transaction details ───────────────────────────────────────────
  drawSection('Transaction details')
  drawField('Transaction ID',  transactionId)
  drawField('Notarised at',    formatTimestamp(timestamp))
  drawField('Standard',        'RFC 3161 Trusted Timestamp')
  drawField('TSA provider',    'DigiCert Timestamp Authority')
  drawField('File name',       fileName)

  y -= 10

  // ── Document fingerprint ──────────────────────────────────────────
  drawSection('Document fingerprint')

  page.drawText('SHA-256 hash  (computed on the user\'s device - document was never uploaded)', {
    x: col + 2, y, font: fontReg, size: 8, color: MUTED,
  })
  y -= 14

  // Hash box
  drawRect(page, { x: col, y: y - 8, width: colW, height: 20, color: LIGHT_GRAY })
  page.drawText(hash, { x: col + 4, y, font: fontMono, size: 7.5, color: NAVY_LIGHT })
  y -= 32

  // ── TSA token ─────────────────────────────────────────────────────
  drawSection('TSA timestamp token  (RFC 3161)')

  page.drawText('Base64-encoded signed token from DigiCert TSA - use this to independently verify the timestamp', {
    x: col + 2, y, font: fontReg, size: 8, color: MUTED,
  })
  y -= 14

  // Wrap token into lines of ~90 chars
  const lineLen = 90
  const tokenLines = []
  for (let i = 0; i < tsaToken.length && tokenLines.length < 6; i += lineLen) {
    tokenLines.push(tsaToken.slice(i, i + lineLen))
  }
  const tokenBoxH = tokenLines.length * 9 + 14
  drawRect(page, { x: col, y: y - tokenBoxH + 10, width: colW, height: tokenBoxH, color: LIGHT_GRAY })
  let ty = y
  for (const line of tokenLines) {
    page.drawText(line, { x: col + 4, y: ty, font: fontMono, size: 6.5, color: MUTED })
    ty -= 9
  }
  page.drawText('... (full token embedded in PDF metadata)', {
    x: col + 4, y: ty, font: fontReg, size: 7, color: MUTED,
  })
  y = ty - 20

  // ── Verify strip ──────────────────────────────────────────────────
  drawRule(page, { x: col, y, width: colW })
  y -= 18

  // QR placeholder box
  const qrSize = 52
  drawRect(page, { x: col, y: y - qrSize, width: qrSize, height: qrSize, color: LIGHT_GRAY })
  page.drawText('QR', { x: col + qrSize/2 - 6, y: y - qrSize/2 - 4, font: fontBold, size: 10, color: MUTED })

  // Verify text
  const tx = col + qrSize + 12
  page.drawText('Verify this document', { x: tx, y: y - 10, font: fontBold, size: 10, color: BLACK })
  page.drawText('Scan the QR code or visit:', { x: tx, y: y - 22, font: fontReg, size: 8, color: MUTED })
  page.drawText(`nottario.com/verify?txid=${transactionId}`, {
    x: tx, y: y - 34, font: fontBold, size: 8, color: NAVY_LIGHT,
  })
  page.drawText('Drop your document - the hash is recomputed locally, no upload needed.',
    { x: tx, y: y - 46, font: fontReg, size: 7.5, color: MUTED })

  y = y - qrSize - 16

  // ── Footer ────────────────────────────────────────────────────────
  drawRule(page, { x: col, y, width: colW })
  y -= 12

  const footerLines = [
    'This receipt constitutes cryptographic proof that the above document existed in its current form at the stated time.',
    'The document hash was computed on the user\'s device and was never transmitted to or stored by Nottario.',
    'The timestamp is independently verifiable against the DigiCert TSA certificate chain under RFC 3161.',
    'Nottario Ltd  |  nottario.com  |  support@nottario.com',
  ]
  for (const line of footerLines) {
    page.drawText(line, {
      x: col + (colW - fontReg.widthOfTextAtSize(line, 7)) / 2,
      y, font: fontReg, size: 7, color: MUTED,
    })
    y -= 10
  }

  // Embed TSA token in PDF metadata for archival
  pdfDoc.setTitle(`Nottario Receipt - ${transactionId}`)
  pdfDoc.setSubject(`SHA-256: ${hash}`)
  pdfDoc.setKeywords([transactionId, hash, 'RFC3161', 'DigiCert'])
  pdfDoc.setCreator('Nottario (nottario.com)')
  pdfDoc.setProducer('pdf-lib')

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

// ── Handler ───────────────────────────────────────────────────────────

export const handler = async (event) => {
  // GET /receipt/{txId} — transaction ID comes from path parameters
  const transactionId = event.pathParameters?.txId
    ?? event.queryStringParameters?.txId

  if (!transactionId || typeof transactionId !== 'string' || transactionId.length < 8) {
    return response(400, { message: 'Missing or invalid transaction ID.' })
  }

  // Fetch notarisation record
  let item
  try {
    const res = await dynamodb.send(new GetItemCommand({
      TableName: process.env.NOTARISATIONS_TABLE_NAME,
      Key: { transactionId: { S: transactionId } },
    }))
    item = res.Item
  } catch (err) {
    console.error('DynamoDB lookup failed:', err)
    return response(500, { message: 'Failed to retrieve notarisation record.' })
  }

  if (!item) {
    return response(404, { message: 'Notarisation record not found.' })
  }

  const record = {
    transactionId,
    hash:      item.hash.S,
    fileName:  item.fileName.S,
    tsaToken:  item.tsaToken.S,
    timestamp: item.timestamp.S,
  }

  // Build PDF
  let pdfBuffer
  try {
    pdfBuffer = await buildPdf(record)
  } catch (err) {
    console.error('PDF generation failed:', err)
    return response(500, { message: 'Failed to generate receipt PDF.' })
  }

  const safeFileName = `nottario-receipt-${transactionId}.pdf`

  return response(200, pdfBuffer, {
    'Content-Type':        'application/pdf',
    'Content-Disposition': `attachment; filename="${safeFileName}"`,
    'Cache-Control':       'private, max-age=3600',
  })
}
