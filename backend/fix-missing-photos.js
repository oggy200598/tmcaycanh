const https = require('https');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../frontend/public/assets/images');

const FALLBACK_PHOTOS = {
  'bonsai_si.jpg': 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=700&auto=format&fit=crop&q=80',
  'bonsai_tung.jpg': 'https://images.unsplash.com/photo-1514517521153-1be72277b32f?w=700&auto=format&fit=crop&q=80',
  'hoa_giay.jpg': 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=700&auto=format&fit=crop&q=80',
  'day_nhen.jpg': 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=700&auto=format&fit=crop&q=80',
  'tung_bong_lai.jpg': 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=700&auto=format&fit=crop&q=80',
  'hong_mon.jpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&auto=format&fit=crop&q=80',
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`Status ${res.statusCode}`));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function run() {
  for (const [name, url] of Object.entries(FALLBACK_PHOTOS)) {
    const dest = path.join(IMAGES_DIR, name);
    try {
      await download(url, dest);
      console.log('✓ Fixed:', name);
    } catch (e) {
      console.log('✗ Fail:', name, e.message);
    }
  }
}
run();
