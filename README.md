<div align="center">

# VIDIA MCP — AI video production for AI agents

**견적받기 · 영상 제작 · 진행 확인 · 결과물 다운로드를 AI 에이전트의 MCP 도구로.**
**Quote, produce, track and download AI videos from any MCP client.**

[![npm](https://img.shields.io/npm/v/vidia-mcp?color=%232463eb&label=npm%20vidia-mcp)](https://www.npmjs.com/package/vidia-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**[vidia.kr](https://vidia.kr)** · **[개발자 가이드 Developer guide](https://vidia.kr/help/guide/developer)** · **[도구 목록 Tools](TOOLS.md)** · **[SDK: vidia-api](https://www.npmjs.com/package/vidia-api)**

</div>

---

## 이게 뭔가요? / What is this?

**KO** — 비디아(VIDIA)는 패키지(영상 제작 방법)를 고르고 주제만 적으면 대본·음성·이미지·AI 영상·자막까지 만들어 주는 AI 영상 제작 서비스입니다. 이 MCP 서버로 Claude·Cursor·Codex 같은 AI 에이전트가 비디아에서 직접 견적을 받고, 동의를 받은 뒤 제작을 시작하고, 완성된 영상을 내려받을 수 있습니다.

**EN** — VIDIA is an AI video production service: pick a package (a production recipe), write a topic, and VIDIA writes the script and produces narration, images, AI video clips and subtitles. With this MCP server, AI agents can get a quote, start a production after the user agrees, follow its progress and download the finished video.

**The server is hosted by VIDIA. 서버는 비디아가 운영합니다.**

```
https://vidia.kr/mcp
```

---

## 빠른 시작 / Quick start

### 1. API 키 만들기 / Create an API key

[vidia.kr/settings/api](https://vidia.kr/settings/api) 에서 키를 만드세요. 권한은 두 가지입니다.
Create a key at [vidia.kr/settings/api](https://vidia.kr/settings/api). Two scopes:

| 권한 Scope | 할 수 있는 일 What it can do |
|---|---|
| 조회·견적만 `read` | 패키지 찾기, 견적(무료), 진행 확인, 결과물 받기. 포인트를 쓰지 않습니다. / Browse, quote (free), track, download. Spends no points. |
| 제작 시작 허용 `run` | 위 기능 + 견적대로 제작 시작·취소. 하루 제작 상한을 키마다 정합니다. / Also start and cancel productions, with a per-key daily limit. |

> `tools/list` 는 키 없이 됩니다. 키는 `tools/call` 부터 확인합니다.
> `tools/list` works without a key; `tools/call` checks it.

### 2. 연결 / Connect

<table>
<tr><th>Client</th><th>방법 / How</th></tr>
<tr><td><b>Claude Code</b></td><td>

```bash
claude mcp add --transport http vidia https://vidia.kr/mcp --header "Authorization: Bearer YOUR_VIDIA_API_KEY"
```
</td></tr>
<tr><td><b>Claude Desktop</b><br><code>claude_desktop_config.json</code></td><td>

```json
{
  "mcpServers": {
    "vidia": {
      "command": "npx",
      "args": ["-y", "vidia-mcp"],
      "env": { "VIDIA_API_KEY": "YOUR_VIDIA_API_KEY" }
    }
  }
}
```
</td></tr>
<tr><td><b>Cursor</b><br><code>~/.cursor/mcp.json</code></td><td>

```json
{
  "mcpServers": {
    "vidia": {
      "url": "https://vidia.kr/mcp",
      "headers": { "Authorization": "Bearer YOUR_VIDIA_API_KEY" }
    }
  }
}
```
</td></tr>
<tr><td><b>VS Code</b><br><code>.vscode/mcp.json</code></td><td>

```json
{
  "servers": {
    "vidia": {
      "type": "http",
      "url": "https://vidia.kr/mcp",
      "headers": { "Authorization": "Bearer YOUR_VIDIA_API_KEY" }
    }
  }
}
```
</td></tr>
<tr><td><b>Codex</b><br><code>~/.codex/config.toml</code></td><td>

```toml
[mcp_servers.vidia]
command = "npx"
args = ["-y", "vidia-mcp"]
env_vars = ["VIDIA_API_KEY"]
```
</td></tr>
<tr><td>원격 MCP 미지원 클라이언트<br>Any stdio-only client</td><td>

```bash
VIDIA_API_KEY=YOUR_VIDIA_API_KEY npx -y vidia-mcp
```
의존성 0개 stdio 중계기, Node 18+. Zero-dependency stdio bridge.
</td></tr>
</table>

### 3. 물어보기 / Ask

> "비디아에서 건강 상식 숏츠 패키지로 '하품은 왜 옮을까?' 영상 견적 받아 줘."
> "Get me a VIDIA quote for a health shorts video about why yawns are contagious."

에이전트는 `vidia_list_packages` → `vidia_get_package` → `vidia_quote` 순서로 견적을 보여 주고, 사용자가 동의하면 `vidia_start_run` 으로 시작한 뒤 `vidia_get_run` 으로 진행을 확인하고 `vidia_get_downloads` 로 결과물 링크를 받습니다.

---

## 도구 / Tools

| 도구 Tool | 하는 일 What it does | 포인트 Points |
|---|---|---|
| `vidia_account` | 잔액·쿠폰·요금제 / balance, coupons, plan | 무료 free |
| `vidia_list_packages` | 발행된 패키지 찾기(예상 포인트·시간) / find published packages | 무료 free |
| `vidia_get_package` | 패키지 설명과 입력 칸 / package details and input fields | 무료 free |
| `vidia_quote` | 제작 견적(10분 유효) / production quote, valid 10 minutes | 무료 free |
| `vidia_start_run` | 견적대로 제작 시작(`confirm: true` 필수) / start a production | 예산만큼 먼저 잡고 남으면 돌려줌 / budget held, unused refunded |
| `vidia_get_run` | 상태·진행 단계·예상 남은 시간, 멈췄으면 `pending`·`actions` / state, step, ETA; `pending` and `actions` when stopped | 무료 free |
| `vidia_wait_run` | 끝나거나 멈출 때까지 최대 50초 기다렸다 답함 / waits up to 50 s for the run to finish or stop | 무료 free |
| `vidia_run_action` | 멈춘 제작 풀기(예산 추가·다시 시도·선택·마치기) / resolve a stopped run | `add_budget`·`approve_price` 만 포인트를 더 잡음 / only these hold more points |
| `vidia_start_batch` | 여러 편(최대 10) 한 번에 시작, 건별 결과 / start up to 10 at once | 건마다 예산만큼 / budget per item |
| `vidia_run_input` | 예전 제작에 넣었던 입력값 / the input of a past run | 무료 free |
| `vidia_list_runs` | 내 제작 목록 / my productions | 무료 free |
| `vidia_cancel_run` | 제작 취소 / cancel a production | — |
| `vidia_finish_run` | 썸네일 바꾸기·되돌리기, 쇼케이스 공개·내리기 / thumbnail, showcase | 무료 free |
| `vidia_trash_run` | 휴지통으로 보내기·복원 / trash or restore | 무료 free |
| `vidia_topic_idea` | 패키지에 맞는 추천 주제 / a suggested topic | 무료 free |
| `vidia_package_results` | 이 패키지로 만든 공개 결과물 / public results made with a package | 무료 free |
| `vidia_usage` | 저장공간·진행 중 제작·이 키의 남은 제작 수 / storage, active runs, runs left | 무료 free |
| `vidia_point_history` | 포인트 내역 / point history | 무료 free |
| `vidia_upload_link` | 자료실에 파일을 올릴 15분짜리 주소 / a 15-minute upload URL | 무료 free |
| `vidia_list_assets` | 내 자료실 파일 id(사진·영상 입력 칸에 넣음) / library file ids for file inputs | 무료 free |
| `vidia_get_downloads` | 완성 영상·썸네일·자막 다운로드 링크(1시간)와 유튜브 업로드 키트 / download links (1 hour) and a YouTube upload kit | 무료 free |

입력·출력 형식은 [TOOLS.md](TOOLS.md) 를 보세요. See [TOOLS.md](TOOLS.md) for arguments and results.

---

## 안전장치 / Safeguards

- **시험용 키**(`vd_test_…`)로 연결하면 포인트 없이 흐름 전체를 시험할 수 있습니다. 실제 영상 대신 약 40초 뒤 견본 결과가 오고 응답에 `test: true` 가 붙습니다.
- OAuth 를 지원하는 앱은 이 패키지 없이 `https://vidia.kr/mcp` 주소만 넣고 비디아 로그인으로 연결할 수 있습니다(키 붙여 넣기 없음).
- 포인트를 잡는 도구는 `vidia_start_run`·`vidia_start_batch` 와 `vidia_run_action` 의 `add_budget`·`approve_price` 뿐이며, 제작 시작은 유효한 견적 id·예산·`idempotency_key`·`confirm: true` 가 모두 있어야 시작합니다. 같은 `idempotency_key` 로 다시 보내면 새 제작을 만들지 않습니다.
- `run` 권한 키에는 하루(최근 24시간) 제작 상한이 있습니다. 키는 언제든 폐기할 수 있습니다.
- 예산 승인·확인 대기처럼 골라야 하는 순간은 진행 확인 응답의 `pending`·`actions` 를 보고 `vidia_run_action` 으로 풉니다(웹의 프로젝트 화면에서도 이어 갈 수 있습니다). 키마다 한 편·하루 예산 상한과 허용 IP 를 정할 수 있습니다.
- 이 패키지는 JSON-RPC 를 그대로 전달하는 중계기입니다. 키는 `Authorization` 헤더로만 보내고 출력·오류 메시지에서 가립니다.

- Connect with a **test key** (`vd_test_…`) to rehearse the whole flow for free: you get a sample result after about 40 seconds and every response carries `test: true`.
- Apps that support OAuth can skip this package: enter `https://vidia.kr/mcp` and sign in to VIDIA.
- Points are only held by `vidia_start_run`, `vidia_start_batch` and the `add_budget` / `approve_price` actions of `vidia_run_action`. Starting needs a valid quote id, a budget, an `idempotency_key` and `confirm: true`; retrying with the same `idempotency_key` never creates a second production.
- `run` keys carry a daily production limit and can be revoked at any time.
- When a run stops, read `pending` and `actions` in the run status and resolve it with `vidia_run_action` (or on the web project page). Keys can carry per-run and daily budget caps and an IP allowlist.
- This package only relays JSON-RPC. The key is sent in the `Authorization` header and redacted from all output.

## 환경 변수 / Environment

| 변수 Variable | 설명 Description |
|---|---|
| `VIDIA_API_KEY` | 비디아 API 키 / VIDIA API key (`vd_live_…` 또는 시험용 `vd_test_…`) |
| `VIDIA_MCP_URL` | 주소 변경(기본 `https://vidia.kr/mcp`) / endpoint override |

## REST API / SDK

코드에서 직접 쓰려면 [`vidia-api`](https://www.npmjs.com/package/vidia-api) 를 쓰세요. For code, use [`vidia-api`](https://www.npmjs.com/package/vidia-api).

## License

MIT
