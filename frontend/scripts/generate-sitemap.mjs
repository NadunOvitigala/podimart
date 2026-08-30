/**
 * Generates public/sitemap.xml from static routes + live shops/products.
 * Run automatically before `vite build`.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE_URL || "https://podimart.lk";
const API =
  process.env.VITE_API_URL ||
  process.env.API_URL ||
  "https://4a23sc77m1.execute-api.ap-south-1.amazonaws.com";

const today = new Date().toISOString().slice(0, 10);

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(path, { changefreq = "weekly", priority = "0.7", lastmod = today } = {}) {
  const loc = path.startsWith("http") ? path : `${SITE}${path}`;
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchJson(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

async function main() {
  const entries = [
    urlEntry("/", { changefreq: "daily", priority: "1.0" }),
    urlEntry("/browse", { changefreq: "daily", priority: "0.9" }),
    urlEntry("/about", { changefreq: "monthly", priority: "0.5" }),
    urlEntry("/contact", { changefreq: "monthly", priority: "0.5" }),
  ];

  try {
    const [sellers, products, categories] = await Promise.all([
      fetchJson("/sellers"),
      fetchJson("/products"),
      fetchJson("/categories").catch(() => []),
    ]);

    for (const category of categories) {
      if (!category?.id) continue;
      entries.push(
        urlEntry(`/browse?category=${encodeURIComponent(category.id)}`, {
          changefreq: "daily",
          priority: "0.8",
        }),
      );
    }

    for (const seller of sellers) {
      if (!seller?.slug) continue;
      const lastmod = (seller.created_at || today).slice(0, 10);
      entries.push(
        urlEntry(`/shop/${encodeURIComponent(seller.slug)}`, {
          changefreq: "weekly",
          priority: "0.8",
          lastmod,
        }),
      );
    }

    for (const product of products) {
      if (!product?.id) continue;
      // Skip disabled listings if status is present
      if (String(product.status || "active").toLowerCase() === "disabled") continue;
      const lastmod = (product.created_at || today).slice(0, 10);
      entries.push(
        urlEntry(`/product/${encodeURIComponent(product.id)}`, {
          changefreq: "weekly",
          priority: "0.7",
          lastmod,
        }),
      );
    }

    console.log(
      `Sitemap: ${sellers.length} shops, ${products.length} products, ${categories.length} categories`,
    );
  } catch (err) {
    console.warn("Could not load live catalog for sitemap:", err.message);
    console.warn("Writing static routes only.");
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  const out = join(__dirname, "..", "public", "sitemap.xml");
  writeFileSync(out, xml, "utf8");
  console.log(`Wrote ${out} (${entries.length} URLs)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
