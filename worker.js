const GITHUB_REPO = "FrostReverie093/meme-pack";
const CACHE_TTL = 600; // 10 minutes

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: { ...corsHeaders } });
  }

  // API routes
  if (path === "/" || path === "/index.html") {
    return new Response(JSON.stringify({
      name: "meme-pack Resource Pack API",
      version: "1.0.0",
      endpoints: {
        latest: "/api/latest",
        all_releases: "/api/releases",
      },
      description: "Get the latest resource pack download link from GitHub Releases",
    }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }

  if (path === "/api/latest") {
    // Return only the latest release download link
    try {
      const cache = caches.default;
      const cachedResponse = await cache.match(request.url);
      if (cachedResponse) {
        return new Response(cachedResponse.body, {
          headers: {
            ...corsHeaders,
            "X-Cache": "HIT",
          },
        });
      }

      const githubRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        {
          headers: { "Accept": "application/vnd.github.v3+json" },
        }
      );

      if (!githubRes.ok) {
        throw new Error(`GitHub API error: ${githubRes.status}`);
      }

      const release = await githubRes.json();
      const asset = release.assets?.[0];

      if (!asset) {
        throw new Error("No assets found in latest release");
      }

      const responseData = {
        name: asset.name,
        downloadUrl: asset.browser_download_url,
        size: asset.size,
        createdAt: release.created_at,
        publishedAt: release.published_at,
        tag: release.tag_name,
        prerelease: release.prerelease,
      };

      const body = JSON.stringify(responseData);
      const response = new Response(body, {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          "Cache-Control": `public, max-age=${CACHE_TTL}`,
        },
      });

      // Store in cache
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

  if (path === "/api/releases") {
    // Return all releases
    try {
      const cache = caches.default;
      const cachedResponse = await cache.match(request.url);
      if (cachedResponse) {
        return new Response(cachedResponse.body, {
          headers: {
            ...corsHeaders,
            "X-Cache": "HIT",
          },
        });
      }

      const githubRes = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=100`,
        {
          headers: { "Accept": "application/vnd.github.v3+json" },
        }
      );

      if (!githubRes.ok) {
        throw new Error(`GitHub API error: ${githubRes.status}`);
      }

      const releases = await githubRes.json();
      const formatted = releases.map((r) => ({
        tag: r.tag_name,
        name: r.assets?.[0]?.name || "unknown",
        downloadUrl: r.assets?.[0]?.browser_download_url || "",
        size: r.assets?.[0]?.size || 0,
        createdAt: r.created_at,
        publishedAt: r.published_at,
        prerelease: r.prerelease,
        draft: r.draft,
      }));

      const body = JSON.stringify(formatted, null, 2);
      const response = new Response(body, {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
          "Cache-Control": `public, max-age=${CACHE_TTL}`,
        },
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
