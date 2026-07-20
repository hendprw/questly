/**
 * db/seed-world.js
 * -----------------
 * Porting LENGKAP dari utils/world-data.js (Orion RPG lama): seluruh
 * resource gathering per-biome, item olahan/consumable/equipment, biome,
 * gemstone enchant, dan monster (dengan deskripsi + lokasi asli).
 *
 * Dipisah dari db/seed.js (yang isinya item dasar starter) supaya
 * konten dunia yang besar ini gampang di-maintain sendiri. Semua pakai
 * INSERT OR IGNORE / ON CONFLICT sehingga aman dijalankan berulang.
 *
 * Aturan harga hasil porting:
 *  - Resource mentah (hasil !gather di suatu biome) TIDAK dijual di shop
 *    (buy_price = NULL) — hanya bisa didapat lewat gathering/loot, lalu
 *    dijual ke shop (sell_price = value.min asli dari Orion).
 *  - Item hasil crafting dijual di shop seharga crafting.cost aslinya.
 *  - Equipment tanpa resep tapi sellable memakai value.min sebagai harga beli.
 *  - Detail tambahan (stats, resep crafting, efek konsumsi, lokasi
 *    gathering) disimpan di kolom items.metadata (JSON) supaya tidak perlu
 *    migration kolom baru tiap ada properti baru.
 */

export const BIOMES = [
  {
    "code": "forest",
    "name": "Eldwood",
    "description": "Hutan kuno lebat yang penuh misteri dan reruntuhan. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "is_hidden": 0,
    "unlocked_by": null,
    "min_level": 1
  },
  {
    "code": "cave",
    "name": "Deepstone",
    "description": "Jaringan gua bawah tanah yang diterangi oleh kristal berpendar. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "is_hidden": 0,
    "unlocked_by": null,
    "min_level": 1
  },
  {
    "code": "mountain",
    "name": "Drakoria",
    "description": "Pegunungan terjal dan berbahaya, sarang monster terbang. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "is_hidden": 0,
    "unlocked_by": null,
    "min_level": 1
  },
  {
    "code": "swamp",
    "name": "Murkwood",
    "description": "Rawa subur yang tenang namun menyimpan bahaya di bawah airnya. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "is_hidden": 0,
    "unlocked_by": null,
    "min_level": 1
  },
  {
    "code": "skyward_valley",
    "name": "Celestia",
    "description": "Sebuah lembah tersembunyi di atas awan, penuh dengan flora dan fauna aneh. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "is_hidden": 1,
    "unlocked_by": "project_celestia",
    "min_level": 1
  },
  {
    "code": "abyss",
    "name": "Abyssia",
    "description": "Lautan dalam yang gelap abadi, dipenuhi reruntuhan kota bawah laut kuno. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "is_hidden": 1,
    "unlocked_by": "abyssal_map",
    "min_level": 1
  },
  {
    "code": "tundra",
    "name": "Frostholm",
    "description": "Daratan es dan salju abadi tempat angin berhembus sangat dingin bagai pisau. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "is_hidden": 0,
    "unlocked_by": null,
    "min_level": 10
  },
  {
    "code": "volcano",
    "name": "Ignis",
    "description": "Kawah gunung berapi aktif dengan aliran lava panas yang siap membakar apapun. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "is_hidden": 0,
    "unlocked_by": null,
    "min_level": 20
  }

];


export const COMMUNITY_PROJECTS = [
  {
    "code": "project_celestia",
    "name": "Membangun Jembatan Langit Celestia",
    "required_item": "omni_stone",
    "target_amount": 10000
  }
];

export const ANIMALS = [
  // Livestock
  { "code": "chicken", "name": "Ayam", "description": "Unggas jinak penghasil telur. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "ternak", "locations": ["Eldwood", "Murkwood"], "loot_table": [{"item_code": "chicken_egg", "chance": 1.0, "qty_min": 1, "qty_max": 2}] },
  { "code": "cow", "name": "Sapi", "description": "Sapi perah penghasil susu. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "ternak", "locations": ["Eldwood"], "loot_table": [{"item_code": "cow_milk", "chance": 1.0, "qty_min": 1, "qty_max": 3}, {"item_code": "beef", "chance": 0.5, "qty_min": 1, "qty_max": 2}] },
  { "code": "sheep", "name": "Domba", "description": "Domba berbulu tebal. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "ternak", "locations": ["Eldwood", "Celestia"], "loot_table": [{"item_code": "wool", "chance": 1.0, "qty_min": 1, "qty_max": 3}] },
  { "code": "pig", "name": "Babi Peliharaan", "description": "Babi gembul pemakan segalanya. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "ternak", "locations": ["Eldwood", "Murkwood"], "loot_table": [{"item_code": "pork", "chance": 1.0, "qty_min": 1, "qty_max": 4}] },
  { "code": "duck", "name": "Bebek", "description": "Unggas air penyuka sungai. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "ternak", "locations": ["Murkwood", "Abyssia"], "loot_table": [{"item_code": "duck_egg", "chance": 1.0, "qty_min": 1, "qty_max": 2}] },
  { "code": "rabbit", "name": "Kelinci", "description": "Kelinci lincah berbulu halus. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "ternak", "locations": ["Eldwood", "Celestia"], "loot_table": [{"item_code": "rabbit_fur", "chance": 1.0, "qty_min": 1, "qty_max": 2}] },
  { "code": "horse", "name": "Kuda", "description": "Kuda pelari cepat. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "ternak", "locations": ["Eldwood", "Celestia"], "loot_table": [{"item_code": "horse_hair", "chance": 1.0, "qty_min": 1, "qty_max": 3}] },
  { "code": "honey_bee", "name": "Lebah Madu", "description": "Serangga pekerja pembuat madu. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "ternak", "locations": ["Eldwood", "Celestia", "Murkwood"], "loot_table": [{"item_code": "beeswax", "chance": 1.0, "qty_min": 1, "qty_max": 2}] },
  { "code": "turkey", "name": "Kalkun", "description": "Burung besar dengan daging tebal. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "ternak", "locations": ["Eldwood", "Deepstone"], "loot_table": [{"item_code": "turkey_meat", "chance": 1.0, "qty_min": 1, "qty_max": 2}] },
  { "code": "quail", "name": "Burung Puyuh", "description": "Burung kecil penghasil telur khasiat tinggi. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "ternak", "locations": ["Eldwood", "Drakoria"], "loot_table": [{"item_code": "quail_egg", "chance": 1.0, "qty_min": 1, "qty_max": 4}] },
  
  // Wild
  { "code": "deer", "name": "Rusa Liar", "description": "Rusa lincah berleher panjang. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "buruan", "locations": ["Eldwood"], "loot_table": [{"item_code": "venison", "chance": 0.8, "qty_min": 1, "qty_max": 2}, {"item_code": "deer_antler", "chance": 0.3, "qty_min": 1, "qty_max": 1}] },
  { "code": "brown_bear", "name": "Beruang Cokelat", "description": "Hewan buas raksasa pelindung hutan. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "buruan", "locations": ["Eldwood", "Drakoria"], "loot_table": [{"item_code": "bear_pelt", "chance": 0.5, "qty_min": 1, "qty_max": 1}] },
  { "code": "snow_wolf", "name": "Serigala Salju", "description": "Pemangsa es bermata biru. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "buruan", "locations": ["Frostholm"], "loot_table": [{"item_code": "snow_wolf_fang", "chance": 0.4, "qty_min": 1, "qty_max": 2}] },
  { "code": "fire_fox", "name": "Rubah Api", "description": "Rubah yang bulunya terbakar api abadi. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "buruan", "locations": ["Ignis"], "loot_table": [{"item_code": "fire_fox_tail", "chance": 0.2, "qty_min": 1, "qty_max": 1}] },
  { "code": "spike_boar", "name": "Babi Hutan Berduri", "description": "Babi agresif pelindung rawa. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "buruan", "locations": ["Murkwood"], "loot_table": [{"item_code": "boar_spike", "chance": 0.6, "qty_min": 1, "qty_max": 3}] },
  { "code": "night_owl", "name": "Burung Hantu Malam", "description": "Mata pengintai di gua gelap. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "buruan", "locations": ["Deepstone"], "loot_table": [{"item_code": "owl_eye", "chance": 0.5, "qty_min": 1, "qty_max": 2}] },
  { "code": "desert_lizard", "name": "Kadal Gurun", "description": "Reptil tahan suhu magma. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "buruan", "locations": ["Ignis"], "loot_table": [{"item_code": "lizard_scale", "chance": 0.7, "qty_min": 1, "qty_max": 4}] },
  { "code": "seal", "name": "Anjing Laut", "description": "Penghuni bongkahan es terapung. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "buruan", "locations": ["Frostholm"], "loot_table": [{"item_code": "seal_oil", "chance": 0.8, "qty_min": 1, "qty_max": 2}] },
  { "code": "giant_bat", "name": "Kelelawar Raksasa", "description": "Makhluk bersayap pengisap darah. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "buruan", "locations": ["Deepstone"], "loot_table": [{"item_code": "bat_wing", "chance": 0.9, "qty_min": 1, "qty_max": 2}] },
  { "code": "mountain_lion", "name": "Singa Gunung", "description": "Kucing besar penguasa puncak tebing. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "buruan", "locations": ["Drakoria"], "loot_table": [{"item_code": "mountain_lion_fang", "chance": 0.3, "qty_min": 1, "qty_max": 2}] }
];


export const PLANTS = [
  // Farmable (Kebun) - harvest_time in minutes
  { "code": "plant_wheat", "name": "Gandum", "description": "Tanaman sereal berbulir keemasan. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "farmable", "locations": [], "harvest_time": 5, "loot_table": [{"item_code": "wheat", "chance": 1.0, "qty_min": 1, "qty_max": 3}] },
  { "code": "plant_corn", "name": "Jagung", "description": "Tumbuh tinggi dengan tongkol kuning. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "farmable", "locations": [], "harvest_time": 10, "loot_table": [{"item_code": "corn", "chance": 1.0, "qty_min": 1, "qty_max": 2}] },
  { "code": "plant_potato", "name": "Kentang", "description": "Umbi-umbian penangkal lapar. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "farmable", "locations": [], "harvest_time": 15, "loot_table": [{"item_code": "potato", "chance": 1.0, "qty_min": 1, "qty_max": 4}] },
  { "code": "plant_carrot", "name": "Wortel", "description": "Akar oranye kesukaan kelinci. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "farmable", "locations": [], "harvest_time": 15, "loot_table": [{"item_code": "carrot", "chance": 1.0, "qty_min": 1, "qty_max": 3}] },
  { "code": "plant_tomato", "name": "Tomat", "description": "Buah berair berwarna merah cerah. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "farmable", "locations": [], "harvest_time": 10, "loot_table": [{"item_code": "tomato", "chance": 1.0, "qty_min": 1, "qty_max": 3}] },
  { "code": "plant_cabbage", "name": "Kubis", "description": "Sayuran bulat berlapis daun tebal. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "farmable", "locations": [], "harvest_time": 20, "loot_table": [{"item_code": "cabbage", "chance": 1.0, "qty_min": 1, "qty_max": 1}] },
  { "code": "plant_garlic", "name": "Bawang Putih", "description": "Umbi dengan aroma tajam pengusir kejahatan. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "farmable", "locations": [], "harvest_time": 20, "loot_table": [{"item_code": "garlic", "chance": 1.0, "qty_min": 1, "qty_max": 2}] },
  { "code": "plant_onion", "name": "Bawang Merah", "description": "Membuat matamu berair saat mengirisnya. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "farmable", "locations": [], "harvest_time": 20, "loot_table": [{"item_code": "onion", "chance": 1.0, "qty_min": 1, "qty_max": 2}] },
  { "code": "plant_rice", "name": "Padi", "description": "Membutuhkan banyak air untuk tumbuh subur. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "farmable", "locations": [], "harvest_time": 30, "loot_table": [{"item_code": "rice", "chance": 1.0, "qty_min": 2, "qty_max": 5}] },
  { "code": "plant_soybean", "name": "Kacang Kedelai", "description": "Kacang ajaib sumber protein nabati. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "farmable", "locations": [], "harvest_time": 25, "loot_table": [{"item_code": "soybean", "chance": 1.0, "qty_min": 1, "qty_max": 4}] },
  { "code": "plant_strawberry", "name": "Stroberi", "description": "Buah merah mungil yang manis asam. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "farmable", "locations": [], "harvest_time": 30, "loot_table": [{"item_code": "strawberry", "chance": 1.0, "qty_min": 1, "qty_max": 3}] },
  { "code": "plant_watermelon", "name": "Semangka", "description": "Buah raksasa berair manis merona. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "farmable", "locations": [], "harvest_time": 60, "loot_table": [{"item_code": "watermelon", "chance": 1.0, "qty_min": 1, "qty_max": 1}] },
  { "code": "plant_apple_tree", "name": "Pohon Apel", "description": "Pohon rindang berbuah merah. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "farmable", "locations": [], "harvest_time": 60, "loot_table": [{"item_code": "apple", "chance": 1.0, "qty_min": 1, "qty_max": 4}] },
  { "code": "plant_orange_tree", "name": "Pohon Jeruk", "description": "Pohon berdaun wangi berbuah oranye cerah. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "farmable", "locations": [], "harvest_time": 60, "loot_table": [{"item_code": "orange", "chance": 1.0, "qty_min": 1, "qty_max": 4}] },
  { "code": "plant_grape_vine", "name": "Pohon Anggur", "description": "Tanaman merambat dengan gugusan ungu. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "farmable", "locations": [], "harvest_time": 45, "loot_table": [{"item_code": "grape", "chance": 1.0, "qty_min": 1, "qty_max": 3}] },

  // Wild (Foraging)
  { "code": "wild_heal_weed", "name": "Rumput Penyembuh", "description": "Rumput ajaib penghenti pendarahan. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "wild", "locations": ["Eldwood"], "harvest_time": 0, "loot_table": [{"item_code": "heal_leaf", "chance": 0.8, "qty_min": 1, "qty_max": 2}] },
  { "code": "wild_mint", "name": "Daun Mint", "description": "Tumbuh di dekat genangan air hutan. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "wild", "locations": ["Eldwood"], "harvest_time": 0, "loot_table": [{"item_code": "mint_leaf", "chance": 0.9, "qty_min": 1, "qty_max": 3}] },
  { "code": "wild_sunflower", "name": "Bunga Matahari Liar", "description": "Bunga kuning pencari sinar mentari. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "wild", "locations": ["Eldwood"], "harvest_time": 0, "loot_table": [{"item_code": "sunflower_seed", "chance": 0.7, "qty_min": 1, "qty_max": 5}] },
  { "code": "wild_ancient_ginseng", "name": "Ginseng Kuno", "description": "Akar mistis yang menyerap energi ribuan tahun. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "wild", "locations": ["Eldwood"], "harvest_time": 0, "loot_table": [{"item_code": "ginseng_root", "chance": 0.3, "qty_min": 1, "qty_max": 1}] },
  { "code": "wild_brown_mushroom", "name": "Jamur Cokelat", "description": "Jamur aman konsumsi yang tumbuh di kayu lapuk. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "wild", "locations": ["Murkwood"], "harvest_time": 0, "loot_table": [{"item_code": "brown_mushroom", "chance": 1.0, "qty_min": 1, "qty_max": 3}] },
  { "code": "wild_poison_mushroom", "name": "Jamur Beracun", "description": "Jamur cerah ungu penebar spora mematikan. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "wild", "locations": ["Murkwood"], "harvest_time": 0, "loot_table": [{"item_code": "poison_spore", "chance": 0.6, "qty_min": 1, "qty_max": 2}] },
  { "code": "wild_bitter_root", "name": "Akar Pahit", "description": "Akar tumbuhan rawa yang rasanya tak karuan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "wild", "locations": ["Murkwood"], "harvest_time": 0, "loot_table": [{"item_code": "bitter_root", "chance": 0.7, "qty_min": 1, "qty_max": 2}] },
  { "code": "wild_glow_mushroom", "name": "Jamur Cahaya", "description": "Menerangi dinding gua yang gelap gulita. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "wild", "locations": ["Deepstone"], "harvest_time": 0, "loot_table": [{"item_code": "glow_mushroom", "chance": 0.5, "qty_min": 1, "qty_max": 2}] },
  { "code": "wild_cave_moss", "name": "Lumut Gua", "description": "Lumut lembab penampung air. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "wild", "locations": ["Deepstone"], "harvest_time": 0, "loot_table": [{"item_code": "cave_moss", "chance": 0.9, "qty_min": 1, "qty_max": 4}] },
  { "code": "wild_cactus", "name": "Pohon Kaktus", "description": "Berduri dan penyimpan banyak cadangan air. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "wild", "locations": ["Ignis"], "harvest_time": 0, "loot_table": [{"item_code": "cactus_meat", "chance": 0.7, "qty_min": 1, "qty_max": 2}] },
  { "code": "wild_fire_lotus", "name": "Teratai Api", "description": "Mekar di tengah lahar panas. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "wild", "locations": ["Ignis"], "harvest_time": 0, "loot_table": [{"item_code": "fire_lotus_seed", "chance": 0.2, "qty_min": 1, "qty_max": 1}] },
  { "code": "wild_iron_bamboo", "name": "Bambu Besi", "description": "Tunas bambu yang sekeras baja tempaan. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "wild", "locations": ["Drakoria"], "harvest_time": 0, "loot_table": [{"item_code": "iron_bamboo_shoot", "chance": 0.4, "qty_min": 1, "qty_max": 1}] },
  { "code": "wild_frost_flower", "name": "Bunga Es", "description": "Tak pernah layu meski suhunya di bawah nol. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "wild", "locations": ["Frostholm"], "harvest_time": 0, "loot_table": [{"item_code": "frost_petal", "chance": 0.4, "qty_min": 1, "qty_max": 3}] },
  { "code": "wild_sky_sprout", "name": "Tunas Langit", "description": "Hanya tumbuh di ketinggian awan. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "wild", "locations": ["Celestia"], "harvest_time": 0, "loot_table": [{"item_code": "sky_leaf", "chance": 0.2, "qty_min": 1, "qty_max": 2}] },
  { "code": "wild_black_rose", "name": "Bunga Mawar Hitam", "description": "Bunga lambang duka cita dari jurang kegelapan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "wild", "locations": ["Abyssia"], "harvest_time": 0, "loot_table": [{"item_code": "black_rose_petal", "chance": 0.2, "qty_min": 1, "qty_max": 1}] }
];

export const WORLD_ITEMS = [
  {
    "code": "pet_baby_dragon", "name": "Ignis", "description": "Seekor bayi naga merah muda. Menambah stat bertarungmu. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "pet", "rarity": "epic", "equip_slot": "pet", "buy_price": null, "sell_price": 5000, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1,
    "metadata": { "stats": { "attack": 25, "max_hp": 50 } }
  },
  {
    "code": "pet_white_wolf", "name": "Frostfang", "description": "Anak serigala salju yang lincah. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "pet", "rarity": "epic", "equip_slot": "pet", "buy_price": null, "sell_price": 5000, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1,
    "metadata": { "stats": { "attack": 15, "speed": 20 } }
  },
  {
    "code": "pet_chocobo", "name": "Zephyr", "description": "Burung pelari cepat berbulu kuning. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "pet", "rarity": "epic", "equip_slot": "pet", "buy_price": null, "sell_price": 5000, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1,
    "metadata": { "stats": { "speed": 35, "max_hp": 20 } }
  },
  {
    "code": "pet_slime", "name": "Rimuru", "description": "Slime biru kenyal yang bisa menyerap serangan. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "pet", "rarity": "epic", "equip_slot": "pet", "buy_price": null, "sell_price": 5000, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1,
    "metadata": { "stats": { "max_hp": 100, "defense": 10 } }
  },
  {
    "code": "pet_eagle", "name": "Aquila", "description": "Elang pengintai bermata tajam. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "pet", "rarity": "epic", "equip_slot": "pet", "buy_price": null, "sell_price": 5000, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1,
    "metadata": { "stats": { "speed": 15, "attack": 10, "max_mp": 30 } }
  },
  {
    "code": "pet_phoenix", "name": "Fawkes", "description": "Burung api legendaris. Regen 5% HP tiap putaran pertarungan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "pet", "rarity": "mythic", "equip_slot": "pet", "buy_price": null, "sell_price": 50000, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1,
    "metadata": { "stats": { "max_hp": 150, "attack": 50 }, "passive": "regen" }
  },
  {
    "code": "pet_golden_slime", "name": "Kinko", "description": "Slime langka terbuat dari emas murni. +30% bonus Aester. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "pet", "rarity": "mythic", "equip_slot": "pet", "buy_price": null, "sell_price": 50000, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1,
    "metadata": { "stats": { "defense": 50, "speed": 10 }, "passive": "gold" }
  },
  {
    "code": "pet_fairy", "name": "Navi", "description": "Peri hutan kecil yang berisik. Peluang 15% menggandakan hasil gather/farm. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "pet", "rarity": "mythic", "equip_slot": "pet", "buy_price": null, "sell_price": 50000, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1,
    "metadata": { "stats": { "max_mp": 100, "speed": 50 }, "passive": "lucky" }
  },
  {
    "code": "small_backpack", "name": "Ransel Kulit Kecil", "description": "Tas sederhana dari kulit hewan. Menambah +30 kapasitas barang bawaan. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "equipment", "rarity": "common", "equip_slot": "bag", "buy_price": 500, "sell_price": 100, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 2,
    "metadata": { "stats": {}, "capacity_bonus": 30, "crafting": { "materials": { "leather": 10, "string": 5 } } }
  },
  {
    "code": "medium_backpack", "name": "Ransel Petualang", "description": "Tas tebal yang tahan lama. Menambah +60 kapasitas barang bawaan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "equipment", "rarity": "uncommon", "equip_slot": "bag", "buy_price": 2000, "sell_price": 500, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 3,
    "metadata": { "stats": {}, "capacity_bonus": 60, "crafting": { "materials": { "leather": 25, "iron_ore": 5, "string": 10 } } }
  },
  {
    "code": "large_backpack", "name": "Ransel Ekspedisi Besar", "description": "Tas yang dirancang khusus untuk membawa beban luar biasa. Menambah +100 kapasitas barang bawaan.", "image": "",
    "category": "equipment", "rarity": "rare", "equip_slot": "bag", "buy_price": 10000, "sell_price": 2500, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 5,
    "metadata": { "stats": {}, "capacity_bonus": 100, "crafting": { "materials": { "leather": 50, "gold_ore": 5, "string": 20 } } }
  },
  {
    "code": "thief_ring", "name": "Cincin Bayangan", "description": "Aksesoris mistis yang meredam suara langkahmu. Meningkatkan peluang curi 15% dan perlindungan copet 15%.", "image": "",
    "category": "equipment", "rarity": "rare", "equip_slot": "accessory", "buy_price": 15000, "sell_price": 3000, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 1,
    "metadata": { "stats": { "speed": 10 }, "passive": "stealth" }
  },
  {
    "code": "rice",
    "name": "Beras",
    "description": "Beras mentah dari rawa. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 10,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wheat",
    "name": "Gandum",
    "description": "Seikat gandum yang dipanen dari hutan. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 12,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "carrot",
    "name": "Wortel",
    "description": "Wortel segar dari tanah subur. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 20,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "potato",
    "name": "Kentang",
    "description": "Ubi-ubian yang mengenyangkan. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 22,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 4,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "tomato",
    "name": "Tomat",
    "description": "Buah merah berair dengan rasa asam manis. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 25,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "corn",
    "name": "Jagung",
    "description": "Tongkol jagung yang manis. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 30,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 5,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "apple",
    "name": "Apel",
    "description": "Buah apel yang manis dan renyah. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 35,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "banana",
    "name": "Pisang",
    "description": "Pisang manis yang tumbuh di iklim hangat. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 30,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 4,
    "metadata": {
      "locations": [
        "Eldwood",
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "strawberry",
    "name": "Stroberi",
    "description": "Buah beri merah yang langka dan manis. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 80,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "grape",
    "name": "Anggur",
    "description": "Sekelompok anggur yang tumbuh di tanaman merambat. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 90,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "chili",
    "name": "Cabai",
    "description": "Cabai pedas yang memberikan sensasi panas. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 100,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wood",
    "name": "Kayu",
    "description": "Batang kayu dari pohon-pohon di hutan. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 25,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 10,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "herb",
    "name": "Herba",
    "description": "Tumbuhan herbal dengan aroma kuat, bahan dasar ramuan. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 45,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "pork",
    "name": "Daging Babi Hutan",
    "description": "Daging babi hutan yang dapat dimasak. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 60,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 6,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "goblin_ear",
    "name": "Telinga Goblin",
    "description": "Telinga goblin sebagai bukti kemenangan. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 30,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Eldwood",
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wild_berries",
    "name": "Beri Liar",
    "description": "Sekumpulan beri manis yang tumbuh liar di semak-semak. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 20,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "leather",
    "name": "Kulit Hewan",
    "description": "Kulit hewan yang telah disamak. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 120,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 5,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "spider_silk",
    "name": "Sutera Laba-laba",
    "description": "Benang sutra dari sarang laba-laba raksasa. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 180,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Eldwood",
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wolf_pelt",
    "name": "Kulit Serigala",
    "description": "Kulit tebal dari serigala hutan, lebih kuat dari kulit biasa. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 250,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 7,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "moonpetal",
    "name": "Kelopak Bulan",
    "description": "Kelopak bunga langka yang hanya mekar di bawah sinar rembulan. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 750,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "minotaur_horn",
    "name": "Tanduk Minotaur",
    "description": "Tanduk besar dari minotaur. Bahan langka untuk senjata kuat. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 800,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 8,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "ancient_bark",
    "name": "Kulit Kayu Kuno",
    "description": "Kulit kayu dari pohon purba yang memiliki sifat magis. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 1200,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 12,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "treant_sap",
    "name": "Getah Treant",
    "description": "Getah kental dari Treant kuno yang dapat meregenerasi kayu. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 7000,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Eldwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "stone",
    "name": "Batu",
    "description": "Batu biasa yang dapat ditemukan di mana saja. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 15,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 8,
    "metadata": {
      "locations": [
        "Deepstone",
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "coal",
    "name": "Batu Bara",
    "description": "Mineral hitam yang mudah terbakar. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 40,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 7,
    "metadata": {
      "locations": [
        "Deepstone",
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "bat_wing",
    "name": "Sayap Kelelawar",
    "description": "Sayap tipis dari kelelawar gua. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 25,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "slime_gel",
    "name": "Gel Slime",
    "description": "Cairan lengket dari slime. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 20,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "locations": [
        "Murkwood",
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "iron_ore",
    "name": "Bijih Besi",
    "description": "Bijih besi kasar, sumber utama untuk perlengkapan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 150,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 12,
    "metadata": {
      "locations": [
        "Deepstone",
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "glowing_mushroom",
    "name": "Jamur Bercahaya",
    "description": "Jamur langka yang memancarkan cahaya lembut. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 120,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Deepstone",
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "amethyst",
    "name": "Kecubung",
    "description": "Permata ungu yang indah, sering digunakan dalam sihir. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 300,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "silver_ore",
    "name": "Bijih Perak",
    "description": "Bijih perak yang bersinar, efektif melawan monster kegelapan. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 900,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 15,
    "metadata": {
      "locations": [
        "Drakoria",
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "golem_core",
    "name": "Inti Golem",
    "description": "Inti kekuatan yang menggerakkan golem. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 1500,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 20,
    "metadata": {
      "locations": [
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "ruby",
    "name": "Ruby",
    "description": "Permata merah menyala yang menyimpan energi api. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 2200,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "locations": [
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "gold_ore",
    "name": "Bijih Emas",
    "description": "Bijih emas murni yang sangat berharga. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "material",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 2500,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 18,
    "metadata": {
      "locations": [
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "shadow_crystal",
    "name": "Kristal Bayangan",
    "description": "Kristal gelap yang menyerap cahaya, bahan untuk sihir ilusi. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 8000,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 4,
    "metadata": {
      "locations": [
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "mythril_ore",
    "name": "Bijih Mythril",
    "description": "Bijih legendaris yang sangat ringan namun lebih kuat dari baja. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "material",
    "rarity": "legendary",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 15000,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 25,
    "metadata": {
      "locations": [
        "Deepstone",
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "feathers",
    "name": "Bulu Kasar",
    "description": "Bulu dari burung gunung biasa. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 35,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "copper_ore",
    "name": "Bijih Tembaga",
    "description": "Bijih logam yang paling umum, mudah ditemukan. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 50,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 9,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "mountain_flower",
    "name": "Bunga Gunung",
    "description": "Bunga langka yang tumbuh di ketinggian. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 60,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "harpy_feather",
    "name": "Bulu Harpy",
    "description": "Bulu dari monster harpy yang berbahaya. Ringan dan kuat. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 150,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "obsidian",
    "name": "Obsidian",
    "description": "Batuan vulkanik hitam yang tajam seperti kaca. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 350,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 10,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wyvern_egg",
    "name": "Telur Wyvern",
    "description": "Telur Wyvern yang belum menetas, sangat berharga bagi kolektor. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 2500,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 15,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "sapphire",
    "name": "Safir",
    "description": "Permata biru yang melambangkan kebijaksanaan. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 2000,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "griffin_claw",
    "name": "Cakar Griffin",
    "description": "Cakar tajam dari seekor Griffin. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "material",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 4500,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 5,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "adamantite_ore",
    "name": "Bijih Adamantite",
    "description": "Bijih langka yang sangat berat dan kuat, hanya ditemukan di pegunungan terjal. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "legendary",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 35000,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 30,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "dragon_scale",
    "name": "Sisik Naga",
    "description": "Sisik keras dari naga purba. Sangat tahan api dan sihir. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "legendary",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 30000,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 15,
    "metadata": {
      "locations": [
        "Drakoria"
      ],
      "source": "gather"
    }
  },
  {
    "code": "reeds",
    "name": "Alang-alang Rawa",
    "description": "Batang alang-alang yang tinggi dan kuat dari rawa. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 10,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "common_fish",
    "name": "Ikan Biasa",
    "description": "Ikan kecil yang umum di rawa. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 40,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 4,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "swamp_gas_vial",
    "name": "Gas Rawa Botolan",
    "description": "Gas metana dari rawa yang ditangkap dalam botol. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 50,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "serpent_eel",
    "name": "Belut Ular",
    "description": "Belut air tawar yang panjang dan licin. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 200,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 5,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "leech_blood",
    "name": "Darah Lintah",
    "description": "Darah yang dihisap oleh lintah rawa, digunakan dalam ramuan aneh. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 100,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "giant_frog_leg",
    "name": "Paha Katak Raksasa",
    "description": "Paha berotot dari katak rawa raksasa, bahan masakan eksotis. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 220,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 6,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "monster_fang",
    "name": "Taring Monster",
    "description": "Taring tajam dari monster. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 600,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Murkwood",
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "will_o_wisp",
    "name": "Esensi Will-o-Wisp",
    "description": "Cahaya hantu yang ditangkap dari rawa, sumber energi sihir. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "material",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 1500,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "hydra_scale",
    "name": "Sisik Hydra",
    "description": "Sisik basah dan tebal dari Hydra yang legendaris. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "material",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 6000,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 4,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "black_lotus",
    "name": "Teratai Hitam",
    "description": "Bunga teratai yang sangat langka, bahan utama untuk ramuan kuat. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "material",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 9000,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "old_boot",
    "name": "Sepatu Bot Tua",
    "description": "Sepatu bot kulit yang sudah usang dan berlubang. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "misc",
    "rarity": "trash",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 1,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 4,
    "metadata": {
      "locations": [
        "Murkwood",
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "rusty_can",
    "name": "Kaleng Berkarat",
    "description": "Kaleng berkarat yang dibuang ke perairan. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "misc",
    "rarity": "trash",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 5,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "locations": [
        "Murkwood",
        "Deepstone"
      ],
      "source": "gather"
    }
  },
  {
    "code": "bottle_message",
    "name": "Pesan dalam Botol",
    "description": "Sebuah botol dengan gulungan kertas di dalamnya. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "misc",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 100,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "locations": [
        "Murkwood"
      ],
      "source": "gather"
    }
  },
  {
    "code": "diamon_sword",
    "name": "Pedang Berlian",
    "description": "Pedang Berlian bukanlah senjata yang ditempa di api biasa. Legenda mengatakan pedang ini ditempa dari pecahan meteorit yang jatuh di lembah terlarang, lalu dipadukan dengan debu intan yang hanya muncul sekali setiap seribu tahun.", "image": "",
    "category": "weapon",
    "rarity": "epic",
    "equip_slot": "weapon",
    "buy_price": 2000,
    "sell_price": 0,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 0,
    "weight": 15,
    "metadata": {
      "upgrade": {
        "maxLevel": 12,
        "cost": [{"level":2,"aester":2000,"materials":{"adamantite_ore":2,"copper_ore":1}},{"level":3,"aester":4000,"materials":{"adamantite_ore":2,"mythril_ore":1}},{"level":4,"aester":6000,"materials":{"adamantite_ore":3,"fairy_tear":1}},{"level":5,"aester":8000,"materials":{"adamantite_ore":3}},{"level":6,"aester":10000,"materials":{"adamantite_ore":4}},{"level":7,"aester":12000,"materials":{"adamantite_ore":4,"golem_core":1}},{"level":8,"aester":14000,"materials":{"adamantite_ore":5,"golem_core":2}},{"level":9,"aester":16000,"materials":{"adamantite_ore":5,"golem_core":2}},{"level":10,"aester":18000,"materials":{"adamantite_ore":6,"golem_core":3}},{"level":11,"aester":20000,"materials":{"adamantite_ore":6,"golem_core":3}},{"level":12,"aester":22000,"materials":{"adamantite_ore":7,"golem_core":4}}],
        "statGrowth": {
          "attack": 10
        }
      },
      "stats": {
        "attack": 18
      },
      "crafting": {
        "cost": 2000,
        "materials": {
          "diamond": 10
        },
        "levelRequirement": 10
      }
    }
  },
  {
    "code": "flour",
    "name": "Tepung",
    "description": "Tepung halus dari gandum. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 50,
    "sell_price": 10,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "crafting": {
        "cost": 10,
        "materials": {
          "wheat": 2
        }
      }
    }
  },
  {
    "code": "sugar",
    "name": "Gula",
    "description": "Gula dari buah manis. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 60,
    "sell_price": 15,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "crafting": {
        "cost": 15,
        "materials": {
          "apple": 2
        }
      }
    }
  },
  {
    "code": "iron_ingot",
    "name": "Batang Besi",
    "description": "Batangan besi hasil peleburan. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 400,
    "sell_price": 50,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 15,
    "metadata": {
      "crafting": {
        "cost": 50,
        "materials": {
          "iron_ore": 2,
          "coal": 1
        }
      }
    }
  },
  {
    "code": "hardened_leather",
    "name": "Kulit Keras",
    "description": "Kulit hewan yang diolah. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 300,
    "sell_price": 25,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 7,
    "metadata": {
      "crafting": {
        "cost": 25,
        "materials": {
          "leather": 2
        }
      }
    }
  },
  {
    "code": "mana_dust",
    "name": "Debu Mana",
    "description": "Bubuk kristal penyimpan energi sihir. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 250,
    "sell_price": 100,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "cost": 100,
        "materials": {
          "quartz": 2,
          "glowing_mushroom": 1
        }
      }
    }
  },
  {
    "code": "potion",
    "name": "Potion",
    "description": "Ramuan penyembuhan dasar. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 250,
    "sell_price": 100,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "cost": 100,
        "materials": {
          "herb": 2,
          "slime_gel": 1
        }
      },
      "effect_note": "Memulihkan 50 HP."
    }
  },
  {
    "code": "potion_of_swiftness",
    "name": "Potion of Swiftness",
    "description": "Meningkatkan Speed sebesar 25% selama 5 menit. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 700,
    "sell_price": 350,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "cost": 350,
        "materials": {
          "herb": 3,
          "bat_wing": 2,
          "slime_gel": 1
        },
        "levelRequirement": 10
      },
      "effect_note": "+25% Speed selama 5 menit."
    }
  },
  {
    "code": "potion_of_strength",
    "name": "Potion of Strength",
    "description": "Meningkatkan Attack sebesar 20% selama 3 menit. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 850,
    "sell_price": 500,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "cost": 500,
        "materials": {
          "bloodthistle": 2,
          "monster_fang": 1
        },
        "levelRequirement": 15
      },
      "effect_note": "+20% Attack selama 3 menit."
    }
  },
  {
    "code": "thread",
    "name": "Benang",
    "description": "Benang kuat yang dipintal dari wol. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 120,
    "sell_price": 20,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "cost": 20,
        "materials": {
          "wool": 2
        }
      }
    }
  },
  {
    "code": "wool",
    "name": "Wol Domba Liar",
    "description": "Wol dari domba liar, dapat dipintal menjadi benang. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 50,
    "sell_price": 50,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "locations": [
        "Eldwood",
        "Drakoria"
      ]
    }
  },
  {
    "code": "bread",
    "name": "Roti",
    "description": "Roti hangat yang mengenyangkan. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 100,
    "sell_price": 20,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "crafting": {
        "cost": 20,
        "materials": {
          "flour": 2
        }
      },
      "effect_note": "Memulihkan 5 HP."
    }
  },
  {
    "code": "steak",
    "name": "Steak",
    "description": "Potongan daging yang dipanggang. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 300,
    "sell_price": 50,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 5,
    "metadata": {
      "crafting": {
        "cost": 50,
        "materials": {
          "pork": 1,
          "wood": 1
        },
        "levelRequirement": 12
      },
      "effect_note": "Memulihkan 7 HP."
    }
  },
  {
    "code": "warm_carrot_soup",
    "name": "Sup Wortel Hangat",
    "description": "Regenerasi HP pasif di luar pertarungan selama 30 menit. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 300,
    "sell_price": 150,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 3,
    "metadata": {
      "crafting": {
        "cost": 150,
        "materials": {
          "carrot": 5,
          "potato": 3,
          "herb": 2
        },
        "levelRequirement": 8
      },
      "effect_note": "Regenerasi HP pasif selama 30 menit."
    }
  },
  {
    "code": "spicy_stir_fry",
    "name": "Tumis Daging Pedas",
    "description": "Meningkatkan peluang critical hit sebesar 5% selama 20 menit. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 600,
    "sell_price": 300,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 4,
    "metadata": {
      "crafting": {
        "cost": 300,
        "materials": {
          "pork": 2,
          "chili": 3,
          "corn": 2
        },
        "levelRequirement": 18
      },
      "effect_note": "+5% Critical Hit selama 20 menit."
    }
  },
  {
    "code": "wooden_sword",
    "name": "Pedang Kayu",
    "description": "Pedang dasar dari kayu. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "weapon",
    "rarity": "common",
    "equip_slot": "weapon",
    "buy_price": 2500,
    "sell_price": 1000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 10,
    "metadata": {
      "upgrade": {
        "maxLevel": 5,
        "cost": [
          {
            "level": 2,
            "aester": 100,
            "materials": {
              "iron_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 200,
            "materials": {
              "iron_ore": 2,
              "leather": 1
            }
          },
          {
            "level": 4,
            "aester": 300,
            "materials": {
              "iron_ore": 3,
              "leather": 2
            }
          },
          {
            "level": 5,
            "aester": 400,
            "materials": {
              "iron_ore": 3,
              "leather": 2
            }
          }
        ],
        "statGrowth": {
          "attack": 2
        }
      },
      "stats": {
        "attack": 3
      },
      "crafting": {
        "cost": 1000,
        "materials": {
          "wood": 20,
          "leather": 2
        }
      }
    }
  },
  {
    "code": "leather_armor",
    "name": "Armor Kulit",
    "description": "Armor ringan dari kulit keras. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "armor",
    "rarity": "uncommon",
    "equip_slot": "body",
    "buy_price": 10000,
    "sell_price": 4000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 18,
    "metadata": {
      "upgrade": {
        "maxLevel": 7,
        "cost": [
          {
            "level": 2,
            "aester": 300,
            "materials": {
              "iron_ingot": 2
            }
          },
          {
            "level": 3,
            "aester": 600,
            "materials": {
              "iron_ingot": 2
            }
          },
          {
            "level": 4,
            "aester": 900,
            "materials": {
              "iron_ingot": 3,
              "wolf_pelt": 1
            }
          },
          {
            "level": 5,
            "aester": 1200,
            "materials": {
              "iron_ingot": 3,
              "wolf_pelt": 2
            }
          },
          {
            "level": 6,
            "aester": 1500,
            "materials": {
              "iron_ingot": 4,
              "wolf_pelt": 2
            }
          },
          {
            "level": 7,
            "aester": 1800,
            "materials": {
              "iron_ingot": 4,
              "wolf_pelt": 3
            }
          }
        ],
        "statGrowth": {
          "defense": 4
        }
      },
      "stats": {
        "defense": 5
      },
      "crafting": {
        "cost": 4000,
        "materials": {
          "hardened_leather": 8,
          "thread": 10,
          "monster_fang": 1
        }
      }
    }
  },
  {
    "code": "spotted_egg",
    "name": "Telur Berbintik",
    "description": "Sebuah telur hangat dengan corak bintik-bintik. Sepertinya akan segera menetas. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "quest",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 0,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 0,
    "weight": 10,
    "metadata": {}
  },
  {
    "code": "crystal_egg",
    "name": "Telur Kristal",
    "description": "Telur yang transparan seperti kristal, memancarkan cahaya redup dari dalamnya. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "quest",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 0,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 0,
    "weight": 10,
    "metadata": {}
  },
  {
    "code": "scaled_egg",
    "name": "Telur Bersisik",
    "description": "Telur dengan cangkang keras seperti sisik reptil. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "quest",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 0,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 0,
    "weight": 10,
    "metadata": {}
  },
  {
    "code": "abyssal_pearl", "name": "Mutiara Abyss", "description": "Mutiara bercahaya biru pekat dari lautan dalam. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 250, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2,
    "metadata": { "locations": ["Abyssia"], "source": "gather" }
  },
  {
    "code": "deep_sea_kelp", "name": "Rumput Laut Dalam", "description": "Tanaman kuat yang tumbuh tanpa cahaya matahari. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 80, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1,
    "metadata": { "locations": ["Abyssia"], "source": "gather" }
  },
  {
    "code": "coral_branch", "name": "Cabang Terumbu", "description": "Terumbu karang tajam dengan warna-warni memudar. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 95, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 3,
    "metadata": { "locations": ["Abyssia"], "source": "gather" }
  },
  {
    "code": "abyssal_scale", "name": "Sisik Abyssal", "description": "Sisik kuat dari monster laut dalam. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 400, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 4,
    "metadata": { "locations": ["Abyssia"], "source": "gather" }
  },
  {
    "code": "sunken_coin", "name": "Koin Tenggelam", "description": "Koin dari peradaban kuno yang hilang ditelan lautan. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "misc", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 350, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1,
    "metadata": { "locations": ["Abyssia", "Murkwood"], "source": "gather" }
  },
  {
    "code": "mysterious_egg", "name": "Telur Misterius", "description": "Telur aneh bersinar redup yang didapat dari berburu. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "misc", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 500, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 5,
    "metadata": { "locations": [], "source": "hunt" }
  },
  {
    "code": "frost_crystal", "name": "Kristal Beku", "description": "Kristal es yang tidak akan pernah mencair. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 300, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2,
    "metadata": { "locations": ["Frostholm"], "source": "gather" }
  },
  {
    "code": "ice_melon", "name": "Melon Es", "description": "Buah langka yang tumbuh di atas bongkahan salju. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 120, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 3,
    "metadata": { "locations": ["Frostholm"], "source": "gather" }
  },
  {
    "code": "yeti_fur", "name": "Bulu Yeti", "description": "Bulu sangat tebal dan hangat untuk pelindung cuaca. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 150, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 5,
    "metadata": { "locations": ["Frostholm"], "source": "gather" }
  },
  {
    "code": "glacial_shard", "name": "Pecahan Glasial", "description": "Bagian tajam dari inti gletser raksasa. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 450, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 3,
    "metadata": { "locations": ["Frostholm"], "source": "gather" }
  },
  {
    "code": "frozen_tear", "name": "Air Mata Beku", "description": "Tetusan embun yang langsung membeku karena aura sihir es. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "misc", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 280, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1,
    "metadata": { "locations": ["Frostholm", "Celestia"], "source": "gather" }
  },
  {
    "code": "lava_rock", "name": "Batu Lahar", "description": "Batu yang masih memancarkan hawa panas mengerikan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 180, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 4,
    "metadata": { "locations": ["Ignis"], "source": "gather" }
  },
  {
    "code": "fire_blossom", "name": "Bunga Api", "description": "Bunga yang kelopaknya terbuat dari api abadi. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 320, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1,
    "metadata": { "locations": ["Ignis"], "source": "gather" }
  },
  {
    "code": "obsidian_shard", "name": "Pecahan Obsidian", "description": "Kaca vulkanik sangat tajam dan kuat. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 500, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 3,
    "metadata": { "locations": ["Ignis"], "source": "gather" }
  },
  {
    "code": "ash_wood", "name": "Kayu Abu", "description": "Sisa kayu langka yang tahan terhadap lahar magma. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 140, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 4,
    "metadata": { "locations": ["Ignis"], "source": "gather" }
  },
  {
    "code": "dragon_scale_fragment", "name": "Serpihan Sisik Naga", "description": "Potongan kecil sisik dari makhluk mistis penunggu kawah. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "misc", "rarity": "legendary", "equip_slot": null, "buy_price": null, "sell_price": 1000, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2,
    "metadata": { "locations": ["Ignis", "Drakoria"], "source": "gather" }
  },
  {
    "code": "omni_stone", "name": "Batu Semesta", "description": "Batu unik yang bisa ditemukan di seluruh penjuru dunia. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 10, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 3,
    "metadata": { "locations": ["Eldwood", "Deepstone", "Drakoria", "Murkwood", "Celestia", "Abyssia", "Frostholm", "Ignis"], "source": "gather" }
  }

,
  // Livestock Items
  { "code": "chicken_egg", "name": "Telur Ayam", "description": "Telur segar bernutrisi. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "material", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 15, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Eldwood", "Murkwood"], "source": "livestock" } },
  { "code": "cow_milk", "name": "Susu Sapi", "description": "Susu murni yang kaya kalsium. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 20, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": ["Eldwood"], "source": "livestock" } },

  { "code": "duck_egg", "name": "Telur Bebek", "description": "Telur gurih berselaput tebal. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 25, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Murkwood", "Abyssia"], "source": "livestock" } },
  { "code": "rabbit_fur", "name": "Bulu Halus Kelinci", "description": "Bulu yang sangat lembut. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 40, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Eldwood", "Celestia"], "source": "livestock" } },
  { "code": "horse_hair", "name": "Rambut Kuda", "description": "Kuat untuk tali busur. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 45, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": ["Eldwood", "Celestia"], "source": "livestock" } },
  { "code": "beeswax", "name": "Lilin Lebah", "description": "Bahan baku lilin dan ramuan. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 50, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Eldwood", "Celestia", "Murkwood"], "source": "livestock" } },
  { "code": "turkey_meat", "name": "Daging Kalkun", "description": "Daging tebal porsi besar. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 45, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 3, "metadata": { "locations": ["Eldwood", "Deepstone"], "source": "livestock" } },
  { "code": "quail_egg", "name": "Telur Puyuh", "description": "Telur mini berkhasiat tinggi. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 60, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Eldwood", "Drakoria"], "source": "livestock" } },
  
  // Wild Items
  { "code": "venison", "name": "Daging Rusa", "description": "Daging rusa liar yang lezat. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 50, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": ["Eldwood"], "source": "hunt" } },
  { "code": "deer_antler", "name": "Tanduk Rusa", "description": "Tanduk keras pengobat luka. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 120, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 4, "metadata": { "locations": ["Eldwood"], "source": "hunt" } },
  { "code": "bear_pelt", "name": "Kulit Beruang", "description": "Pelindung hawa dingin terbaik. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 250, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 5, "metadata": { "locations": ["Eldwood", "Drakoria"], "source": "hunt" } },
  { "code": "snow_wolf_fang", "name": "Taring Serigala Salju", "description": "Taring yang membekukan darah. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 180, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": ["Frostholm"], "source": "hunt" } },
  { "code": "fire_fox_tail", "name": "Ekor Rubah Api", "description": "Ekor yang terus menyala hangat. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 300, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": ["Ignis"], "source": "hunt" } },
  { "code": "boar_spike", "name": "Duri Babi Hutan", "description": "Duri tajam tembus armor. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 150, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 3, "metadata": { "locations": ["Murkwood"], "source": "hunt" } },
  { "code": "owl_eye", "name": "Mata Burung Hantu", "description": "Bersinar dalam gelap. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 140, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Deepstone"], "source": "hunt" } },
  { "code": "lizard_scale", "name": "Sisik Kadal Tahan Api", "description": "Tahan suhu ekstrem. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 280, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 3, "metadata": { "locations": ["Ignis"], "source": "hunt" } },
  { "code": "seal_oil", "name": "Minyak Anjing Laut", "description": "Bahan bakar lentera abadi. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 160, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": ["Frostholm"], "source": "hunt" } },

  { "code": "mountain_lion_fang", "name": "Taring Singa Gunung", "description": "Simbol keberanian sejati. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 350, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": ["Drakoria"], "source": "hunt" } },
  
  // Mythical & Legendary Items
  { "code": "golden_dragon_egg", "name": "Telur Naga Emas", "description": "Telur naga legendaris bersisik emas asli. Berdenyut dengan energi kehidupan. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "misc", "rarity": "mythic", "equip_slot": null, "buy_price": null, "sell_price": 15000, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 10, "metadata": { "locations": ["Ignis"], "source": "hunt" } },
  { "code": "fairy_tear", "name": "Tetesan Air Mata Peri", "description": "Air mata kristal dari makhluk gaib hutan kuno. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "misc", "rarity": "mythic", "equip_slot": null, "buy_price": null, "sell_price": 12000, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Eldwood"], "source": "hunt" } },
  { "code": "leviathan_heart", "name": "Jantung Beku Leviathan", "description": "Organ dalam monster laut penguasa samudra yang tak pernah berdetak lagi. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "misc", "rarity": "mythic", "equip_slot": null, "buy_price": null, "sell_price": 20000, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 15, "metadata": { "locations": ["Abyssia"], "source": "hunt" } },
  { "code": "ancient_lightning_core", "name": "Inti Petir Kuno", "description": "Gumpalan energi murni yang menyambar tanpa henti. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "misc", "rarity": "legendary", "equip_slot": null, "buy_price": null, "sell_price": 8000, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 5, "metadata": { "locations": ["Celestia"], "source": "hunt" } },
  { "code": "beast_soul_gem", "name": "Permata Jiwa Binatang", "description": "Kristal penyerap nyawa yang kadang jatuh dari hewan liar level tinggi. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "misc", "rarity": "legendary", "equip_slot": null, "buy_price": null, "sell_price": 10000, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": ["Drakoria", "Frostholm", "Ignis", "Deepstone", "Murkwood", "Eldwood", "Abyssia", "Celestia"], "source": "hunt" } }
,
  // Farm Crops
  { "code": "cabbage", "name": "Kubis Hijau", "description": "Sayuran renyah berlapis. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "crop", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 18, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": [], "source": "farming" } },
  { "code": "garlic", "name": "Bawang Putih", "description": "Penyedap masakan yang kuat. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "crop", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 20, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": [], "source": "farming" } },
  { "code": "onion", "name": "Bawang Merah", "description": "Bumbu dasar masakan rumahan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "crop", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 20, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": [], "source": "farming" } },
  { "code": "soybean", "name": "Kedelai", "description": "Kacang penuh khasiat gizi. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "crop", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 12, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": [], "source": "farming" } },
  { "code": "watermelon", "name": "Buah Semangka", "description": "Penuh air untuk menyegarkan tenggorokan. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "crop", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 50, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 3, "metadata": { "locations": [], "source": "farming" } },
  { "code": "orange", "name": "Jeruk Manis", "description": "Kaya akan vitamin C. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "crop", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 35, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": [], "source": "farming" } },

  // Foraged Items (Wild)
  { "code": "heal_leaf", "name": "Daun Penyembuh", "description": "Bahan utama pembuatan Potion HP. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "material", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 10, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Eldwood"], "source": "forage" } },
  { "code": "mint_leaf", "name": "Daun Mint Segar", "description": "Daun yang menyejukkan kerongkongan. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "material", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 8, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Eldwood"], "source": "forage" } },
  { "code": "sunflower_seed", "name": "Biji Bunga Matahari", "description": "Cemilan ringan di perjalanan. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 15, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Eldwood"], "source": "forage" } },
  { "code": "ginseng_root", "name": "Akar Ginseng", "description": "Akar langka penambah kekuatan fisik permanen. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 150, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Eldwood"], "source": "forage" } },
  { "code": "brown_mushroom", "name": "Jamur Biasa", "description": "Bisa dimasak jadi sup hangat. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "material", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 12, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Murkwood"], "source": "forage" } },
  { "code": "poison_spore", "name": "Spora Beracun", "description": "Sangat mematikan jika terhirup langsung. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 30, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Murkwood"], "source": "forage" } },
  { "code": "bitter_root", "name": "Akar Pahit", "description": "Rasanya luar biasa tidak enak, namun bisa menangkal racun. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 25, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Murkwood"], "source": "forage" } },
  { "code": "glow_mushroom", "name": "Jamur Bercahaya", "description": "Memancarkan cahaya neon biru pudar. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 60, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Deepstone"], "source": "forage" } },
  { "code": "cave_moss", "name": "Lumut Lembab", "description": "Sering dipakai sebagai perban darurat. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 5, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Deepstone"], "source": "forage" } },
  { "code": "cactus_meat", "name": "Daging Kaktus Air", "description": "Penyelamat dehidrasi di tengah gurun. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 28, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Ignis"], "source": "forage" } },
  { "code": "fire_lotus_seed", "name": "Biji Teratai Api", "description": "Mengandung elemen api murni di dalamnya. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 350, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Ignis"], "source": "forage" } },
  { "code": "iron_bamboo_shoot", "name": "Rebung Bambu Besi", "description": "Bambu muda namun sekeras pelat baja. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 200, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": ["Drakoria"], "source": "forage" } },
  { "code": "frost_petal", "name": "Kelopak Bunga Es", "description": "Terasa seperti menggenggam kepingan salju yang tak pernah mencair. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 180, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Frostholm"], "source": "forage" } },
  { "code": "sky_leaf", "name": "Daun Langit", "description": "Daun tembus pandang yang memancarkan aura suci. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 400, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Celestia"], "source": "forage" } },
  { "code": "black_rose_petal", "name": "Kelopak Mawar Hitam", "description": "Kelopak bunga yang menguarkan energi kelam abyss. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "material", "rarity": "epic", "equip_slot": null, "buy_price": null, "sell_price": 500, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Abyssia"], "source": "forage" } },

  // -----------------------------------------
  // MISSING ITEMS (Bug Fix)
  // -----------------------------------------
  { "code": "beef", "name": "Daging Sapi", "description": "Potongan daging sapi segar. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "material", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 35, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": [], "source": "livestock" } },
  { "code": "duck_meat", "name": "Daging Bebek", "description": "Daging bebek mentah siap dimasak. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "material", "rarity": "common", "equip_slot": null, "buy_price": null, "sell_price": 30, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 2, "metadata": { "locations": [], "source": "livestock" } },
  { "code": "diamond", "name": "Berlian", "description": "Batu permata terkeras dan terlangka. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "material", "rarity": "legendary", "equip_slot": null, "buy_price": null, "sell_price": 5000, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Deepstone"], "source": "mining" } },
  { "code": "quartz", "name": "Kuarsa", "description": "Kristal putih bening penyimpan mana. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "material", "rarity": "uncommon", "equip_slot": null, "buy_price": null, "sell_price": 80, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Deepstone"], "source": "mining" } },
  { "code": "bloodthistle", "name": "Bunga Darah", "description": "Tanaman berduri berisi cairan merah pekat. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "material", "rarity": "rare", "equip_slot": null, "buy_price": null, "sell_price": 120, "stackable": 1, "max_stack": 999, "tradeable": 1, "weight": 1, "metadata": { "locations": ["Murkwood"], "source": "forage" } },

  // -----------------------------------------
  // NEW CRAFTING, COOKING & ALCHEMY EXPANSION
  // -----------------------------------------
  
  {
    "code": "wheat_bread",
    "name": "Roti Gandum",
    "description": "Roti panggang yang mengenyangkan. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 40,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 2,
        "cost": 10,
        "materials": {
          "wheat": 3
        }
      },
      "effect_note": "Memulihkan 30 HP dan 10 Stamina."
    }
  },
  {
    "code": "mushroom_soup",
    "name": "Sup Jamur",
    "description": "Sup kental penghangat badan. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 60,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 3,
        "cost": 15,
        "materials": {
          "brown_mushroom": 3,
          "onion": 1
        }
      },
      "effect_note": "Memulihkan 45 HP."
    }
  },
  {
    "code": "venison_roast",
    "name": "Bistik Rusa",
    "description": "Daging panggang yang menggugah selera. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 180,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "crafting": {
        "levelRequirement": 5,
        "cost": 40,
        "materials": {
          "venison": 2,
          "garlic": 1
        }
      },
      "effect_note": "Memulihkan 100 HP."
    }
  },
  {
    "code": "warm_milk",
    "name": "Susu Murni Panas",
    "description": "Minuman yang menenangkan pikiran. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 50,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 2,
        "cost": 10,
        "materials": {
          "cow_milk": 2
        }
      },
      "effect_note": "Memulihkan 25 Mana."
    }
  },
  {
    "code": "mushroom_omelet",
    "name": "Telur Dadar Jamur",
    "description": "Kudapan lezat di pagi hari. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 70,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 3,
        "cost": 15,
        "materials": {
          "chicken_egg": 2,
          "brown_mushroom": 1
        }
      },
      "effect_note": "Memulihkan 40 HP."
    }
  },
  {
    "code": "fairy_salad",
    "name": "Salad Buah Peri",
    "description": "Sangat segar dan menyehatkan. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 120,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 4,
        "cost": 25,
        "materials": {
          "apple": 1,
          "orange": 1,
          "strawberry": 1
        }
      },
      "effect_note": "Memulihkan 60 HP dan 40 Mana."
    }
  },
  {
    "code": "garlic_fried_rice",
    "name": "Nasi Goreng Bawang",
    "description": "Rempahnya terasa kuat. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 80,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 6,
        "cost": 30,
        "materials": {
          "rice": 2,
          "chicken_egg": 1,
          "garlic": 1
        }
      },
      "effect_note": "Memulihkan 80 HP."
    }
  },
  {
    "code": "blood_wine",
    "name": "Anggur Merah Darah",
    "description": "Minuman bangsawan berumur tua. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "consumable",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 300,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 10,
        "cost": 50,
        "materials": {
          "grape": 5
        }
      },
      "effect_note": "Memulihkan 150 Mana."
    }
  },
  {
    "code": "frost_watermelon",
    "name": "Es Semangka Murni",
    "description": "Membekukan rasa haus dalam seketika. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "consumable",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 250,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 5,
        "cost": 60,
        "materials": {
          "watermelon": 1,
          "frost_petal": 1
        }
      },
      "effect_note": "Memulihkan 120 Stamina."
    }
  },
  {
    "code": "orc_skewers",
    "name": "Sate Babi Orc",
    "description": "Porsi besar untuk petarung sejati. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 140,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "crafting": {
        "levelRequirement": 6,
        "cost": 30,
        "materials": {
          "pork": 3
        }
      },
      "effect_note": "Memulihkan 120 HP."
    }
  },
  {
    "code": "pure_soy_milk",
    "name": "Sari Kedelai Murni",
    "description": "Kaya protein untuk otot. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 50,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 4,
        "cost": 15,
        "materials": {
          "soybean": 3
        }
      },
      "effect_note": "Memulihkan 45 Stamina."
    }
  },
  {
    "code": "baked_potato",
    "name": "Kentang Panggang",
    "description": "Dibalut mentega gurih. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 60,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 4,
        "cost": 15,
        "materials": {
          "potato": 3,
          "cow_milk": 1
        }
      },
      "effect_note": "Memulihkan 50 HP."
    }
  },
  {
    "code": "corn_soup",
    "name": "Sup Jagung Manis",
    "description": "Kental dan manis. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 55,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 5,
        "cost": 20,
        "materials": {
          "corn": 2,
          "carrot": 1
        }
      },
      "effect_note": "Memulihkan 55 HP."
    }
  },
  {
    "code": "turkey_stew",
    "name": "Semur Kalkun",
    "description": "Kuahnya meresap hingga ke tulang. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "consumable",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 160,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "crafting": {
        "levelRequirement": 8,
        "cost": 45,
        "materials": {
          "turkey_meat": 2,
          "potato": 1,
          "tomato": 1
        }
      },
      "effect_note": "Memulihkan 150 HP."
    }
  },
  {
    "code": "honey_duck",
    "name": "Bebek Panggang Madu",
    "description": "Kulitnya renyah berlapis madu manis. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "consumable",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 180,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "crafting": {
        "levelRequirement": 10,
        "cost": 50,
        "materials": {
          "duck_meat": 2,
          "beeswax": 1
        }
      },
      "effect_note": "Memulihkan 160 HP."
    }
  },
  {
    "code": "harpy_eggs",
    "name": "Sate Telur Harpy",
    "description": "Telur puyuh utuh yang ditusuk. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 200,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 4,
        "cost": 30,
        "materials": {
          "quail_egg": 3
        }
      },
      "effect_note": "Memulihkan 80 Mana."
    }
  },
  {
    "code": "steamed_rice",
    "name": "Nasi Putih Kukus",
    "description": "Sederhana namun penting. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 25,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 2,
        "cost": 5,
        "materials": {
          "rice": 2
        }
      },
      "effect_note": "Memulihkan 20 HP."
    }
  },
  {
    "code": "clear_soup",
    "name": "Sup Sayur Bening",
    "description": "Sehat tanpa kalori berlebih. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 60,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 5,
        "cost": 20,
        "materials": {
          "cabbage": 1,
          "carrot": 1,
          "tomato": 1
        }
      },
      "effect_note": "Memulihkan 60 HP."
    }
  },
  {
    "code": "garlic_tempeh",
    "name": "Tempe Goreng Bawang",
    "description": "Kudapan merakyat super gurih. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 70,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 6,
        "cost": 25,
        "materials": {
          "soybean": 3,
          "garlic": 1
        }
      },
      "effect_note": "Memulihkan 70 HP."
    }
  },
  {
    "code": "spicy_beef_curry",
    "name": "Kari Sapi Pedas",
    "description": "Rempahnya membakar lidah. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "consumable",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 300,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 2,
    "metadata": {
      "crafting": {
        "levelRequirement": 12,
        "cost": 80,
        "materials": {
          "beef": 2,
          "potato": 1,
          "carrot": 1
        }
      },
      "effect_note": "Memulihkan 300 HP."
    }
  },
  {
    "code": "healing_potion",
    "name": "Potion Pemulih",
    "description": "Cairan hijau penyembuh luka ringan. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 150,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 5,
        "cost": 50,
        "materials": {
          "heal_leaf": 3,
          "mint_leaf": 1
        }
      },
      "effect_note": "Memulihkan 200 HP secara instan."
    }
  },
  {
    "code": "antidote_potion",
    "name": "Penawar Racun Pahit",
    "description": "Menyembuhkan segala jenis bisa dan racun mematikan. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "consumable",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 200,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 8,
        "cost": 75,
        "materials": {
          "bitter_root": 2,
          "mint_leaf": 2
        }
      },
      "effect_note": "Menghilangkan efek Poison."
    }
  },
  {
    "code": "fire_resist_essence",
    "name": "Esensi Tahan Panas",
    "description": "Membuat kulit tidak terbakar lahar. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "consumable",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 450,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 15,
        "cost": 150,
        "materials": {
          "fire_lotus_seed": 1,
          "cactus_meat": 2
        }
      },
      "effect_note": "Tahan serangan elemen Api selama 10 menit."
    }
  },
  {
    "code": "yggdrasil_elixir",
    "name": "Elixir Yggdrasil",
    "description": "Cairan dewa pemulih absolut. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "consumable",
    "rarity": "mythic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 18000,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 30,
        "cost": 5000,
        "materials": {
          "sky_leaf": 1,
          "ginseng_root": 1,
          "golden_dragon_egg": 1
        }
      },
      "effect_note": "Memulihkan HP & Mana hingga MAX."
    }
  },
  {
    "code": "dark_venom",
    "name": "Racun Senjata Gelap",
    "description": "Bisa kental penembus urat nadi. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "category": "consumable",
    "rarity": "epic",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 600,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 20,
        "cost": 200,
        "materials": {
          "poison_spore": 3,
          "black_rose_petal": 1
        }
      },
      "effect_note": "Melekat pada senjata, 30% peluang Poison."
    }
  },
  {
    "code": "cat_eye_potion",
    "name": "Ramuan Mata Kucing",
    "description": "Mempertajam pandangan di gua gelap. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "consumable",
    "rarity": "rare",
    "equip_slot": null,
    "buy_price": null,
    "sell_price": 300,
    "stackable": 1,
    "max_stack": 999,
    "tradeable": 1,
    "weight": 1,
    "metadata": {
      "crafting": {
        "levelRequirement": 12,
        "cost": 100,
        "materials": {
          "glow_mushroom": 3,
          "owl_eye": 1
        }
      },
      "effect_note": "Meningkatkan Akurasi sebesar 15%."
    }
  },
  {
    "code": "excalibur",
    "name": "Excalibur",
    "description": "Pedang suci pemutus takdir. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "weapon",
    "rarity": "mythic",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 25000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 10,
    "metadata": {
      "upgrade": {
        "maxLevel": 20,
        "cost": [{"level":2,"aester":10000,"materials":{"omni_stone":2}},{"level":3,"aester":20000,"materials":{"omni_stone":2,"amethyst":1}},{"level":4,"aester":30000,"materials":{"omni_stone":3,"ruby":2,"glacial_shard":1}},{"level":5,"aester":40000,"materials":{"omni_stone":3,"obsidian":2,"dragon_scale":1,"lava_rock":1}},{"level":6,"aester":50000,"materials":{"omni_stone":4}},{"level":7,"aester":60000,"materials":{"omni_stone":4}},{"level":8,"aester":70000,"materials":{"omni_stone":5}},{"level":9,"aester":80000,"materials":{"omni_stone":5}},{"level":10,"aester":90000,"materials":{"omni_stone":6}},{"level":11,"aester":100000,"materials":{"omni_stone":6,"shadow_crystal":1}},{"level":12,"aester":110000,"materials":{"omni_stone":7,"shadow_crystal":2}},{"level":13,"aester":120000,"materials":{"omni_stone":7,"shadow_crystal":2}},{"level":14,"aester":130000,"materials":{"omni_stone":8,"shadow_crystal":3}},{"level":15,"aester":140000,"materials":{"omni_stone":8,"shadow_crystal":3}},{"level":16,"aester":150000,"materials":{"omni_stone":9,"shadow_crystal":4}},{"level":17,"aester":160000,"materials":{"omni_stone":9,"shadow_crystal":4}},{"level":18,"aester":170000,"materials":{"omni_stone":10,"shadow_crystal":5}},{"level":19,"aester":180000,"materials":{"omni_stone":10,"shadow_crystal":5}},{"level":20,"aester":190000,"materials":{"omni_stone":11,"shadow_crystal":6}}],
        "statGrowth": {
          "attack": 40
        }
      },
      "crafting": {
        "levelRequirement": 30,
        "cost": 10000,
        "materials": {
          "gold_ore": 2,
          "sky_leaf": 1,
          "omni_stone": 1
        }
      },
      "stats": {
        "attack": 250,
        "luck": 50
      }
    }
  },
  {
    "code": "durandal",
    "name": "Durandal",
    "description": "Pedang emas yang takkan pernah tumpul. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "weapon",
    "rarity": "legendary",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 8500,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 8,
    "metadata": {
      "upgrade": {
        "maxLevel": 15,
        "cost": [{"level":2,"aester":5000,"materials":{"dragon_scale":2,"sapphire":1}},{"level":3,"aester":10000,"materials":{"dragon_scale":2,"obsidian_shard":1}},{"level":4,"aester":15000,"materials":{"dragon_scale":3}},{"level":5,"aester":20000,"materials":{"dragon_scale":3}},{"level":6,"aester":25000,"materials":{"dragon_scale":4}},{"level":7,"aester":30000,"materials":{"dragon_scale":4}},{"level":8,"aester":35000,"materials":{"dragon_scale":5,"diamond":1}},{"level":9,"aester":40000,"materials":{"dragon_scale":5,"diamond":2}},{"level":10,"aester":45000,"materials":{"dragon_scale":6,"diamond":2}},{"level":11,"aester":50000,"materials":{"dragon_scale":6,"diamond":3}},{"level":12,"aester":55000,"materials":{"dragon_scale":7,"diamond":3}},{"level":13,"aester":60000,"materials":{"dragon_scale":7,"diamond":4}},{"level":14,"aester":65000,"materials":{"dragon_scale":8,"diamond":4}},{"level":15,"aester":70000,"materials":{"dragon_scale":8,"diamond":5}}],
        "statGrowth": {
          "attack": 20
        }
      },
      "crafting": {
        "levelRequirement": 25,
        "cost": 3000,
        "materials": {
          "iron_ingot": 2,
          "mountain_lion_fang": 1
        }
      },
      "stats": {
        "attack": 180,
        "strength": 30
      }
    }
  },
  {
    "code": "gram",
    "name": "Gram",
    "description": "Pedang penghancur cangkang naga. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "category": "weapon",
    "rarity": "epic",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 4500,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 7,
    "metadata": {
      "upgrade": {
        "maxLevel": 12,
        "cost": [
          {
            "level": 2,
            "aester": 2000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 4000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 4,
            "aester": 6000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 5,
            "aester": 8000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 6,
            "aester": 10000,
            "materials": {
              "adamantite_ore": 4
            }
          },
          {
            "level": 7,
            "aester": 12000,
            "materials": {
              "adamantite_ore": 4,
              "golem_core": 1
            }
          },
          {
            "level": 8,
            "aester": 14000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 9,
            "aester": 16000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 10,
            "aester": 18000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 11,
            "aester": 20000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 12,
            "aester": 22000,
            "materials": {
              "adamantite_ore": 7,
              "golem_core": 4
            }
          }
        ],
        "statGrowth": {
          "attack": 10
        }
      },
      "crafting": {
        "levelRequirement": 20,
        "cost": 1500,
        "materials": {
          "iron_ingot": 2,
          "iron_bamboo_shoot": 1
        }
      },
      "stats": {
        "attack": 140,
        "strength": 20
      }
    }
  },
  {
    "code": "caliburn",
    "name": "Caliburn",
    "description": "Bilah yang dicabut dari bongkahan batu. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "weapon",
    "rarity": "rare",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 2500,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 6,
    "metadata": {
      "upgrade": {
        "maxLevel": 10,
        "cost": [{"level":2,"aester":800,"materials":{"silver_ore":2,"mysterious_egg":1}},{"level":3,"aester":1600,"materials":{"silver_ore":2,"leviathan_heart":1}},{"level":4,"aester":2400,"materials":{"silver_ore":3}},{"level":5,"aester":3200,"materials":{"silver_ore":3}},{"level":6,"aester":4000,"materials":{"silver_ore":4,"minotaur_horn":1}},{"level":7,"aester":4800,"materials":{"silver_ore":4,"minotaur_horn":2}},{"level":8,"aester":5600,"materials":{"silver_ore":5,"minotaur_horn":2}},{"level":9,"aester":6400,"materials":{"silver_ore":5,"minotaur_horn":3}},{"level":10,"aester":7200,"materials":{"silver_ore":6,"minotaur_horn":3}}],
        "statGrowth": {
          "attack": 6
        }
      },
      "crafting": {
        "levelRequirement": 15,
        "cost": 800,
        "materials": {
          "iron_ore": 3,
          "deer_antler": 1
        }
      },
      "stats": {
        "attack": 90,
        "strength": 10
      }
    }
  },
  {
    "code": "bloodhowl",
    "name": "Bloodhowl",
    "description": "Meraung memecah kesunyian setiap diayunkan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "weapon",
    "rarity": "legendary",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 8000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 12,
    "metadata": {
      "upgrade": {
        "maxLevel": 15,
        "cost": [{"level":2,"aester":5000,"materials":{"dragon_scale":2,"beast_soul_gem":1}},{"level":3,"aester":10000,"materials":{"dragon_scale":2}},{"level":4,"aester":15000,"materials":{"dragon_scale":3}},{"level":5,"aester":20000,"materials":{"dragon_scale":3}},{"level":6,"aester":25000,"materials":{"dragon_scale":4}},{"level":7,"aester":30000,"materials":{"dragon_scale":4}},{"level":8,"aester":35000,"materials":{"dragon_scale":5,"diamond":1}},{"level":9,"aester":40000,"materials":{"dragon_scale":5,"diamond":2}},{"level":10,"aester":45000,"materials":{"dragon_scale":6,"diamond":2}},{"level":11,"aester":50000,"materials":{"dragon_scale":6,"diamond":3}},{"level":12,"aester":55000,"materials":{"dragon_scale":7,"diamond":3}},{"level":13,"aester":60000,"materials":{"dragon_scale":7,"diamond":4}},{"level":14,"aester":65000,"materials":{"dragon_scale":8,"diamond":4}},{"level":15,"aester":70000,"materials":{"dragon_scale":8,"diamond":5}}],
        "statGrowth": {
          "attack": 20
        }
      },
      "crafting": {
        "levelRequirement": 25,
        "cost": 3500,
        "materials": {
          "iron_ingot": 2,
          "snow_wolf_fang": 2
        }
      },
      "stats": {
        "attack": 200,
        "speed": -5
      }
    }
  },
  {
    "code": "earthshaker",
    "name": "Earthshaker",
    "description": "Menggetarkan daratan di bawah kaki musuh. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "weapon",
    "rarity": "mythic",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 24000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 15,
    "metadata": {
      "upgrade": {
        "maxLevel": 20,
        "cost": [{"level":2,"aester":10000,"materials":{"omni_stone":2,"ancient_lightning_core":1}},{"level":3,"aester":20000,"materials":{"omni_stone":2}},{"level":4,"aester":30000,"materials":{"omni_stone":3}},{"level":5,"aester":40000,"materials":{"omni_stone":3,"abyssal_pearl":1}},{"level":6,"aester":50000,"materials":{"omni_stone":4}},{"level":7,"aester":60000,"materials":{"omni_stone":4}},{"level":8,"aester":70000,"materials":{"omni_stone":5}},{"level":9,"aester":80000,"materials":{"omni_stone":5}},{"level":10,"aester":90000,"materials":{"omni_stone":6}},{"level":11,"aester":100000,"materials":{"omni_stone":6,"shadow_crystal":1}},{"level":12,"aester":110000,"materials":{"omni_stone":7,"shadow_crystal":2}},{"level":13,"aester":120000,"materials":{"omni_stone":7,"shadow_crystal":2}},{"level":14,"aester":130000,"materials":{"omni_stone":8,"shadow_crystal":3}},{"level":15,"aester":140000,"materials":{"omni_stone":8,"shadow_crystal":3}},{"level":16,"aester":150000,"materials":{"omni_stone":9,"shadow_crystal":4}},{"level":17,"aester":160000,"materials":{"omni_stone":9,"shadow_crystal":4}},{"level":18,"aester":170000,"materials":{"omni_stone":10,"shadow_crystal":5}},{"level":19,"aester":180000,"materials":{"omni_stone":10,"shadow_crystal":5}},{"level":20,"aester":190000,"materials":{"omni_stone":11,"shadow_crystal":6}}],
        "statGrowth": {
          "attack": 40
        }
      },
      "crafting": {
        "levelRequirement": 30,
        "cost": 9000,
        "materials": {
          "iron_ingot": 3,
          "bear_pelt": 1
        }
      },
      "stats": {
        "attack": 280,
        "speed": -10
      }
    }
  },
  {
    "code": "skullcrusher",
    "name": "Skullcrusher",
    "description": "Kapak bengis penghancur tulang. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "weapon",
    "rarity": "epic",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 4000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 10,
    "metadata": {
      "upgrade": {
        "maxLevel": 12,
        "cost": [
          {
            "level": 2,
            "aester": 2000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 4000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 4,
            "aester": 6000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 5,
            "aester": 8000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 6,
            "aester": 10000,
            "materials": {
              "adamantite_ore": 4
            }
          },
          {
            "level": 7,
            "aester": 12000,
            "materials": {
              "adamantite_ore": 4,
              "golem_core": 1
            }
          },
          {
            "level": 8,
            "aester": 14000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 9,
            "aester": 16000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 10,
            "aester": 18000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 11,
            "aester": 20000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 12,
            "aester": 22000,
            "materials": {
              "adamantite_ore": 7,
              "golem_core": 4
            }
          }
        ],
        "statGrowth": {
          "attack": 10
        }
      },
      "crafting": {
        "levelRequirement": 20,
        "cost": 1200,
        "materials": {
          "iron_ingot": 2,
          "boar_spike": 2
        }
      },
      "stats": {
        "attack": 150,
        "speed": -5
      }
    }
  },
  {
    "code": "ember_cleaver",
    "name": "Ember Cleaver",
    "description": "Kapak yang membara menebas apa saja. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "weapon",
    "rarity": "epic",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 5000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 11,
    "metadata": {
      "upgrade": {
        "maxLevel": 12,
        "cost": [
          {
            "level": 2,
            "aester": 2000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 4000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 4,
            "aester": 6000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 5,
            "aester": 8000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 6,
            "aester": 10000,
            "materials": {
              "adamantite_ore": 4
            }
          },
          {
            "level": 7,
            "aester": 12000,
            "materials": {
              "adamantite_ore": 4,
              "golem_core": 1
            }
          },
          {
            "level": 8,
            "aester": 14000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 9,
            "aester": 16000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 10,
            "aester": 18000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 11,
            "aester": 20000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 12,
            "aester": 22000,
            "materials": {
              "adamantite_ore": 7,
              "golem_core": 4
            }
          }
        ],
        "statGrowth": {
          "attack": 10
        }
      },
      "crafting": {
        "levelRequirement": 22,
        "cost": 1800,
        "materials": {
          "iron_ingot": 2,
          "fire_fox_tail": 1
        }
      },
      "stats": {
        "attack": 165,
        "strength": 15
      }
    }
  },
  {
    "code": "frostbite_axe",
    "name": "Frostbite Axe",
    "description": "Bilah es tajam yang membekukan darah. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "category": "weapon",
    "rarity": "epic",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 5000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 11,
    "metadata": {
      "upgrade": {
        "maxLevel": 12,
        "cost": [
          {
            "level": 2,
            "aester": 2000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 4000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 4,
            "aester": 6000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 5,
            "aester": 8000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 6,
            "aester": 10000,
            "materials": {
              "adamantite_ore": 4
            }
          },
          {
            "level": 7,
            "aester": 12000,
            "materials": {
              "adamantite_ore": 4,
              "golem_core": 1
            }
          },
          {
            "level": 8,
            "aester": 14000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 9,
            "aester": 16000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 10,
            "aester": 18000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 11,
            "aester": 20000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 12,
            "aester": 22000,
            "materials": {
              "adamantite_ore": 7,
              "golem_core": 4
            }
          }
        ],
        "statGrowth": {
          "attack": 10
        }
      },
      "crafting": {
        "levelRequirement": 22,
        "cost": 1800,
        "materials": {
          "iron_ingot": 2,
          "frost_petal": 2
        }
      },
      "stats": {
        "attack": 165,
        "luck": 15
      }
    }
  },
  {
    "code": "moonpiercer",
    "name": "Moonpiercer",
    "description": "Menembus bayang malam dengan kilau perak. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "weapon",
    "rarity": "rare",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 2800,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 5,
    "metadata": {
      "upgrade": {
        "maxLevel": 10,
        "cost": [
          {
            "level": 2,
            "aester": 800,
            "materials": {
              "silver_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 1600,
            "materials": {
              "silver_ore": 2
            }
          },
          {
            "level": 4,
            "aester": 2400,
            "materials": {
              "silver_ore": 3
            }
          },
          {
            "level": 5,
            "aester": 3200,
            "materials": {
              "silver_ore": 3
            }
          },
          {
            "level": 6,
            "aester": 4000,
            "materials": {
              "silver_ore": 4,
              "minotaur_horn": 1
            }
          },
          {
            "level": 7,
            "aester": 4800,
            "materials": {
              "silver_ore": 4,
              "minotaur_horn": 2
            }
          },
          {
            "level": 8,
            "aester": 5600,
            "materials": {
              "silver_ore": 5,
              "minotaur_horn": 2
            }
          },
          {
            "level": 9,
            "aester": 6400,
            "materials": {
              "silver_ore": 5,
              "minotaur_horn": 3
            }
          },
          {
            "level": 10,
            "aester": 7200,
            "materials": {
              "silver_ore": 6,
              "minotaur_horn": 3
            }
          }
        ],
        "statGrowth": {
          "attack": 6
        }
      },
      "crafting": {
        "levelRequirement": 15,
        "cost": 900,
        "materials": {
          "wood": 2,
          "glow_mushroom": 2,
          "spider_silk": 1
        }
      },
      "stats": {
        "attack": 85,
        "speed": 15
      }
    }
  },
  {
    "code": "emerald_longbow",
    "name": "Emerald Longbow",
    "description": "Busur para tetua peri hutan. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "category": "weapon",
    "rarity": "epic",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 4200,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 6,
    "metadata": {
      "upgrade": {
        "maxLevel": 12,
        "cost": [
          {
            "level": 2,
            "aester": 2000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 4000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 4,
            "aester": 6000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 5,
            "aester": 8000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 6,
            "aester": 10000,
            "materials": {
              "adamantite_ore": 4
            }
          },
          {
            "level": 7,
            "aester": 12000,
            "materials": {
              "adamantite_ore": 4,
              "golem_core": 1
            }
          },
          {
            "level": 8,
            "aester": 14000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 9,
            "aester": 16000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 10,
            "aester": 18000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 11,
            "aester": 20000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 12,
            "aester": 22000,
            "materials": {
              "adamantite_ore": 7,
              "golem_core": 4
            }
          }
        ],
        "statGrowth": {
          "attack": 10
        }
      },
      "crafting": {
        "levelRequirement": 20,
        "cost": 1600,
        "materials": {
          "iron_bamboo_shoot": 3,
          "spider_silk": 2
        }
      },
      "stats": {
        "attack": 135,
        "speed": 20
      }
    }
  },
  {
    "code": "celestial_archer",
    "name": "Celestial Archer",
    "description": "Meluncurkan bintang jatuh sebagai anak panahnya. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "weapon",
    "rarity": "mythic",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 23000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 7,
    "metadata": {
      "upgrade": {
        "maxLevel": 20,
        "cost": [
          {
            "level": 2,
            "aester": 10000,
            "materials": {
              "omni_stone": 2
            }
          },
          {
            "level": 3,
            "aester": 20000,
            "materials": {
              "omni_stone": 2
            }
          },
          {
            "level": 4,
            "aester": 30000,
            "materials": {
              "omni_stone": 3
            }
          },
          {
            "level": 5,
            "aester": 40000,
            "materials": {
              "omni_stone": 3
            }
          },
          {
            "level": 6,
            "aester": 50000,
            "materials": {
              "omni_stone": 4
            }
          },
          {
            "level": 7,
            "aester": 60000,
            "materials": {
              "omni_stone": 4
            }
          },
          {
            "level": 8,
            "aester": 70000,
            "materials": {
              "omni_stone": 5
            }
          },
          {
            "level": 9,
            "aester": 80000,
            "materials": {
              "omni_stone": 5
            }
          },
          {
            "level": 10,
            "aester": 90000,
            "materials": {
              "omni_stone": 6
            }
          },
          {
            "level": 11,
            "aester": 100000,
            "materials": {
              "omni_stone": 6,
              "shadow_crystal": 1
            }
          },
          {
            "level": 12,
            "aester": 110000,
            "materials": {
              "omni_stone": 7,
              "shadow_crystal": 2
            }
          },
          {
            "level": 13,
            "aester": 120000,
            "materials": {
              "omni_stone": 7,
              "shadow_crystal": 2
            }
          },
          {
            "level": 14,
            "aester": 130000,
            "materials": {
              "omni_stone": 8,
              "shadow_crystal": 3
            }
          },
          {
            "level": 15,
            "aester": 140000,
            "materials": {
              "omni_stone": 8,
              "shadow_crystal": 3
            }
          },
          {
            "level": 16,
            "aester": 150000,
            "materials": {
              "omni_stone": 9,
              "shadow_crystal": 4
            }
          },
          {
            "level": 17,
            "aester": 160000,
            "materials": {
              "omni_stone": 9,
              "shadow_crystal": 4
            }
          },
          {
            "level": 18,
            "aester": 170000,
            "materials": {
              "omni_stone": 10,
              "shadow_crystal": 5
            }
          },
          {
            "level": 19,
            "aester": 180000,
            "materials": {
              "omni_stone": 10,
              "shadow_crystal": 5
            }
          },
          {
            "level": 20,
            "aester": 190000,
            "materials": {
              "omni_stone": 11,
              "shadow_crystal": 6
            }
          }
        ],
        "statGrowth": {
          "attack": 40
        }
      },
      "crafting": {
        "levelRequirement": 30,
        "cost": 8500,
        "materials": {
          "iron_bamboo_shoot": 3,
          "sky_leaf": 1,
          "horse_hair": 1
        }
      },
      "stats": {
        "attack": 230,
        "speed": 35,
        "luck": 20
      }
    }
  },
  {
    "code": "windrunner",
    "name": "Windrunner",
    "description": "Anak panahnya mustahil ditangkap mata. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "weapon",
    "rarity": "epic",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 3500,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 5,
    "metadata": {
      "upgrade": {
        "maxLevel": 12,
        "cost": [
          {
            "level": 2,
            "aester": 2000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 4000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 4,
            "aester": 6000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 5,
            "aester": 8000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 6,
            "aester": 10000,
            "materials": {
              "adamantite_ore": 4
            }
          },
          {
            "level": 7,
            "aester": 12000,
            "materials": {
              "adamantite_ore": 4,
              "golem_core": 1
            }
          },
          {
            "level": 8,
            "aester": 14000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 9,
            "aester": 16000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 10,
            "aester": 18000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 11,
            "aester": 20000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 12,
            "aester": 22000,
            "materials": {
              "adamantite_ore": 7,
              "golem_core": 4
            }
          }
        ],
        "statGrowth": {
          "attack": 10
        }
      },
      "crafting": {
        "levelRequirement": 18,
        "cost": 1200,
        "materials": {
          "wood": 3,
          "bat_wing": 1
        }
      },
      "stats": {
        "attack": 110,
        "speed": 25
      }
    }
  },
  {
    "code": "sylvan_grace",
    "name": "Sylvan Grace",
    "description": "Busur anggun mahakarya elf. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "weapon",
    "rarity": "legendary",
    "equip_slot": "weapon",
    "buy_price": null,
    "sell_price": 7500,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 6,
    "metadata": {
      "upgrade": {
        "maxLevel": 15,
        "cost": [
          {
            "level": 2,
            "aester": 5000,
            "materials": {
              "dragon_scale": 2
            }
          },
          {
            "level": 3,
            "aester": 10000,
            "materials": {
              "dragon_scale": 2
            }
          },
          {
            "level": 4,
            "aester": 15000,
            "materials": {
              "dragon_scale": 3
            }
          },
          {
            "level": 5,
            "aester": 20000,
            "materials": {
              "dragon_scale": 3
            }
          },
          {
            "level": 6,
            "aester": 25000,
            "materials": {
              "dragon_scale": 4
            }
          },
          {
            "level": 7,
            "aester": 30000,
            "materials": {
              "dragon_scale": 4
            }
          },
          {
            "level": 8,
            "aester": 35000,
            "materials": {
              "dragon_scale": 5,
              "diamond": 1
            }
          },
          {
            "level": 9,
            "aester": 40000,
            "materials": {
              "dragon_scale": 5,
              "diamond": 2
            }
          },
          {
            "level": 10,
            "aester": 45000,
            "materials": {
              "dragon_scale": 6,
              "diamond": 2
            }
          },
          {
            "level": 11,
            "aester": 50000,
            "materials": {
              "dragon_scale": 6,
              "diamond": 3
            }
          },
          {
            "level": 12,
            "aester": 55000,
            "materials": {
              "dragon_scale": 7,
              "diamond": 3
            }
          },
          {
            "level": 13,
            "aester": 60000,
            "materials": {
              "dragon_scale": 7,
              "diamond": 4
            }
          },
          {
            "level": 14,
            "aester": 65000,
            "materials": {
              "dragon_scale": 8,
              "diamond": 4
            }
          },
          {
            "level": 15,
            "aester": 70000,
            "materials": {
              "dragon_scale": 8,
              "diamond": 5
            }
          }
        ],
        "statGrowth": {
          "attack": 20
        }
      },
      "crafting": {
        "levelRequirement": 25,
        "cost": 2800,
        "materials": {
          "wood": 3,
          "ancient_bark": 1,
          "spider_silk": 1
        }
      },
      "stats": {
        "attack": 175,
        "speed": 30
      }
    }
  },
  {
    "code": "aegis_of_dawn",
    "name": "Aegis of Dawn",
    "description": "Perisai fajar penyilau kegelapan. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "armor",
    "rarity": "mythic",
    "equip_slot": "armor",
    "buy_price": null,
    "sell_price": 26000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 14,
    "metadata": {
      "upgrade": {
        "maxLevel": 20,
        "cost": [
          {
            "level": 2,
            "aester": 10000,
            "materials": {
              "omni_stone": 2
            }
          },
          {
            "level": 3,
            "aester": 20000,
            "materials": {
              "omni_stone": 2
            }
          },
          {
            "level": 4,
            "aester": 30000,
            "materials": {
              "omni_stone": 3
            }
          },
          {
            "level": 5,
            "aester": 40000,
            "materials": {
              "omni_stone": 3
            }
          },
          {
            "level": 6,
            "aester": 50000,
            "materials": {
              "omni_stone": 4
            }
          },
          {
            "level": 7,
            "aester": 60000,
            "materials": {
              "omni_stone": 4
            }
          },
          {
            "level": 8,
            "aester": 70000,
            "materials": {
              "omni_stone": 5
            }
          },
          {
            "level": 9,
            "aester": 80000,
            "materials": {
              "omni_stone": 5
            }
          },
          {
            "level": 10,
            "aester": 90000,
            "materials": {
              "omni_stone": 6
            }
          },
          {
            "level": 11,
            "aester": 100000,
            "materials": {
              "omni_stone": 6,
              "shadow_crystal": 1
            }
          },
          {
            "level": 12,
            "aester": 110000,
            "materials": {
              "omni_stone": 7,
              "shadow_crystal": 2
            }
          },
          {
            "level": 13,
            "aester": 120000,
            "materials": {
              "omni_stone": 7,
              "shadow_crystal": 2
            }
          },
          {
            "level": 14,
            "aester": 130000,
            "materials": {
              "omni_stone": 8,
              "shadow_crystal": 3
            }
          },
          {
            "level": 15,
            "aester": 140000,
            "materials": {
              "omni_stone": 8,
              "shadow_crystal": 3
            }
          },
          {
            "level": 16,
            "aester": 150000,
            "materials": {
              "omni_stone": 9,
              "shadow_crystal": 4
            }
          },
          {
            "level": 17,
            "aester": 160000,
            "materials": {
              "omni_stone": 9,
              "shadow_crystal": 4
            }
          },
          {
            "level": 18,
            "aester": 170000,
            "materials": {
              "omni_stone": 10,
              "shadow_crystal": 5
            }
          },
          {
            "level": 19,
            "aester": 180000,
            "materials": {
              "omni_stone": 10,
              "shadow_crystal": 5
            }
          },
          {
            "level": 20,
            "aester": 190000,
            "materials": {
              "omni_stone": 11,
              "shadow_crystal": 6
            }
          }
        ],
        "statGrowth": {
          "defense": 40
        }
      },
      "crafting": {
        "levelRequirement": 30,
        "cost": 9500,
        "materials": {
          "iron_ingot": 3,
          "golden_dragon_egg": 1
        }
      },
      "stats": {
        "defense": 200,
        "luck": 20
      }
    }
  },
  {
    "code": "guardian_bastion",
    "name": "Guardian Bastion",
    "description": "Benteng hidup sang ksatria tangguh. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "category": "armor",
    "rarity": "epic",
    "equip_slot": "armor",
    "buy_price": null,
    "sell_price": 4800,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 15,
    "metadata": {
      "upgrade": {
        "maxLevel": 12,
        "cost": [
          {
            "level": 2,
            "aester": 2000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 4000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 4,
            "aester": 6000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 5,
            "aester": 8000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 6,
            "aester": 10000,
            "materials": {
              "adamantite_ore": 4
            }
          },
          {
            "level": 7,
            "aester": 12000,
            "materials": {
              "adamantite_ore": 4,
              "golem_core": 1
            }
          },
          {
            "level": 8,
            "aester": 14000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 9,
            "aester": 16000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 10,
            "aester": 18000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 11,
            "aester": 20000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 12,
            "aester": 22000,
            "materials": {
              "adamantite_ore": 7,
              "golem_core": 4
            }
          }
        ],
        "statGrowth": {
          "defense": 10
        }
      },
      "crafting": {
        "levelRequirement": 20,
        "cost": 1500,
        "materials": {
          "iron_ingot": 3,
          "bear_pelt": 1
        }
      },
      "stats": {
        "defense": 120,
        "speed": -5
      }
    }
  },
  {
    "code": "titan_wall",
    "name": "Titan Wall",
    "description": "Perisai kolosal sekokoh gunung. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "category": "armor",
    "rarity": "legendary",
    "equip_slot": "armor",
    "buy_price": null,
    "sell_price": 9000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 20,
    "metadata": {
      "upgrade": {
        "maxLevel": 15,
        "cost": [
          {
            "level": 2,
            "aester": 5000,
            "materials": {
              "dragon_scale": 2
            }
          },
          {
            "level": 3,
            "aester": 10000,
            "materials": {
              "dragon_scale": 2
            }
          },
          {
            "level": 4,
            "aester": 15000,
            "materials": {
              "dragon_scale": 3
            }
          },
          {
            "level": 5,
            "aester": 20000,
            "materials": {
              "dragon_scale": 3
            }
          },
          {
            "level": 6,
            "aester": 25000,
            "materials": {
              "dragon_scale": 4
            }
          },
          {
            "level": 7,
            "aester": 30000,
            "materials": {
              "dragon_scale": 4
            }
          },
          {
            "level": 8,
            "aester": 35000,
            "materials": {
              "dragon_scale": 5,
              "diamond": 1
            }
          },
          {
            "level": 9,
            "aester": 40000,
            "materials": {
              "dragon_scale": 5,
              "diamond": 2
            }
          },
          {
            "level": 10,
            "aester": 45000,
            "materials": {
              "dragon_scale": 6,
              "diamond": 2
            }
          },
          {
            "level": 11,
            "aester": 50000,
            "materials": {
              "dragon_scale": 6,
              "diamond": 3
            }
          },
          {
            "level": 12,
            "aester": 55000,
            "materials": {
              "dragon_scale": 7,
              "diamond": 3
            }
          },
          {
            "level": 13,
            "aester": 60000,
            "materials": {
              "dragon_scale": 7,
              "diamond": 4
            }
          },
          {
            "level": 14,
            "aester": 65000,
            "materials": {
              "dragon_scale": 8,
              "diamond": 4
            }
          },
          {
            "level": 15,
            "aester": 70000,
            "materials": {
              "dragon_scale": 8,
              "diamond": 5
            }
          }
        ],
        "statGrowth": {
          "defense": 20
        }
      },
      "crafting": {
        "levelRequirement": 25,
        "cost": 3200,
        "materials": {
          "iron_ingot": 4,
          "stone": 1
        }
      },
      "stats": {
        "defense": 170,
        "speed": -10
      }
    }
  },
  {
    "code": "celestial_bulwark",
    "name": "Celestial Bulwark",
    "description": "Pelindung suci anti retak. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "category": "armor",
    "rarity": "legendary",
    "equip_slot": "armor",
    "buy_price": null,
    "sell_price": 12000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 12,
    "metadata": {
      "upgrade": {
        "maxLevel": 15,
        "cost": [
          {
            "level": 2,
            "aester": 5000,
            "materials": {
              "dragon_scale": 2
            }
          },
          {
            "level": 3,
            "aester": 10000,
            "materials": {
              "dragon_scale": 2
            }
          },
          {
            "level": 4,
            "aester": 15000,
            "materials": {
              "dragon_scale": 3
            }
          },
          {
            "level": 5,
            "aester": 20000,
            "materials": {
              "dragon_scale": 3
            }
          },
          {
            "level": 6,
            "aester": 25000,
            "materials": {
              "dragon_scale": 4
            }
          },
          {
            "level": 7,
            "aester": 30000,
            "materials": {
              "dragon_scale": 4
            }
          },
          {
            "level": 8,
            "aester": 35000,
            "materials": {
              "dragon_scale": 5,
              "diamond": 1
            }
          },
          {
            "level": 9,
            "aester": 40000,
            "materials": {
              "dragon_scale": 5,
              "diamond": 2
            }
          },
          {
            "level": 10,
            "aester": 45000,
            "materials": {
              "dragon_scale": 6,
              "diamond": 2
            }
          },
          {
            "level": 11,
            "aester": 50000,
            "materials": {
              "dragon_scale": 6,
              "diamond": 3
            }
          },
          {
            "level": 12,
            "aester": 55000,
            "materials": {
              "dragon_scale": 7,
              "diamond": 3
            }
          },
          {
            "level": 13,
            "aester": 60000,
            "materials": {
              "dragon_scale": 7,
              "diamond": 4
            }
          },
          {
            "level": 14,
            "aester": 65000,
            "materials": {
              "dragon_scale": 8,
              "diamond": 4
            }
          },
          {
            "level": 15,
            "aester": 70000,
            "materials": {
              "dragon_scale": 8,
              "diamond": 5
            }
          }
        ],
        "statGrowth": {
          "defense": 20
        }
      },
      "crafting": {
        "levelRequirement": 28,
        "cost": 4500,
        "materials": {
          "iron_ingot": 3,
          "sky_leaf": 1
        }
      },
      "stats": {
        "defense": 185,
        "luck": 15
      }
    }
  },
  {
    "code": "holy_fortress",
    "name": "Holy Fortress",
    "description": "Berkat suci yang mengelilingi perisai besi. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "category": "armor",
    "rarity": "epic",
    "equip_slot": "armor",
    "buy_price": null,
    "sell_price": 5500,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 13,
    "metadata": {
      "upgrade": {
        "maxLevel": 12,
        "cost": [
          {
            "level": 2,
            "aester": 2000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 3,
            "aester": 4000,
            "materials": {
              "adamantite_ore": 2
            }
          },
          {
            "level": 4,
            "aester": 6000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 5,
            "aester": 8000,
            "materials": {
              "adamantite_ore": 3
            }
          },
          {
            "level": 6,
            "aester": 10000,
            "materials": {
              "adamantite_ore": 4
            }
          },
          {
            "level": 7,
            "aester": 12000,
            "materials": {
              "adamantite_ore": 4,
              "golem_core": 1
            }
          },
          {
            "level": 8,
            "aester": 14000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 9,
            "aester": 16000,
            "materials": {
              "adamantite_ore": 5,
              "golem_core": 2
            }
          },
          {
            "level": 10,
            "aester": 18000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 11,
            "aester": 20000,
            "materials": {
              "adamantite_ore": 6,
              "golem_core": 3
            }
          },
          {
            "level": 12,
            "aester": 22000,
            "materials": {
              "adamantite_ore": 7,
              "golem_core": 4
            }
          }
        ],
        "statGrowth": {
          "defense": 10
        }
      },
      "crafting": {
        "levelRequirement": 22,
        "cost": 2000,
        "materials": {
          "wood": 3,
          "iron_ingot": 2,
          "heal_leaf": 1
        }
      },
      "stats": {
        "defense": 135,
        "strength": 10
      }
    }
  },
  { "code": "ikan_bakar", "name": "Ikan Bakar", "description": "Ikan segar yang dibakar sempurna. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "food", "rarity": "common", "equip_slot": null, "buy_price": 40, "sell_price": 20, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_hp": 20 }, "crafting": { "materials": { "common_fish": 1, "wood": 1 } } } },
  { "code": "sup_belut", "name": "Sup Belut Penambah Stamina", "description": "Sup hangat yang membakar semangatmu. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "food", "rarity": "rare", "equip_slot": null, "buy_price": 100, "sell_price": 50, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_stamina": 25 }, "crafting": { "materials": { "serpent_eel": 1, "herb": 1 } } } },
  { "code": "ramuan_penyembuh", "name": "Ramuan Penyembuh", "description": "Cairan merah berbau herbal pekat. Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "", "category": "potion", "rarity": "uncommon", "equip_slot": null, "buy_price": 80, "sell_price": 40, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_hp": 50 }, "crafting": { "materials": { "treant_sap": 1, "herb": 2 } } } },
  { "code": "elixir_bulan", "name": "Elixir Bulan", "description": "Memancarkan cahaya biru lembut, memulihkan Mana. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "potion", "rarity": "rare", "equip_slot": null, "buy_price": 150, "sell_price": 75, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_mp": 50 }, "crafting": { "materials": { "moonpetal": 1, "cave_moss": 2 } } } },
  { "code": "telur_dadar", "name": "Telur Dadar Liar", "description": "Makanan sederhana namun mengenyangkan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "food", "rarity": "common", "equip_slot": null, "buy_price": 30, "sell_price": 15, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_hp": 15 }, "crafting": { "materials": { "duck_egg": 1, "wood": 1 } } } },
  { "code": "mantel_bulu", "name": "Mantel Bulu Kelinci", "description": "Pakaian hangat dan ringan. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "armor", "rarity": "common", "equip_slot": "body", "buy_price": 200, "sell_price": 100, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 5, "metadata": { "stats": { "defense": 5 }, "crafting": { "materials": { "rabbit_fur": 3, "iron_ore": 1 } } } },

  { "code": "salad_buah", "name": "Salad Buah Hutan", "description": "Campuran Beri Liar dan Pisang yang menyegarkan. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "food", "rarity": "common", "equip_slot": null, "buy_price": 60, "sell_price": 30, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_hp": 40 }, "crafting": { "materials": { "wild_berries": 2, "banana": 1 } } } },
  { "code": "kue_manis", "name": "Kue Manis", "description": "Roti panggang dengan gula dan telur. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "food", "rarity": "uncommon", "equip_slot": null, "buy_price": 120, "sell_price": 60, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 2, "metadata": { "usable": { "heal_hp": 30, "heal_stamina": 20 }, "crafting": { "materials": { "sugar": 1, "wheat": 2, "duck_egg": 1 } } } },
  { "code": "ramuan_nyawa_hitam", "name": "Ramuan Nyawa Hitam", "description": "Ramuan kental dari Lotus Hitam dan Darah Lintah. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "", "category": "potion", "rarity": "epic", "equip_slot": null, "buy_price": 500, "sell_price": 250, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_hp": 150 }, "crafting": { "materials": { "black_lotus": 1, "leech_blood": 3 } } } },
  { "code": "esensi_salju_abadi", "name": "Esensi Salju Abadi", "description": "Dingin yang membekukan jiwa, namun memulihkan mana. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "potion", "rarity": "epic", "equip_slot": null, "buy_price": 600, "sell_price": 300, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_mp": 100 }, "crafting": { "materials": { "frost_crystal": 1, "ice_melon": 2 } } } },
  { "code": "sate_paha_katak", "name": "Sate Paha Katak", "description": "Daging kenyal hasil panggangan. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "", "category": "food", "rarity": "common", "equip_slot": null, "buy_price": 50, "sell_price": 25, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 3, "metadata": { "usable": { "heal_hp": 35 }, "crafting": { "materials": { "giant_frog_leg": 1, "wood": 1 } } } },
  { "code": "jubah_yeti", "name": "Jubah Yeti Tahan Dingin", "description": "Jubah tebal dari bulu Yeti asli. Ada aura magis tipis yang memancar dari benda ini.", "image": "", "category": "armor", "rarity": "rare", "equip_slot": "body", "buy_price": 800, "sell_price": 400, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 8, "metadata": { "stats": { "defense": 15, "hp": 50 }, "crafting": { "materials": { "yeti_fur": 3, "seal_oil": 1 } } } },
  { "code": "zirah_naga_rawa", "name": "Zirah Sisik Hydra", "description": "Baju besi yang tahan korosi dan sangat kuat. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "", "category": "armor", "rarity": "epic", "equip_slot": "body", "buy_price": 1500, "sell_price": 750, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 12, "metadata": { "stats": { "defense": 25, "mp": 20 }, "crafting": { "materials": { "hydra_scale": 5, "swamp_gas_vial": 2, "iron_ore": 3 } } } },
  { "code": "mahkota_griffin", "name": "Mahkota Griffin", "description": "Hiasan kepala lambang kebebasan. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "armor", "rarity": "rare", "equip_slot": "head", "buy_price": 700, "sell_price": 350, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 2, "metadata": { "stats": { "defense": 10, "speed": 15 }, "crafting": { "materials": { "griffin_claw": 2, "harpy_feather": 3 } } } },
  { "code": "kalung_tengkorak", "name": "Kalung Tengkorak Goblin", "description": "Menakutkan tapi berkhasiat sihir. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "accessory", "rarity": "uncommon", "equip_slot": "accessory", "buy_price": 300, "sell_price": 150, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 1, "metadata": { "stats": { "attack": 5 }, "crafting": { "materials": { "goblin_ear": 5, "reeds": 2 } } } },


  { "code": "ramuan_sihir_kuno", "name": "Ramuan Sihir Kuno", "description": "Ramuan sakti dari serbuk debu mana dan wisp. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "", "category": "potion", "rarity": "mythic", "equip_slot": null, "buy_price": 1000, "sell_price": 500, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 1, "metadata": { "usable": { "heal_mp": 150 }, "crafting": { "materials": { "mana_dust": 2, "will_o_wisp": 1, "mountain_flower": 1, "fire_blossom": 1 } } } },
  { "code": "telur_wyvern_bakar", "name": "Telur Wyvern Bakar", "description": "Telur raksasa yang dipanggang dengan kayu abu. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "food", "rarity": "epic", "equip_slot": null, "buy_price": 800, "sell_price": 400, "stackable": 1, "max_stack": 99, "tradeable": 1, "weight": 5, "metadata": { "usable": { "heal_hp": 100, "heal_stamina": 50 }, "crafting": { "materials": { "wyvern_egg": 1, "ash_wood": 2 } } } },
  { "code": "zirah_laut_dalam", "name": "Zirah Laut Dalam", "description": "Baju besi yang memancarkan aura lautan. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "", "category": "armor", "rarity": "legendary", "equip_slot": "body", "buy_price": 3000, "sell_price": 1500, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 15, "metadata": { "stats": { "defense": 30, "hp": 100 }, "crafting": { "materials": { "abyssal_scale": 3, "coral_branch": 5, "deep_sea_kelp": 10 } } } },
  { "code": "jubah_kadal_terbang", "name": "Jubah Kadal Terbang", "description": "Ringan dan tahan api. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "", "category": "armor", "rarity": "uncommon", "equip_slot": "body", "buy_price": 400, "sell_price": 200, "stackable": 0, "max_stack": 1, "tradeable": 1, "weight": 4, "metadata": { "stats": { "defense": 12, "speed": 5 }, "crafting": { "materials": { "lizard_scale": 4, "feathers": 5 } } } },
];

export const GEMSTONE_ENCHANTS = [
  {
    "gem_code": "quartz",
    "slot": "weapon",
    "description": "+10% kerusakan pada Mana musuh Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "stats": {}
  },
  {
    "gem_code": "quartz",
    "slot": "armor",
    "description": "+5% Regenerasi Mana Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "stats": {}
  },
  {
    "gem_code": "amethyst",
    "slot": "weapon",
    "description": "Lifesteal 2% dari kerusakan yang diberikan. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "stats": {}
  },
  {
    "gem_code": "amethyst",
    "slot": "armor",
    "description": "+5% Max HP Kualitasnya yang luar biasa membuatnya sangat dicari oleh para petualang.", "image": "",
    "stats": {
      "maxHp": 5
    }
  },
  {
    "gem_code": "topaz",
    "slot": "weapon",
    "description": "+10% Peluang Critical Hit. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "stats": {}
  },
  {
    "gem_code": "topaz",
    "slot": "armor",
    "description": "+10 Speed. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "stats": {
      "speed": 10
    }
  },
  {
    "gem_code": "sapphire",
    "slot": "weapon",
    "description": "15% peluang memperlambat musuh. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "stats": {}
  },
  {
    "gem_code": "sapphire",
    "slot": "armor",
    "description": "+15% Magic Defense. Bentuknya mungkin sederhana, tapi nilainya tidak bisa diremehkan.", "image": "",
    "stats": {
      "defense": 15
    }
  },
  {
    "gem_code": "diamond",
    "slot": "weapon",
    "description": "+10% Kerusakan Serangan Dasar. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "stats": {
      "attack": 10
    }
  },
  {
    "gem_code": "diamond",
    "slot": "armor",
    "description": "5% peluang blok total. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "stats": {}
  },

];

export const WORLD_MONSTERS = [
  {
    "code": "goblin",
    "name": "Goblin Pencuri",
    "description": "Makhluk kecil licik yang bergerak berkelompok dan suka mencuri. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "min_level": 1,
    "max_level": 8,
    "hp": 50,
    "attack": 15,
    "defense": 3,
    "xp_reward": 25,
    "cash_min": 10,
    "cash_max": 30,
    "loot_table": [
      {
        "item_code": "goblin_ear",
        "chance": 0.8,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [
      "Eldwood",
      "Deepstone"
    ],
    "is_boss": false
  },
  {
    "code": "wild_boar",
    "name": "Babi Hutan Liar",
    "description": "Hewan teritorial dengan taring tajam. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "min_level": 3,
    "max_level": 10,
    "hp": 80,
    "attack": 12,
    "defense": 5,
    "xp_reward": 40,
    "cash_min": 20,
    "cash_max": 50,
    "loot_table": [
      {
        "item_code": "pork",
        "chance": 0.9,
        "qty_min": 1,
        "qty_max": 1
      },
      {
        "item_code": "leather",
        "chance": 0.2,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [
      "Eldwood"
    ],
    "is_boss": false
  },
  {
    "code": "forest_spider",
    "name": "Laba-laba Hutan",
    "description": "Laba-laba predator penjebak mangsa dengan jaring sutra. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "min_level": 4,
    "max_level": 11,
    "hp": 70,
    "attack": 15,
    "defense": 4,
    "xp_reward": 50,
    "cash_min": 25,
    "cash_max": 60,
    "loot_table": [
      {
        "item_code": "spider_silk",
        "chance": 0.75,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [
      "Eldwood",
      "Deepstone"
    ],
    "is_boss": false
  },
  {
    "code": "minotaur",
    "name": "Minotaur",
    "description": "Monster setengah manusia setengah banteng penjaga labirin kuno. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "min_level": 13,
    "max_level": 20,
    "hp": 250,
    "attack": 30,
    "defense": 15,
    "xp_reward": 200,
    "cash_min": 150,
    "cash_max": 300,
    "loot_table": [
      {
        "item_code": "minotaur_horn",
        "chance": 0.5,
        "qty_min": 1,
        "qty_max": 1
      },
      {
        "item_code": "monster_fang",
        "chance": 0.8,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [
      "Eldwood"
    ],
    "is_boss": false
  },
  {
    "code": "giant_bat",
    "name": "Kelelawar Raksasa",
    "description": "Kelelawar penghuni gua berukuran tidak wajar. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "min_level": 2,
    "max_level": 9,
    "hp": 60,
    "attack": 10,
    "defense": 2,
    "xp_reward": 30,
    "cash_min": 15,
    "cash_max": 40,
    "loot_table": [
      {
        "item_code": "bat_wing",
        "chance": 0.9,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [
      "Deepstone"
    ],
    "is_boss": false
  },
  {
    "code": "slime",
    "name": "Slime Gua",
    "description": "Gumpalan cairan lengket yang menyerap apa saja di sekitarnya. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "min_level": 1,
    "max_level": 7,
    "hp": 40,
    "attack": 6,
    "defense": 8,
    "xp_reward": 20,
    "cash_min": 5,
    "cash_max": 20,
    "loot_table": [
      {
        "item_code": "slime_gel",
        "chance": 0.95,
        "qty_min": 1,
        "qty_max": 1
      },
      {
        "item_code": "rusty_can",
        "chance": 0.1,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [
      "Deepstone",
      "Murkwood"
    ],
    "is_boss": false
  },
  {
    "code": "stone_golem",
    "name": "Golem Batu",
    "description": "Sebongkah batu yang dihidupkan sihir kuno, pukulannya lambat namun mematikan. Sangat berharga bagi mereka yang tahu cara menggunakannya.", "image": "",
    "min_level": 10,
    "max_level": 17,
    "hp": 200,
    "attack": 20,
    "defense": 25,
    "xp_reward": 150,
    "cash_min": 100,
    "cash_max": 250,
    "loot_table": [
      {
        "item_code": "golem_core",
        "chance": 0.2,
        "qty_min": 1,
        "qty_max": 1
      },
      {
        "item_code": "iron_ore",
        "chance": 0.5,
        "qty_min": 1,
        "qty_max": 1
      },
      {
        "item_code": "stone",
        "chance": 1,
        "qty_min": 1,
        "qty_max": 3
      }
    ],
    "locations": [
      "Deepstone"
    ],
    "is_boss": false
  },
  {
    "code": "harpy",
    "name": "Harpy",
    "description": "Monster setengah wanita setengah burung dengan pekikan mematikan. Benda ini memiliki sejarah yang panjang di daratan Questly.", "image": "",
    "min_level": 8,
    "max_level": 15,
    "hp": 120,
    "attack": 25,
    "defense": 8,
    "xp_reward": 100,
    "cash_min": 80,
    "cash_max": 150,
    "loot_table": [
      {
        "item_code": "harpy_feather",
        "chance": 0.85,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [
      "Drakoria"
    ],
    "is_boss": false
  },
  {
    "code": "wyvern",
    "name": "Wyvern Muda",
    "description": "Kerabat jauh naga yang lebih kecil dan ganas. Terasa hangat jika disentuh, menyimpan sisa-sisa energi alam.", "image": "",
    "min_level": 23,
    "max_level": 30,
    "hp": 500,
    "attack": 50,
    "defense": 30,
    "xp_reward": 500,
    "cash_min": 500,
    "cash_max": 1000,
    "loot_table": [
      {
        "item_code": "dragon_scale",
        "chance": 0.1,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [
      "Drakoria"
    ],
    "is_boss": false
  },
  {
    "code": "swamp_serpent",
    "name": "Ular Rawa",
    "description": "Ular raksasa yang bersembunyi di perairan keruh. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "min_level": 6,
    "max_level": 13,
    "hp": 100,
    "attack": 18,
    "defense": 6,
    "xp_reward": 70,
    "cash_min": 50,
    "cash_max": 100,
    "loot_table": [
      {
        "item_code": "monster_fang",
        "chance": 0.7,
        "qty_min": 1,
        "qty_max": 1
      },
      {
        "item_code": "serpent_eel",
        "chance": 0.3,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [
      "Murkwood"
    ],
    "is_boss": false
  },
  {
    "code": "goblin_chieftain",
    "name": "Kepala Suku Goblin",
    "description": "Goblin veteran yang selamat dari puluhan pertempuran. Konon, benda ini adalah kunci menuju kekuatan yang lebih besar.", "image": "",
    "min_level": 8,
    "max_level": 15,
    "hp": 300,
    "attack": 25,
    "defense": 15,
    "xp_reward": 300,
    "cash_min": 200,
    "cash_max": 400,
    "loot_table": [
      {
        "item_code": "monster_fang",
        "chance": 1,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [],
    "is_boss": true
  },
  {
    "code": "swamp_hydra",
    "name": "Hidra Rawa",
    "description": "Penjaga kuno Kuil Tenggelam, tiap tetes darahnya menumbuhkan kepala baru. Ada aura magis tipis yang memancar dari benda ini.", "image": "",
    "min_level": 18,
    "max_level": 25,
    "hp": 800,
    "attack": 45,
    "defense": 25,
    "xp_reward": 1000,
    "cash_min": 800,
    "cash_max": 1500,
    "loot_table": [
      {
        "item_code": "sapphire",
        "chance": 0.2,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [],
    "is_boss": true
  },
  {
    "code": "griffin_lord",
    "name": "Raja Griffin",
    "description": "Griffin alpha penguasa Puncak Langit. Cocok untuk dibawa dalam perjalanan yang jauh dan berbahaya.", "image": "",
    "min_level": 28,
    "max_level": 35,
    "hp": 1500,
    "attack": 60,
    "defense": 40,
    "xp_reward": 2500,
    "cash_min": 2000,
    "cash_max": 3500,
    "loot_table": [
      {
        "item_code": "griffin_claw",
        "chance": 1,
        "qty_min": 1,
        "qty_max": 1
      }
    ],
    "locations": [],
    "is_boss": true
  }
];

/** @param {import('better-sqlite3').Database} db */
export const WORLD_DUNGEONS = {
  "goblin_cave": {
      name: "Gua Goblin",
      description: "Sebuah gua lembab yang dipenuhi bau tidak sedap, telah dijadikan sarang oleh sekelompok Goblin Pencuri. Mereka menumpuk hasil jarahan mereka di bagian terdalam gua, dijaga oleh Kepala Suku mereka.",
      levelRequirement: 5,
      cooldownHours: 5,
      monsters: ['goblin', 'goblin', 'forest_spider'],
      boss: 'goblin_chieftain',
      rewards: { exp: 500, aester: 200, items: { iron_ore: 0.5, diamond: 0.1 } }
  },
  "sunken_temple": {
      name: "Kuil Tenggelam",
      description: "Reruntuhan sebuah kuil kuno yang kini terbenam di jantung rawa. Dikatakan bahwa kuil ini menyimpan sumber kekuatan air murni, yang kini dijaga oleh Hidra Rawa yang mengerikan.",
      levelRequirement: 15,
      cooldownHours: 11,
      monsters: ['slime', 'swamp_serpent', 'slime', 'swamp_serpent'],
      boss: 'swamp_hydra',
      rewards: { exp: 1500, aester: 500, items: { antidote: 1, sapphire: 0.3 } }
  },
  "sky_peak": {
      name: "Puncak Langit",
      description: "Salah satu puncak tertinggi di Pegunungan, sering diselimuti badai. Ini adalah wilayah kekuasaan para Griffin.",
      levelRequirement: 25,
      cooldownHours: 24,
      monsters: ['harpy', 'stone_golem', 'harpy', 'wyvern'],
      boss: 'griffin_lord',
      rewards: { exp: 4000, aester: 1000, items: { dragon_scale: 0.15, emerald: 0.5 } }
  }
};

export function seedWorldContent(db) {
  const insertBiome = db.prepare(`
    INSERT INTO biomes (code, name, description, is_hidden, unlocked_by)
    VALUES (@code, @name, @description, @is_hidden, @unlocked_by)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name, description = excluded.description,
      is_hidden = excluded.is_hidden, unlocked_by = excluded.unlocked_by,\n      min_level = excluded.min_level
  `);

  const insertItem = db.prepare(`
    INSERT INTO items (code, name, description, category, rarity, equip_slot,
                        buy_price, sell_price, stackable, max_stack, tradeable,
                        weight, locations, crafting, metadata)
    VALUES (@code, @name, @description, @category, @rarity, @equip_slot,
            @buy_price, @sell_price, @stackable, @max_stack, @tradeable,
            @weight, @locations, @crafting, @metadata)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name, description = excluded.description,
      category = excluded.category, rarity = excluded.rarity,
      equip_slot = excluded.equip_slot, buy_price = excluded.buy_price,
      sell_price = excluded.sell_price, stackable = excluded.stackable,
      max_stack = excluded.max_stack, tradeable = excluded.tradeable,
      weight = excluded.weight, locations = excluded.locations,
      crafting = excluded.crafting, metadata = excluded.metadata
  `);

  const insertGem = db.prepare(`
    INSERT INTO gemstone_enchants (gem_code, slot, description, stats)
    VALUES (@gem_code, @slot, @description, @stats)
    ON CONFLICT(gem_code, slot) DO UPDATE SET
      description = excluded.description, stats = excluded.stats
  `);

  const insertMonster = db.prepare(`
    INSERT INTO monsters (code, name, description, min_level, max_level, hp,
                           attack, defense, xp_reward, cash_min, cash_max,
                           loot_table, locations, is_boss)
    VALUES (@code, @name, @description, @min_level, @max_level, @hp,
            @attack, @defense, @xp_reward, @cash_min, @cash_max,
            @loot_table, @locations, @is_boss)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name, description = excluded.description,
      min_level = excluded.min_level, max_level = excluded.max_level,
      hp = excluded.hp, attack = excluded.attack, defense = excluded.defense,
      xp_reward = excluded.xp_reward, cash_min = excluded.cash_min,
      cash_max = excluded.cash_max, loot_table = excluded.loot_table,
      locations = excluded.locations, is_boss = excluded.is_boss
  `);



  const insertPlant = db.prepare(`
    INSERT INTO plants (code, name, description, category, locations, harvest_time, loot_table)
    VALUES (@code, @name, @description, @category, @locations, @harvest_time, @loot_table)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name, description = excluded.description, category = excluded.category,
      locations = excluded.locations, harvest_time = excluded.harvest_time, loot_table = excluded.loot_table
  `);

  const insertProject = db.prepare(`

    INSERT INTO community_projects (code, name, required_item, target_amount, current_amount, is_completed)
    VALUES (@code, @name, @required_item, @target_amount, COALESCE(@current_amount, 0), COALESCE(@is_completed, 0))
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name, required_item = excluded.required_item, target_amount = excluded.target_amount
  `);

  const insertAnimal = db.prepare(`
    INSERT INTO animals (code, name, description, category, locations, loot_table)
    VALUES (@code, @name, @description, @category, @locations, @loot_table)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name, description = excluded.description, category = excluded.category,
      locations = excluded.locations, loot_table = excluded.loot_table
  `);

  const runAll = db.transaction(() => {

    for (const b of BIOMES) insertBiome.run(b);

    for (const it of WORLD_ITEMS) {
      insertItem.run({
        code: it.code,
        name: it.name,
        description: it.description,
        category: it.category,
        rarity: it.rarity,
        equip_slot: it.equip_slot,
        buy_price: it.buy_price,
        sell_price: it.sell_price,
        stackable: it.stackable,
        max_stack: it.max_stack,
        tradeable: it.tradeable,
        weight: it.weight,
        locations: JSON.stringify(it.metadata.locations || []),
        crafting: it.metadata.crafting ? JSON.stringify(it.metadata.crafting) : null,
        metadata: JSON.stringify(it.metadata),
      });
    }

    for (const g of GEMSTONE_ENCHANTS) {
      insertGem.run({ ...g, stats: JSON.stringify(g.stats) });
    }



    for (const p of PLANTS) {
      insertPlant.run({
        ...p,
        locations: JSON.stringify(p.locations),
        loot_table: JSON.stringify(p.loot_table)
      });
    }

    for (const proj of COMMUNITY_PROJECTS) {

      insertProject.run({ ...proj, current_amount: 0, is_completed: 0 });
    }

    for (const animal of ANIMALS) {
      insertAnimal.run({
        ...animal,
        locations: JSON.stringify(animal.locations),
        loot_table: JSON.stringify(animal.loot_table)
      });
    }

    for (const m of WORLD_MONSTERS) {

      insertMonster.run({
        ...m,
        loot_table: JSON.stringify(m.loot_table),
        locations: JSON.stringify(m.locations),
        is_boss: m.is_boss ? 1 : 0,
      });
    }
  });

  runAll();
}
