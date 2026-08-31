# @onepostly/sdk

Official TypeScript SDK for the [Onepostly API](https://onepostly.com/docs) — publish, schedule, and read results across all supported social platforms with one request shape. See the [docs](https://onepostly.com/docs) for the current platform list.

Zero dependencies. Node 18+, browsers, and edge runtimes.

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

| API class | Methods |
| --- | --- |
| `PostsApi` | `createPost` `listPosts` `getPost` `cancelPost` `deletePostDestination` |
| `MediaApi` | `uploadMedia` `listMedia` `deleteMedia` |
| `ConnectionsApi` | `listConnections` `getConnectionStats` `listConnectionMedia` `getTikTokCreatorInfo` `listPinterestBoards` `createPinterestBoard` `connectBluesky` `startOAuth` `listFacebookPages` `selectFacebookPage` |
| `InsightsApi` | `getPostInsights` `getPostInsightsTimeline` |
| `CommentsApi` | `listComments` `createComment` `deleteComment` |
| `EngagementApi` | `listRetweeters` `retweet` `undoRetweet` `like` `unlike` `bookmark` `removeBookmark` `quote` |
| `WebhooksApi` | `listWebhookEventTypes` `listWebhooks` `createWebhook` `getWebhook` `updateWebhook` `deleteWebhook` `rotateWebhookSecret` `listWebhookDeliveries` `testWebhook` |

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

Full request/response reference: [onepostly.com/openapi.json](https://onepostly.com/openapi.json)
