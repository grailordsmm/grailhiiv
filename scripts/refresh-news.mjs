// Called by the VPS scheduler. Keep the bearer token in the environment,
// rather than passing it as a command-line argument.
const secret = process.env.NEWS_CRON_SECRET;
const endpoint = process.env.NEWS_REFRESH_URL || 'http://127.0.0.1:3000/api/news/refresh';

try {
  if (!secret) throw new Error('NEWS_CRON_SECRET is not set.');
  const url = new URL(endpoint);
  const isLoopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopback))) {
    throw new Error('NEWS_REFRESH_URL must use HTTPS or a loopback HTTP address.');
  }
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${secret}` },
    redirect: 'error',
    signal: AbortSignal.timeout(55_000),
  });
  if (!response.ok) throw new Error(`Refresh endpoint returned HTTP ${response.status}.`);
  const result = await response.json();
  if (!Number.isInteger(result.checked) || !Number.isInteger(result.failed)) throw new Error('Refresh endpoint returned an unexpected response.');
  console.log(`Checked ${result.checked} feed(s); ${result.failed} failed.`);
  if (result.failed > 0) process.exitCode = 1;
} catch (error) {
  console.error(`News refresh failed: ${error instanceof Error ? error.message : 'Unknown error.'}`);
  process.exitCode = 1;
}
