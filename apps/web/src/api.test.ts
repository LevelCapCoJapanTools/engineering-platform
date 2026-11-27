import assert from "node:assert/strict";
import { test } from "node:test";
import { runIdFromUrl } from "./api.ts";

test("restores a bookmarked run ID and rejects malformed IDs", () => {
  const id = "03aaf5ef-177c-4e21-82e3-6bd83ae4ff95";
  assert.equal(runIdFromUrl(`?run=${id}`), id);
  assert.equal(runIdFromUrl("?run=../../healthz"), null);
  assert.equal(runIdFromUrl("?scenario=passing"), null);
});
