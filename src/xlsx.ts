// ────────────────────────────────────────────────────
// 최소 .xlsx(OOXML) 생성기 — 외부 라이브러리 없이 직접 ZIP 컨테이너를 구성한다.
// DirectSend 업로드 양식(이름/이메일 2열, 헤더 1행)에 맞춘 단순 시트 전용.
// 압축 없이(STORED) 저장 — 데이터가 작아(최대 수백 행) 굳이 deflate가 필요 없고,
// 구현을 단순하게 유지해 손상 위험을 줄인다.
// ────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function escapeXml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// DOS date/time: 1980-01-01 00:00:00 — 유효한 최소값이면 충분(각 파트에 실제 타임스탬프 의미 없음)
const DOS_TIME = 0
const DOS_DATE = (1 << 5) | 1

function u16(v: number) { const b = new Uint8Array(2); b[0] = v & 0xff; b[1] = (v >> 8) & 0xff; return b }
function u32(v: number) { const b = new Uint8Array(4); b[0] = v & 0xff; b[1] = (v >> 8) & 0xff; b[2] = (v >> 16) & 0xff; b[3] = (v >>> 24) & 0xff; return b }
function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(total)
  let off = 0
  for (const p of parts) { out.set(p, off); off += p.length }
  return out
}

function buildZip(files: { name: string; content: string }[]): Uint8Array {
  const enc = new TextEncoder()
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  for (const f of files) {
    const nameBytes = enc.encode(f.name)
    const data = enc.encode(f.content)
    const crc = crc32(data)

    const localHeader = concat(
      u32(0x04034b50), u16(20), u16(0), u16(0),
      u16(DOS_TIME), u16(DOS_DATE),
      u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0),
      nameBytes,
    )
    localParts.push(localHeader, data)

    const centralHeader = concat(
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0),
      u16(DOS_TIME), u16(DOS_DATE),
      u32(crc), u32(data.length), u32(data.length),
      u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
      u32(0), u32(offset),
      nameBytes,
    )
    centralParts.push(centralHeader)

    offset += localHeader.length + data.length
  }

  const centralStart = offset
  const central = concat(...centralParts)
  const eocd = concat(
    u32(0x06054b50), u16(0), u16(0),
    u16(files.length), u16(files.length),
    u32(central.length), u32(centralStart),
    u16(0),
  )

  return concat(...localParts, central, eocd)
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`

const RELS_ROOT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`

const WORKBOOK = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`

function colLetter(n: number): string {
  // n: 0-based column index
  let s = ''
  n += 1
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

function cell(rowIdx: number, colIdx: number, value: string): string {
  const ref = colLetter(colIdx) + rowIdx
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
}

/** name/email 2열 xlsx 생성 (DirectSend 업로드 양식: A1="이름", B1="이메일") */
export function buildNameEmailXlsx(rows: { name: string; email: string }[]): Uint8Array {
  const bodyRows: string[] = []
  bodyRows.push(`<row r="1">${cell(1, 0, '이름')}${cell(1, 1, '이메일')}</row>`)
  rows.forEach((r, i) => {
    const rowNum = i + 2
    bodyRows.push(`<row r="${rowNum}">${cell(rowNum, 0, r.name)}${cell(rowNum, 1, r.email)}</row>`)
  })
  const lastRow = rows.length + 1
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:B${lastRow}"/><sheetData>${bodyRows.join('')}</sheetData></worksheet>`

  return buildZip([
    { name: '[Content_Types].xml', content: CONTENT_TYPES },
    { name: '_rels/.rels', content: RELS_ROOT },
    { name: 'xl/workbook.xml', content: WORKBOOK },
    { name: 'xl/_rels/workbook.xml.rels', content: WORKBOOK_RELS },
    { name: 'xl/styles.xml', content: STYLES },
    { name: 'xl/worksheets/sheet1.xml', content: sheet },
  ])
}
