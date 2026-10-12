# 1.1.1

- 다운로드 링크 안내를 고쳤습니다(서버 변경): `vidia_get_downloads` 의 링크는 이제 링크를 받은 회원만 쓸 수 있습니다. 받을 때 API 키를 `Authorization: Bearer` 헤더로 함께 보내거나, 같은 회원으로 비디아에 로그인한 브라우저에서 여세요. 지금은 서버의 유예 기간이라 키 없이도 받히지만 `Vidia-Deprecation` 경고가 붙고, 유예 기간이 끝나면 키 없이 열면 `401 AUTH_REQUIRED` 입니다. 중계기 코드는 바뀌지 않았습니다(도구 설명과 `linkAuth` 안내는 서버가 줍니다).
- Download links from `vidia_get_downloads` are now valid only for the member they were issued to (server change). Fetch them with the API key in the `Authorization: Bearer` header, or in a browser signed in to VIDIA as the same member; during the server's grace period a link without a key still works with a `Vidia-Deprecation` warning; after it, the answer is `401 AUTH_REQUIRED`. The bridge code is unchanged.

# 1.1.0

- 서버 도구가 21개로 늘었습니다: 멈춘 제작 풀기(`vidia_run_action`)·기다리기(`vidia_wait_run`)·여러 편 시작(`vidia_start_batch`)·입력값(`vidia_run_input`)·마무리(`vidia_finish_run`)·휴지통·추천 주제·공개 결과물·사용량·포인트 내역·업로드 주소. 프롬프트 3종과 도구 결과 구조(outputSchema)도 서버가 제공합니다.
- 시험용 키(`vd_test_…`)와 로그인 연결(OAuth) 안내를 추가했습니다. 인증이 없으면 서버가 HTTP 401 로 답하며 중계기는 그 안내문을 그대로 전합니다.
- 키 가리기에 시험용 키·연결 토큰을 더했습니다.
- The server now offers 21 tools (resolve stopped runs, wait, batch start, thumbnails, showcase, usage and more), prompts and output schemas. Test keys and OAuth sign-in are documented; redaction covers test keys and OAuth tokens.

# 1.0.1

- 문서: 서버 도구 `vidia_list_assets`(자료실 파일 id) 안내 추가. 중계기 코드는 같습니다.
- Docs: document the `vidia_list_assets` server tool. Bridge code unchanged.

# 1.0.0

- 첫 공개: 비디아 MCP(https://vidia.kr/mcp) stdio 중계기. 도구 9개(계정·패키지 찾기·패키지 입력 칸·견적·제작 시작·진행 확인·제작 목록·취소·다운로드 링크).
- First release: stdio bridge for the VIDIA MCP server with 9 tools (account, packages, package inputs, quote, start, status, list, cancel, downloads).
