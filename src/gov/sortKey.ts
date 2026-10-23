// ────────────────────────────────────────────────────
// 지원사업 구조 모듈 빌더 개편 P2 — sort_key 유틸 (§12-3 point 2)
//
// 형제 노드 순서를 정수 재부여(O(n) 쓰기) 대신 lexicographic 문자열로 관리한다
// (Notion/Figma 방식 — §10-1). 키는 base36 알파벳("0-9a-z")의 자릿수 문자열로 보고,
// '문자열 뒤에 숨은 0들'을 상정해 비교한다 — 그래서 'a' < 'aa' < 'ab' < 'b'가 그대로
// 올바른 순서가 된다(일반 문자열 비교와 동일하게 동작).
// ────────────────────────────────────────────────────

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'
const BASE = ALPHABET.length // 36

function digitValue(ch: string): number {
  const v = ALPHABET.indexOf(ch)
  if (v === -1) throw new Error(`sort_key에 허용되지 않은 문자: "${ch}"`)
  return v
}

// prevKey/nextKey 둘 다 주어지면 그 사이, 한쪽만 없으면 그쪽 끝에, 둘 다 없으면
// 적당히 가운데에 새 키를 만든다. prevKey >= nextKey면 호출자 실수이므로 던진다.
export function between(prevKey: string | null | undefined, nextKey: string | null | undefined): string {
  const a = prevKey ?? null
  const b = nextKey ?? null
  if (a != null && b != null && a >= b) {
    throw new Error(`between(): prevKey("${a}")는 nextKey("${b}")보다 작아야 합니다.`)
  }

  const digits: number[] = []
  let i = 0
  // b가 아예 없으면(끝에 삽입) 매 자리에서 "다음 자리까지 무제한으로 열려 있다"고
  // 보고 상한을 BASE-1로 둔다. b가 있지만 이 자리에서 길이가 끝났으면(공통 접두사
  // 소진) 그 자리의 implicit 값은 0이다 — 'a'가 'a000...'을 뜻하는 것과 같은 논리.
  let unboundedAbove = b == null

  while (true) {
    const da = a != null && i < a.length ? digitValue(a[i]) : 0
    const db = unboundedAbove ? BASE - 1 : (b != null && i < b.length ? digitValue(b[i]) : 0)

    if (db - da > 1) {
      digits.push(Math.floor((da + db) / 2))
      break
    }
    if (db - da === 1) {
      // 이 자리에서는 여유가 없다 — a의 자릿수를 그대로 쓰고, 그 다음부터는 b의
      // 제약이 더 이상 유효하지 않다(이미 da < db인 자리이므로 더 깊은 자리는
      // 무엇을 넣어도 결과 < b가 보장된다).
      digits.push(da)
      unboundedAbove = true
      i++
      continue
    }
    // da === db — 공통 접두사, 그대로 복사하고 한 자리 더 들어간다.
    digits.push(da)
    i++
  }

  return digits.map((d) => ALPHABET[d]).join('')
}

// 형제 전체를 폭넓게 재분배한다 — between()을 같은 간격에 반복 호출하면 키가
// 한없이 길어질 수 있어(§10-1), 키 길이가 임계치(32자)를 넘으면 호출한다.
// 'r' 접두사는 임의 선택 — 알파벳 중간쯽이라 재분배 이후에도 위/아래 양쪽에
// between()으로 끼워 넣을 여유가 남는다.
export function rebalance(n: number): string[] {
  if (n <= 0) return []
  const width = Math.max(3, n.toString(36).length)
  return Array.from({ length: n }, (_, i) => 'r' + i.toString(36).padStart(width, '0'))
}

export const SORT_KEY_REBALANCE_THRESHOLD = 32
