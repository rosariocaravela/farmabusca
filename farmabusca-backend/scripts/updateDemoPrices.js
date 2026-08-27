require('dotenv').config();
const { sequelize, Medicine, Pharmacy } = require('../src/models');

const prices = [
  ['Farmácia Baixa Saúde', 'Paracetamol', 70],
  ['Farmácia Alto Maé Central', 'Paracetamol', 75],
  ['Farmácia Baixa Saúde', 'Ibuprofeno', 125],
  ['Farmácia Alto Maé Central', 'Amoxicilina', 275],
  ['Farmácia Baixa Saúde', 'Loratadina', 95],
  ['Farmácia Alto Maé Central', 'Vitamina C', 145],
  ['Farmácia Baixa Saúde', 'Azitromicina', 350],
  ['Farmácia Alto Maé Central', 'Cetirizina', 105],
  ['Farmácia Baixa Saúde', 'Amoxicilina', 290],
  ['Farmácia Alto Maé Central', 'Complexo B', 210],
  ['Farmácia Costa do Sol Demo', 'Paracetamol', 68],
  ['Farmácia Costa do Sol Demo', 'Ibuprofeno', 120],
  ['Farmácia Matola Centro Demo', 'Amoxicilina', 285],
  ['Farmácia Matola Centro Demo', 'Loratadina', 90],
];

async function run() {
  await sequelize.authenticate();
  let updated = 0;

  await sequelize.transaction(async (transaction) => {
    for (const [pharmacyName, medicineName, price] of prices) {
      const pharmacy = await Pharmacy.findOne({ where: { name: pharmacyName }, transaction });
      if (!pharmacy) continue;
      const [count] = await Medicine.update(
        { price },
        { where: { pharmacyId: pharmacy.id, name: medicineName }, transaction },
      );
      updated += count;
    }
  });

  console.log(`Demo prices updated in ${updated} medicine records.`);
}

run()
  .then(() => sequelize.close())
  .catch(async (error) => {
    console.error('Demo price update failed:', error.message);
    await sequelize.close();
    process.exit(1);
  });
