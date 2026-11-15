import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.resolve(scriptDir, "..");
const resourceDir = path.resolve(uiDir, "..");
const sourceDir = path.resolve(uiDir, "out");
const targetDir = path.resolve(uiDir, "dist");

if (!sourceDir.startsWith(uiDir)) {
  throw new Error(`Refusing to copy from outside ui dir: ${sourceDir}`);
}

const copyIfExists = async (source, target) => {
  try {
    await stat(source);
  } catch {
    return false;
  }

  await cp(source, target, { recursive: true });
  return true;
};

if (!targetDir.startsWith(uiDir)) {
  throw new Error(`Refusing to write outside ui dir: ${targetDir}`);
}

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });

await copyIfExists(path.join(sourceDir, "index.html"), path.join(targetDir, "index.html"));

await copyIfExists(
  path.join(sourceDir, "_next", "static", "chunks"),
  path.join(targetDir, "assets", "static", "chunks"),
);
await copyIfExists(
  path.join(sourceDir, "_next", "static", "media"),
  path.join(targetDir, "assets", "static", "media"),
);
await copyIfExists(
  path.join(sourceDir, "_next", "static", "css"),
  path.join(targetDir, "assets", "static", "css"),
);

// Built-in room photos must be served locally by the NUI resource.
await copyIfExists(path.join(sourceDir, "images"), path.join(targetDir, "images"));

// Static admin catalogue thumbnails share the same exported NUI root.
await copyIfExists(path.join(sourceDir, "admin"), path.join(targetDir, "admin"));

// Door lockpick sounds (TR Scripts, CC0), fetched by the HUD at runtime.
await copyIfExists(path.join(sourceDir, "sounds"), path.join(targetDir, "sounds"));

await copyIfExists(path.join(sourceDir, 'alarm'), path.join(targetDir, 'alarm'));

const textExtensions = new Set([".html", ".js", ".css", ".json", ".txt"]);

const rewriteAssetReferences = async (dir) => {
  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await rewriteAssetReferences(entryPath);
        continue;
      }

      if (!textExtensions.has(path.extname(entry.name))) continue;

      const original = await readFile(entryPath, "utf8");
      const rewritten = original
        .replaceAll("./_next/", "./assets/")
        .replaceAll("/_next/", "/assets/")
        .replaceAll("_next/", "assets/")
        .replace(/<link rel="icon"[^>]*>/g, "");

      if (rewritten !== original) {
        await writeFile(entryPath, rewritten);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

await rewriteAssetReferences(targetDir);

// Next export output is only an intermediate step.
await rm(sourceDir, { recursive: true, force: true });

console.log(`Copied UI build to ${path.relative(resourceDir, targetDir)}`);
