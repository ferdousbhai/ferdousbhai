// Static assets are served whole, without byte ranges, and Safari plays a video
// only from a server that answers a Range request with 206 Partial Content.
// The project clips (and only they: assets.runWorkerFirst) come through here,
// get read from the assets as usual and sliced to the range asked for. Every
// other path is served by the assets alone and never reaches this script.
export default {
  async fetch(request, env) {
    // Read the file with GET even for HEAD: a HEAD response from the assets
    // carries no length to work the range out from.
    const response = await env.ASSETS.fetch(new Request(request.url, { headers: request.headers }));
    if (response.status !== 200) return response;

    const headers = new Headers(response.headers);
    headers.set("Accept-Ranges", "bytes");
    const [, first = "", last = ""] = request.headers.get("Range")?.match(/^bytes=(\d*)-(\d*)$/) ?? [];
    const head = request.method === "HEAD";
    if (first === "" && last === "") return new Response(head ? null : response.body, { status: 200, headers });

    const body = await response.arrayBuffer();
    const size = body.byteLength;
    // "bytes=-N" is the last N bytes; "bytes=N-" runs to the end.
    const start = first === "" ? Math.max(0, size - Number(last)) : Number(first);
    const end = first === "" || last === "" ? size - 1 : Math.min(Number(last), size - 1);
    if (start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(head ? null : body.slice(start, end + 1), { status: 206, headers });
  },
};
