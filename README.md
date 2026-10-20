<p align="center">
  <a href="https://onepostly.com">
    <img src="https://cdn.onepostly.com/banner.png" alt="Onepostly — One API for all social media" width="640">
  </a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@onepostly/sdk"><img src="https://img.shields.io/npm/v/@onepostly/sdk.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache--2.0-blue.svg" alt="License"></a>
</p>

<p align="center">
  Official TypeScript SDK for the <a href="https://onepostly.com">Onepostly API</a> — publish, schedule, and read results<br>
  across all supported social platforms with one request shape. See the <a href="https://onepostly.com/docs">docs</a> for the current platform list.
</p>

<p align="center">
  Zero dependencies. Node 18+, browsers, and edge runtimes.
</p>

## Installation

```sh
npm install @onepostly/sdk
```

## Usage

Every resource is its own API class built on a shared `Configuration`. Create an API key in the dashboard; it is sent as `Authorization: Bearer op_…`.

```ts
import { AccountsApi, Configuration, PostsApi } from "@onepostly/sdk";

const config = new Configuration({ accessToken: process.env.ONEPOSTLY_API_KEY });

const accounts = new AccountsApi(config);
const posts = new PostsApi(config);

const { data } = await accounts.listAccounts();

const created = await posts.createPost({
  createPostBody: {
    text: "Hello from Onepostly.",
    accounts: [{ accountId: data[0].id }],
  },
});

// One post per account, all sharing created.groupId.
for (const post of created.data) {
  console.log(post.id, post.platform, post.status); // "publishing"
}
```

Methods return the deserialized body directly. Pass `initOverrides` to any method to tweak the underlying `fetch` call, or use the `…Raw` variants to get `{ raw, value() }` with full access to the `Response`.

### Scheduling

```ts
await posts.createPost({
  createPostBody: {
    text: "Join our product webinar next week.",
    scheduledFor: "2027-03-15T09:00:00", // local time in `timezone`
    timezone: "America/New_York",
    accounts: [{ accountId: "acc_…" }],
  },
});
// 201 Created, status "scheduled"

await posts.updatePost({ id: "pst_…", updatePostBody: { scheduledFor: "2027-03-16T09:00:00" } });
await posts.deletePost({ id: "pst_…" }); // cancels a scheduled post
```

### Media

Create a media item, upload the file to its `uploadUrl`, then use its id in a post:

```ts
import { readFile } from "node:fs/promises";
import { MediaApi } from "@onepostly/sdk";

const media = new MediaApi(config);

const file = await readFile("launch.mp4");
const item = await media.createMedia({
  createMediaBody: { filename: "launch.mp4", contentType: "video/mp4", size: file.byteLength },
});

await fetch(item.uploadUrl, {
  method: "PUT",
  headers: { "Content-Type": "video/mp4" },
  body: file,
});

await posts.createPost({
  createPostBody: {
    text: "Launch day",
    media: [{ id: item.id }],
    accounts: [{ accountId: "acc_…" }],
  },
});
```

The upload URL needs no API key and accepts exactly the declared type and size.

### Analytics

```ts
import { AnalyticsApi } from "@onepostly/sdk";

const analytics = new AnalyticsApi(config);

const result = await analytics.getPostAnalytics({ id: "pst_…" });
console.log(result.status, result.metrics);

const timeline = await analytics.getPostAnalyticsTimeline({
  id: "pst_…",
  since: "2027-03-01T00:00:00Z",
  until: "2027-03-29T00:00:00Z", // exclusive
});
```

### Error handling

Every non-2xx response throws a `ResponseError` carrying the raw `Response`. The body has a stable `code` to build logic on, and a `requestId` to share with support:

```ts
import { ResponseError } from "@onepostly/sdk";

try {
  await posts.createPost({ /* … */ });
} catch (error) {
  if (error instanceof ResponseError) {
    console.log(error.response.status, await error.response.json());
    // 400 { error: "Invalid request: …", code: "VALIDATION_ERROR", param: "accounts.0.accountId", requestId: "req_…" }
  }
}
```

See [Errors](https://onepostly.com/docs/error-handling) for every code.

## API reference

All methods take a single request-parameters object; required fields are listed first.

<!-- BEGIN GENERATED API REFERENCE -->

### AccountsApi

| Method | Description |
| --- | --- |
| `accounts.listAccounts()` | List accounts |
| `accounts.createAccount()` | Connect a Bluesky account |
| `accounts.getAccount()` | Get account |
| `accounts.deleteAccount()` | Disconnect account |
| `accounts.updateAccount()` | Update account |
| `accounts.reconnectAccount()` | Reconnect account |
| `accounts.getAccountStats()` | Get account stats |
| `accounts.listAccountReviews()` | List Page reviews |
| `accounts.getMessengerProfile()` | Get Messenger profile |
| `accounts.setMessengerProfile()` | Set Messenger profile |
| `accounts.listAccountBoards()` | List Pinterest boards |
| `accounts.createAccountBoard()` | Create Pinterest board |
| `accounts.getCreatorInfo()` | Get TikTok creator info |
| `accounts.getAccountSettings()` | Get account settings |
| `accounts.updateAccountSettings()` | Update account settings |
| `accounts.listAccountMedia()` | List account media |
| `accounts.searchAccountAudio()` | Search Instagram audio |

### ConnectApi

| Method | Description |
| --- | --- |
| `connect.createConnectSession()` | Create connect session |
| `connect.listConnectCandidates()` | List candidates |
| `connect.selectConnectCandidate()` | Select candidate |

### ProfilesApi

| Method | Description |
| --- | --- |
| `profiles.listProfiles()` | List profiles |
| `profiles.createProfile()` | Create profile |
| `profiles.deleteProfile()` | Delete profile |
| `profiles.updateProfile()` | Rename profile |

### MediaApi

| Method | Description |
| --- | --- |
| `media.listMedia()` | List media |
| `media.createMedia()` | Create media |
| `media.getMedia()` | Get media |
| `media.deleteMedia()` | Delete media |

### PostsApi

| Method | Description |
| --- | --- |
| `posts.listPosts()` | List posts |
| `posts.createPost()` | Create post |
| `posts.getPost()` | Get post |
| `posts.deletePost()` | Delete post |
| `posts.updatePost()` | Update post |
| `posts.syncAccountPosts()` | Sync account posts |

### AnalyticsApi

| Method | Description |
| --- | --- |
| `analytics.getPostAnalytics()` | Get post analytics |
| `analytics.getPostAnalyticsTimeline()` | Get post analytics timeline |
| `analytics.getAccountAnalytics()` | Get account analytics |

### CommentsApi

| Method | Description |
| --- | --- |
| `comments.listComments()` | List comments |
| `comments.createComment()` | Comment on a post |
| `comments.replyToComment()` | Reply to a comment |
| `comments.deleteComment()` | Delete comment |
| `comments.hideComment()` | Hide comment |
| `comments.unhideComment()` | Unhide comment |
| `comments.likeComment()` | Like comment |
| `comments.unlikeComment()` | Unlike comment |
| `comments.sendPrivateReply()` | Send private reply |

### EngagementApi

| Method | Description |
| --- | --- |
| `engagement.likePost()` | Like a post |
| `engagement.unlikePost()` | Remove a like |
| `engagement.bookmarkPost()` | Bookmark a post |
| `engagement.unbookmarkPost()` | Remove a bookmark |
| `engagement.repostPost()` | Repost a post |
| `engagement.unrepostPost()` | Undo a repost |
| `engagement.listReposters()` | List reposters |

### InboxApi

| Method | Description |
| --- | --- |
| `inbox.listConversations()` | List conversations |
| `inbox.createConversation()` | Create conversation |
| `inbox.getConversation()` | Get conversation |
| `inbox.listMessages()` | List messages |
| `inbox.sendMessage()` | Send message |

### AutomationsApi

| Method | Description |
| --- | --- |
| `automations.listAutomations()` | List automations |
| `automations.createAutomation()` | Create automation |
| `automations.getAutomation()` | Get automation |
| `automations.deleteAutomation()` | Delete automation |
| `automations.updateAutomation()` | Update automation |

### WebhooksApi

| Method | Description |
| --- | --- |
| `webhooks.listWebhookEventTypes()` | List event types |
| `webhooks.listWebhooks()` | List webhooks |
| `webhooks.createWebhook()` | Create webhook |
| `webhooks.getWebhook()` | Get webhook |
| `webhooks.deleteWebhook()` | Delete webhook |
| `webhooks.updateWebhook()` | Update webhook |
| `webhooks.rotateWebhookSecret()` | Rotate signing secret |
| `webhooks.listWebhookDeliveries()` | List deliveries |
| `webhooks.getWebhookDelivery()` | Get delivery |
| `webhooks.retryWebhookDelivery()` | Retry delivery |
| `webhooks.testWebhook()` | Send test event |

### WalletApi

| Method | Description |
| --- | --- |
| `wallet.getWalletBalance()` | Get wallet balance |
<!-- END GENERATED API REFERENCE -->

Path and query parameters are flat fields of that object, and a JSON body sits under its schema name, such as `createPostBody`. Every operation, with request and response examples in TypeScript, is in the [API Reference](https://onepostly.com/docs/api-reference).

## Links

- [Documentation](https://onepostly.com/docs)
- [API Reference](https://onepostly.com/docs/api-reference)
- [Dashboard](https://app.onepostly.com)
- [OpenAPI spec](https://onepostly.com/openapi.json)

## License

Apache-2.0
