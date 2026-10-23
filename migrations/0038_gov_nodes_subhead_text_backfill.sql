-- ────────────────────────────────────────────────────
-- 지원사업 구조 모듈 빌더 개편 P2 — subhead/subhead2 payload.text 보정
--
-- P0 이관(0037) 당시 doMigrateGovStructure()는 subhead/subhead2를
-- payload={text: item.notes, autoNumber:true}로 옮겼다(§가이드: "payload로 기존
-- notes를 {"text": notes} 형태로 이전"). 그런데 원본 8종 체계에서 subhead/subhead2의
-- 실제 제목 내용은 notes가 아니라 label(지금의 node.title)에 들어있었고, notes는
-- 대부분 빈 문자열이었다 — 예: ['subhead', '가. 창업아이템 배경', ''].
--
-- P1에서 정의한 14종 카탈로그(moduleTypes.ts)의 subhead/subhead2.text 필드는
-- "제목" 그 자체(= 렌더링되는 내용)로 정의돼 있어, 이관된 payload.text가 거의
-- 전부 빈 문자열인 채로 남아 validateNode()의 V003(필수 필드 누락)에 전부 걸린다
-- (P2 빌더 API 작업 중 /programs/:id/publish를 curl로 실제 호출해보다가 발견).
--
-- headlineBox/paragraph/table 등 다른 타입은 이관 매핑이 그대로 맞다(그 타입들의
-- "미완성" 신호는 실제로 관리자가 채워야 할 내용이 비어있다는 뜻이라 V003이 맞게
-- 동작하는 것) — subhead/subhead2만 "제목 내용이 title에는 있는데 payload.text에는
-- 없다"는 이관 매핑 자체의 문제라 여기서 한 번만 보정한다.
-- ────────────────────────────────────────────────────
UPDATE gov_support_nodes
SET payload = json_set(payload, '$.text', title)
WHERE expression_type IN ('subhead', 'subhead2')
  AND (json_extract(payload, '$.text') IS NULL OR json_extract(payload, '$.text') = '')
  AND title IS NOT NULL AND title != '';
