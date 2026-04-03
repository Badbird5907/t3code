import { assert, describe, it } from "@effect/vitest";

import {
  mergeWinUpdateManifests,
  parseWinUpdateManifest,
  serializeWinUpdateManifest,
} from "./merge-win-update-manifests.ts";

describe("merge-win-update-manifests", () => {
  it("merges arm64 and x64 Windows update manifests into one multi-arch manifest", () => {
    const arm64 = parseWinUpdateManifest(
      `version: 0.0.4
files:
  - url: T3-Code-0.0.4-arm64.exe
    sha512: arm64exe
    size: 125621344
  - url: T3-Code-0.0.4-arm64.exe.blockmap
    sha512: arm64blockmap
    size: 131754
path: T3-Code-0.0.4-arm64.exe
sha512: arm64exe
releaseDate: '2026-03-07T10:32:14.587Z'
`,
      "latest-win-arm64.yml",
    );

    const x64 = parseWinUpdateManifest(
      `version: 0.0.4
files:
  - url: T3-Code-0.0.4-x64.exe
    sha512: x64exe
    size: 132000112
  - url: T3-Code-0.0.4-x64.exe.blockmap
    sha512: x64blockmap
    size: 138148
path: T3-Code-0.0.4-x64.exe
sha512: x64exe
releaseDate: '2026-03-07T10:36:07.540Z'
`,
      "latest-win-x64.yml",
    );

    const merged = mergeWinUpdateManifests(arm64, x64);

    assert.equal(merged.version, "0.0.4");
    assert.equal(merged.releaseDate, "2026-03-07T10:36:07.540Z");
    assert.deepStrictEqual(
      merged.files.map((file) => file.url),
      [
        "T3-Code-0.0.4-arm64.exe",
        "T3-Code-0.0.4-arm64.exe.blockmap",
        "T3-Code-0.0.4-x64.exe",
        "T3-Code-0.0.4-x64.exe.blockmap",
      ],
    );

    const serialized = serializeWinUpdateManifest(merged);
    assert.ok(!serialized.includes("path:"));
    assert.equal((serialized.match(/- url:/g) ?? []).length, 4);
  });

  it("rejects mismatched manifest versions", () => {
    const arm64 = parseWinUpdateManifest(
      `version: 0.0.4
files:
  - url: T3-Code-0.0.4-arm64.exe
    sha512: arm64exe
    size: 1
releaseDate: '2026-03-07T10:32:14.587Z'
`,
      "latest-win-arm64.yml",
    );

    const x64 = parseWinUpdateManifest(
      `version: 0.0.5
files:
  - url: T3-Code-0.0.5-x64.exe
    sha512: x64exe
    size: 1
releaseDate: '2026-03-07T10:36:07.540Z'
`,
      "latest-win-x64.yml",
    );

    assert.throws(() => mergeWinUpdateManifests(arm64, x64), /different versions/);
  });

  it("preserves quoted scalars as strings", () => {
    const manifest = parseWinUpdateManifest(
      `version: '1.0'
files:
  - url: T3-Code-1.0-x64.exe
    sha512: exesha
    size: 1
releaseName: 'true'
minimumSystemVersion: '10.0'
stagingPercentage: 50
releaseDate: '2026-03-07T10:36:07.540Z'
`,
      "latest-win-x64.yml",
    );

    assert.equal(manifest.version, "1.0");
    assert.equal(manifest.extras.releaseName, "true");
    assert.equal(manifest.extras.minimumSystemVersion, "10.0");
    assert.equal(manifest.extras.stagingPercentage, 50);
  });

  it("round-trips numeric-looking versions as strings", () => {
    const original = parseWinUpdateManifest(
      `version: '1.0'
files:
  - url: T3-Code-1.0-x64.exe
    sha512: exesha
    size: 1
releaseDate: '2026-03-07T10:36:07.540Z'
`,
      "latest-win-x64.yml",
    );

    const serialized = serializeWinUpdateManifest(original);
    assert.ok(serialized.includes("version: '1.0'"));

    const reparsed = parseWinUpdateManifest(serialized, "latest-win-x64.yml");
    assert.equal(reparsed.version, "1.0");
  });
});
