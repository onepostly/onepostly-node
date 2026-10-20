// Client isolation tests: every API instance must carry its own Configuration.
// A leaked module-level config would send one tenant's API key on another
// tenant's request — the failure mode these tests pin down.
import { describe, expect, it, vi } from "vitest";
import { Configuration, PostsApi, WebhooksApi } from "../src/index.js";

const POST = {
  id: "pst_1",
  groupId: "grp_1",
  accountId: "acc_1",
  platform: "linkedin",
  source: "onepostly",
  status: "published",
  text: "Hello",
  mediaKind: "text",
  media: [],
  thread: [],
  scheduledFor: null,
  timezone: null,
  options: {},
  platformPostId: null,
  url: null,
  error: null,
  publishedAt: null,
  metrics: null,
  createdAt: "2027-03-15T09:00:00.000Z",
  updatedAt: "2027-03-15T09:00:00.000Z",
};

function authorizationOf(init?: RequestInit): string | undefined {
  return (init?.headers as Record<string, string>)?.Authorization;
}

function mockFetch(captured: { urls: string[]; keys: (string | undefined)[] }) {
  return vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    captured.urls.push(url);
    captured.keys.push(authorizationOf(init));
    const body = url.includes("/v1/webhooks") ? { data: [], nextCursor: null, hasMore: false } : POST;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

describe("client isolation", () => {
  it("sends each instance its own API key", async () => {
    const captured = { urls: [] as string[], keys: [] as (string | undefined)[] };
    const first = new PostsApi(
      new Configuration({ accessToken: "op_first", fetchApi: mockFetch(captured) }),
    );
    const second = new PostsApi(
      new Configuration({ accessToken: "op_second", fetchApi: mockFetch(captured) }),
    );

    await first.getPost({ id: "pst_1" });
    await second.getPost({ id: "pst_1" });

    expect(captured.keys).toEqual(["Bearer op_first", "Bearer op_second"]);
  });

  it("keeps the earlier instance working after a later one is constructed", async () => {
    const captured = { urls: [] as string[], keys: [] as (string | undefined)[] };
    const fetchMock = mockFetch(captured);
    const first = new PostsApi(new Configuration({ accessToken: "op_first", fetchApi: fetchMock }));
    new PostsApi(new Configuration({ accessToken: "op_second", fetchApi: fetchMock }));

    await first.getPost({ id: "pst_1" });

    expect(captured.keys).toEqual(["Bearer op_first"]);
  });

  it("keeps distinct API classes independent on the same config", async () => {
    const captured = { urls: [] as string[], keys: [] as (string | undefined)[] };
    const config = new Configuration({ accessToken: "op_shared", fetchApi: mockFetch(captured) });
    const posts = new PostsApi(config);
    const webhooks = new WebhooksApi(config);

    await posts.getPost({ id: "pst_1" });
    await webhooks.listWebhooks({});

    expect(captured.urls[0]).toContain("/v1/posts/pst_1");
    expect(captured.urls[1]).toContain("/v1/webhooks");
    expect(captured.keys).toEqual(["Bearer op_shared", "Bearer op_shared"]);
  });
});
