import axios from 'axios';

async function fetchCommunityOsintFeed() {
  console.log('\n================================================================');
  console.log('    FETCHING REAL COMMUNITY THREAT EVENTS FROM BOTVRIJ OSINT FEED');
  console.log('================================================================\n');

  const MANIFEST_URL = 'http://www.botvrij.eu/data/feed-osint/manifest.json';
  const BASE_FEED_URL = 'http://www.botvrij.eu/data/feed-osint';
  const MISP_URL = 'http://localhost:8443';
  const MISP_KEY = 'LcVwzXXHcG0ctiIutSQGw9xiY61iuucbr7zjMfFG';

  const headers = {
    Authorization: MISP_KEY,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  try {
    console.log(`[1] Downloading live community feed manifest from ${MANIFEST_URL}...`);
    const manifestRes = await axios.get(MANIFEST_URL, { timeout: 15000 });
    const manifestData = manifestRes.data;

    const eventUuids = Object.keys(manifestData);
    console.log(`[1] Manifest loaded. Total community events available: ${eventUuids.length}`);

    // Select top 3 authentic event UUIDs
    const selectedUuids = eventUuids.slice(0, 3);
    console.log(`[2] Downloading authentic community event JSON payloads...`);

    let importedCount = 0;

    for (const uuid of selectedUuids) {
      const eventUrl = `${BASE_FEED_URL}/${uuid}.json`;
      try {
        const eventRes = await axios.get(eventUrl, { timeout: 15000 });
        const eventObj = eventRes.data;

        const info = eventObj.Event?.info || manifestData[uuid]?.info || 'Community OSINT Event';
        console.log(` -> Fetched community event: "${info}" (UUID: ${uuid})`);

        // Post event into MISP
        const postRes = await axios.post(`${MISP_URL}/events/add`, eventObj, { headers });
        if (postRes.data?.Event?.id) {
          importedCount++;
          console.log(`    ✅ Successfully imported into MISP: Event ID ${postRes.data.Event.id}`);
        }
      } catch (err: any) {
        console.error(`    ⚠️ Failed to import event ${uuid}:`, err.response?.data || err.message);
      }
    }

    // Verify MISP index
    const indexRes = await axios.get(`${MISP_URL}/events/index`, { headers });
    console.log(`\n================================================================`);
    console.log(`✅ VERIFIED: Live MISP Event Count is now ${indexRes.data.length} real community events.`);
    console.log(`================================================================\n`);

  } catch (error: any) {
    console.error('Error fetching community feed:', error.message);
  }
}

fetchCommunityOsintFeed();
