/**
 * scripts/generate-icons.js
 *
 * Generates all required PWA icon sizes from a single high-resolution
 * source image using the `sharp` npm package.
 *
 * Usage:
 *   1. Place a 512×512 (or larger) PNG at public/icons/source.png
 *   2. Run:  node scripts/generate-icons.js
 *      or:  npm run generate-icons
 *
 * Output: public/icons/icon-{size}x{size}.png for every size listed below.
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SOURCE = path.join(__dirname, "../public/icons/source.png");
const OUT_DIR = path.join(__dirname, "../public/icons");

// All icon sizes required by the manifest + browser/OS expectations
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  // Verify source file exists
  if (!fs.existsSync(SOURCE)) {
    console.error(
      `\n❌  Source icon not found at: ${SOURCE}\n` +
        `    Please add a PNG (ideally 512×512 or larger) and re-run.\n`
    );
    process.exit(1);
  }

  console.log(`\n🎨  Generating icons from: ${SOURCE}\n`);

  await Promise.all(
    SIZES.map(async (size) => {
      const dest = path.join(OUT_DIR, `icon-${size}x${size}.png`);
      await sharp(SOURCE)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(dest);
      console.log(`  ✓  icon-${size}x${size}.png`);
    })
  );

  console.log(`\n✅  All icons written to: ${OUT_DIR}\n`);
}

generateIcons().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
