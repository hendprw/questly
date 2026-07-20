import fs from 'fs';

const FILE_PATH = './db/seed-world.js';
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Fungsi untuk memperpanjang deskripsi
function enhanceDescription(oldDesc, name) {
    if (!oldDesc) return oldDesc;
    if (oldDesc.length > 80) return oldDesc; // Sudah cukup panjang

    const additions = [
        ` Benda ini memiliki sejarah yang panjang di daratan Questly.`,
        ` Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.`,
        ` Ada aura magis tipis yang memancar dari benda ini.`,
        ` Sangat berharga bagi mereka yang tahu cara menggunakannya.`,
        ` Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.`,
        ` Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.`,
        ` Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.`,
        ` Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.`
    ];
    
    // Pilih tambahan secara pseudo-random berdasarkan nama
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % additions.length;
    
    return oldDesc + additions[idx];
}

// Regex untuk mencari blok objek item yang memiliki "code", "name", "description"
// Kita asumsikan formatnya kurang lebih: "description": "...", 
// Kita akan menambahkan "image": "", setelah description atau di akhirnya.

// Langkah 1: Tambahkan "image": "" jika belum ada.
// Karena kita memproses seluruh file, kita cari pola: "description": "xxx",
const descRegex = /"description":\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;

let matchCount = 0;
let newContent = content.replace(descRegex, (match, p1) => {
    matchCount++;
    // Karena kita tidak punya akses ke 'name' secara presisi dengan regex ini,
    // kita generate random saja atau ambil dari p1.
    const enhanced = enhanceDescription(p1, p1);
    
    // Kembalikan dengan tambahan image
    return `"description": "${enhanced}", "image": ""`;
});

// Cek apakah "image": "", "image": "" dobel jika dijalankan ulang
newContent = newContent.replace(/"image": "",\s*"image": ""/g, '"image": ""');

fs.writeFileSync(FILE_PATH, newContent, 'utf8');
console.log(`Berhasil memperbarui ${matchCount} deskripsi dan menambahkan field image.`);
