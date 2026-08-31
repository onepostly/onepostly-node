// Offline smoke tests: the generated client must shape requests correctly
// against a stubbed fetch. These do not hit the network.
import { describe, expect, it } from "vitest";
import { PostsApi, WebhooksApi, Configuration } from "../src/index.js";

function withFetch(handlers: {
  onRequest?: (url: string, init: RequestInit) => void;
  status?: number;
  body?: unknown;
}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchMock = (async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init: init ?? {} });
    handlers.onRequest?.(url, init ?? {});
    return new Response(JSON.stringify(handlers.body ?? { ok: true }), {
      status: handlers.status ?? 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
  return { calls, fetchMock };
}

describe("generated client smoke", () => {
  it("createPost sends the documented body and API key header", async () => {
    const { calls, fetchMock } = withFetch({
      status: 202,
      body: {
        post: {
          id: "p1",
          text: "Hello",
          mediaUrls: [],
          mediaKind: "text",
          status: "queued",
          scheduledFor: null,
          timezone: null,
          destinations: [],
          createdAt: "2026-08-30T20:00:00.000Z",
          updatedAt: "2026-08-30T20:00:00.000Z",
        },
      },
    });
    const api = new PostsApi(new Configuration({ apiKey: "op_test", fetchApi: fetchMock }));
    const result = await api.createPost({
      createPostBody: {
        text: "Hello",
        mediaKind: "text",
        destinations: [{ connectionId: "c1" }],
      },
    });
    expect(result.post.id).toBe("p1");
    expect(calls[0].url).toContain("/v1/posts");
    expect((calls[0].init.headers as Record<string, string>)["x-api-key"]).toBe("op_test");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      text: "Hello",
      mediaKind: "text",
      destinations: [{ connectionId: "c1" }],
    });
  });

  it("undoRetweet sends destinationId as a query parameter", async () => {
    const { calls, fetchMock } = withFetch({ body: { retweet: {} } });
    const api = new WebhooksApi(new Configuration({ apiKey: "op_test", fetchApi: fetchMock }));
    void api;
    const { EngagementApi } = await import("../src/index.js");
    const engagement = new EngagementApi(new Configuration({ apiKey: "op_test", fetchApi: fetchMock }));
    await engagement.undoRetweet({ id: "p1", destinationId: "d1" });
    expect(calls[0].url).toContain("/v1/posts/p1/retweets");
    expect(calls[0].url).toContain("destinationId=d1");
    expect(calls[0].init.method).toBe("DELETE");
  });

  it("uploadMedia posts multipart form data", async () => {
    const { calls, fetchMock } = withFetch({ status: 201, body: { media: { id: "m1" } } });
    const { MediaApi } = await import("../src/index.js");
    const media = new MediaApi(new Configuration({ apiKey: "op_test", fetchApi: fetchMock }));
    const file = new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" });
    await media.uploadMedia({ file });
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.body).toBeInstanceOf(FormData);
  });
});
