const { Pharmacy, Medicine, User, Category } = require('../models');
const { Op } = require('sequelize');
const { uploadImage } = require('../services/cloudinaryService');
const { SAFE_USER_ATTRIBUTES } = require('../utils/authPolicy');
const { PUBLIC_PHARMACY_ATTRIBUTES } = require('../utils/pharmacyPolicy');

const safeUserInclude = { model: User, attributes: SAFE_USER_ATTRIBUTES };

const PROFILE_FIELDS = [
  'name',
  'description',
  'address',
  'city',
  'province',
  'district',
  'neighborhood',
  'phone',
  'whatsapp',
  'openingHours',
  'companyName',
  'nuit',
  'licenseNumber',
  'location',
  'latitude',
  'longitude',
  'responsibleName',
  'responsibleRole',
  'responsibleContact',
];

const getProfilePayload = (body = {}) => PROFILE_FIELDS.reduce((payload, field) => {
  if (body[field] !== undefined) payload[field] = body[field];
  return payload;
}, {});

const getImageUrlFromRequest = async (req) => {
  let imageUrl = req.body.image || req.body.imageUrl;
  // single file under 'image'
  if (req.files && req.files.image && req.files.image[0] && req.files.image[0].buffer) {
    try {
      const result = await uploadImage(req.files.image[0].buffer, 'pharmacies');
      if (result && result.secure_url) imageUrl = result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error', err);
    }
  }
  return imageUrl;
};

const getEstablishmentPhoto = (documents = []) => {
  const namedPhoto = documents.find((document) =>
    document?.url && /^estabelecimento-/i.test(document.originalName || '')
  );
  if (namedPhoto?.url) return namedPhoto.url;

  // Cadastros antigos guardavam NUIT, licença e fotos em sequência,
  // todos com o nome genérico "documento-N".
  const legacyPhoto = documents.slice(2).find((document) =>
    document?.url && /^documento-\d+\.(jpe?g|png|webp)$/i.test(document.originalName || '')
  );
  return legacyPhoto?.url || null;
};

const withPublicImage = (pharmacy) => {
  if (!pharmacy) return pharmacy;
  const data = typeof pharmacy.toJSON === 'function' ? pharmacy.toJSON() : pharmacy;
  return { ...data, image: data.image || getEstablishmentPhoto(data.documents) };
};

const uploadPharmacyDocuments = async (files = [], currentDocuments = [], currentImage = null) => {
  const documents = Array.isArray(currentDocuments) ? currentDocuments.map((document) => ({ ...document })) : [];
  let image = currentImage;

  for (const file of files) {
    try {
      const result = await uploadImage(file.buffer, 'pharmacy_documents');
      const url = result?.secure_url || null;
      documents.push({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
        uploadedAt: new Date().toISOString(),
      });
      if (!image && /^estabelecimento-/i.test(file.originalname || '')) image = url;
    } catch (error) {
      console.error('Document upload error', error);
      const uploadError = new Error(`Falha ao guardar o documento ${file.originalname}`);
      uploadError.statusCode = 502;
      throw uploadError;
    }
  }

  return { documents, image };
};

const createProfile = async (req, res, next) => {
  try {
    const profileData = getProfilePayload(req.body);
    const existing = await Pharmacy.findOne({ where: { userId: req.user.id } });
    if (existing) {
      const requestedImage = await getImageUrlFromRequest(req);
      const uploaded = await uploadPharmacyDocuments(
        req.files?.documents || [],
        existing.documents,
        requestedImage || existing.image,
      );
      await existing.update({
        ...profileData,
        phone: profileData.phone || existing.phone || req.user.phone,
        image: uploaded.image,
        documents: uploaded.documents,
      });
      return res.json({ success: true, message: 'Dados da farmácia atualizados', data: existing });
    }

    let image = await getImageUrlFromRequest(req);
    const uploaded = await uploadPharmacyDocuments(req.files?.documents || [], [], image);
    image = uploaded.image;

    const pharmacy = await Pharmacy.create({
      ...profileData,
      phone: profileData.phone || req.user.phone,
      image,
      userId: req.user.id,
      approved: false,
      suspended: false,
      documents: uploaded.documents,
    });
    res.status(201).json({ success: true, message: 'Perfil da farmácia criado', data: pharmacy });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findOne({ where: { userId: req.user.id } });
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    }

    let image = await getImageUrlFromRequest(req);
    const uploaded = await uploadPharmacyDocuments(
      req.files?.documents || [],
      pharmacy.documents,
      image || pharmacy.image,
    );

    await pharmacy.update({
      ...getProfilePayload(req.body),
      ...(uploaded.image ? { image: uploaded.image } : {}),
      documents: uploaded.documents,
    });
    res.json({ success: true, message: 'Perfil atualizado', data: pharmacy });
  } catch (error) {
    next(error);
  }
};

const getMyPharmacy = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findOne({ where: { userId: req.user.id } });
    res.json({ success: true, message: 'Farmácia carregada', data: pharmacy });
  } catch (error) {
    next(error);
  }
};

const listMyMedicines = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findOne({ where: { userId: req.user.id } });
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    }

    const medicines = await Medicine.findAll({ where: { pharmacyId: pharmacy.id, isActive: true }, include: [Category] });
    res.json({ success: true, message: 'Medicamentos da farmácia', data: medicines });
  } catch (error) {
    next(error);
  }
};

const getMyMedicineById = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findOne({ where: { userId: req.user.id } });
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    }

    const medicine = await Medicine.findOne({
      where: { id: req.params.id, pharmacyId: pharmacy.id, isActive: true },
      include: [Category],
    });
    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicamento não encontrado' });
    }

    res.json({ success: true, message: 'Medicamento da farmácia carregado', data: medicine });
  } catch (error) {
    next(error);
  }
};

const listPharmacies = async (req, res, next) => {
  try {
    const where = { approved: true, suspended: false };
    const name = String(req.query.name || '').trim();
    const location = String(req.query.location || '').trim();
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (location) where[Op.or] = ['neighborhood', 'address', 'city', 'district', 'province', 'location']
      .map((field) => ({ [field]: { [Op.iLike]: `%${location}%` } }));

    where.reviewStatus = 'APPROVED';
    const pharmacies = await Pharmacy.findAll({ attributes: PUBLIC_PHARMACY_ATTRIBUTES, where, include: [{ model: User, attributes: [], where: { isActive: true }, required: true }], order: [['name', 'ASC']] });
    res.json({ success: true, message: 'Farmácias listadas', data: pharmacies.map(withPublicImage) });
  } catch (error) {
    next(error);
  }
};

const getPharmacyById = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findOne({
      where: { id: req.params.id, approved: true, suspended: false, reviewStatus: 'APPROVED' },
      attributes: PUBLIC_PHARMACY_ATTRIBUTES,
      include: [{ model: User, attributes: [], where: { isActive: true }, required: true }],
    });
    if (!pharmacy) {
      return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    }
    res.json({ success: true, message: 'Farmácia carregada', data: withPublicImage(pharmacy) });
  } catch (error) {
    next(error);
  }
};

const listPharmacyMedicines = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findOne({ where: { id: req.params.id, approved: true, suspended: false, reviewStatus: 'APPROVED' }, include: [{ model: User, attributes: [], where: { isActive: true }, required: true }] });
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    const medicines = await Medicine.findAll({ where: { pharmacyId: pharmacy.id, isActive: true }, include: [Category] });
    res.json({ success: true, message: 'Medicamentos da farmácia listados', data: medicines });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProfile,
  updateProfile,
  getMyPharmacy,
  listMyMedicines,
  getMyMedicineById,
  listPharmacies,
  getPharmacyById,
  listPharmacyMedicines,
};
