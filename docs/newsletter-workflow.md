# Newsletter signup workflow diagnosis

Date: 2026-09-14. Read-only investigation of the failed live signup at 14:38:05 UTC. Nothing was changed in
the n8n workflow, the site code, or any credential.

Sources: the site source at commits `b6bdadb` and `cf73b6a`, and the n8n public API (`/api/v1/workflows`,
`/api/v1/executions`) on the `zax76.app.n8n.cloud` instance, using GET requests only. This document contains
no API keys and no email addresses. Long identifiers (the beehiiv publication id, the Google Sheets document
id) are replaced with placeholders. In quoted strings, `·` marks a space character.

## Fixed on 2026-09-16

The workflow was rebuilt from its published version through the n8n public API and published as version
`e41bb8b2-e8cf-418d-b33b-082fd74f3580`. The sections after this one describe the state diagnosed on
2026-09-14.

Final workflow, in order:

1. **Website Form Webhook**: `POST /webhook/pizza-signup`, with the path, node id, and webhook id unchanged.
   Respond mode: using a Respond to Webhook node.
2. **Edit Fields**: outputs only `email` (`String($json.body.email ?? '').trim().toLowerCase()`), `source`,
   `consent` (the text `true` or `false`), `timestamp` (from `consentTimestamp`), and `pizzaStyle`, all read
   from `$json.body`.
3. **Save to Google Sheets**: the existing node and credential append `email`, `source`, `consent`, and
   `timestamp` to "Pizza Formula Leads" / "Sheet1". `pizzaStyle` is not written, because the node's cached
   column list has no such column.
4. **Respond to Webhook**: HTTP 200 with `{"ok": true}`. It runs only after the append succeeds, so the site
   no longer receives a 200 when an earlier node fails.
5. **Kit: subscribe**: `POST https://api.kit.com/v4/subscribers` with `email_address`. Kit creates new
   subscribers as active by default.
6. **Kit: tag pizza**: `POST https://api.kit.com/v4/tags/23500137/subscribers` with `email_address`. The
   `pizza` tag was created on 2026-09-16, and its id is stored in the node.
7. **Kit step failed**: a Stop and Error node. Both Kit nodes use "Continue (using error output)" and send
   failures here, so a Kit error marks the execution as failed. The sheet row and the response happen
   before the Kit steps and are not affected.

Both Kit nodes authenticate with the n8n credential "Kit API key" (Header Auth, header `X-Kit-Api-Key`,
created with its allowed domains limited to `api.kit.com`). No key is stored in node parameters. The beehiiv
HTTP Request node and its inline API key were removed.

Verified through the n8n API: the node order, response mode, credential references, Google Sheets
credential, and the absence of beehiiv references, inline headers, and stray spaces. A live submission
through the site has not been run yet; it should produce one sheet row, one Kit subscriber tagged `pizza`,
and a successful execution.

Still open:

- Earlier versions in n8n's workflow history still contain the beehiiv API key. Revoke that key in beehiiv.
- The site's privacy page and newsletter copy do not mention Kit.
- The two blank rows written on 2026-09-14 are still in the sheet.

## Summary

- The site sends a correct request. The email address arrives in n8n as `body.email`.
- The published n8n workflow reads it as `$json.email`, which does not exist, and several field names and
  parameter names contain trailing spaces. The beehiiv request therefore goes out with no `email` key, and
  beehiiv rejects it with HTTP 400.
- The spreadsheet step is Google Sheets, not Microsoft Excel. It ran before the failure and reported
  success, but the values it wrote were blank (a single space in each column).
- The site showed success because the Webhook node responds immediately, before any other node runs.
- The workflow also contains a step that subscribes the address to a **beehiiv** newsletter publication,
  with a welcome email requested.

## Part 1: What the site sends

Source: `src/pages/index.astro`, client script. No imported module sends the request, and no other file in
`src/` posts to the webhook.

| | Newsletter section form (`#email-form`) | Form below the calculator (`#recipe-email-form`) |
| --- | --- | --- |
| URL | `import.meta.env.PUBLIC_N8N_WEBHOOK_URL`, falling back to `https://zax76.app.n8n.cloud/webhook/pizza-signup`. The live build contains the same URL. | Same |
| Method | `POST` | `POST` |
| Headers | `Content-Type: application/json` | `Content-Type: application/json` |
| JSON body | `email` (form field `email`), `source: "pizza-calculator"`, `consent: true`, `consentTimestamp` (ISO time) | `email` (form field `recipe-email`), `source: "pizza-calculator-recipe"`, `pizzaStyle` (style name), `consent: true`, `consentTimestamp` |
| Success | `response.ok` (any 2xx): shows the success message, resets the form, sends `newsletter_signup_submitted` | Same |
| Failure | Non-2xx or network error: shows the error message | Same |

Step 4 (`cf73b6a`) did not change the request. Compared with `b6bdadb`, the only changes in these handlers
replace the `gtag('event', 'email_signup', ...)` calls inside the success branch with
`track('newsletter_signup_submitted', ...)`. Outside the handlers, the commit added `data-placement`
attributes to both forms and changed the success and footer copy. The URL, method, headers, and body fields
are identical.

## Part 2: The n8n workflow

### Which workflow

The instance has 36 workflows. Exactly one Webhook node uses the path `pizza-signup`:
**"The Pizza Dough Email List"** (id `zVGR67meBiGRN8k7`, active), node "Website Form Webhook", method POST.

### Published version and saved draft

| | Version id | Timestamp | Runs on production calls? |
| --- | --- | --- | --- |
| Published (active) version | `ca5056db-bfdd-47ab-bb09-1dbca4003a14` | created 2025-12-29 19:41:51 UTC, updated 19:42:23 UTC | Yes |
| Saved draft | `bee28d15-4317-4ecc-a36e-ecc033835791` | workflow updated 2025-12-29 20:28:03 UTC | No, never published |

The node parameters recorded with both failed executions match the published version. The draft differs in
Edit Fields, Save to Google Sheets, and HTTP Request (see "How the email field is referenced"). The
executions' `workflowVersionId` field shows the draft's id even though the parameters that ran are the
published ones; this was not investigated further.

Everything below describes the published version unless it says "draft".

### Nodes and connections

1. **Website Form Webhook** (`n8n-nodes-base.webhook`, v2.1)
2. **Edit Fields** (`n8n-nodes-base.set`, v3.4)
3. **Save to Google Sheets** (`n8n-nodes-base.googleSheets`, v4.7)
4. **HTTP Request** (`n8n-nodes-base.httpRequest`, v4.3)

```
Website Form Webhook ──> Edit Fields ──┬──> Save to Google Sheets
                                       └──> HTTP Request
```

Edit Fields feeds both nodes in parallel branches; Save to Google Sheets is not upstream of HTTP Request. With
the workflow's execution order setting (`v1`), Save to Google Sheets ran first and HTTP Request second. No node
has error handling settings (`onError`, `alwaysOutputData`) set.

### Webhook response

- Response mode: not set, which is n8n's default **Respond Immediately** (`onReceived`). The recorded
  execution parameters show `responseMode: onReceived`.
- Response code: default 200. Options: none.
- Respond to Webhook node: none in the workflow.

### Edit Fields (Set node, manual mapping, other fields not included)

| Field name as configured | Value as configured | Type |
| --- | --- | --- |
| `"=email··"` | `"={{ $json.email }}·"` | string |
| `"=source··"` | `"={{ $json.source }}·"` | string |
| `"=consent·"` | `"={{ $json.consent }}··"` | string |
| `"=timestamp·"` | `"={{ $json.consentTimestamp }}"` | string |

### Save to Google Sheets

- Operation: **append** a row to the document "Pizza Formula Leads", sheet "Sheet1" (document id omitted).
- Credential type and name: `googleSheetsOAuth2Api`, "Google Sheets account".
- Column mapping:

| Column | Expression |
| --- | --- |
| `email` | `"={{ $json.email }}·"` |
| `source` | `"={{ $json.source }}·"` |
| `consent` | `"={{ $json.consent }}·"` |
| `timestamp` | `"={{ $json.timestamp }}·"` |

There is no Microsoft Excel node in this workflow.

### HTTP Request

- Service: **beehiiv** newsletter API, create subscription:
  `POST https://api.beehiiv.com/v2/publications/<publication id>/subscriptions`. The configured URL has a
  leading space (`"·https://api.beehiiv.com/..."`); the recorded request used the URL without it.
- Authentication: **None**. An `Authorization` header is typed directly into the node's header parameters
  (value not shown here). It is not stored as an n8n credential.
- Body: JSON, key-value pairs.

| Body parameter name as configured | Value as configured |
| --- | --- |
| `"=email···"` | `"={{ $json.email }}"` |
| `"reactivate_existing·"` | `"false"` |
| `"send_welcome_email·"` | `"true··"` |
| `"utm_source·"` | `"website··"` |
| `"=utm_medium··"` | `"={{ $json.source }}·"` |

### How the email field is referenced

| Node | Published version (runs) | Saved draft (not published) |
| --- | --- | --- |
| Website Form Webhook output | `body.email` (no top-level `email`) | Same |
| Edit Fields | reads `$json.email`, writes field `"email··"` | reads `$json.body.email` with a leading space in the value (`"=·{{ $json.body.email }}"`), writes field `"email··"` |
| Save to Google Sheets | `$json.email` (Edit Fields output) | `$('Website Form Webhook').item.json.body.email` with leading spaces |
| HTTP Request | body name `"email···"`, value `$json.email` | body name `"email"`, value `$json['email··']`; the other four body parameters are not in the draft |

### Failed execution 250614

Started 2026-09-14 14:38:05.338 UTC, stopped 14:38:07.582 UTC, mode `webhook`, status `error`.

| Node | Started (UTC) | Duration | Result |
| --- | --- | --- | --- |
| Website Form Webhook | 14:38:05.385 | 0 ms | success |
| Edit Fields | 14:38:05.386 | 14 ms | success |
| Save to Google Sheets | 14:38:05.400 | 1,986 ms | success |
| HTTP Request | 14:38:07.386 | 194 ms | error, HTTP 400 |

What arrived, what each node produced, and what was sent to beehiiv:

| Webhook output `body` | Edit Fields output | Save to Google Sheets output | Request body sent to beehiiv |
| --- | --- | --- | --- |
| `email`: (address, masked) | `"email··"`: `"·"` | `email`: `"·"` | no `email` key |
| `source`: `"pizza-calculator-recipe"` | `"source··"`: `"·"` | `source`: `"·"` | `"utm_medium··"`: `"·"` |
| `pizzaStyle`: `"New York"` | (not mapped) | (not mapped) | |
| `consent`: `true` | `"consent·"`: `"··"` | `consent`: `"·"` | |
| `consentTimestamp`: `"2026-09-14T14:38:05.683Z"` | `"timestamp·"`: `null` | `timestamp`: `"·"` | |
| | | | `"reactivate_existing·"`: `"false"` |
| | | | `"send_welcome_email·"`: `"true··"` |
| | | | `"utm_source·"`: `"website··"` |

The Webhook output's top-level fields are `headers`, `params`, `query`, `body`, `webhookUrl`, and
`executionMode`; its `content-type` header is `application/json`.

beehiiv's response: `400 {"status":400,"statusText":"bad_request","errors":[{"message":"#/components/schemas/subscriptionrequest missing required parameters: email","code":"NOT_EXIST_REQUIRED_KEY"}]}`.

### Earlier execution 250613

Started 2026-09-14 14:30:21.220 UTC, from the same form (`source: "pizza-calculator-recipe"`). It ran the
same parameters, produced the same blank Edit Fields and Google Sheets output, and failed with the same
beehiiv error. These two are the only executions the API returned for this workflow, so the history does not
show whether any earlier signup worked.

## Part 3: Diagnosis

### Why beehiiv reports "missing required parameters: email"

Three mismatches combine:

1. **Wrong input path.** The Webhook node nests the posted JSON under `body`, but Edit Fields reads
   `$json.email`, `$json.source`, `$json.consent`, and `$json.consentTimestamp`. All four are undefined, so
   Edit Fields outputs only the literal spaces around its expressions (and `null` for `timestamp`).
2. **Trailing spaces in Edit Fields field names.** Edit Fields writes `"email··"`, not `email`, so a later
   `$json.email` is undefined even if the value were correct.
3. **Trailing spaces in the HTTP Request body parameter names.** The email parameter's value (`$json.email`)
   is undefined, and n8n left the parameter out of the body entirely. Even with a value, its name would be
   `"email···"`, which beehiiv does not treat as `email`. The other parameter names have trailing spaces as
   well, so `reactivate_existing`, `send_welcome_email`, `utm_source`, and `utm_medium` are not applied as
   intended either.

### Did the spreadsheet step run before the failure?

Yes. Save to Google Sheets started at 14:38:05.400 and finished successfully about two seconds before HTTP
Request started. It appended a row, but its output shows a single space in every column, because its mapping
reads `$json.email` and the other Edit Fields keys, which do not exist under those names. The address was not
saved. The same happened at 14:30:21. The sheet itself was not opened during this investigation (no Google
access was used); the evidence is the node's recorded output.

### Why the site received a success response

The Webhook node is set to Respond Immediately and there is no Respond to Webhook node. n8n returned 200 as
soon as the request arrived, before Edit Fields ran. The site treats any 2xx as success, so it showed the
success message and sent `newsletter_signup_submitted`. The failure two seconds later could not change a
response that had already been sent.

### Smallest fixes (descriptions only, not applied)

1. **Missing email (n8n).** In the published workflow's Edit Fields node, retype the four field names as
   exactly `email`, `source`, `consent`, and `timestamp`, and set their values to `{{ $json.body.email }}`,
   `{{ $json.body.source }}`, `{{ $json.body.consent }}`, and `{{ $json.body.consentTimestamp }}` with no
   characters before or after the braces. This alone fixes the Google Sheets row, whose mapping already reads
   those keys. If the beehiiv step stays, also retype the HTTP Request body parameter names without spaces
   (`email`, `reactivate_existing`, `send_welcome_email`, `utm_source`, `utm_medium`), the values `true` and
   `website`, and the URL without its leading space. Retype rather than paste, since pasted text is the
   likely source of the stray spaces. Publish the change; saving alone updates only the draft, which does
   not run.
2. **Blank spreadsheet rows.** Fix 1 makes new rows contain the submitted values. The rows appended at
   14:30:21 and 14:38:05 UTC contain only spaces and can be deleted.
3. **Success reported before the work is done.** Change the Webhook node's Respond setting to "Using
   'Respond to Webhook' Node" and add a Respond to Webhook node after Save to Google Sheets. The 200 is then
   sent only after the row is appended, which is what step 4 of ADR 0001 requires before
   `newsletter_signup_submitted` can stand for a confirmed signup. If the workflow stops before that node, the
   site should receive an error status instead; confirm this with a test submission. Setting the Webhook to
   "When Last Node Finishes" would also work but ties the response to the beehiiv call. No site change is
   needed; the site already treats non-2xx responses as failures.

### The beehiiv step: decide whether it should exist

The HTTP Request node subscribes each address to a **beehiiv** publication through beehiiv's
`/v2/publications/<id>/subscriptions` API, with `send_welcome_email` intended to be true. It has never
succeeded in the recorded executions. If it worked, beehiiv would add the subscriber to that publication and
could send a welcome email, and beehiiv emails carry their own unsubscribe links.

That conflicts with what the site now says. The privacy page states that addresses go through n8n into a
spreadsheet, that no confirmation email is sent, and that there is no automated unsubscribe, and ADR 0001
records no sending provider. The owner should either remove the HTTP Request node (and the beehiiv key in its
header), or keep it and update the privacy page, the newsletter copy, and the ADR to name beehiiv and describe
its emails.

### Other observations

- The beehiiv API key is stored as a plain `Authorization` header value in the node parameters, with the
  node's authentication set to None. It appears in workflow exports and to anyone with access to the
  workflow. Storing it in an n8n Header Auth credential would keep it out of the node parameters.
- The owner's understanding and ADR 0001 describe a Microsoft Excel spreadsheet. The workflow uses Google
  Sheets (document "Pizza Formula Leads"). The privacy page's wording, "a spreadsheet kept by the site owner",
  is still accurate.
- `pizzaStyle`, sent by the form below the calculator, is not used by any node.
- The saved draft reads the webhook body correctly but still has leading and trailing spaces in names and
  values, and it drops four beehiiv parameters. Publishing it as is would not be a reliable fix.
