import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createBridge, redact, checkEndpoint, DEFAULT_ENDPOINT } from '../src/bridge.js';

const KEY = 'vd_live_' + 'A'.repeat(32);

function jsonResponse(body, status = 200, extra = {}) {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...extra } });
}

test('기본 주소는 https://vidia.kr/mcp 이고 키는 Bearer 헤더로만 보낸다', async () => {
	const seen = [];
	const out = [];
	const reply = { jsonrpc: '2.0', id: 1, result: { tools: [] } };
	const bridge = createBridge({
		apiKey: KEY,
		write: (line) => out.push(JSON.parse(line)),
		fetch: async (url, init) => { seen.push({ url, init }); return jsonResponse(reply); }
	});
	assert.equal(bridge.endpoint, DEFAULT_ENDPOINT);
	await bridge.handleLine(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }));
	assert.equal(seen[0].url, 'https://vidia.kr/mcp');
	assert.equal(seen[0].init.headers.authorization, 'Bearer ' + KEY);
	assert.ok(!seen[0].url.includes(KEY));
	assert.deepEqual(out, [reply]);
});

test('키가 없으면 Authorization 헤더 없이 보낸다(목록 조회는 키 없이 된다)', async () => {
	let headers;
	const bridge = createBridge({ write: () => {}, fetch: async (url, init) => { headers = init.headers; return jsonResponse({ jsonrpc: '2.0', id: 1, result: {} }); } });
	await bridge.handleLine(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }));
	assert.equal(headers.authorization, undefined);
});

test('서버의 도구 결과(isError 포함)를 바꾸지 않고 전달하고, 협상한 프로토콜 버전을 다음 요청에 싣는다', async () => {
	const out = [];
	const calls = [];
	const replies = [
		{ jsonrpc: '2.0', id: 1, result: { protocolVersion: '2025-06-18', capabilities: {}, serverInfo: { name: 'kr.vidia/vidia', version: '1.0.0' } } },
		{ jsonrpc: '2.0', id: 2, result: { isError: true, content: [{ type: 'text', text: '{"error":{"code":"AUTH_REQUIRED"}}' }], structuredContent: { error: { code: 'AUTH_REQUIRED' } } } }
	];
	const bridge = createBridge({ write: (l) => out.push(JSON.parse(l)), fetch: async (url, init) => { calls.push(init.headers); return jsonResponse(replies[calls.length - 1]); } });
	await bridge.handleLine(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }));
	await bridge.handleLine(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'vidia_account', arguments: {} } }));
	assert.deepEqual(out, replies);
	assert.equal(calls[1]['mcp-protocol-version'], '2025-06-18');
});

test('알림(202 빈 본문)은 아무것도 쓰지 않고, SSE 응답은 메시지로 풀어 쓴다', async () => {
	const out = [];
	let n = 0;
	const bridge = createBridge({
		write: (l) => out.push(JSON.parse(l)),
		fetch: async () => (++n === 1 ? new Response(null, { status: 202 }) : new Response('event: message\ndata: {"jsonrpc":"2.0","id":3,"result":{}}\n\n', { status: 200, headers: { 'content-type': 'text/event-stream' } }))
	});
	await bridge.handleLine(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }));
	assert.equal(out.length, 0);
	await bridge.handleLine(JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'ping' }));
	assert.deepEqual(out, [{ jsonrpc: '2.0', id: 3, result: {} }]);
});

test('REST 오류 본문(429 등)·연결 실패는 JSON-RPC 오류로 바꾸고 키를 가린다', async () => {
	const out = [];
	const bridge = createBridge({ apiKey: KEY, write: (l) => out.push(JSON.parse(l)), fetch: async () => jsonResponse({ error: { code: 'RATE_LIMITED', message: '요청이 너무 많습니다.' } }, 429) });
	await bridge.handleLine(JSON.stringify({ jsonrpc: '2.0', id: 9, method: 'tools/list' }));
	assert.equal(out[0].id, 9);
	assert.equal(out[0].error.code, -32002);
	assert.match(out[0].error.message, /요청이 너무 많습니다/);
	const out2 = [];
	const down = createBridge({ apiKey: KEY, write: (l) => out2.push(JSON.parse(l)), fetch: async () => { throw new Error('connect failed Bearer ' + KEY); } });
	await down.handleLine(JSON.stringify({ jsonrpc: '2.0', id: 10, method: 'tools/list' }));
	assert.equal(out2[0].error.code, -32001);
	assert.ok(!out2[0].error.message.includes(KEY));
});

test('주소 검사: https 만, localhost 는 http 허용, URL 에 자격증명 금지', () => {
	assert.equal(checkEndpoint('https://vidia.kr/mcp/'), 'https://vidia.kr/mcp');
	assert.equal(checkEndpoint('http://localhost:8080/mcp'), 'http://localhost:8080/mcp');
	assert.throws(() => checkEndpoint('http://vidia.kr/mcp'), /https/);
	assert.throws(() => checkEndpoint('https://user:pw@vidia.kr/mcp'), /credentials/);
	assert.throws(() => checkEndpoint('not a url'), /valid URL/);
});

test('redact: 키 원문·Bearer 값·vd_live_ 토큰을 가린다', () => {
	assert.equal(redact('x ' + KEY + ' y', KEY), 'x *** y');
	assert.equal(redact('Authorization: Bearer abc.def', ''), 'Authorization: Bearer ***');
	assert.equal(redact('leak vd_live_abcDEF123', ''), 'leak vd_live_***');
});

test('공개 메타데이터: 이름·bin·mcpName·저장소가 맞고 README 에 연결 방법이 있다', () => {
	const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
	const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
	assert.equal(pkg.name, 'vidia-mcp');
	assert.equal(pkg.bin['vidia-mcp'], 'src/index.js');
	assert.equal(pkg.mcpName, 'kr.vidia/vidia');
	assert.equal(pkg.repository.url, 'git+https://github.com/lead788/vidia-mcp.git');
	assert.match(readme, /https:\/\/vidia\.kr\/mcp/);
	assert.match(readme, /VIDIA_API_KEY/);
	assert.doesNotMatch(readme, /vd_live_[A-Za-z0-9]{32}/);
	for (const tool of ['vidia_account', 'vidia_list_packages', 'vidia_get_package', 'vidia_quote', 'vidia_start_run', 'vidia_get_run', 'vidia_list_runs', 'vidia_cancel_run', 'vidia_get_downloads']) assert.match(readme, new RegExp('`' + tool + '`'));
});
