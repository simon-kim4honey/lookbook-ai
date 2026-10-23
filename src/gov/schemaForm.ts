// ────────────────────────────────────────────────────
// 지원사업 구조 모듈 빌더 개편 P1 — 스키마 → 인스펙터 폼 자동 렌더러
// (기획서 §12-2 point 2)
//
// 이 레포의 어드민(/admin02)은 React 같은 컴포넌트 프레임워크가 아니라, 서버가 문자열
// 템플릿으로 HTML을 만들고 그 안에 바닐라 JS <script>를 심는 방식이다(예: 기존
// gsAdminRenderSection). 그래서 "SchemaForm 컴포넌트"도 DOM을 직접 조작하는 객체가
// 아니라, (schema, value)를 받아 폼 HTML 문자열을 만들어주는 순수 함수로 만든다 —
// DOM이 필요 없어서 Node 테스트 러너로 그대로 단위 테스트할 수 있다는 장점도 있다.
//
// P3(빌더 UI)에서 이 함수가 반환한 HTML을 모듈 카드의 인스펙터 패널에 꽂고,
// onChangeFnName으로 넘긴 이름의 전역 함수를 실제로 구현해 저장 API를 호출하면 된다.
// ────────────────────────────────────────────────────

import { getExpressionType, type ExpressionTypeDef, type FieldSchema } from './moduleTypes.ts'

export interface SchemaFormOptions {
  idPrefix: string
  // 값이 바뀔 때 호출할 전역 함수 이름. 시그니처: (idPrefix, fieldKey, value) => void
  onChangeFnName: string
}

function esc(s: any): string {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function isEmptyValue(v: any): boolean {
  if (v === undefined || v === null) return true
  if (typeof v === 'string') return v.trim() === ''
  if (Array.isArray(v)) return v.length === 0
  return false
}

function renderFieldError(field: FieldSchema, value: any): string {
  // 2) "필수 필드 미입력 시 필드 하단에 인라인 오류를 표시한다(차단하지 않음)"
  if (!field.required || !isEmptyValue(value)) return ''
  return `<div class="sf-field-error" data-field="${esc(field.key)}">필수 입력입니다</div>`
}

function renderWidget(field: FieldSchema, value: any, opts: SchemaFormOptions): string {
  const fieldId = `sf_${opts.idPrefix}_${field.key}`
  const changeAttr = (jsValueExpr: string) =>
    `onchange="${opts.onChangeFnName}('${esc(opts.idPrefix)}','${esc(field.key)}',${jsValueExpr})"`

  switch (field.type) {
    case 'text':
      return `<input type="text" id="${fieldId}" class="sf-input" placeholder="${esc(field.placeholder || '')}" value="${esc(value ?? '')}" ${changeAttr('this.value')} />`
    case 'textarea':
      return `<textarea id="${fieldId}" class="sf-textarea" placeholder="${esc(field.placeholder || '')}" ${changeAttr('this.value')}>${esc(value ?? '')}</textarea>`
    case 'number':
      return `<input type="number" id="${fieldId}" class="sf-input" value="${esc(value ?? '')}" ${changeAttr('this.valueAsNumber')} />`
    case 'color':
      return `<input type="color" id="${fieldId}" value="${esc(value || '#3182F6')}" ${changeAttr('this.value')} />`
    case 'toggle':
      return `<input type="checkbox" id="${fieldId}" ${value ? 'checked' : ''} ${changeAttr('this.checked')} />`
    case 'select': {
      const opts2 = (field.options || []).map((o) =>
        `<option value="${esc(o.value)}" ${o.value === value ? 'selected' : ''}>${esc(o.labelKo)}</option>`
      ).join('')
      return `<select id="${fieldId}" class="sf-select" ${changeAttr('this.value')}>${opts2}</select>`
    }
    case 'list': {
      const items: any[] = Array.isArray(value) ? value : []
      const rows = items.map((it, i) => `
        <div class="sf-list-row" data-index="${i}">
          <input type="text" class="sf-input" value="${esc(typeof it === 'string' ? it : JSON.stringify(it))}"
            onchange="${opts.onChangeFnName}ListSet('${esc(opts.idPrefix)}','${esc(field.key)}',${i},this.value)" />
          <button type="button" onclick="${opts.onChangeFnName}ListRemove('${esc(opts.idPrefix)}','${esc(field.key)}',${i})">삭제</button>
        </div>`).join('')
      const addDisabled = field.maxItems && items.length >= field.maxItems ? 'disabled' : ''
      return `<div class="sf-list" data-field="${esc(field.key)}">${rows}
        <button type="button" ${addDisabled} onclick="${opts.onChangeFnName}ListAdd('${esc(opts.idPrefix)}','${esc(field.key)}')">+ 항목 추가</button>
      </div>`
    }
    case 'table': {
      const rows: any[] = Array.isArray(value) ? value : []
      const rowsHtml = rows.map((r, i) => `<tr data-index="${i}"><td>${esc(JSON.stringify(r))}</td><td><button type="button" onclick="${opts.onChangeFnName}ListRemove('${esc(opts.idPrefix)}','${esc(field.key)}',${i})">삭제</button></td></tr>`).join('')
      return `<table class="sf-table" data-field="${esc(field.key)}"><tbody>${rowsHtml}</tbody></table>
        <button type="button" onclick="${opts.onChangeFnName}ListAdd('${esc(opts.idPrefix)}','${esc(field.key)}')">+ 행 추가</button>`
    }
    default:
      return ''
  }
}

// schema(단일 표현방법 정의 또는 payloadSchema 배열 그 자체)로 인스펙터 폼 HTML을 만든다.
export function renderSchemaFormHtml(
  schemaOrType: ExpressionTypeDef | FieldSchema[] | string,
  value: Record<string, any>,
  opts: SchemaFormOptions
): string {
  const fields: FieldSchema[] =
    typeof schemaOrType === 'string' ? (getExpressionType(schemaOrType)?.payloadSchema || [])
    : Array.isArray(schemaOrType) ? schemaOrType
    : schemaOrType.payloadSchema

  return fields.map((f) => `
    <div class="sf-field" data-field="${esc(f.key)}">
      <label class="sf-label" for="sf_${esc(opts.idPrefix)}_${esc(f.key)}">${esc(f.labelKo)}${f.required ? ' <span class="sf-required">*</span>' : ''}</label>
      ${renderWidget(f, value?.[f.key], opts)}
      ${f.helpText ? `<div class="sf-help">${esc(f.helpText)}</div>` : ''}
      ${renderFieldError(f, value?.[f.key])}
    </div>`).join('')
}

// 디바운스 유틸 — P3가 admin02 페이지에 한 번만 심어서 쓰는 공용 런타임.
// "값 변경 시 300ms 디바운스로 onChange 호출"(§12-2 point 2)을 위한 최소 구현.
export const SCHEMA_FORM_RUNTIME_JS = `
function sfDebounce(fn, ms) {
  var timer = null;
  return function () {
    var args = arguments;
    var self = this;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(self, args); }, ms || 300);
  };
}
`
