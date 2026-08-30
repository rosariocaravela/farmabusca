require('dotenv').config();
const { sequelize, Medicine, Pharmacy } = require('../src/models');

const prices = [
  ['Farmácia Baixa Saúde', 'Paracetamol', 15],
  ['Farmácia Alto Maé Central', 'Paracetamol', 18],
  ['Farmácia Baixa Saúde', 'Ibuprofeno', 25],
  ['Farmácia Alto Maé Central', 'Omeprazol', 30],
  ['Farmácia Baixa Saúde', 'Loratadina', 22],
  ['Farmácia Alto Maé Central', 'Vitamina C', 20],
  ['Farmácia Baixa Saúde', 'Soro de Reidratação', 12],
  ['Farmácia Alto Maé Central', 'Cetirizina', 22],
  ['Farmácia Baixa Saúde', 'Amoxicilina', 35],
  ['Farmácia Alto Maé Central', 'Complexo B', 28],
  ['Farmácia Costa do Sol Demo', 'Paracetamol', 16],
  ['Farmácia Costa do Sol Demo', 'Ibuprofeno', 26],
  ['Farmácia Matola Centro Demo', 'Omeprazol', 32],
  ['Farmácia Matola Centro Demo', 'Loratadina', 20],
  ['Farmácia Baixa Saúde', 'Azitromicina', 35],
  ['Farmácia Baixa Saúde', 'Amoxicilina', 35],
  ['Farmácia Alto Maé Central', 'Amoxicilina', 35],
  ['Farmácia Matola Centro Demo', 'Amoxicilina', 35],
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
