import axios from 'axios';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

interface BenchmarkResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  durationMs: number;
  requestsPerSecond: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
}

async function benchmarkEndpoint(
  name: string,
  fn: () => Promise<number>,
  concurrency: number,
  totalRequests: number,
): Promise<BenchmarkResult> {
  console.log(`\n---------------------------------------------------------`);
  console.log(`🚀 Benchmarking: ${name}`);
  console.log(`   Concurrency: ${concurrency} | Total Requests: ${totalRequests}`);
  console.log(`---------------------------------------------------------`);

  const latencies: number[] = [];
  let successful = 0;
  let failed = 0;

  const startTime = Date.now();

  let completedRequests = 0;

  async function worker() {
    while (completedRequests < totalRequests) {
      completedRequests++;
      try {
        const latency = await fn();
        latencies.push(latency);
        successful++;
      } catch (err) {
        failed++;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  const durationMs = Date.now() - startTime;
  latencies.sort((a, b) => a - b);

  const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = (successful / (durationMs / 1000));
  const errorRate = (failed / totalRequests) * 100;

  const result: BenchmarkResult = {
    endpoint: name,
    totalRequests,
    successfulRequests: successful,
    failedRequests: failed,
    durationMs,
    requestsPerSecond: Math.round(rps * 100) / 100,
    avgLatencyMs: Math.round(avgLatency * 100) / 100,
    p50LatencyMs: Math.round(p50 * 100) / 100,
    p95LatencyMs: Math.round(p95 * 100) / 100,
    p99LatencyMs: Math.round(p99 * 100) / 100,
    errorRatePercent: Math.round(errorRate * 100) / 100,
  };

  console.log(`✅ Completed in ${durationMs}ms`);
  console.log(`   RPS: ${result.requestsPerSecond}`);
  console.log(`   Avg Latency: ${result.avgLatencyMs}ms (p50: ${result.p50LatencyMs}ms, p95: ${result.p95LatencyMs}ms, p99: ${result.p99LatencyMs}ms)`);
  console.log(`   Error Rate: ${result.errorRatePercent}% (${failed}/${totalRequests} failed)`);

  return result;
}

async function runLoadTests() {
  console.log(`\n=========================================================`);
  console.log(`🔥 CYBER THREAT INTEL PLATFORM - PHASE 6 LOAD BENCHMARK`);
  console.log(`=========================================================\n`);

  // 1. Obtain JWT Bearer Token
  let jwtToken = '';
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@cyberintel.gov',
      password: 'AdminSecurePass123!',
    });
    jwtToken = loginRes.data.accessToken || loginRes.data.access_token || loginRes.data.token;
    console.log(`🔑 Authenticated successfully as Admin. Token acquired.`);
  } catch (err: any) {
    console.error(`⚠️ Login failed: ${err.message}. Proceeding without auth header if possible.`);
  }

  const authHeaders = jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {};

  const results: BenchmarkResult[] = [];

  // Test 1: POST /api/auth/login (Limited concurrency to respect rate limits)
  const loginResult = await benchmarkEndpoint(
    'POST /api/auth/login',
    async () => {
      const start = Date.now();
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'admin@cyberintel.gov',
        password: 'AdminSecurePass123!',
      });
      return Date.now() - start;
    },
    2,
    8,
  );
  results.push(loginResult);

  // Test 2: GET /api/alerts
  const alertsResult = await benchmarkEndpoint(
    'GET /api/alerts',
    async () => {
      const start = Date.now();
      await axios.get(`${BASE_URL}/alerts`, { headers: authHeaders });
      return Date.now() - start;
    },
    15,
    150,
  );
  results.push(alertsResult);

  // Test 3: GET /api/iocs/search
  const iocSearchResult = await benchmarkEndpoint(
    'GET /api/iocs/search',
    async () => {
      const start = Date.now();
      await axios.get(`${BASE_URL}/iocs/search?q=198.51.100`, { headers: authHeaders });
      return Date.now() - start;
    },
    10,
    50,
  );
  results.push(iocSearchResult);

  console.log(`\n=========================================================`);
  console.log(`📊 FINAL LOAD TEST SUMMARY`);
  console.log(`=========================================================`);
  console.table(results);
}

runLoadTests();
