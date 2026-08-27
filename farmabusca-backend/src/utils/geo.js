const EARTH_RADIUS_METERS = 6371008.8;

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
};

const validateCoordinates = (latitudeValue, longitudeValue, { required = false } = {}) => {
  const latitude = toFiniteNumber(latitudeValue);
  const longitude = toFiniteNumber(longitudeValue);
  if (latitude === null && longitude === null && !required) return null;
  if (latitude === null || longitude === null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    const error = new Error('Latitude e longitude devem ser informadas como números');
    error.statusCode = 400;
    throw error;
  }
  if (latitude < -90 || latitude > 90) {
    const error = new Error('Latitude deve estar entre -90 e 90');
    error.statusCode = 400;
    throw error;
  }
  if (longitude < -180 || longitude > 180) {
    const error = new Error('Longitude deve estar entre -180 e 180');
    error.statusCode = 400;
    throw error;
  }
  return { latitude, longitude };
};

const haversineDistanceMeters = (first, second) => {
  const a = validateCoordinates(first?.latitude, first?.longitude, { required: true });
  const b = validateCoordinates(second?.latitude, second?.longitude, { required: true });
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(b.latitude - a.latitude);
  const longitudeDelta = radians(b.longitude - a.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const rankByProximity = (items, coordinates, { radiusKm = null, sort = 'distance' } = {}) => {
  const origin = coordinates ? validateCoordinates(coordinates.latitude, coordinates.longitude, { required: true }) : null;
  const data = items.map((item) => {
    const pharmacy = item.Pharmacy || item.pharmacy;
    let distanceMeters = null;
    if (origin && pharmacy?.latitude != null && pharmacy?.longitude != null) {
      distanceMeters = Math.round(haversineDistanceMeters(origin, pharmacy));
    }
    return { ...item, distanceMeters, distanceKm: distanceMeters === null ? null : Number((distanceMeters / 1000).toFixed(2)) };
  }).filter((item) => radiusKm === null || (item.distanceMeters !== null && item.distanceMeters <= radiusKm * 1000));

  if (sort === 'distance' && origin) {
    data.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity) || Number(a.price) - Number(b.price));
  }
  if (sort === 'pharmacy') {
    data.sort((a, b) => String(a.Pharmacy?.name || '').localeCompare(String(b.Pharmacy?.name || '')));
  }
  return data;
};

module.exports = { haversineDistanceMeters, rankByProximity, validateCoordinates };
