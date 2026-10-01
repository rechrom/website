const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const name = 'rechrom-website';
if (!accountId || !token) {
  throw new Error('Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to repository Actions secrets. See README.md.');
}
const base = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects`;
async function request(url, method = 'GET', body) {
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json();
  return { status: response.status, ok: response.ok && data.success === true, data };
}
function verifyProject(project) {
  if (project.name !== name || project.production_branch !== 'main' || project.source) {
    throw new Error('Existing Pages project must use Direct Upload with production branch main. No configuration was changed.');
  }
}
const existing = await request(`${base}/${name}`);
if (existing.ok) {
  verifyProject(existing.data.result);
  console.log(`Pages project ${name} is ready.`);
} else if (existing.status === 404) {
  const created = await request(base, 'POST', { name, production_branch: 'main' });
  if (!created.ok) throw new Error(`Pages project creation failed (HTTP ${created.status}). Check token permissions and account. Error codes: ${(created.data.errors ?? []).map(error => error.code).join(', ')}`);
  verifyProject(created.data.result);
  console.log(`Created Pages project ${name}.`);
} else {
  throw new Error(`Cannot read Pages project (HTTP ${existing.status}). Check token permissions and account. Error codes: ${(existing.data.errors ?? []).map(error => error.code).join(', ')}`);
}
