import { prisma } from '../src/db';
import http from 'http';

async function testEndpoint() {
  const purifier = await prisma.purifier.findFirst();
  if (!purifier) {
    console.log('No purifier found in database');
    return;
  }
  console.log(`Testing scan for purifier ${purifier.purifierCode} (${purifier.id})...`);

  const payload = JSON.stringify({ purifierId: purifier.id, sampleType: 'Insect Particulate' });
  const req = http.request('http://127.0.0.1:5000/api/ai-detections/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  }, (res) => {
    let body = '';
    res.on('data', c => body += c);
    res.on('end', () => {
      console.log('HTTP Status:', res.statusCode);
      try {
        const json = JSON.parse(body);
        console.log('Detected Object:', json.scanResult?.detectedObject);
        console.log('Confidence:', json.scanResult?.confidence);
        console.log('Risk Level:', json.scanResult?.riskLevel);
        console.log('Bounding Boxes:', json.scanResult?.boundingBoxes);
        console.log('Metrics:', json.scanResult?.metrics);
      } catch {
        console.log('Raw response:', body);
      }
      process.exit(0);
    });
  });

  req.on('error', (err) => {
    console.error('Request failed:', err.message);
    process.exit(1);
  });

  req.write(payload);
  req.end();
}

testEndpoint();
