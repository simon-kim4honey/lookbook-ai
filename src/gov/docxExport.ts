// ────────────────────────────────────────────────────
// 2026-10-31 — 사업계획서 초안을 편집 가능한 .docx 파일로 내보내기.
// 사용자가 "결과물을 한글/워드 파일로 다운받아 직접 수정하고 싶다"고 요청 —
// 결과 페이지(/gov-support/result/:id)의 rsRenderBlock과 같은 블록 구조
// (generated_content.sections[].blocks[])를 입력으로 받아 docx.Document로
// 변환한다. .hwp(한글 전용 포맷)는 생성 가능한 오픈소스 라이브러리가 사실상
// 없어(비공개 포맷) 대상에서 제외 — 한글 2014+는 .docx를 직접 열고 편집할 수
// 있어 실질적 대안이다.
//
// 이 파일은 DB·네트워크를 건드리지 않는 순수 변환 로직만 담는다(index.tsx가
// D1에서 generated_content/이미지를 읽어 넘겨준다) — generationAssembly.ts와
// 같은 이유로, Node 테스트 러너에서 API 키 없이 바로 검증할 수 있게 한다.
// ────────────────────────────────────────────────────

import {
  Document, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ImageRun, BorderStyle,
} from 'docx'

const ARB_COLOR = 'D97706' // rsMarkArb의 주황색(.rs-arb)과 동일 — AI가 추정/임의로 채운 구간 표시
// [[AI]] / [[AI:url]] 토큰 — 결과 페이지의 rsMarkArb와 동일한 패턴(이 파일은 index.tsx의
// 바깥쪽 템플릿 리터럴 밖에 있는 일반 .ts 모듈이라 백슬래시를 그대로 써도 안전하다).
const AI_TOKEN_RE = /\[\[AI(?::([^\]]*))?\]\]/g

// "...본문...[[AI]]" 또는 "...본문...[[AI:https://...]]" 문자열을 TextRun 배열로 바꾼다 —
// 토큰 직전까지는 주황색, 토큰 자체는 버린다(출처 URL은 docx에서는 괄호로 덧붙인다).
function markedRuns(text: string | null | undefined): TextRun[] {
  const s = String(text == null ? '' : text)
  if (!s) return []
  AI_TOKEN_RE.lastIndex = 0
  const runs: TextRun[] = []
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = AI_TOKEN_RE.exec(s))) {
    const before = s.slice(lastIndex, m.index)
    if (before) runs.push(new TextRun({ text: before, color: ARB_COLOR }))
    const src = m[1]
    if (src) runs.push(new TextRun({ text: ` [출처: ${src}]`, color: ARB_COLOR, size: 16, italics: true }))
    lastIndex = m.index + m[0].length
  }
  const rest = s.slice(lastIndex)
  if (rest) runs.push(new TextRun(rest))
  if (!runs.length) runs.push(new TextRun(''))
  return runs
}

export function plainText(text: string | null | undefined): string {
  return String(text == null ? '' : text).replace(AI_TOKEN_RE, '').trim()
}

// PNG(IHDR)/JPEG(SOF) 헤더에서 가로세로 비율만 읽어 docx 삽입 폭(고정)에 맞는 높이를
// 계산한다 — 라이브러리 없이 바이트만 읽는다. 못 읽으면 16:9로 대체(생성 이미지 대부분이
// 가로형이라 안전한 기본값).
function imageAspect(bytes: Uint8Array): number {
  try {
    // PNG: 시그니처(8) + IHDR 청크 길이(4) + "IHDR"(4) + width(4) + height(4)
    if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
      const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
      const w = dv.getUint32(16, false)
      const h = dv.getUint32(20, false)
      if (w > 0 && h > 0) return w / h
    }
    // JPEG: SOFn(0xC0~0xC3) 마커를 찾아 높이/너비 읽기
    if (bytes.length > 4 && bytes[0] === 0xFF && bytes[1] === 0xD8) {
      let i = 2
      while (i < bytes.length - 9) {
        if (bytes[i] !== 0xFF) { i++; continue }
        const marker = bytes[i + 1]
        if (marker >= 0xC0 && marker <= 0xC3) {
          const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
          const h = dv.getUint16(i + 5, false)
          const w = dv.getUint16(i + 7, false)
          if (w > 0 && h > 0) return w / h
        }
        const segLen = (bytes[i + 2] << 8) + bytes[i + 3]
        i += 2 + segLen
      }
    }
  } catch { /* 아래 기본값으로 대체 */ }
  return 16 / 9
}

function dataUriToBytes(dataUri: string | null | undefined): { bytes: Uint8Array; type: 'png' | 'jpg' } | null {
  if (!dataUri) return null
  const match = dataUri.match(/^data:([^;]+);base64,([\s\S]*)$/)
  if (!match) return null
  const mime = match[1]
  const type: 'png' | 'jpg' = mime.includes('png') ? 'png' : 'jpg'
  try {
    const binary = atob(match[2])
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return { bytes, type }
  } catch {
    return null
  }
}

const IMG_WIDTH_PX = 560 // A4 본문 폭(여백 2cm 기준 약 17cm ≈ 630px)보다 살짝 좁게

function imageParagraph(dataUri: string | null | undefined, caption?: string | null): Paragraph[] {
  const decoded = dataUriToBytes(dataUri)
  if (!decoded) {
    return [new Paragraph({ children: [new TextRun({ text: `[이미지를 불러오지 못했습니다${caption ? ': ' + plainText(caption) : ''}]`, italics: true, color: '8B95A1' })] })]
  }
  const aspect = imageAspect(decoded.bytes)
  const height = Math.round(IMG_WIDTH_PX / aspect)
  const out: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: decoded.bytes, type: decoded.type, transformation: { width: IMG_WIDTH_PX, height } })],
    }),
  ]
  if (caption) {
    out.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: plainText(caption), size: 18, color: '8B95A1' })] }))
  }
  return out
}

function simpleTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => new TableCell({
      shading: { fill: 'F8F9FA' },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
    })),
  })
  const bodyRows = rows.map((r) => new TableRow({
    children: r.map((cell) => new TableCell({ children: [new Paragraph({ children: markedRuns(cell) })] })),
  }))
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] })
}

export interface DocxImages {
  process: string | null | undefined
  visual: Record<string, string>
}

// 블록 하나 → Paragraph/Table 배열(docx는 문단·표가 같은 레벨의 자식이라 섞어서 반환).
function renderBlockToDocx(b: any, images: DocxImages): (Paragraph | Table)[] {
  switch (b?.type) {
    case 'headlineBox':
      if (!b.text) return []
      return [new Paragraph({
        alignment: AlignmentType.CENTER,
        shading: { fill: 'EAF2FF' },
        spacing: { before: 100, after: 200 },
        children: [new TextRun({ text: plainText(b.text), bold: true, color: '1B64DA' })],
      })]
    case 'subhead':
      if (!b.number && !b.text) return []
      return [new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun((b.number ? b.number + ' ' : '') + plainText(b.text))] })]
    case 'subhead2':
      if (!b.number && !b.text) return []
      return [new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun((b.number ? b.number + ' ' : '') + plainText(b.text))] })]
    case 'bulletsSummary':
    case 'bullets': {
      const out: (Paragraph | Table)[] = []
      if (b.label) out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(plainText(b.label))] }))
      for (const item of (b.items || [])) out.push(new Paragraph({ bullet: { level: 0 }, children: markedRuns(item) }))
      return out
    }
    case 'paragraph':
      if (!b.text) return []
      return [new Paragraph({ spacing: { after: 160 }, children: markedRuns(b.text) })]
    case 'table': {
      const headers: string[] = b.headers || []
      const rows: string[][] = b.rows || []
      if (!headers.length && !rows.length) return []
      return [simpleTable(headers, rows), new Paragraph({ text: '' })]
    }
    case 'timeline': {
      const cols: string[] = b.columns || ['구분', '추진 내용', '추진 기간', '세부 내용']
      const rows: string[][] = b.rows || []
      const out: (Paragraph | Table)[] = []
      if (b.title) out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(plainText(b.title))] }))
      out.push(simpleTable(cols, rows), new Paragraph({ text: '' }))
      return out
    }
    case 'compareTable': {
      const subjects: any[] = b.subjects || []
      const headers = [b.criteriaLabel || '비교 항목', ...subjects.map((s) => s.labelKo || s.label || s.key)]
      const rows = (b.rows || []).map((r: any) => [r.label, ...subjects.map((s) => {
        const v = (r.values || {})[s.key]
        return v == null ? '-' : String(v)
      })])
      return [simpleTable(headers, rows), new Paragraph({ text: '' })]
    }
    case 'iconStats': {
      const out: (Paragraph | Table)[] = []
      if (b.caption) out.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(plainText(b.caption))] }))
      for (const it of (b.tiles || []).slice(0, 4)) {
        out.push(new Paragraph({
          bullet: { level: 0 },
          children: [
            new TextRun({ text: `${it.icon || '📌'} ${plainText(it.label)}: `, bold: true }),
            ...markedRuns(it.value),
          ],
        }))
      }
      return out
    }
    case 'diagram': {
      const nodes: any[] = b.nodes || []
      if (b.diagramType === 'flow' && nodes.length) {
        return [new Paragraph({ children: [new TextRun(nodes.map((n) => n.label).join('  →  '))] })]
      }
      return nodes.map((n) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun(String(n.label || ''))] }))
    }
    case 'callout':
      if (!b.text) return []
      return [new Paragraph({ children: [new TextRun({ text: plainText(b.text), italics: true })] })]
    case 'chart':
      // 캔버스로 그리는 막대/바 차트는 docx로 그대로 옮기기 어려워, 어떤 차트인지와
      // 웹에서 확인하라는 안내만 남긴다 — 수치 자체는 바로 위/아래의 표(원가 구조 등)에 이미 있다.
      return [new Paragraph({ children: [new TextRun({ text: `※ ${plainText(b.caption) || '차트'}는 웹 버전 결과 페이지에서 확인해주세요.`, italics: true, color: '8B95A1' })] })]
    case 'visual': {
      if (b.visualId === 'process-flow') return imageParagraph(images.process, b.caption)
      if (b.visualUrl) {
        const key = String(b.visualUrl).split('/').pop() || ''
        return imageParagraph(images.visual[key], b.caption)
      }
      return [new Paragraph({ children: [new TextRun({ text: `[시각화: ${plainText(b.caption || b.visualId || '')} — 웹 버전에서 직접 채워주세요]`, italics: true, color: '8B95A1' })] })]
    }
    case 'evidenceGap':
      return [new Paragraph({ children: [new TextRun({ text: `⚠️ 근거 필요: ${plainText(b.need)} — ${plainText(b.how)}`, color: 'B91C1C' })] })]
    default:
      return []
  }
}

export interface GovSupportDocxInput {
  programName: string
  generatedAt: string | null
  content: { sections: Array<{ sectionId: string; headline: string; lead?: string; blocks: any[] }> }
  images: DocxImages
}

export function buildGovSupportDocx(input: GovSupportDocxInput): Document {
  const children: (Paragraph | Table)[] = []

  children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(input.programName || '지원사업 사업계획서 초안')] }))
  children.push(new Paragraph({
    spacing: { after: 300 },
    children: [new TextRun({
      text: '⚠️ 이 초안은 대표님이 직접 입력하신 답변을 바탕으로 AI가 작성을 돕는 참고용 초안입니다. 반드시 본인의 경험과 표현으로 직접 수정·보완하고 수치·사실관계를 확인한 뒤, 원문 공고 양식에 맞춰 제출해주세요.',
      italics: true, size: 18, color: '8A6D1D',
    })],
  }))

  for (const section of input.content?.sections || []) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: children.length > 0, children: [new TextRun(section.headline || '')] }))
    if (section.lead) children.push(new Paragraph({ children: markedRuns(section.lead) }))
    for (const b of (section.blocks || [])) {
      children.push(...renderBlockToDocx(b, input.images))
    }
  }

  return new Document({
    sections: [{
      properties: {},
      children,
    }],
  })
}
