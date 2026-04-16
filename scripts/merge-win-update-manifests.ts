import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  mergeUpdateManifests,
  parseUpdateManifest,
  serializeUpdateManifest,
  type UpdateManifest,
} from "./lib/update-manifest.ts";

type WindowsUpdateManifest = UpdateManifest;

export function parseWinUpdateManifest(raw: string, sourcePath: string): WindowsUpdateManifest {
  return parseUpdateManifest(raw, sourcePath, "Windows");
}

export function mergeWinUpdateManifests(
  primary: WindowsUpdateManifest,
  secondary: WindowsUpdateManifest,
): WindowsUpdateManifest {
  return mergeUpdateManifests(primary, secondary, "Windows");
}

export function serializeWinUpdateManifest(manifest: WindowsUpdateManifest): string {
  return serializeUpdateManifest(manifest, {
    platformLabel: "Windows",
  });
}

function main(args: ReadonlyArray<string>): void {
  const [primaryPathArg, secondaryPathArg, outputPathArg] = args;
  if (!primaryPathArg || !secondaryPathArg) {
    throw new Error(
      "Usage: node scripts/merge-win-update-manifests.ts <latest-win-arm64.yml> <latest-win-x64.yml> [output-path]",
    );
  }

  const primaryPath = resolve(primaryPathArg);
  const secondaryPath = resolve(secondaryPathArg);
  const outputPath = resolve(outputPathArg ?? primaryPathArg);

  const primaryManifest = parseWinUpdateManifest(readFileSync(primaryPath, "utf8"), primaryPath);
  const secondaryManifest = parseWinUpdateManifest(
    readFileSync(secondaryPath, "utf8"),
    secondaryPath,
  );
  const merged = mergeWinUpdateManifests(primaryManifest, secondaryManifest);
  writeFileSync(outputPath, serializeWinUpdateManifest(merged));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
