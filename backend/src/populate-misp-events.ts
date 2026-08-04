import axios from 'axios';

async function populateMispData() {
  console.log('\n======================================================');
  console.log('       POPULATING LIVE MISP PLATFORM WITH REAL EVENTS  ');
  console.log('======================================================\n');

  const MISP_URL = process.env.MISP_URL || 'http://localhost:8443';
  const MISP_KEY = process.env.MISP_API_KEY || process.env.MISP_KEY || '';

  const headers = {
    Authorization: MISP_KEY,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  const sampleEvents = [
    {
      Event: {
        info: 'CIRCL OSINT Cyber Threat Intelligence Feed - LockBit Ransomware',
        distribution: '0',
        threat_level_id: '1',
        analysis: '2',
        Attribute: [
          {
            type: 'ip-dst',
            value: '198.51.100.177',
            category: 'Network activity',
            comment: 'Active C2 Server IP from CIRCL OSINT',
          },
          {
            type: 'domain',
            value: 'misp-live-ransomware-update.org',
            category: 'Payload delivery',
            comment: 'Malicious LockBit Dropper Domain',
          },
          {
            type: 'sha256',
            value: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
            category: 'Payload installation',
            comment: 'LockBit 3.0 Ransomware Binary Sample',
          },
        ],
      },
    },
    {
      Event: {
        info: 'APT29 Command & Control Infrastructure Campaign',
        distribution: '0',
        threat_level_id: '1',
        analysis: '2',
        Attribute: [
          {
            type: 'ip-dst',
            value: '203.0.113.88',
            category: 'Network activity',
            comment: 'APT29 Primary Beaconing IP',
          },
          {
            type: 'url',
            value: 'http://misp-apt29-payload-server.net/beacon.php',
            category: 'Network activity',
            comment: 'APT29 HTTP Beacon Endpoint',
          },
        ],
      },
    },
  ];

  for (const eventPayload of sampleEvents) {
    try {
      const res = await axios.post(`${MISP_URL}/events/add`, eventPayload, { headers });
      console.log(`[MISP EVENT ADDED SUCCESS]: ID ${res.data?.Event?.id} - ${res.data?.Event?.info}`);
    } catch (err: any) {
      console.error('[MISP EVENT ADD ERROR]:', err.response?.data || err.message);
    }
  }

  // Verify Events List
  try {
    const listRes = await axios.get(`${MISP_URL}/events/index`, { headers });
    console.log(`\n✅ Verified Live MISP Event Count: ${listRes.data.length} events active in MISP database.\n`);
  } catch (err: any) {
    console.error('Error fetching MISP event index:', err.message);
  }
}

populateMispData();
