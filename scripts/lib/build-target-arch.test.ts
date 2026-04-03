import { assert, describe, it } from "@effect/vitest";

import { getDefaultBuildArch, resolveHostProcessArch } from "./build-target-arch.ts";

describe("build-target-arch", () => {
  it("prefers arm64 for Windows-on-Arm hosts running x64 emulation", () => {
    const hostArch = resolveHostProcessArch("win32", "x64", {
      PROCESSOR_ARCHITECTURE: "AMD64",
      PROCESSOR_ARCHITEW6432: "ARM64",
    });

    assert.equal(hostArch, "arm64");
  });

  it("falls back to x64 for native x64 Windows hosts", () => {
    const hostArch = resolveHostProcessArch("win32", "x64", {
      PROCESSOR_ARCHITECTURE: "AMD64",
    });

    assert.equal(hostArch, "x64");
  });

  it("keeps arm64 when the current process is already native arm64", () => {
    const hostArch = resolveHostProcessArch("win32", "arm64", {});

    assert.equal(hostArch, "arm64");
  });

  it("uses the resolved host arch when selecting the default Windows build arch", () => {
    const arch = getDefaultBuildArch(
      "win",
      "x64",
      {
        PROCESSOR_ARCHITECTURE: "AMD64",
        PROCESSOR_ARCHITEW6432: "ARM64",
      },
      { archChoices: ["x64", "arm64"] },
    );

    assert.equal(arch, "arm64");
  });
});
