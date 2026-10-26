const test = require('node:test');
const assert = require('node:assert/strict');
const gisService = require('../services/gisService');

test('GIS Service & Business Rule Verification (TDD)', async (t) => {
  await t.test('1. Haversine distance calculation is accurate', () => {
    // Q1 (10.7745, 106.7032) to Q12 nursery (10.8672, 106.6853)
    const dist = gisService.calculateDistance(10.7745, 106.7032, 10.8672, 106.6853);
    assert.ok(dist > 10 && dist < 12, `Expected distance ~10.5 km, got ${dist}`);

    // Same point should be 0 km
    assert.equal(gisService.calculateDistance(10.77, 106.70, 10.77, 106.70), 0);
  });

  await t.test('2. GIS Shipping fee calculation adheres to BR08', () => {
    const fee1 = gisService.calculateShippingFee(10, 5); // 10 km, 5 kg
    assert.ok(fee1 >= 25000, 'Fee for 10km and 5kg should be reasonable');

    // Longer distance and heavier plant should cost more
    const fee2 = gisService.calculateShippingFee(30, 20);
    assert.ok(fee2 > fee1, 'Longer distance and heavier plant must have higher fee');
  });

  await t.test('3. Spatial Matching Engine calculates climate compatibility (BR06)', () => {
    const requirement = {
      nhietdotoithieu: 18,
      nhietdotoida: 35,
      doamtoiuu: 60,
      yeucauanhsang: 'Trong nhà',
      loaidat: 'Đất tơi xốp, thoát nước tốt pha mùn dừa',
    };

    // Perfect conditions (e.g. HCM indoor room)
    const perfectClimate = {
      nhietDo: 27,
      doAm: 62,
      anhSang: 'Trong nhà',
    };
    const result1 = gisService.calculateClimateCompatibility(requirement, perfectClimate);
    assert.ok(result1.score >= 90, `Expected score >= 90%, got ${result1.score}%`);
    assert.equal(result1.isCompatible, true);
    assert.ok(result1.badge.includes('Hợp'));

    // Harsh/incompatible conditions (e.g. freezing or extreme direct sun)
    const harshClimate = {
      nhietDo: 5,
      doAm: 20,
      anhSang: 'Toàn phần',
    };
    const result2 = gisService.calculateClimateCompatibility(requirement, harshClimate);
    assert.ok(result2.score < 50, `Expected low score for freezing conditions, got ${result2.score}%`);
    assert.equal(result2.isCompatible, false);
  });

  await t.test('4. Linear state machine enforces BR12 & BR13', () => {
    // Valid transitions
    assert.equal(gisService.isValidOrderTransition('ChoXacNhan', 'DaXacNhan'), true);
    assert.equal(gisService.isValidOrderTransition('DaXacNhan', 'DangChuanBiHang'), true);
    assert.equal(gisService.isValidOrderTransition('DangChuanBiHang', 'DangGiaoHang'), true);
    assert.equal(gisService.isValidOrderTransition('DangGiaoHang', 'DaHoanThanh'), true);

    // Invalid skipping transitions (BR12)
    assert.equal(gisService.isValidOrderTransition('ChoXacNhan', 'DangGiaoHang'), false);
    assert.equal(gisService.isValidOrderTransition('ChoXacNhan', 'DaHoanThanh'), false);
    assert.equal(gisService.isValidOrderTransition('DaHoanThanh', 'ChoXacNhan'), false);

    // Cancellation rule (BR12): cannot cancel once DangGiaoHang or DaHoanThanh
    assert.equal(gisService.isValidOrderTransition('ChoXacNhan', 'DaHuy'), true);
    assert.equal(gisService.isValidOrderTransition('DangChuanBiHang', 'DaHuy'), true);
    assert.equal(gisService.isValidOrderTransition('DangGiaoHang', 'DaHuy'), false);
    assert.equal(gisService.isValidOrderTransition('DaHoanThanh', 'DaHuy'), false);
  });
});
