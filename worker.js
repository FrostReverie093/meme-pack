const GITHUB_REPO = "FrostReverie093/meme-pack";

// GitHub proxy mirrors for file downloads
// Format: replace "https://github.com/" with this prefix
const PROXY_MIRRORS = [
  "https://ghfile.geekertao.top/",
  "https://gh.geekertao.top/",
  "https://github.dpik.top/",
  "https://gh.felicity.ac.cn/",
];

const CACHE_TTL = 600; // 10 minutes

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: { ...corsHeaders } });
  }

  // Root — info page
  if (path === "/" || path === "/index.html") {
    return new Response(JSON.stringify({
      name: "meme-pack Resource Pack API",
      version: "1.0.0",
      endpoints: {
        latest: "/api/latest",       // returns the raw file (direct download)
        json: "/api/latest/json",    // returns JSON metadata
      },
      description: "Direct file proxy from GitHub Releases",
    }, null, 2), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // --- Raw file endpoint (returns the actual file) ---
  if (path === "/api/latest") {
    try {
      // Check cache first
      const cacheKey = await caches.open("meme-pack-files");
      const cached = await cacheKey.match(request.url);
      if (cached) {
        return new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: {
            ...corsHeaders,
            "X-Cache": "HIT",
          },
        });
      }

      // Fetch latest release metadata from GitHub API
      const apiRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        { headers: { "Accept": "application/vnd.github.v3+json" } }
      );

      if (!apiRes.ok) {
        throw new Error(`GitHub API error: ${apiRes.status}`);
      }

      const release = await apiRes.json();
      const asset = release.assets?.[0];

      if (!asset) {
        throw new Error("No assets found in latest release");
      }

      // Try each mirror in order
      let fileRes = null;
      let usedMirror = "";

      for (const mirror of PROXY_MIRRORS) {
        const downloadUrl = mirror + asset.browser_download_url.replace(
          "https://github.com/", ""
        );

        fileRes = await fetch(downloadUrl, {
          headers: { "User-Agent": "meme-pack-api-proxy" },
        });

        if (fileRes.ok) {
          usedMirror = mirror;
          break;
        }
      }

      if (!fileRes || !fileRes.ok) {
        throw new Error(`File download failed on all mirrors (last status: ${fileRes?.status || "N/A"})`);
      }

      const headers = new Headers(fileRes.headers);
      headers.set("Content-Disposition", `attachment; filename="${asset.name}"`);
      headers.set("Content-Type", fileRes.headers.get("Content-Type") || "application/octet-stream");
      headers.set("Cache-Control", `public, max-age=${CACHE_TTL}`);
      headers.set("X-Mirror", usedMirror);
      Object.assign(headers, corsHeaders);

      const response = new Response(fileRes.body, {
        status: fileRes.status,
        headers,
      });

      // Cache the file body
      await cacheKey.put(request.url, response.clone());

      return response;
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  // --- JSON metadata endpoint ---
  if (path === "/api/latest/json") {
    try {
      const cache = caches.default;
      const cached = await cache.match(request.url);
      if (cached) {
        return new Response(await cached.text(), {
          headers: { "Content-Type": "application/json", ...corsHeaders, "X-Cache": "HIT" },
        });
      }

      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        { headers: { "Accept": "application/vnd.github.v3+json" } }
      );

      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

      const release = await res.json();
      const asset = release.assets?.[0];

      if (!asset) throw new Error("No assets found");

      // Build proxied download URLs for all mirrors
      const proxyUrls = PROXY_MIRRORS.map((mirror) => ({
        mirror,
        url: mirror + asset.browser_download_url.replace("https://github.com/", ""),
      }));

      const body = JSON.stringify({
        name: asset.name,
        downloadUrl: asset.browser_download_url,
        proxyUrls,
        size: asset.size,
        createdAt: release.created_at,
        publishedAt: release.published_at,
        tag: release.tag_name,
        prerelease: release.prerelease,
      }, null, 2);

      const response = new Response(body, {
        headers: { "Content-Type": "application/json", ...corsHeaders, "Cache-Control": `public, max-age=${CACHE_TTL}` },
      });

      const cacheKey = await caches.open("meme-pack-api");
      await cacheKey.put(request.url, response.clone());

      return response;
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
