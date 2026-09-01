// Client isolation tests: every API instance must carry its own Configuration.
// A leaked module-level config would send one tenant's API key on another
// tenant's request — the failure mode these tests pin down.
import { describe, expect, it, vi } from "vitest";
import { Configuration, PostsApi, WebhooksApi } from "../src/index.js";

function mockFetch(captured: { urls: string[]; keys: (string | undefined)[] }) {
  return vi.fn(async (input: string | URL, init?: RequestInit) => {
    captured.urls.push(String(input));
    captured.keys.push((init?.headers as Record<string, string>)?.[RESOLVED_API_KEY_HEADER]);
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
}

const RESOLVED_API_KEY_HEADER = "x-api-key";

describe("client isolation", () => {
  it("sends each instance its own API key", async () => {
    const captured = { urls: [] as string[], keys: [] as (string | undefined)[] };
    const first = new PostsApi(
      new Configuration({ apiKey: "op_first", fetchApi: mockFetch(captured) }),
    );
    const second = new PostsApi(
      new Configuration({ apiKey: "op_second", fetchApi: mockFetch(captured) }),
    );

    await first.getPost({ id: "p1" });
    await second.getPost({ id: "p1" });

    expect(captured.keys).toEqual(["op_first", "op_second"]);
  });

  it("keeps the earlier instance working after a later one is constructed", async () => {
    const captured = { urls: [] as string[], keys: [] as (string | undefined)[] };
    const fetchMock = mockFetch(captured);
    const first = new PostsApi(new Configuration({ apiKey: "op_first", fetchApi: fetchMock }));
    new PostsApi(new Configuration({ apiKey: "op_second", fetchApi: fetchMock }));

    await first.getPost({ id: "p1" });

    expect(captured.keys).toEqual(["op_first"]);
  });

  it("keeps distinct API classes independent on the same config", async () => {
    const captured = { urls: [] as string[], keys: [] as (string | undefined)[] };
    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      captured.urls.push(url);
      captured.keys.push((init?.headers as Record<string, string>)?.[RESOLVED_API_KEY_HEADER]);
      const body = url.includes("/v1/webhooks") ? { webhooks: [] } : {};
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const config = new Configuration({ apiKey: "op_shared", fetchApi: fetchMock });
    const posts = new PostsApi(config);
    const webhooks = new WebhooksApi(config);

    await posts.getPost({ id: "p1" });
    await webhooks.listWebhooks({});

    expect(captured.urls[0]).toContain("/v1/posts/p1");
    expect(captured.urls[1]).toContain("/v1/webhooks");
    expect(captured.keys).toEqual(["op_shared", "op_shared"]);
  });
});
