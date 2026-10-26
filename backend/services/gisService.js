/**
 * GIS Spatial Engine & Business Logic Service for TMCayCanh
 * Implements: Haversine distance, shipping calculation (BR08),
 * climate matching engine (BR06), and linear state transition validator (BR12, BR13).
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Great-Circle distance between two coordinates using Haversine formula
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers rounded to 2 decimals
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (val) => (val * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Calculates shipping fee based on distance (km) and plant weight (kg) (BR08)
 * Formula: Base fee + (distance * ratePerKm) + (weight * weightFactor)
 * Minimum fee: 20,000 VND
 * @param {number} distanceKm Distance in kilometers
 * @param {number} weightKg Total weight of plants in kilograms
 * @returns {number} Shipping fee in VND
 */
function calculateShippingFee(distanceKm, weightKg = 2.0) {
  const baseFee = 15000;
  const ratePerKm = 2500;
  const ratePerKg = 1500;

  let fee = baseFee + distanceKm * ratePerKm + Math.max(0, weightKg - 1) * ratePerKg;
  fee = Math.max(20000, fee);
  // Round to nearest 1,000 VND
  return Math.round(fee / 1000) * 1000;
}

/**
 * Climate and soil matching engine (BR06)
 * Calculates match score between plant growth requirements and local environment
 * @param {object} requirement { nhietdotoithieu, nhietdotoida, doamtoiuu, yeucauanhsang, loaidat }
 * @param {object} climate { nhietDo, doAm, anhSang, loaiDat }
 * @returns {object} { score: number, isCompatible: boolean, badge: string, breakdown: object }
 */
function calculateClimateCompatibility(requirement, climate = {}) {
  let tempScore = 100;
  let humidityScore = 100;
  let lightScore = 100;

  const curTemp = climate.nhietDo !== undefined ? climate.nhietDo : 28; // default VN climate
  const curHumidity = climate.doAm !== undefined ? climate.doAm : 70;
  const curLight = climate.anhSang || 'Trong nhà';

  // 1. Temperature Check (Weight 40%)
  if (curTemp < requirement.nhietdotoithieu) {
    const diff = requirement.nhietdotoithieu - curTemp;
    tempScore = Math.max(0, 100 - diff * 12);
  } else if (curTemp > requirement.nhietdotoida) {
    const diff = curTemp - requirement.nhietdotoida;
    tempScore = Math.max(0, 100 - diff * 10);
  }

  // 2. Humidity Check (Weight 30%)
  const humDiff = Math.abs(curHumidity - requirement.doamtoiuu);
  if (humDiff > 10) {
    humidityScore = Math.max(0, 100 - (humDiff - 10) * 2.5);
  }

  // 3. Light Check (Weight 30%)
  if (requirement.yeucauanhsang === curLight) {
    lightScore = 100;
  } else if (
    (requirement.yeucauanhsang === 'Bán râm' && (curLight === 'Trong nhà' || curLight === 'Toàn phần')) ||
    (requirement.yeucauanhsang === 'Trong nhà' && curLight === 'Bán râm')
  ) {
    lightScore = 70;
  } else {
    lightScore = 30;
  }

  const totalScore = Math.round(tempScore * 0.4 + humidityScore * 0.3 + lightScore * 0.3);
  const isCompatible = totalScore >= 70;
  const badge = isCompatible ? `${totalScore}% Hợp thổ nhưỡng & khí hậu` : `${totalScore}% Cần che chắn/điều hòa`;

  return {
    score: totalScore,
    isCompatible,
    badge,
    breakdown: {
      tempScore: Math.round(tempScore),
      humidityScore: Math.round(humidityScore),
      lightScore: Math.round(lightScore),
    },
  };
}

/**
 * Checks whether an order state transition is valid according to BR12 & BR13
 * Sequence: ChoXacNhan -> DaXacNhan -> DangChuanBiHang -> DangGiaoHang -> DaHoanThanh
 * Cancellation (DaHuy) is only allowed BEFORE DangGiaoHang.
 * @param {string} currentState Current order status
 * @param {string} nextState Target order status
 * @returns {boolean}
 */
function isValidOrderTransition(currentState, nextState) {
  const allowedNext = {
    ChoXacNhan: ['DaXacNhan', 'DaHuy'],
    DaXacNhan: ['DangChuanBiHang', 'DaHuy'],
    DangChuanBiHang: ['DangGiaoHang', 'DaHuy'],
    DangGiaoHang: ['DaHoanThanh'],
    DaHoanThanh: [],
    DaHuy: [],
  };

  return (allowedNext[currentState] || []).includes(nextState);
}

module.exports = {
  calculateDistance,
  calculateShippingFee,
  calculateClimateCompatibility,
  isValidOrderTransition,
};
