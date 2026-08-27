const { Op } = require('sequelize');
const { Medicine, Pharmacy, User } = require('../models');
const { rankByProximity, validateCoordinates } = require('../utils/geo');
const { PUBLIC_PHARMACY_ATTRIBUTES } = require('../utils/pharmacyPolicy');

const publicPharmacyWhere = { approved: true, suspended: false, reviewStatus: 'APPROVED' };
const locationCondition = (textLocation) => textLocation ? {
  [Op.or]: ['neighborhood', 'address', 'city', 'district', 'province', 'location'].map((field) => ({ [field]: { [Op.iLike]: `%${textLocation}%` } })),
} : null;

const publicUserInclude = { model: User, attributes: [], where: { isActive: true }, required: true };
const publicPharmacyInclude = (textLocation) => ({
  model: Pharmacy, attributes: PUBLIC_PHARMACY_ATTRIBUTES,
  where: { ...publicPharmacyWhere, ...(locationCondition(textLocation) || {}) }, required: true,
  include: [publicUserInclude],
});

const queryAssistantResults = async (intent, coordinatesInput) => {
  const coordinates = validateCoordinates(coordinatesInput?.latitude, coordinatesInput?.longitude);
  const radiusKm = coordinates ? intent.radiusKm : null;
  const sort = intent.sortBy === 'PRICE_ASC' ? 'price_asc' : intent.sortBy === 'PRICE_DESC' ? 'price_desc' : 'distance';
  const textLocation = intent.locationMode === 'TEXT_LOCATION' ? intent.textLocation : null;

  if (intent.intent === 'SEARCH_PHARMACY_NEARBY' && !intent.medicineName) {
    const pharmacies = await Pharmacy.findAll({ where: { ...publicPharmacyWhere, ...(locationCondition(textLocation) || {}) }, attributes: PUBLIC_PHARMACY_ATTRIBUTES, include: [publicUserInclude], limit: 50 });
    const ranked = rankByProximity(pharmacies.map((item) => ({ Pharmacy: item.toJSON(), price: 0 })), coordinates, { radiusKm, sort: 'distance' });
    return ranked.slice(0, 5).map((item) => ({ pharmacy: item.Pharmacy, medicine: null, distanceMeters: item.distanceMeters, distanceKm: item.distanceKm }));
  }

  if (!intent.medicineName) return [];
  const medicineWhere = { isActive: true, name: { [Op.iLike]: `%${intent.medicineName}%` } };
  if (intent.onlyAvailable) medicineWhere.stockStatus = { [Op.in]: ['AVAILABLE', 'LOW_STOCK'] };
  if (intent.minimumPrice !== null || intent.maximumPrice !== null) {
    medicineWhere.price = { ...(intent.minimumPrice !== null ? { [Op.gte]: intent.minimumPrice } : {}), ...(intent.maximumPrice !== null ? { [Op.lte]: intent.maximumPrice } : {}) };
  }
  const medicines = await Medicine.findAll({ where: medicineWhere, include: [publicPharmacyInclude(textLocation)], limit: 100 });
  let ranked = rankByProximity(medicines.map((item) => item.toJSON()), coordinates, { radiusKm, sort: sort === 'distance' ? 'distance' : 'name' });
  if (sort === 'price_asc') ranked.sort((a, b) => Number(a.price) - Number(b.price));
  if (sort === 'price_desc') ranked.sort((a, b) => Number(b.price) - Number(a.price));
  return ranked.slice(0, 5).map((item) => ({
    medicine: { id: item.id, name: item.name, price: item.price, quantity: item.quantity, stockStatus: item.stockStatus, updatedAt: item.updatedAt },
    pharmacy: item.Pharmacy, distanceMeters: item.distanceMeters, distanceKm: item.distanceKm,
  }));
};

module.exports = { queryAssistantResults };
