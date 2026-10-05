#!/usr/bin/env node
// vidia-mcp - run the VIDIA MCP server over stdio.
//
// Usage:
//   vidia-mcp
//
// Environment:
//   VIDIA_API_KEY   VIDIA API key (vd_live_...). Optional: tools/list works without one,
//                   tools/call needs it. Create one at https://vidia.kr/settings/api
//   VIDIA_MCP_URL   Endpoint override (default: https://vidia.kr/mcp).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createBridge, DEFAULT_ENDPOINT, redact } from './bridge.js';

const HELP = `vidia-mcp - VIDIA MCP server over stdio

  vidia-mcp

Options
  --version, -v        print version
  --help, -h           print this message

Environment
  VIDIA_API_KEY        VIDIA API key (create one at https://vidia.kr/settings/api)
  VIDIA_MCP_URL        endpoint override (default: ${DEFAULT_ENDPOINT})

Clients that support remote MCP can skip this bridge and connect straight to
${DEFAULT_ENDPOINT} with an Authorization: Bearer header.
Docs: https://vidia.kr/help/guide/developer
`;

function version() {
	const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
	return JSON.parse(readFileSync(pkgPath, 'utf8')).version;
}

async function main() {
	const argv = process.argv.slice(2);
	if (argv.includes('--help') || argv.includes('-h')) {
		process.stdout.write(HELP);
		return;
	}
	if (argv.includes('--version') || argv.includes('-v')) {
		process.stdout.write(version() + '\n');
		return;
	}
	if (argv.length) {
		process.stderr.write('vidia-mcp: unknown argument ' + argv[0] + '\n\n' + HELP);
		process.exitCode = 2;
		return;
	}

	const bridge = createBridge({
		apiKey: process.env.VIDIA_API_KEY,
		endpoint: process.env.VIDIA_MCP_URL,
		version: version()
	});

	if (!process.env.VIDIA_API_KEY) {
		process.stderr.write(
			'vidia-mcp: no VIDIA_API_KEY set - tool discovery works, tool calls will ask for a key (https://vidia.kr/settings/api)\n'
		);
	}

	await bridge.attach(process.stdin);
}

main().catch((err) => {
	process.stderr.write('vidia-mcp: ' + redact(err.message, process.env.VIDIA_API_KEY) + '\n');
	process.exitCode = 1;
});
