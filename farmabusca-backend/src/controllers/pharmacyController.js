const { Pharmacy, Medicine, User, Category } = require('../models');
const { uploadImage } = require('../services/cloudinaryService');

const PROFILE_FIELDS = [
  'name',
  'description',
  'address',
  'city',
  'province',
  'district',
  'phone',
  'whatsapp',
  'openingHours',
  'companyName',
  'nuit',
  'licenseNumber',
  'location',
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

const createProfile = async (req, res, next) => {
  try {
    const profileData = getProfilePayload(req.body);
    const existing = await Pharmacy.findOne({ where: { userId: req.user.id } });
    if (existing) {
      await existing.update({
        ...profileData,
        phone: profileData.phone || existing.phone || req.user.phone,
      });
      return res.json({ success: true, message: 'Dados da farmácia atualizados', data: existing });
    }

    let image = await getImageUrlFromRequest(req);
    // handle documents uploads
    let documentsMeta = [];
    if (req.files && req.files.documents && req.files.documents.length) {
      for (const file of req.files.documents) {
        try {
          const r = await uploadImage(file.buffer, 'pharmacy_documents');
          documentsMeta.push({ originalName: file.originalname, url: r?.secure_url || null });
          if (!image && /^estabelecimento-/i.test(file.originalname || '')) image = r?.secure_url || null;
        } catch (err) {
          console.error('Document upload error', err);
          const uploadError = new Error(`Falha ao guardar o documento ${file.originalname}`);
          uploadError.statusCode = 502;
          throw uploadError;
        }
      }
    }

    const pharmacy = await Pharmacy.create({
      ...profileData,
      phone: profileData.phone || req.user.phone,
      image,
      userId: req.user.id,
      approved: false,
      suspended: false,
      documents: documentsMeta,
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
    // handle documents uploads (append)
    let documentsMeta = pharmacy.documents || [];
    if (req.files && req.files.documents && req.files.documents.length) {
      for (const file of req.files.documents) {
        try {
          const r = await uploadImage(file.buffer, 'pharmacy_documents');
          documentsMeta.push({ originalName: file.originalname, url: r?.secure_url || null });
          if (!image && /^estabelecimento-/i.test(file.originalname || '')) image = r?.secure_url || null;
        } catch (err) {
          console.error('Document upload error', err);
          const uploadError = new Error(`Falha ao guardar o documento ${file.originalname}`);
          uploadError.statusCode = 502;
          throw uploadError;
        }
      }
    }

    await pharmacy.update({
      ...getProfilePayload(req.body),
      ...(image ? { image } : {}),
      documents: documentsMeta,
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

    const medicines = await Medicine.findAll({ where: { pharmacyId: pharmacy.id }, include: [Category] });
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
      where: { id: req.params.id, pharmacyId: pharmacy.id },
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
    const pharmacies = await Pharmacy.findAll({ where: { approved: true, suspended: false }, include: [User] });
    res.json({ success: true, message: 'Farmácias listadas', data: pharmacies.map(withPublicImage) });
  } catch (error) {
    next(error);
  }
};

const getPharmacyById = async (req, res, next) => {
  try {
    const pharmacy = await Pharmacy.findOne({
      where: { id: req.params.id, approved: true, suspended: false },
      include: [User],
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
    const pharmacy = await Pharmacy.findOne({ where: { id: req.params.id, approved: true, suspended: false } });
    if (!pharmacy) return res.status(404).json({ success: false, message: 'Farmácia não encontrada' });
    const medicines = await Medicine.findAll({ where: { pharmacyId: pharmacy.id, stockStatus: ['AVAILABLE', 'LOW_STOCK'] }, include: [Category] });
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
