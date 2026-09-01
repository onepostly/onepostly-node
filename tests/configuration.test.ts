// Configuration tests: the shared Configuration is the single source of auth
// and base-path for every API class, so its resolution rules are a public
// contract (documented in the README quick start).
import { describe, expect, it } from "vitest";
import { BASE_PATH, Configuration, PostsApi } from "../src/index.js";

const RESOLVED_API_KEY_HEADER = "x-api-key";

describe("Configuration", () => {
  it("resolves a string apiKey into a per-security-scheme getter", () => {
    const config = new Configuration({ apiKey: "op_test" });
    expect(config.apiKey?.(RESOLVED_API_KEY_HEADER)).toBe("op_test");
  });

  it("supports async apiKey getters for secret-manager lookups", async () => {
    const config = new Configuration({
      apiKey: async () => "op_from_vault",
    });
    expect(await config.apiKey?.(RESOLVED_API_KEY_HEADER)).toBe("op_from_vault");
  });

  it("falls back to the production base path when none is given", () => {
    const config = new Configuration({});
    expect(config.basePath).toBe(BASE_PATH);
    expect(BASE_PATH).toBe("https://api.onepostly.com");
  });

  it("lets tests and gateways point at a different base path", () => {
    const config = new Configuration({ basePath: "http://127.0.0.1:8787" });
    expect(config.basePath).toBe("http://127.0.0.1:8787");
  });

  it("is shared safely: every API class built on one config uses the same auth", () => {
    const config = new Configuration({ apiKey: "op_shared" });
    const posts = new PostsApi(config);
    expect(posts.configuration.apiKey?.(RESOLVED_API_KEY_HEADER)).toBe("op_shared");
    expect(posts.configuration.basePath).toBe(config.basePath);
  });
});
