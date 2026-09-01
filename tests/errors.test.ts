// Error-contract tests: the SDK's public error surface must behave exactly as
// documented in the README (ResponseError carrying status + machine-readable
// body, RequiredError naming the missing field). These are hand-written
// behavior contracts, not regenerated from the spec.
import { describe, expect, it } from "vitest";
import { Configuration, PostsApi, RequiredError, ResponseError } from "../src/index.js";

function withFetch(status: number, body: unknown, statusText = "") {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      statusText,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

describe("ResponseError", () => {
  it("carries the raw Response and the machine-readable error body", async () => {
    const api = new PostsApi(
      new Configuration({
        apiKey: "op_test",
        fetchApi: withFetch(402, {
          error: { code: "INSUFFICIENT_WALLET", message: "Wallet balance too low" },
        }),
      }),
    );

    const error = await api
      .createPost({
        createPostBody: {
          text: "Hello",
          mediaKind: "text",
          destinations: [{ connectionId: "c1" }],
        },
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ResponseError);
    if (!(error instanceof ResponseError)) return;

    expect(error.response.status).toBe(402);
    expect(await error.response.json()).toEqual({
      error: { code: "INSUFFICIENT_WALLET", message: "Wallet balance too low" },
    });
  });

  it("maps status families so callers can branch without parsing bodies", async () => {
    const statuses: [number, (api: PostsApi) => Promise<unknown>][] = [
      [401, (api) => api.getPost({ id: "p1" })],
      [403, (api) => api.getPost({ id: "p1" })],
      [404, (api) => api.getPost({ id: "p1" })],
    ];

    for (const [status, call] of statuses) {
      const api = new PostsApi(new Configuration({ apiKey: "op_test", fetchApi: withFetch(status, {}) }));
      const error = await call(api).catch((e: unknown) => e);
      expect(error, `status ${status}`).toBeInstanceOf(ResponseError);
      expect((error as ResponseError).response.status, `status ${status}`).toBe(status);
    }
  });

  it("preserves the prototype chain across transpilation targets", () => {
    const error = new ResponseError(new Response(null, { status: 500 }), "boom");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ResponseError);
    expect(error.name).toBe("ResponseError");
    expect(error.message).toBe("boom");
  });
});

describe("RequiredError", () => {
  it("names the missing required path parameter instead of sending a broken request", async () => {
    const api = new PostsApi(
      new Configuration({ apiKey: "op_test", fetchApi: withFetch(201, {}) }),
    );

    const error = await api
      .cancelPost({ id: undefined as unknown as string })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(RequiredError);
    expect((error as RequiredError).field).toBe("id");
    expect((error as RequiredError).message).toContain("cancelPost()");
  });
});
