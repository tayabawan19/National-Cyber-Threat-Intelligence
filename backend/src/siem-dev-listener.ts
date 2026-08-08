import * as http from 'http';

export function startSiemDevServers() {
  // 1. Local Splunk HEC Dev Server (Port 8088)
  const splunkServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const authHeader = req.headers['authorization'] || '';
      console.log(`\n[SPLUNK HEC DEV SERVER :8088] Incoming POST ${req.url}`);
      console.log(`  Header Authorization: ${authHeader}`);
      console.log(`  Received Event Body: ${body}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text: 'Success', code: 0, ackId: 1 }));
    });
  });

  splunkServer.listen(8088, () => {
    console.log('⚡ [SIEM DEV SERVER] Splunk HEC Dev Listener running on http://localhost:8088/services/collector/event');
  });

  // 2. Local Wazuh Manager API Dev Server (Port 55000)
  const wazuhServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      const apiKey = req.headers['x-wazuh-key'] || '';
      console.log(`\n[WAZUH MANAGER DEV SERVER :55000] Incoming POST ${req.url}`);
      console.log(`  Header x-wazuh-key: ${apiKey}`);
      console.log(`  Received Alert Body: ${body}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 0, message: 'Alert ingested successfully into Wazuh Manager queue', data: { status: 'ingested' } }));
    });
  });

  wazuhServer.listen(55000, () => {
    console.log('⚡ [SIEM DEV SERVER] Wazuh Manager API Dev Listener running on http://localhost:55000/api/v1/alerts');
  });

  return { splunkServer, wazuhServer };
}
