// Offline smoke tests: the generated client must shape requests correctly
// against a stubbed fetch. These do not hit the network.
import { describe, expect, it } from "vitest";
import { Configuration, EngagementApi, MediaApi, PostsApi } from "../src/index.js";

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
  it("createPost sends the documented body and bearer authorization", async () => {
    const { calls, fetchMock } = withFetch({
      status: 201,
      body: {
        groupId: "grp_1",
        data: [
          {
            id: "pst_1",
            groupId: "grp_1",
            accountId: "acc_1",
            platform: "linkedin",
            source: "onepostly",
            status: "publishing",
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
          },
        ],
      },
    });
    const api = new PostsApi(new Configuration({ accessToken: "op_test", fetchApi: fetchMock }));
    const result = await api.createPost({
      createPostBody: {
        text: "Hello",
        accounts: [{ accountId: "acc_1" }],
      },
    });
    expect(result.groupId).toBe("grp_1");
    expect(result.data[0].id).toBe("pst_1");
    expect(calls[0].url).toContain("/v1/posts");
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer op_test");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      text: "Hello",
      accounts: [{ accountId: "acc_1" }],
    });
  });

  it("unrepostPost puts both path parameters in the URL", async () => {
    const { calls, fetchMock } = withFetch({
      body: {
        postId: "pst_1",
        accountId: "acc_1",
        platform: "threads",
        reposted: false,
        platformRepostId: null,
      },
    });
    const engagement = new EngagementApi(new Configuration({ accessToken: "op_test", fetchApi: fetchMock }));
    const result = await engagement.unrepostPost({ id: "acc_1", postId: "pst_1" });
    expect(calls[0].url).toContain("/v1/accounts/acc_1/reposts/pst_1");
    expect(calls[0].init.method).toBe("DELETE");
    expect(result.reposted).toBe(false);
  });

  it("createMedia posts the file details and returns the upload URL", async () => {
    const { calls, fetchMock } = withFetch({
      status: 201,
      body: {
        id: "med_1",
        url: "https://cdn.example.com/media/a.png",
        contentType: "image/png",
        sizeBytes: null,
        filename: "a.png",
        status: "pending",
        createdAt: "2027-03-15T09:00:00.000Z",
        uploadUrl: "https://uploads.example.com/temp/a.png?sig=1",
        uploadExpiresIn: 3600,
      },
    });
    const media = new MediaApi(new Configuration({ accessToken: "op_test", fetchApi: fetchMock }));
    const result = await media.createMedia({
      createMediaBody: { filename: "a.png", contentType: "image/png", size: 1024 },
    });
    expect(calls[0].url).toContain("/v1/media");
    expect(calls[0].init.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      filename: "a.png",
      contentType: "image/png",
      size: 1024,
    });
    expect(result.id).toBe("med_1");
    expect(result.uploadUrl).toBe("https://uploads.example.com/temp/a.png?sig=1");
  });
});
