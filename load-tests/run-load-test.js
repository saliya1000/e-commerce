const https = require('https');

const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  maxSockets: 2000
});

const ENDPOINTS = [
  '/api/products',
  '/api/products?q=dog',
  '/api/products?sortBy=price&sortOrder=asc',
  '/api/products?minPrice=20&maxPrice=50',
  '/api/products/brands',
  '/api/products/categories'
];

function makeRequest(vuId, endpoint) {
  return new Promise((resolve) => {
    const start = Date.now();
    const clientIp = `10.200.${Math.floor(vuId / 250)}.${(vuId % 250) + 1}`;

    const req = https.request({
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'GET',
      agent,
      headers: {
        'User-Agent': 'LoadTester/1.0',
        'X-Forwarded-For': clientIp,
        'Connection': 'keep-alive'
      },
      timeout: 10000 // 10s timeout
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          status: res.statusCode,
          duration,
          success: res.statusCode >= 200 && res.statusCode < 300
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 408,
        duration: Date.now() - start,
        success: false,
        timeout: true
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 500,
        duration: Date.now() - start,
        success: false,
        error: err.message
      });
    });

    req.end();
  });
}

async function runStage(concurrency, durationSec = 10) {
  console.log(`\n======================================================`);
  console.log(`Running Stage: ${concurrency} Concurrent Users for ${durationSec}s`);
  console.log(`======================================================`);

  const startTime = Date.now();
  const endTime = startTime + (durationSec * 1000);
  const results = [];

  let activeWorkers = 0;
  let vuCounter = 0;

  async function worker(vuId) {
    while (Date.now() < endTime) {
      const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
      const res = await makeRequest(vuId, endpoint);
      results.push(res);
      // Small randomized think time (50-150ms) to simulate realistic user behavior
      await new Promise(r => setTimeout(r, 50 + Math.random() * 100));
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker(i + 1));
  }

  await Promise.all(workers);

  const totalReqs = results.length;
  const successes = results.filter(r => r.success).length;
  const failures = totalReqs - successes;
  const durations = results.map(r => r.duration).sort((a, b) => a - b);

  if (durations.length === 0) {
    return { concurrency, totalReqs: 0, avg: 0, p95: 0, max: 0, rps: 0, failures: 0, exceeded5s: false };
  }

  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const median = durations[Math.floor(durations.length * 0.50)];
  const p90 = durations[Math.floor(durations.length * 0.90)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];
  const min = durations[0];
  const max = durations[durations.length - 1];
  const totalDurationSec = (Date.now() - startTime) / 1000;
  const rps = (totalReqs / totalDurationSec).toFixed(1);
  const errorRate = ((failures / totalReqs) * 100).toFixed(2);
  const countOver5s = durations.filter(d => d > 5000).length;
  const exceeded5s = max > 5000 || p95 > 5000;

  console.log(`Results for ${concurrency} Concurrent Users:`);
  console.log(`- Total Requests:     ${totalReqs} (${rps} req/s)`);
  console.log(`- Success Rate:       ${successes}/${totalReqs} (${(100 - errorRate)}%)`);
  console.log(`- Min Latency:        ${min} ms`);
  console.log(`- Average Latency:    ${avg} ms`);
  console.log(`- Median (p50):       ${median} ms`);
  console.log(`- 90th Percentile:    ${p90} ms`);
  console.log(`- 95th Percentile:    ${p95} ms`);
  console.log(`- 99th Percentile:    ${p99} ms`);
  console.log(`- Max Latency:        ${max} ms`);
  console.log(`- Requests > 5s:      ${countOver5s} (${((countOver5s / totalReqs) * 100).toFixed(2)}%)`);
  console.log(`- Exceeded 5s Limit:  ${exceeded5s ? 'YES ⚠️' : 'NO ✅'}`);

  return {
    concurrency,
    totalReqs,
    rps,
    successes,
    failures,
    errorRate,
    min,
    avg,
    median,
    p90,
    p95,
    p99,
    max,
    countOver5s,
    exceeded5s
  };
}

async function main() {
  console.log('Starting HappyPets Load Test Benchmark...');
  console.log('Target: https://localhost:3000/api');
  console.log('Criteria: Maximum concurrent users before response time exceeds 5000 ms (5 seconds)\n');

  // Warmup run
  console.log('Warming up connection pool...');
  await runStage(5, 3);

  const stages = [25, 50, 100, 175, 250, 320, 380, 420, 480];
  const allResults = [];

  let maxStableUsers = 0;

  for (const vu of stages) {
    const res = await runStage(vu, 8);
    allResults.push(res);
    if (!res.exceeded5s && res.failures === 0) {
      maxStableUsers = vu;
    }
  }

  console.log('\n======================================================');
  console.log('SUMMARY BENCHMARK REPORT: CONCURRENCY vs RESPONSE TIME');
  console.log('======================================================');
  console.log('| Users | Throughput | Avg Latency | p95 Latency | Max Latency | Req > 5s | Status |');
  console.log('|:-----:|:----------:|:-----------:|:-----------:|:-----------:|:--------:|:------:|');
  for (const r of allResults) {
    const status = r.exceeded5s ? 'FAILED (>5s)' : 'PASSED (<=5s)';
    console.log(`| ${String(r.concurrency).padEnd(5)} | ${String(r.rps + ' req/s').padEnd(10)} | ${String(r.avg + ' ms').padEnd(11)} | ${String(r.p95 + ' ms').padEnd(11)} | ${String(r.max + ' ms').padEnd(11)} | ${String(r.countOver5s).padEnd(8)} | ${status} |`);
  }

  console.log(`\n>>> MAXIMUM CONCURRENT USERS BEFORE RESPONSE TIMES EXCEED 5s: ${maxStableUsers} USERS <<<`);
}

main().catch(console.error);
