const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function main() {
  const res = await pool.query(`
    SELECT DISTINCT c.macay, c.tencay, d.tendanhmuc, t.duongdantaptin
    FROM caycanh c
    LEFT JOIN danhmuc d ON c.madanhmuc = d.madanhmuc
    LEFT JOIN taptintruyenthong t ON c.macay = t.macay AND t.laanhchinh = true
    ORDER BY d.tendanhmuc, c.tencay
  `);
  
  const plantsByName = {};
  res.rows.forEach(r => {
    // extract base name without pot type
    const baseName = r.tencay.split(' - ')[0].trim();
    if (!plantsByName[baseName]) {
      plantsByName[baseName] = {
        category: r.tendanhmuc,
        photos: new Set(),
        examples: []
      };
    }
    if (r.duongdantaptin) plantsByName[baseName].photos.add(r.duongdantaptin);
    plantsByName[baseName].examples.push(r.macay + ' (' + r.tencay + '): ' + r.duongdantaptin);
  });

  console.log('--- PLANTS BY BASE SPECIES (' + Object.keys(plantsByName).length + ' species) ---');
  for (const [name, info] of Object.entries(plantsByName)) {
    console.log(`[${info.category}] ${name}`);
    console.log(`  Photos (${info.photos.size}): ${Array.from(info.photos).join(', ')}`);
  }

  await pool.end();
}

main().catch(console.error);
