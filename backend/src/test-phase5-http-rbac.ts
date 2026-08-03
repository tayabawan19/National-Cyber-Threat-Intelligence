import axios from 'axios';

async function testPhase5HttpEndpoints() {
  console.log('\n======================================================');
  console.log('     PHASE 5 LIVE HTTP ENDPOINT & RBAC TEST SUITE      ');
  console.log('======================================================\n');

  const API_BASE = 'http://localhost:3000/api';

  try {
    // 1. Authenticate as SOC_ANALYST user (analyst@cyberintel.gov)
    console.log('[TEST 1] Authenticating as SOC_ANALYST user (analyst@cyberintel.gov)...');
    const analystAuth = await axios.post(`${API_BASE}/auth/login`, {
      email: 'analyst@cyberintel.gov',
      password: 'AnalystPass123!',
    });
    const analystToken = analystAuth.data.accessToken;
    console.log(` -> Received SOC_ANALYST Token. Role: ${analystAuth.data.user.role}`);

    // 2. Attempt POST /api/forensics/artifacts as SOC_ANALYST -> Expect 403 Forbidden
    console.log('\n[TEST 2] SOC_ANALYST attempting POST /api/forensics/artifacts...');
    try {
      await axios.post(
        `${API_BASE}/forensics/artifacts`,
        {
          caseId: 'some-case-id',
          artifactType: 'LOG_FILE',
          description: 'Forbidden analyst attempt',
        },
        { headers: { Authorization: `Bearer ${analystToken}` } },
      );
      console.log('❌ FAILED: API allowed SOC_ANALYST to add forensic artifact!');
    } catch (err: any) {
      console.log(` -> Response Status: ${err.response?.status} (${err.response?.data?.message || err.message})`);
      if (err.response?.status === 403) {
        console.log('✅ PASSED: SOC_ANALYST rejected with HTTP 403 Forbidden.');
      } else {
        console.log('⚠️ Unexpected status code:', err.response?.status);
      }
    }

    // 3. Authenticate as ADMIN (admin@cyberintel.gov)
    console.log('\n[TEST 3] Authenticating as ADMIN (admin@cyberintel.gov)...');
    const adminAuth = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@cyberintel.gov',
      password: 'AdminSecurePass123!',
    });
    const adminToken = adminAuth.data.accessToken;
    console.log(` -> Received ADMIN Token. Role: ${adminAuth.data.user.role}`);

    // Get a valid case ID
    const casesRes = await axios.get(`${API_BASE}/cases`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const targetCaseId = casesRes.data[0]?.id;

    // 4. ADMIN creating artifact and appending custody entry via HTTP
    console.log(`\n[TEST 4] ADMIN attaching artifact to Case ${targetCaseId.slice(0, 8)}...`);
    const artRes = await axios.post(
      `${API_BASE}/forensics/artifacts`,
      {
        caseId: targetCaseId,
        artifactType: 'NETWORK_CAPTURE_META',
        description: 'Pcap packet capture of command and control session',
        hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
        initialAction: 'Captured via tcpdump on boundary router eth0',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    console.log(` -> Artifact Created: ID ${artRes.data.id} (Chain entries: ${artRes.data.chainOfCustody.length})`);

    const artifactId = artRes.data.id;

    // Append custody action
    console.log(` -> Appending custody log action to Artifact ${artifactId.slice(0, 8)}...`);
    const custodyRes = await axios.post(
      `${API_BASE}/forensics/artifacts/${artifactId}/custody`,
      { action: 'Exported sanitized PCAP metadata to SIEM analysis enclave' },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    console.log(` -> Custody Appended: Total chain entries now ${custodyRes.data.chainOfCustody.length}`);

    // 5. Test forbidden PUT edit on past custody history
    console.log('\n[TEST 5] Attempting forbidden PUT edit on past custody history...');
    try {
      await axios.put(
        `${API_BASE}/forensics/artifacts/${artifactId}`,
        { description: 'Altered metadata' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      console.log('❌ FAILED: API allowed modification of forensic artifact!');
    } catch (err: any) {
      console.log(` -> Response Status: ${err.response?.status} (${err.response?.data?.message})`);
      if (err.response?.status === 400 || err.response?.status === 403) {
        console.log('✅ PASSED: Modification rejected (Append-only policy enforced).');
      }
    }

    // 6. Test GET /api/siem/export with X-SIEM-API-KEY
    console.log('\n[TEST 6] Testing GET /api/siem/export (CEF and JSON format)...');
    
    // Test without key -> Expect 401
    try {
      await axios.get(`${API_BASE}/siem/export`);
      console.log('❌ FAILED: SIEM export accessible without API key!');
    } catch (err: any) {
      console.log(` -> Unauthenticated Request Response: ${err.response?.status}`);
      if (err.response?.status === 401) {
        console.log('✅ PASSED: Unauthorized request rejected with 401.');
      }
    }

    // Test JSON export
    const jsonExport = await axios.get(`${API_BASE}/siem/export?format=json`, {
      headers: { 'X-SIEM-API-KEY': 'siem_secret_service_key_2026' },
    });
    console.log(` -> JSON Export Success: ${jsonExport.data.count} alerts exported.`);

    // Test CEF export
    const cefExport = await axios.get(`${API_BASE}/siem/export?format=cef`, {
      headers: { 'X-SIEM-API-KEY': 'siem_secret_service_key_2026' },
    });
    console.log(` -> CEF Export Success: ${cefExport.data.count} alerts formatted in CEF.`);
    console.log(` -> Sample CEF Header:\n   "${cefExport.data.data.split('\n')[0].slice(0, 85)}..."`);

  } catch (error: any) {
    console.error('Error during HTTP endpoint test execution:', error.response?.data || error.message);
  }
}

testPhase5HttpEndpoints();
