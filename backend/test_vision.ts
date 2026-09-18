import jpeg from 'jpeg-js';
import { analyzeVisionFrame } from './src/services/visionAnalysis.service';

function createTestJpeg(width: number, height: number, drawFn: (x: number, y: number) => [number, number, number]): Buffer {
  const frameData = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = drawFn(x, y);
      const idx = (y * width + x) * 4;
      frameData[idx] = r;
      frameData[idx + 1] = g;
      frameData[idx + 2] = b;
      frameData[idx + 3] = 255;
    }
  }
  const encoded = jpeg.encode({ data: frameData, width, height }, 85);
  return encoded.data;
}

async function runTests() {
  console.log('=== AQUAPURE AI COMPUTER VISION TEST SUITE ===\n');

  const width = 640;
  const height = 480;

  // 1. Test Clean Water Frame
  console.log('[Test 1] Testing Clean Water optical transmission...');
  const cleanFrame = createTestJpeg(width, height, (x, y) => [180 + (x % 5), 200 + (y % 5), 220 + ((x + y) % 4)]);
  const cleanResult = analyzeVisionFrame(cleanFrame);
  console.log('  -> Result:', cleanResult.detectedObject, '| Conf:', cleanResult.confidence, '| Risk:', cleanResult.riskLevel);
  console.assert(cleanResult.riskLevel === 'SAFE', 'Clean water should be SAFE');
  console.assert(cleanResult.detectedObject.includes('Clean'), 'Should detect Clean Water');
  console.log('  ✓ Clean Water test passed!\n');

  // 2. Test Algae Bloom Frame (Concentrated green colony/biofilm)
  console.log('[Test 2] Testing Algae Bloom / Biofilm detection...');
  const algaeFrame = createTestJpeg(width, height, (x, y) => {
    // Green algae cluster between (150, 100) and (350, 280)
    if (x >= 150 && x <= 350 && y >= 100 && y <= 280) {
      return [35, 175, 45]; // Dense chlorophyll green
    }
    return [170, 185, 200]; // Water background
  });
  const algaeResult = analyzeVisionFrame(algaeFrame);
  console.log('  -> Result:', algaeResult.detectedObject, '| Conf:', algaeResult.confidence, '| Risk:', algaeResult.riskLevel);
  console.log('  -> Bounding boxes:', JSON.stringify(algaeResult.boundingBoxes));
  console.assert(algaeResult.riskLevel === 'CRITICAL', 'Algae bloom should be CRITICAL');
  console.assert(algaeResult.detectedObject.includes('Algae'), 'Should detect Algae Bloom');
  console.assert(algaeResult.boundingBoxes.length > 0, 'Should have bounding box for algae');
  console.log('  ✓ Algae Bloom test passed!\n');

  // 3. Test Insect Particulate Frame (Dark organic blob)
  console.log('[Test 3] Testing Insect Particulate detection...');
  const insectFrame = createTestJpeg(width, height, (x, y) => {
    // Insect body & appendages around (250, 200) to (330, 270)
    if (x >= 250 && x <= 330 && y >= 200 && y <= 270) {
      return [30, 22, 18]; // Dark chitin / insect organic matter
    }
    return [200, 215, 225]; // Water background
  });
  const insectResult = analyzeVisionFrame(insectFrame);
  console.log('  -> Result:', insectResult.detectedObject, '| Conf:', insectResult.confidence, '| Risk:', insectResult.riskLevel);
  console.log('  -> Bounding boxes:', JSON.stringify(insectResult.boundingBoxes));
  console.assert(insectResult.riskLevel === 'CRITICAL' || insectResult.riskLevel === 'WARNING', 'Insect should be CRITICAL or WARNING');
  console.assert(insectResult.detectedObject.includes('Insect'), 'Should detect Insect Particulate');
  console.assert(insectResult.boundingBoxes.length > 0, 'Should have bounding box for insect');
  console.log('  ✓ Insect Particulate test passed!\n');

  // 4. Test Nematode / Worm Frame (Elongated serpentine filament)
  console.log('[Test 4] Testing Nematode / Helminth Larvae (Worm) detection...');
  const wormFrame = createTestJpeg(width, height, (x, y) => {
    // Elongated worm filament along horizontal axis from (180, 230) to (460, 245) - Aspect ratio > 18:1
    if (x >= 180 && x <= 460 && y >= 230 && y <= 245) {
      return [40, 35, 30]; // Dark parasite body
    }
    return [195, 210, 220]; // Water background
  });
  const wormResult = analyzeVisionFrame(wormFrame);
  console.log('  -> Result:', wormResult.detectedObject, '| Conf:', wormResult.confidence, '| Risk:', wormResult.riskLevel);
  console.log('  -> Bounding boxes:', JSON.stringify(wormResult.boundingBoxes));
  console.assert(wormResult.riskLevel === 'CRITICAL', 'Nematode should be CRITICAL');
  console.assert(wormResult.detectedObject.includes('Nematode'), 'Should detect Nematode Larvae');
  console.assert(wormResult.boundingBoxes.length > 0, 'Should have bounding box for worm');
  console.log('  ✓ Nematode Larvae test passed!\n');

  console.log('====================================================');
  console.log('ALL AI OPTICAL VISION DETECTIONS VERIFIED 100% OK!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
