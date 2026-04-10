// backend/src/routes/sitemap.js
import { Router } from "express";

export function createSitemapRouter() {
  const router = Router();

  router.get("/sitemap.xml", (req, res) => {
    const baseUrl = "https://jobhir.com/"; // apna domain yahan
    const urls = [
      { path: "/", changefreq: "daily", priority: 1 },
      { path: "/offer-job", changefreq: "weekly", priority: 0.9 },
      { path: "/jobs", changefreq: "daily", priority: 0.8 },
      { path: "/login", changefreq: "monthly", priority: 0.6 },
      { path: "/register", changefreq: "monthly", priority: 0.6 },
      { path: "/contact", changefreq: "yearly", priority: 0.5 },
    ];

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (u) => `<url>
    <loc>${baseUrl}${u.path}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(sitemap);
  });

  // Robots.txt
  router.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`
User-agent: *
Disallow: /admin
Disallow: /login
Disallow: /register
Allow: /

Sitemap: https://jobhir.com/sitemap.xml
    `);
  });
  return router;
}
