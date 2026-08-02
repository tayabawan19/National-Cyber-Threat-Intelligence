import axios from 'axios';

async function testRbacDirectEnforcement() {
  console.log('\n=======================================================');
  console.log('    BACKEND DIRECT RBAC 403 FORBIDDEN ENFORCEMENT TEST');
  console.log('=======================================================\n');

  const API_BASE = 'http://localhost:3000/api';
  let successCount = 0;
  let totalTests = 5;

  try {
    // 1. Authenticate as READ_ONLY user
    console.log('[RBAC TEST] Authenticating as READ_ONLY user (readonly@cyberintel.gov)...');
    const authRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'readonly@cyberintel.gov',
      password: 'ReadOnlyPass123!',
    });

    const token = authRes.data.accessToken;
    console.log(`[RBAC TEST] Received JWT Token. User Role: ${authRes.data.user?.role}`);

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Direct HTTP API Write Attempt 1: POST /api/cases
    console.log('\n--- Direct API Write Attempt 1: POST /api/cases ---');
    try {
      await axios.post(
        `${API_BASE}/cases`,
        { title: 'Bypassed UI Case', description: 'Malicious read-only write attempt', severity: 'HIGH' },
        { headers },
      );
      console.log('❌ FAILED: API allowed POST /api/cases for READ_ONLY user!');
    } catch (err: any) {
      console.log(`[HTTP RESPONSE CODE]: ${err.response?.status} ${err.response?.statusText}`);
      console.log(`[HTTP RESPONSE BODY]:`, err.response?.data);
      if (err.response?.status === 403) {
        console.log('✅ PASSED: Backend independently rejected direct POST /api/cases with 403 Forbidden.');
        successCount++;
      }
    }

    // 3. Direct HTTP API Write Attempt 2: PATCH /api/alerts/:id
    console.log('\n--- Direct API Write Attempt 2: PATCH /api/alerts/:id ---');
    try {
      // Get an existing alert ID
      const alertsRes = await axios.get(`${API_BASE}/alerts?limit=1`, { headers });
      const alertId = alertsRes.data.items[0]?.id;

      await axios.patch(`${API_BASE}/alerts/${alertId}`, { status: 'RESOLVED' }, { headers });
      console.log('❌ FAILED: API allowed PATCH /api/alerts for READ_ONLY user!');
    } catch (err: any) {
      console.log(`[HTTP RESPONSE CODE]: ${err.response?.status} ${err.response?.statusText}`);
      console.log(`[HTTP RESPONSE BODY]:`, err.response?.data);
      if (err.response?.status === 403) {
        console.log('✅ PASSED: Backend independently rejected direct PATCH /api/alerts with 403 Forbidden.');
        successCount++;
      }
    }

    // 4. Direct HTTP API Write Attempt 3: POST /api/cases/:id/notes
    console.log('\n--- Direct API Write Attempt 3: POST /api/cases/:id/notes ---');
    try {
      const casesRes = await axios.get(`${API_BASE}/cases`, { headers });
      const caseId = casesRes.data[0]?.id || '11111111-1111-1111-1111-111111111111';

      await axios.post(`${API_BASE}/cases/${caseId}/notes`, { note: 'Bypassed note' }, { headers });
      console.log('❌ FAILED: API allowed POST /api/cases/:id/notes for READ_ONLY user!');
    } catch (err: any) {
      console.log(`[HTTP RESPONSE CODE]: ${err.response?.status} ${err.response?.statusText}`);
      console.log(`[HTTP RESPONSE BODY]:`, err.response?.data);
      if (err.response?.status === 403) {
        console.log('✅ PASSED: Backend independently rejected direct POST /api/cases/:id/notes with 403 Forbidden.');
        successCount++;
      }
    }

    // 5. Direct HTTP API Write Attempt 4: POST /api/detection-rules
    console.log('\n--- Direct API Write Attempt 4: POST /api/detection-rules ---');
    try {
      await axios.post(
        `${API_BASE}/detection-rules`,
        {
          name: 'Bypassed Rule',
          severity: 'HIGH',
          correlationType: 'SIMPLE',
          condition: { type: 'MATCH_TAGS', tags: ['malicious'] },
        },
        { headers },
      );
      console.log('❌ FAILED: API allowed POST /api/detection-rules for READ_ONLY user!');
    } catch (err: any) {
      console.log(`[HTTP RESPONSE CODE]: ${err.response?.status} ${err.response?.statusText}`);
      console.log(`[HTTP RESPONSE BODY]:`, err.response?.data);
      if (err.response?.status === 403) {
        console.log('✅ PASSED: Backend independently rejected direct POST /api/detection-rules with 403 Forbidden.');
        successCount++;
      }
    }

    // 6. Direct HTTP API Write Attempt 5: POST /api/threat-feeds/:id/sync
    console.log('\n--- Direct API Write Attempt 5: POST /api/threat-feeds/:id/sync ---');
    try {
      const feedsRes = await axios.get(`${API_BASE}/threat-feeds`, { headers });
      const feedId = feedsRes.data[0]?.id;

      await axios.post(`${API_BASE}/threat-feeds/${feedId}/sync`, {}, { headers });
      console.log('❌ FAILED: API allowed POST /api/threat-feeds/:id/sync for READ_ONLY user!');
    } catch (err: any) {
      console.log(`[HTTP RESPONSE CODE]: ${err.response?.status} ${err.response?.statusText}`);
      console.log(`[HTTP RESPONSE BODY]:`, err.response?.data);
      if (err.response?.status === 403) {
        console.log('✅ PASSED: Backend independently rejected direct POST /api/threat-feeds/:id/sync with 403 Forbidden.');
        successCount++;
      }
    }

  } catch (err: any) {
    console.error('RBAC Test Error:', err.message);
  }

  console.log('\n=======================================================');
  console.log(`RBAC BACKEND ENFORCEMENT RESULTS: ${successCount} / ${totalTests} PASSED (403 FORBIDDEN)`);
  console.log('=======================================================\n');
}

testRbacDirectEnforcement();
