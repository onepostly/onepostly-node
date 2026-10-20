// Configuration tests: the shared Configuration is the single source of auth
// and base-path for every API class, so its resolution rules are a public
// contract (documented in the README quick start).
import { describe, expect, it } from "vitest";
import { BASE_PATH, Configuration, PostsApi } from "../src/index.js";

describe("Configuration", () => {
  it("resolves a string accessToken into a bearer token getter", async () => {
    const config = new Configuration({ accessToken: "op_test" });
    expect(await config.accessToken?.("Bearer", [])).toBe("op_test");
  });

  it("supports async accessToken getters for secret-manager lookups", async () => {
    const config = new Configuration({
      accessToken: async () => "op_from_vault",
    });
    expect(await config.accessToken?.("Bearer", [])).toBe("op_from_vault");
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

  it("is shared safely: every API class built on one config uses the same auth", async () => {
    const config = new Configuration({ accessToken: "op_shared" });
    const posts = new PostsApi(config);
    expect(await posts.configuration.accessToken?.("Bearer", [])).toBe("op_shared");
    expect(posts.configuration.basePath).toBe(config.basePath);
  });
});
