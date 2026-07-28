# PandaWiki desktop test build

This test build connects the existing PandaWiki workspace UI to a deployed
PandaWiki server. It does not bundle server credentials.

## Connected functions

1. Sign in with a PandaWiki account.
2. List only the knowledge bases authorized for that account.
3. Browse each authorized knowledge-base tree and read node content.
4. Ask a non-streaming OpenAI-compatible RAG question using a separate
   PandaWiki chat API token.

## First-run configuration

1. Start the app and sign in to the configured server.
2. In **Knowledge provider → PandaWiki chat**, enter the complete endpoint:

   ```text
   https://pandawiki.docs.baizhi.cloud:2444/share/v1/chat/completions
   ```

3. Keep the model as `knowledge-base` and set a timeout of 90 seconds.
4. Paste the **问答机器人 API** token, then save.

The app stores the chat token only in Windows Credential Manager. The login
session and the chat token are separate. No `X-KB-ID` is sent: the PandaWiki
server resolves the knowledge base from the chat token.

## TLS prerequisite

The endpoint host must exactly match a DNS name in the server certificate SAN,
and Windows must trust the issuing CA. The test build does not disable TLS
verification or fall back to an insecure transport.

## Intentionally not in this test build

- PandaWiki document upload, parsing status and download
- PandaWiki server-backed search
- Conversation history and streaming SSE
- Entity/relation graph views

See `pandawiki-client-capability-audit.md` for the reasons and the planned
integration order.
