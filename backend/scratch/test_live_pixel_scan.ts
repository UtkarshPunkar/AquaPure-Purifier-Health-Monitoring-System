import { prisma } from '../src/db';
import jpeg from 'jpeg-js';
import http from 'http';

function createAlgaeFrame(width: number, height: number): Buffer {
  const buf = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Dense green algae mat in center
      if (x >= 180 && x <= 450 && y >= 120 && y <= 360) {
        buf[idx] = 35;      // R
        buf[idx + 1] = 185; // G (high chlorophyll green)
        buf[idx + 2] = 45;  // B
        buf[idx + 3] = 255;
      } else {
        buf[idx] = 175;
        buf[idx + 1] = 190;
        buf[idx + 2] = 205;
        buf[idx + 3] = 255;
      }
    }
  }
  return jpeg.encode({ data: buf, width, height }, 85).data;
}

function createInsectFrame(width: number, height: number): Buffer {
  const buf = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Dark insect body and appendages in center
      if (x >= 240 && x <= 340 && y >= 180 && y <= 270) {
        buf[idx] = 28;      // R (dark chitin)
        buf[idx + 1] = 22;  // G
        buf[idx + 2] = 16;  // B
        buf[idx + 3] = 255;
      } else {
        buf[idx] = 200;
        buf[idx + 1] = 215;
        buf[idx + 2] = 225;
        buf[idx + 3] = 255;
      }
    }
  }
  return jpeg.encode({ data: buf, width, height }, 85).data;
}

async function sendScan(payloadObj: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(payloadObj);
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
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testLivePixelAnalysis() {
  const purifier = await prisma.purifier.findFirst();
  if (!purifier) return;

  console.log('=== TEST 1: RAW INSECT FRAME SCAN ===');
  const insectJpeg = createInsectFrame(640, 480);
  const insectRes = await sendScan({
    purifierId: purifier.id,
    image: `data:image/jpeg;base64,${insectJpeg.toString('base64')}`,
  });
  console.log('HTTP Status:', insectRes.status);
  console.log('Detected Object:', insectRes.data.scanResult?.detectedObject);
  console.log('Confidence:', insectRes.data.scanResult?.confidence);
  console.log('Risk Level:', insectRes.data.scanResult?.riskLevel);
  console.log('Bounding Boxes:', insectRes.data.scanResult?.boundingBoxes);

  console.log('\n=== TEST 2: RAW ALGAE FRAME SCAN ===');
  const algaeJpeg = createAlgaeFrame(640, 480);
  const algaeRes = await sendScan({
    purifierId: purifier.id,
    image: `data:image/jpeg;base64,${algaeJpeg.toString('base64')}`,
  });
  console.log('HTTP Status:', algaeRes.status);
  console.log('Detected Object:', algaeRes.data.scanResult?.detectedObject);
  console.log('Confidence:', algaeRes.data.scanResult?.confidence);
  console.log('Risk Level:', algaeRes.data.scanResult?.riskLevel);
  console.log('Bounding Boxes:', algaeRes.data.scanResult?.boundingBoxes);

  // Check purifier status in DB
  const updatedPurifier = await prisma.purifier.findUnique({ where: { id: purifier.id } });
  console.log('\nUpdated Purifier Status in DB:', updatedPurifier?.status);

  // Check alerts in DB
  const latestAlerts = await prisma.alert.findMany({
    where: { purifierId: purifier.id },
    orderBy: { timestamp: 'desc' },
    take: 2,
  });
  console.log('Latest Generated Alerts in DB:');
  latestAlerts.forEach(a => console.log(`  - [${a.severity}] ${a.title}: ${a.message}`));

  process.exit(0);
}

testLivePixelAnalysis().catch((e) => {
  console.error(e);
  process.exit(1);
});
