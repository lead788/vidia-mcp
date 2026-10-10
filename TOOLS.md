# VIDIA MCP 도구 / Tools

서버: `https://vidia.kr/mcp` (Streamable HTTP, stateless). 모든 도구 결과는 `structuredContent` 와 같은 내용의 JSON 문자열(`content[0].text`)로 옵니다. 실패하면 `isError: true` 와 `{ "error": { "code", "message" } }` 를 돌려줍니다.

JSON-RPC 배치(배열)는 받지 않습니다. 메시지를 하나씩 보내세요. / Batches are not accepted.

Server: `https://vidia.kr/mcp`. Every result carries `structuredContent` plus the same JSON as text. Failures return `isError: true` with `{ "error": { "code", "message" } }`.

## 순서 / Flow

```
vidia_list_packages → vidia_get_package → vidia_quote → (사용자 동의 / user agrees) → vidia_start_run
  → vidia_wait_run (또는 / or vidia_get_run 30초 이상 간격) → 멈추면 / if stopped: vidia_run_action → vidia_get_downloads
```

---

## `vidia_account`

잔액·쿠폰·요금제. 인자 없음. / Balance, coupons, plan. No arguments.

결과 예 / Result: `{ "user": { "id", "nickname" }, "balance": { "available", "held", "currency": "P" }, "coupons", "plan": { "key", "concurrentRuns", "maxWaiting" } }` — 1P = 1원.

## `vidia_list_packages`

| 인자 Argument | 형식 Type | 설명 |
|---|---|---|
| `q` | string | 검색어(제목·설명·태그) / search text |
| `format` | `shorts` \| `longform` | 영상 형식 |
| `mix` | `ai-video` \| `mixed` \| `ai-image` | 결과물 구성 |
| `sort` | `popular` \| `recent` \| `completed` | 정렬 |
| `limit` / `offset` | integer | 최대 50 |

결과 / Result: `{ total, items: [{ slug, title, summary, format, tags, official, estimate: { point: { expected, low, high }, minutes: {...} }, url }] }`

## `vidia_get_package`

| 인자 | 형식 | 설명 |
|---|---|---|
| `slug` | string, **필수 required** | 패키지 slug |

결과에 `inputs` 가 있습니다. 견적·제작의 `input` 은 이 칸의 `key` 로 채웁니다. 칸 속성: `key, label, type(text|longtext|number|select|boolean|url|asset), required, help, options, min, max, maxLength, default, showWhen`. `asset` 칸은 비디아 자료실에 올린 파일 id 입니다.

`inputs` lists the fields to fill. Use each `key` in `input`. `asset` fields take file ids from `vidia_list_assets`.

## `vidia_quote`

| 인자 | 형식 | 설명 |
|---|---|---|
| `package` | string, **필수** | 패키지 slug |
| `input` | object, **필수** | 입력 칸 key → 값 |
| `title` | string | 프로젝트 이름 |
| `mode` | `AUTO` \| `MANUAL` | 기본 AUTO |
| `problem_policy` | `SKIP` \| `ASK` | 오류 처리, 기본 SKIP |
| `loop_policy` | `ACCEPT` \| `ASK` | 품질 미달 처리, 기본 ACCEPT |
| `loop_retries` | 0~5 | 다시 만들기 횟수 |

결과 / Result: `{ id, expiresAt, point: { minimum, recommended, expected, estimatedMin, estimatedMax, budgetMax }, balance, minutes, fees, external, notice }`. 포인트는 차감되지 않습니다. 견적은 10분 동안 유효합니다. `external` 이 있으면 시작 때 `external_consent: true` 가 필요합니다. / No points are spent. Valid for 10 minutes.

## `vidia_start_run` — 포인트 사용 / spends points

견적을 사용자에게 보여 주고 동의를 받은 뒤에만 부르세요. `run` 권한 키가 필요합니다.
Call only after showing the quote and getting the user's consent. Requires a `run` key.

| 인자 | 형식 | 설명 |
|---|---|---|
| `package`, `input` | **필수** | 견적 때와 같은 값 / same as the quote |
| `quote_id` | string, **필수** | `vidia_quote` 의 `id` |
| `budget` | integer, **필수** | 예산 포인트(`minimum` 이상, 보통 `recommended`) |
| `idempotency_key` | string, **필수** | 영숫자·`_`·`-` 8~96자. 재시도 때 같은 값을 쓰면 중복 제작이 없습니다 |
| `confirm` | `true`, **필수** | 사용자 동의 |
| `use_coupon` | boolean | 제작 쿠폰 사용 |
| `external_consent` | boolean | 견적에 `external`(외부 서비스 요청)이 있으면, 사용자가 그 전송에 동의했을 때 true |
| 그 밖의 설정 | | 견적 때와 같은 `title`·`mode`·… |

예산만큼 포인트를 먼저 잡아 두고, 끝나면 쓰지 않은 만큼 돌려줍니다. 결과 / Result: `{ id, state: "QUEUED", scheduledAt, webUrl }`.

## `vidia_get_run`

`run_id`(필수). 결과 / Result: `{ id, title, state, stateLabel, outcome, budget, spent, progress: { step, total }, eta: { seconds, finishAt }, hasVideo, error, reason, actionNeeded, webUrl }`. 실패하면 `error.code` 는 `RUN_FAILED` 이고 자세한 처리는 웹 화면에서 합니다.

상태 / States: `QUEUED`, `RUNNING`, `PAUSED`(확인 대기), `AWAITING_APPROVAL`(예산 승인 대기), `COMPLETED`, `FAILED`, `CANCELLED`. `PAUSED`·`AWAITING_APPROVAL` 이면 `actionNeeded` 의 웹 주소에서 이어 갑니다.

## `vidia_list_runs`

`state`, `limit`, `offset`. 최근 순 / newest first.

## `vidia_cancel_run` — 되돌릴 수 없음 / irreversible

`run_id`(필수), `confirmed`(오류로 멈춘 제작을 전액 돌려받고 취소할 때 — 만든 파일이 지워짐). `run` 권한 키가 필요합니다.

## `vidia_list_assets`

`kind`(image·video·audio), `q`, `limit`. 결과 / Result: `{ items: [{ id, kind, name, bytes, width, height, durationSec, createdAt }] }`. 입력 칸 `type` 이 `asset` 이면 이 `id` 를 넣습니다(여러 장이면 배열). 파일 올리기는 웹 자료실이나 REST·SDK(`POST /api/v1/assets`, `run` 키)로 합니다. / Use these ids in `asset` fields; upload via the web, REST or the SDK.

## `vidia_get_downloads`

`run_id`(필수). 결과 / Result: `{ runId, state, ttlSeconds: 3600, items: [{ id, kind, role(final_video|thumbnail|file), label, name, bytes, url, expiresAt }], publish }`. 링크는 키 없이 1시간 동안 받을 수 있고 Range 요청을 지원합니다. `publish` 에는 게시용 제목 후보·설명이 들어 있습니다.

Links work without a key for one hour and support Range requests.

## `vidia_wait_run`

| 인자 | 형식 | 설명 |
|---|---|---|
| `run_id` | integer, **필수 required** | 제작 번호 |
| `timeout_sec` | integer 1–50 | 기다릴 최대 초(기본 45) / max seconds to wait |

제작이 끝나거나 멈출 때까지 기다렸다가 `vidia_get_run` 과 같은 결과에 `waited`·`timedOut` 을 붙여 돌려줍니다. / Same result as `vidia_get_run` plus `waited` and `timedOut`.

## `vidia_run_action` — 멈춘 제작 풀기 / resolve a stopped run

`vidia_get_run` 결과의 `actions`(지금 보낼 수 있는 동작)와 `pending`(멈춘 사정: `kind`, `message`, `budget`, `candidates`, `priceApprovals`)을 보고 하나를 보냅니다.

| 인자 | 형식 | 설명 |
|---|---|---|
| `run_id` | integer, **필수** | 제작 번호 |
| `action` | string, **필수** | `add_budget` · `approve_price` · `retry` · `resume` · `finish` · `pause` · `set_mode` · `resend_external` · `skip` · `more` · `continue` · `choose` · `partial` · `start` · `acknowledge` |
| `add`, `idempotency_key` | integer, string | `add_budget`: 더 승인할 포인트와 중복 방지 키 |
| `approval_id`, `headroom_pct` | integer | `approve_price`: `pending.priceApprovals` 의 번호, 추가 허용폭 % |
| `step_id` | integer | `choose`: `pending.candidates` 의 `step_id` |
| `rounds` | integer 1–3 | `more`: 더 다시 만들 횟수 |
| `mode` | `AUTO` \| `MANUAL` | `set_mode` |
| `confirm` | boolean | `add_budget`·`approve_price`·`resend_external` 은 사용자 확인 뒤 `true` |

`add_budget` and `approve_price` hold more points: show the amount, get the user's agreement, then pass `confirm: true`.

## `vidia_start_batch` — 포인트 사용 / spends points

`items`(1–10, 각 건은 `vidia_start_run` 과 같은 칸)와 맨 위 `confirm: true`. 건별로 처리해 `{ total, started, failed, items: [{ index, ok, run | error }] }` 를 돌려줍니다 — 하나가 거절돼도 나머지는 시작됩니다. / Per-item results; one rejection does not stop the others.

## `vidia_run_input`

`run_id` → `{ runId, package, input }`. 같은 내용으로 다시 만들 때 `vidia_quote` 에 그대로 넣습니다. / Reuse it in `vidia_quote` to make the same video again.

## `vidia_finish_run`

`run_id` 와 다음 중 **하나**: `thumbnail_asset_id`(자료실 이미지를 대표 썸네일로), `thumbnail_reset: true`(처음 것으로), `showcase: true | false`(쇼케이스 공개·내리기 — 공개는 `confirm: true` 필요). / Exactly one of these per call; publishing needs `confirm: true`.

## `vidia_trash_run`

`run_id`, `restore?` — 끝난 제작을 휴지통으로 보내거나(30일 뒤 자동 삭제) 복원합니다. / Trash a finished run (auto-deleted after 30 days) or restore it.

## `vidia_topic_idea` · `vidia_package_results` · `vidia_usage` · `vidia_point_history`

- `vidia_topic_idea` — `package`, `skip_id?` → `{ eligible, idea: { id, topic, reason }, preparing }`
- `vidia_package_results` — `package`, `limit?`, `offset?` → `{ total, items: [{ title, by, thumbnailUrl, videoUrl }] }`
- `vidia_usage` — 인자 없음 → `{ storage, runs, system, key: { mode, scope, runsLeft, … } }`
- `vidia_point_history` — `days?` (7·30·90), `limit?`, `page?` → `{ total, items: [{ type, delta, balanceAfter, memo, at }] }`

## `vidia_upload_link`

인자 없음 → `{ uploadUrl, method: "POST", field: "file", expiresAt }`. 그 주소로 multipart POST 를 보내면 자료실에 올라갑니다(15분, 500MB 이하): `curl -F "file=@photo.jpg" "<uploadUrl>"` → `{ asset: { id } }`. / A 15-minute URL that accepts one multipart upload without a key header.

## 시험용 키 / Test keys

`vd_test_…` 키로 연결하면 `vidia_start_run` 이 실제 제작 대신 모의 제작을 만듭니다(포인트 없음, 약 40초 뒤 견본 결과, 응답에 `test: true`). `test_scenario`: `complete` · `fail` · `budget` · `review`. / With a test key, runs are simulated and cost nothing.

## 프롬프트 / Prompts

`prompts/list`: `make_video`(주제 → 견적 → 제작 → 결과물), `check_runs`(진행·멈춘 제작 살펴보기), `try_test_key`(시험용 키로 연동 시험).

## 오류 코드 / Error codes

| code | 뜻 Meaning |
|---|---|
| `AUTH_REQUIRED` / `AUTH_INVALID` | 키 없음·틀림·폐기 / missing, wrong or revoked key |
| `SCOPE_FORBIDDEN` | 조회 전용 키로 제작 시작·취소 / read key used to start or cancel |
| `INPUT_INVALID` / `INPUT_INCOMPLETE` | 인자·입력 칸 오류(`detail` 참고) |
| `PACKAGE_NOT_FOUND` / `RUN_NOT_FOUND` | 없거나 볼 수 없음 |
| `QUOTE_EXPIRED` / `QUOTE_CHANGED` | 견적 만료·견적과 다른 요청 — 다시 견적 |
| `BUDGET_BELOW_MINIMUM` | 예산이 견적 최소보다 적음 |
| `CONFIRM_REQUIRED` | `confirm: true` 없음 |
| `KEY_DAILY_RUN_LIMIT` | 키의 하루 제작 상한 |
| `QUEUE_FULL`, `RATE_LIMITED` | 잠시 뒤 다시 |
