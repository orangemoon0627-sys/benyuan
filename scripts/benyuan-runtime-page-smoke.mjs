const base = process.env.BENYUAN_BASE_URL ?? "http://localhost:3000";
const token = process.env.BENYUAN_INTERNAL_ACCESS_TOKEN?.trim();
const response = await fetch(`${base}/lab/runtime`, {
  headers: token ? { authorization: `Bearer ${token}` } : {},
});

if (!response.ok) {
  throw new Error(`runtime page not reachable: status=${response.status}`);
}

console.log("runtime-page:ok");
