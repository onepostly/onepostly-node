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

Every resource is its own API class built on a shared `Configuration`:

```ts
import { Configuration, PostsApi } from "@onepostly/sdk";

const config = new Configuration({
  apiKey: process.env.ONEPOSTLY_API_KEY, // sent as the `x-api-key` header
});

const posts = new PostsApi(config);

const response = await posts.createPost({
  createPostBody: {
    text: "Hello from Onepostly",
    mediaKind: "text",
    destinations: [{ connectionId: "…" }],
  },
});

const post = response.post;
console.log(post.id, post.status); // "queued"
```

Methods return the deserialized body directly (`PostResponse`, `ListPosts200Response`, …). Pass `initOverrides` to any method to tweak the underlying `fetch` call, or use the `…Raw` variants to get `{ raw, value() }` with full access to the `Response`.

### Scheduling

```ts
await posts.createPost({
  createPostBody: {
    text: "Tomorrow morning",
    scheduledFor: "2026-09-01T09:00:00", // timezone-naive local time
    timezone: "Europe/Istanbul",
    destinations: [{ connectionId: "…" }],
  },
});
// 201 Created, status "scheduled"
```

### Media

```ts
import { Configuration, MediaApi } from "@onepostly/sdk";

const mediaApi = new MediaApi(config);

const file = new File([buffer], "photo.jpg", { type: "image/jpeg" });
const upload = await mediaApi.uploadMedia({ file });
const mediaUrl = upload.media.url;

await posts.createPost({
  createPostBody: {
    text: "With an image",
    mediaKind: "image",
    mediaUrls: [mediaUrl],
    destinations: [{ connectionId: "…" }],
  },
});
```

### Insights

```ts
import { Configuration, InsightsApi } from "@onepostly/sdk";

const insights = new InsightsApi(config);

const { insights: postInsights } = await insights.getPostInsights({ id: postId });
for (const destination of postInsights.destinations ?? []) {
  console.log(destination.platform, destination.metrics);
}

const { timeline } = await insights.getPostInsightsTimeline({
  id: postId,
  from: "2026-08-01", // inclusive, YYYY-MM-DD
  to: "2026-08-28",   // inclusive, YYYY-MM-DD
});
```

### Error handling

Every non-2xx response throws a `ResponseError` carrying the raw `Response` and the API's machine-readable error body:

```ts
import { ResponseError } from "@onepostly/sdk";

try {
  await posts.createPost({ /* … */ });
} catch (error) {
  if (error instanceof ResponseError) {
    console.log(error.response.status, await error.response.json());
    // 402 { error: { code: "INSUFFICIENT_WALLET", message: "…" } }
  }
}
```

## API reference

All methods take a single request-parameters object; required fields are listed first.

<!-- BEGIN GENERATED API REFERENCE -->

### ConnectionsApi

| Method | Description |
| --- | --- |
| `connections.listConnections()` | List connections |
| `connections.getConnectionStats()` | Get connection account stats |
| `connections.listConnectionMedia()` | List creator media |
| `connections.getTikTokCreatorInfo()` | Get TikTok creator info |
| `connections.listPinterestBoards()` | List Pinterest boards |
| `connections.createPinterestBoard()` | Create Pinterest board |
| `connections.connectBluesky()` | Connect Bluesky via App Password |
| `connections.startOAuth()` | Start OAuth connect |
| `connections.listFacebookPages()` | List Facebook Pages for pending connect |
| `connections.selectFacebookPage()` | Select Facebook Page and finish connect |

### MediaApi

| Method | Description |
| --- | --- |
| `media.listMedia()` | List media |
| `media.uploadMedia()` | Upload media |
| `media.deleteMedia()` | Delete media |

### PostsApi

| Method | Description |
| --- | --- |
| `posts.listPosts()` | List posts |
| `posts.createPost()` | Create post. |
| `posts.getPost()` | Get post |
| `posts.cancelPost()` | Cancel post |
| `posts.deletePostDestination()` | Remote-delete destination |

### InsightsApi

| Method | Description |
| --- | --- |
| `insights.getPostInsights()` | Get insights |
| `insights.getPostInsightsTimeline()` | Get daily insights timeline |

### CommentsApi

| Method | Description |
| --- | --- |
| `comments.listComments()` | List comments |
| `comments.createComment()` | Create reply |
| `comments.deleteComment()` | Delete own comment |

### EngagementApi

| Method | Description |
| --- | --- |
| `engagement.listRetweeters()` | List retweeters |
| `engagement.retweet()` | Retweet |
| `engagement.undoRetweet()` | Undo retweet |
| `engagement.like()` | Like |
| `engagement.unlike()` | Unlike |
| `engagement.bookmark()` | Bookmark |
| `engagement.removeBookmark()` | Remove bookmark |
| `engagement.quote()` | Quote tweet |

### WebhooksApi

| Method | Description |
| --- | --- |
| `webhooks.listWebhookEventTypes()` | List webhook event types |
| `webhooks.listWebhooks()` | List webhooks |
| `webhooks.createWebhook()` | Create webhook |
| `webhooks.getWebhook()` | Get webhook |
| `webhooks.deleteWebhook()` | Delete webhook |
| `webhooks.updateWebhook()` | Update webhook |
| `webhooks.rotateWebhookSecret()` | Rotate webhook secret |
| `webhooks.listWebhookDeliveries()` | List webhook deliveries |
| `webhooks.testWebhook()` | Send test event |
<!-- END GENERATED API REFERENCE -->

Representative signatures:

```ts
// PostsApi — id/destination-scoped actions take { id, … }
posts.createPost({ createPostBody })        // → PostResponse
posts.listPosts({ limit?, offset? })        // → { posts: Post[] }
posts.getPost({ id })                       // → PostResponse
posts.cancelPost({ id })                    // → PostResponse
posts.deletePostDestination({ id, destinationId }) // remote-delete, → PostResponse

// EngagementApi — body-bearing actions take DestinationIdBody / QuoteBody
engagement.retweet({ id, destinationId: { destinationId } })
engagement.undoRetweet({ id, destinationId })
engagement.like({ id, destinationId: { destinationId } })
engagement.quote({ id, quoteBody: { destinationId, text } })
engagement.listRetweeters({ id, destinationId?, limit?, cursor? })

// CommentsApi
comments.createComment({ id, createCommentBody: { destinationId, text, parentCommentId? } })
comments.listComments({ id, destinationId?, limit?, cursor? })
comments.deleteComment({ id, commentId, destinationId })

// WebhooksApi
webhooks.createWebhook({ createWebhookBody: { name, url, events, enabled? } })
webhooks.updateWebhook({ id, updateWebhookBody })
webhooks.rotateWebhookSecret({ id })
webhooks.testWebhook({ id })
```

## Links

- [Documentation](https://onepostly.com/docs)
- [Dashboard](https://app.onepostly.com)
- [OpenAPI spec](https://onepostly.com/openapi.json)

## License

Apache-2.0
