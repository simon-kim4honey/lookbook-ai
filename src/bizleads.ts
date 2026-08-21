// ────────────────────────────────────────────────────
// 의류·패션·잡화 통신판매업 사업자 리드 조회
// (구 Genspark 샌드박스 "fashion-biz" 프로젝트를 lookbook-ai/D1로 이관)
// 공정거래위원회 공공데이터 기반 — 조회 전용. 발송 기능 없음.
// ────────────────────────────────────────────────────
import { Hono } from 'hono'

type BizBindings = {
  LOOKBOOK_DB: D1Database
  ADMIN_PASSWORD: string
}

const biz = new Hono<{ Bindings: BizBindings }>()

const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('X-Admin-Password')
  const adminPassword = c.env.ADMIN_PASSWORD
  if (!adminPassword) {
    return c.json({ success: false, message: '서버 설정 오류: ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.' }, 500)
  }
  if (authHeader !== adminPassword) {
    return c.json({ success: false, message: '인증 실패' }, 401)
  }
  await next()
}
biz.use('/*', adminAuth)

function fmtTel(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/[^0-9]/g, '')
  if (digits.length < 7) return raw
  if (digits.startsWith('02')) {
    if (digits.length === 9) return digits.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3')
    if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3')
  } else if (digits.startsWith('0')) {
    if (digits.length === 9) return digits.replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3')
    if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  if (!digits.startsWith('0') && digits.length >= 7) {
    const pad = '0' + digits
    if (pad.startsWith('02')) {
      if (pad.length === 9) return pad.replace(/(\d{2})(\d{3})(\d{4})/, '$1-$2-$3')
      if (pad.length === 10) return pad.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3')
    } else if (pad.length === 10) return pad.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    else if (pad.length === 11) return pad.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  }
  return raw
}

function fmtBrno(raw: string): string {
  if (!raw) return ''
  const digits = raw.replace(/[^0-9]/g, '')
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
  return raw
}

// ────────────────────────────────────────────────────
// 통계
// ────────────────────────────────────────────────────
biz.get('/stats', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const total = (await db.prepare(`SELECT COUNT(*) AS n FROM biz_leads`).first<any>())?.n || 0
  const { results: regions } = await db.prepare(
    `SELECT region, COUNT(*) AS n FROM biz_leads WHERE region != 'N/A' AND region IS NOT NULL GROUP BY region ORDER BY n DESC`
  ).all()
  const validStats = await db.prepare(`
    SELECT
      SUM(CASE WHEN is_valid=1  THEN 1 ELSE 0 END) AS valid,
      SUM(CASE WHEN is_valid=0  THEN 1 ELSE 0 END) AS invalid,
      SUM(CASE WHEN is_valid=-1 THEN 1 ELSE 0 END) AS pending
    FROM biz_leads
  `).first()
  const contactStats = await db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN email LIKE '%@%' AND email NOT LIKE '%**%' THEN 1 ELSE 0 END) AS email_full,
      SUM(CASE WHEN email LIKE '%**%' THEN 1 ELSE 0 END) AS email_masked,
      SUM(CASE WHEN tel NOT LIKE '%개인정보%' AND tel != 'N/A' AND tel != '' AND tel IS NOT NULL THEN 1 ELSE 0 END) AS tel_full,
      SUM(CASE WHEN tel LIKE '%개인정보%' THEN 1 ELSE 0 END) AS tel_masked,
      SUM(CASE WHEN addr != 'N/A' AND addr != '' AND addr IS NOT NULL THEN 1 ELSE 0 END) AS addr_ok
    FROM biz_leads WHERE is_valid = 1
  `).first()
  const crawlStats = await db.prepare(`
    SELECT
      SUM(CASE WHEN crawl_status IS NOT NULL THEN 1 ELSE 0 END) AS done,
      SUM(CASE WHEN crawl_status = 'ok' THEN 1 ELSE 0 END) AS crawl_ok,
      SUM(CASE WHEN crawled_email IS NOT NULL AND crawled_email != '' THEN 1 ELSE 0 END) AS crawl_email,
      SUM(CASE WHEN crawled_tel   IS NOT NULL AND crawled_tel   != '' THEN 1 ELSE 0 END) AS crawl_tel,
      SUM(CASE WHEN crawled_kakao IS NOT NULL AND crawled_kakao != '' THEN 1 ELSE 0 END) AS crawl_kakao,
      SUM(CASE WHEN crawled_insta IS NOT NULL AND crawled_insta != '' THEN 1 ELSE 0 END) AS crawl_insta,
      SUM(CASE WHEN crawl_status IS NULL THEN 1 ELSE 0 END) AS crawl_pending
    FROM biz_leads WHERE is_valid = 1
  `).first()
  return c.json({ success: true, total, regions, validStats, contactStats, crawlStats })
})

// ────────────────────────────────────────────────────
// 목록 (검색/필터/페이지네이션)
// ────────────────────────────────────────────────────
function buildListWhere(c: any) {
  const q = c.req.query('q') || ''
  const region = c.req.query('region') || ''
  const status = c.req.query('status') || ''
  const validOnly = c.req.query('validOnly') || ''
  const emailOnly = c.req.query('emailOnly') || ''
  const telOnly = c.req.query('telOnly') || ''

  const wheres: string[] = []
  const params: any[] = []
  if (q) {
    wheres.push('(bzmnNm LIKE ? OR domain_clean LIKE ? OR domain LIKE ? OR addr LIKE ? OR ceo LIKE ? OR brno LIKE ? OR email LIKE ? OR crawled_email LIKE ?)')
    const p = `%${q}%`
    params.push(p, p, p, p, p, p, p, p)
  }
  if (region) { wheres.push('region = ?'); params.push(region) }
  if (status) { wheres.push('status = ?'); params.push(status) }
  if (validOnly === '1') wheres.push('is_valid = 1')
  if (emailOnly === '1') wheres.push("email LIKE '%@%' AND email NOT LIKE '%**%'")
  if (telOnly === '1') wheres.push("tel NOT LIKE '%개인정보%' AND tel != 'N/A' AND tel != '' AND tel IS NOT NULL")

  const where = wheres.length ? 'WHERE ' + wheres.join(' AND ') : ''
  return { where, params }
}

biz.get('/list', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = Math.min(200, parseInt(c.req.query('limit') || '100'))
  const offset = (page - 1) * limit
  const { where, params } = buildListWhere(c)

  const total = (await db.prepare(`SELECT COUNT(*) AS n FROM biz_leads ${where}`).bind(...params).first<any>())?.n || 0
  const { results: rows } = await db.prepare(`
    SELECT id, bzmnNm, codeName, status, inst, region, ceo, brno, declDate,
           method, domain, domain_clean, is_valid,
           addr, tel, email, server,
           crawled_email, crawled_tel, crawled_kakao, crawled_insta, crawl_status
    FROM biz_leads ${where} ORDER BY id LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all()

  return c.json({ success: true, total, page, limit, rows })
})

biz.get('/detail/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.LOOKBOOK_DB.prepare(`SELECT * FROM biz_leads WHERE id = ?`).bind(id).first()
  if (!row) return c.json({ success: false, message: '찾을 수 없습니다.' }, 404)
  return c.json({ success: true, ...row })
})

// ────────────────────────────────────────────────────
// CSV 내보내기
// ────────────────────────────────────────────────────
biz.get('/download.csv', async (c) => {
  const db = c.env.LOOKBOOK_DB
  const { where, params } = buildListWhere(c)
  const { results: rows } = await db.prepare(`
    SELECT id, bzmnNm, codeName, status, region, ceo, brno, declDate,
           domain_clean, is_valid, email, tel, addr, server,
           crawled_email, crawled_tel, crawled_kakao, crawled_insta
    FROM biz_leads ${where} ORDER BY id
  `).bind(...params).all<any>()

  const BOM = '﻿'
  const header = '번호,상호명,취급품목,영업상태,지역,대표자,사업자번호,신고일자,도메인,도메인유효,이메일(원본),전화번호(원본),크롤링이메일,크롤링전화,카카오채널,인스타그램,주소,서버소재지\r\n'
  const vLabel: Record<string, string> = { '1': '유효', '0': '불가', '-1': '미검증' }
  const csv = BOM + header + rows.map((r) => {
    const emailMasked = (r.email || '').includes('**') || !(r.email || '').includes('@')
    const telMasked = (r.tel || '').includes('개인정보')
    return [
      r.id, r.bzmnNm, r.codeName, r.status, r.region, r.ceo,
      fmtBrno(r.brno || ''), r.declDate,
      r.domain_clean, vLabel[String(r.is_valid)] ?? '미검증',
      emailMasked ? '[마스킹]' : (r.email || ''),
      telMasked ? '[마스킹]' : fmtTel(r.tel || ''),
      r.crawled_email || '',
      r.crawled_tel || '',
      r.crawled_kakao || '',
      r.crawled_insta || '',
      r.addr, r.server,
    ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  }).join('\r\n')

  return c.text(csv, 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="fashion_biz_leads.csv"',
  })
})

biz.get('/export/kakao.csv', async (c) => {
  const { results: rows } = await c.env.LOOKBOOK_DB.prepare(`
    SELECT id, bzmnNm, domain_clean, crawled_kakao FROM biz_leads
    WHERE crawled_kakao IS NOT NULL AND crawled_kakao != '' ORDER BY id
  `).all<any>()
  const BOM = '﻿'
  const header = '번호,상호명,도메인,카카오채널\r\n'
  const csv = BOM + header + rows.map((r) => [r.id, r.bzmnNm, r.domain_clean, r.crawled_kakao]
    .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  return c.text(csv, 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="fashion_biz_kakao.csv"',
  })
})

biz.get('/export/insta.csv', async (c) => {
  const { results: rows } = await c.env.LOOKBOOK_DB.prepare(`
    SELECT id, bzmnNm, domain_clean, crawled_insta FROM biz_leads
    WHERE crawled_insta IS NOT NULL AND crawled_insta != '' ORDER BY id
  `).all<any>()
  const BOM = '﻿'
  const header = '번호,상호명,도메인,인스타그램\r\n'
  const csv = BOM + header + rows.map((r) => [r.id, r.bzmnNm, r.domain_clean, r.crawled_insta]
    .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n')
  return c.text(csv, 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="fashion_biz_instagram.csv"',
  })
})

export default biz
