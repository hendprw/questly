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
    "name": "Veridian Labyrinth",
    "description": "Hutan kuno lebat yang penuh misteri dan reruntuhan.",
    "is_hidden": 0,
    "unlocked_by": null
  },
  {
    "code": "cave",
    "name": "Crystalgrove Deeps",
    "description": "Jaringan gua bawah tanah yang diterangi oleh kristal berpendar.",
    "is_hidden": 0,
    "unlocked_by": null
  },
  {
    "code": "mountain",
    "name": "Wyrms Tooth Peaks",
    "description": "Pegunungan terjal dan berbahaya, sarang monster terbang.",
    "is_hidden": 0,
    "unlocked_by": null
  },
  {
    "code": "swamp",
    "name": "Sunken Serenity",
    "description": "Rawa subur yang tenang namun menyimpan bahaya di bawah airnya.",
    "is_hidden": 0,
    "unlocked_by": null
  },
  {
    "code": "skyward_valley",
    "name": "Dataran Tinggi Skyward",
    "description": "Sebuah lembah tersembunyi di atas awan, penuh dengan flora dan fauna aneh.",
    "is_hidden": 1,
    "unlocked_by": "broken_bridge"
  }
];

export const WORLD_ITEMS = [
  {
    "code": "rice",
    "name": "Beras",
    "description": "Beras mentah dari rawa.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wheat",
    "name": "Gandum",
    "description": "Seikat gandum yang dipanen dari hutan.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "carrot",
    "name": "Wortel",
    "description": "Wortel segar dari tanah subur.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "potato",
    "name": "Kentang",
    "description": "Ubi-ubian yang mengenyangkan.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "tomato",
    "name": "Tomat",
    "description": "Buah merah berair dengan rasa asam manis.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "corn",
    "name": "Jagung",
    "description": "Tongkol jagung yang manis.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "apple",
    "name": "Apel",
    "description": "Buah apel yang manis dan renyah.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "banana",
    "name": "Pisang",
    "description": "Pisang manis yang tumbuh di iklim hangat.",
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
        "Veridian Labyrinth",
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "strawberry",
    "name": "Stroberi",
    "description": "Buah beri merah yang langka dan manis.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "grape",
    "name": "Anggur",
    "description": "Sekelompok anggur yang tumbuh di tanaman merambat.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "chili",
    "name": "Cabai",
    "description": "Cabai pedas yang memberikan sensasi panas.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wood",
    "name": "Kayu",
    "description": "Batang kayu dari pohon-pohon di hutan.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "herb",
    "name": "Herba",
    "description": "Tumbuhan herbal dengan aroma kuat, bahan dasar ramuan.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "pork",
    "name": "Daging Babi Hutan",
    "description": "Daging babi hutan yang dapat dimasak.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "goblin_ear",
    "name": "Telinga Goblin",
    "description": "Telinga goblin sebagai bukti kemenangan.",
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
        "Veridian Labyrinth",
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wild_berries",
    "name": "Beri Liar",
    "description": "Sekumpulan beri manis yang tumbuh liar di semak-semak.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "leather",
    "name": "Kulit Hewan",
    "description": "Kulit hewan yang telah disamak.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "spider_silk",
    "name": "Sutera Laba-laba",
    "description": "Benang sutra dari sarang laba-laba raksasa.",
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
        "Veridian Labyrinth",
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wolf_pelt",
    "name": "Kulit Serigala",
    "description": "Kulit tebal dari serigala hutan, lebih kuat dari kulit biasa.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "moonpetal",
    "name": "Kelopak Bulan",
    "description": "Kelopak bunga langka yang hanya mekar di bawah sinar rembulan.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "minotaur_horn",
    "name": "Tanduk Minotaur",
    "description": "Tanduk besar dari minotaur. Bahan langka untuk senjata kuat.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "ancient_bark",
    "name": "Kulit Kayu Kuno",
    "description": "Kulit kayu dari pohon purba yang memiliki sifat magis.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "treant_sap",
    "name": "Getah Treant",
    "description": "Getah kental dari Treant kuno yang dapat meregenerasi kayu.",
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
        "Veridian Labyrinth"
      ],
      "source": "gather"
    }
  },
  {
    "code": "stone",
    "name": "Batu",
    "description": "Batu biasa yang dapat ditemukan di mana saja.",
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
        "Crystalgrove Deeps",
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "coal",
    "name": "Batu Bara",
    "description": "Mineral hitam yang mudah terbakar.",
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
        "Crystalgrove Deeps",
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "bat_wing",
    "name": "Sayap Kelelawar",
    "description": "Sayap tipis dari kelelawar gua.",
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
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "slime_gel",
    "name": "Gel Slime",
    "description": "Cairan lengket dari slime.",
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
        "Sunken Serenity",
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "iron_ore",
    "name": "Bijih Besi",
    "description": "Bijih besi kasar, sumber utama untuk perlengkapan.",
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
        "Crystalgrove Deeps",
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "glowing_mushroom",
    "name": "Jamur Bercahaya",
    "description": "Jamur langka yang memancarkan cahaya lembut.",
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
        "Crystalgrove Deeps",
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "amethyst",
    "name": "Kecubung",
    "description": "Permata ungu yang indah, sering digunakan dalam sihir.",
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
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "silver_ore",
    "name": "Bijih Perak",
    "description": "Bijih perak yang bersinar, efektif melawan monster kegelapan.",
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
        "Wyrms Tooth Peaks",
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "golem_core",
    "name": "Inti Golem",
    "description": "Inti kekuatan yang menggerakkan golem.",
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
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "ruby",
    "name": "Ruby",
    "description": "Permata merah menyala yang menyimpan energi api.",
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
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "gold_ore",
    "name": "Bijih Emas",
    "description": "Bijih emas murni yang sangat berharga.",
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
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "shadow_crystal",
    "name": "Kristal Bayangan",
    "description": "Kristal gelap yang menyerap cahaya, bahan untuk sihir ilusi.",
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
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "mythril_ore",
    "name": "Bijih Mythril",
    "description": "Bijih legendaris yang sangat ringan namun lebih kuat dari baja.",
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
        "Crystalgrove Deeps",
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "feathers",
    "name": "Bulu Kasar",
    "description": "Bulu dari burung gunung biasa.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "copper_ore",
    "name": "Bijih Tembaga",
    "description": "Bijih logam yang paling umum, mudah ditemukan.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "mountain_flower",
    "name": "Bunga Gunung",
    "description": "Bunga langka yang tumbuh di ketinggian.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "harpy_feather",
    "name": "Bulu Harpy",
    "description": "Bulu dari monster harpy yang berbahaya. Ringan dan kuat.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "obsidian",
    "name": "Obsidian",
    "description": "Batuan vulkanik hitam yang tajam seperti kaca.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "wyvern_egg",
    "name": "Telur Wyvern",
    "description": "Telur Wyvern yang belum menetas, sangat berharga bagi kolektor.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "sapphire",
    "name": "Safir",
    "description": "Permata biru yang melambangkan kebijaksanaan.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "griffin_claw",
    "name": "Cakar Griffin",
    "description": "Cakar tajam dari seekor Griffin.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "adamantite_ore",
    "name": "Bijih Adamantite",
    "description": "Bijih langka yang sangat berat dan kuat, hanya ditemukan di pegunungan terjal.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "dragon_scale",
    "name": "Sisik Naga",
    "description": "Sisik keras dari naga purba. Sangat tahan api dan sihir.",
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
        "Wyrms Tooth Peaks"
      ],
      "source": "gather"
    }
  },
  {
    "code": "reeds",
    "name": "Alang-alang Rawa",
    "description": "Batang alang-alang yang tinggi dan kuat dari rawa.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "common_fish",
    "name": "Ikan Biasa",
    "description": "Ikan kecil yang umum di rawa.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "swamp_gas_vial",
    "name": "Gas Rawa Botolan",
    "description": "Gas metana dari rawa yang ditangkap dalam botol.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "serpent_eel",
    "name": "Belut Ular",
    "description": "Belut air tawar yang panjang dan licin.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "leech_blood",
    "name": "Darah Lintah",
    "description": "Darah yang dihisap oleh lintah rawa, digunakan dalam ramuan aneh.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "giant_frog_leg",
    "name": "Paha Katak Raksasa",
    "description": "Paha berotot dari katak rawa raksasa, bahan masakan eksotis.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "monster_fang",
    "name": "Taring Monster",
    "description": "Taring tajam dari monster.",
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
        "Sunken Serenity",
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "will_o_wisp",
    "name": "Esensi Will-o-Wisp",
    "description": "Cahaya hantu yang ditangkap dari rawa, sumber energi sihir.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "hydra_scale",
    "name": "Sisik Hydra",
    "description": "Sisik basah dan tebal dari Hydra yang legendaris.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "black_lotus",
    "name": "Teratai Hitam",
    "description": "Bunga teratai yang sangat langka, bahan utama untuk ramuan kuat.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "old_boot",
    "name": "Sepatu Bot Tua",
    "description": "Sepatu bot kulit yang sudah usang dan berlubang.",
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
        "Sunken Serenity",
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "rusty_can",
    "name": "Kaleng Berkarat",
    "description": "Kaleng berkarat yang dibuang ke perairan.",
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
        "Sunken Serenity",
        "Crystalgrove Deeps"
      ],
      "source": "gather"
    }
  },
  {
    "code": "bottle_message",
    "name": "Pesan dalam Botol",
    "description": "Sebuah botol dengan gulungan kertas di dalamnya.",
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
        "Sunken Serenity"
      ],
      "source": "gather"
    }
  },
  {
    "code": "diamon_sword",
    "name": "Pedang Berlian",
    "description": "Pedang Berlian bukanlah senjata yang ditempa di api biasa. Legenda mengatakan pedang ini ditempa dari pecahan meteorit yang jatuh di lembah terlarang, lalu dipadukan dengan debu intan yang hanya muncul sekali setiap seribu tahun.",
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
    "description": "Tepung halus dari gandum.",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 10,
    "sell_price": 50,
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
    "description": "Gula dari buah manis.",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 15,
    "sell_price": 60,
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
    "description": "Batangan besi hasil peleburan.",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 50,
    "sell_price": 400,
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
    "description": "Kulit hewan yang diolah.",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 25,
    "sell_price": 300,
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
    "description": "Bubuk kristal penyimpan energi sihir.",
    "category": "material",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 100,
    "sell_price": 250,
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
    "description": "Ramuan penyembuhan dasar.",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 100,
    "sell_price": 250,
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
    "description": "Meningkatkan Speed sebesar 25% selama 5 menit.",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 350,
    "sell_price": 700,
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
    "description": "Meningkatkan Attack sebesar 20% selama 3 menit.",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 500,
    "sell_price": 850,
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
    "description": "Benang kuat yang dipintal dari wol.",
    "category": "material",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 20,
    "sell_price": 120,
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
    "description": "Wol dari domba liar, dapat dipintal menjadi benang.",
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
        "Veridian Labyrinth",
        "Wyrms Tooth Peaks"
      ]
    }
  },
  {
    "code": "bread",
    "name": "Roti",
    "description": "Roti hangat yang mengenyangkan.",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 20,
    "sell_price": 100,
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
    "description": "Potongan daging yang dipanggang.",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 50,
    "sell_price": 300,
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
    "description": "Regenerasi HP pasif di luar pertarungan selama 30 menit.",
    "category": "consumable",
    "rarity": "common",
    "equip_slot": null,
    "buy_price": 150,
    "sell_price": 300,
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
    "description": "Meningkatkan peluang critical hit sebesar 5% selama 20 menit.",
    "category": "consumable",
    "rarity": "uncommon",
    "equip_slot": null,
    "buy_price": 300,
    "sell_price": 600,
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
    "description": "Pedang dasar dari kayu.",
    "category": "weapon",
    "rarity": "common",
    "equip_slot": "weapon",
    "buy_price": 1000,
    "sell_price": 2500,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 10,
    "metadata": {
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
    "description": "Armor ringan dari kulit keras.",
    "category": "armor",
    "rarity": "uncommon",
    "equip_slot": "body",
    "buy_price": 4000,
    "sell_price": 10000,
    "stackable": 0,
    "max_stack": 1,
    "tradeable": 1,
    "weight": 18,
    "metadata": {
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
    "description": "Sebuah telur hangat dengan corak bintik-bintik. Sepertinya akan segera menetas.",
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
    "description": "Telur yang transparan seperti kristal, memancarkan cahaya redup dari dalamnya.",
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
    "description": "Telur dengan cangkang keras seperti sisik reptil.",
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
  }
];

export const GEMSTONE_ENCHANTS = [
  {
    "gem_code": "quartz",
    "slot": "weapon",
    "description": "+10% kerusakan pada Mana musuh",
    "stats": {}
  },
  {
    "gem_code": "quartz",
    "slot": "armor",
    "description": "+5% Regenerasi Mana",
    "stats": {}
  },
  {
    "gem_code": "amethyst",
    "slot": "weapon",
    "description": "Lifesteal 2% dari kerusakan yang diberikan.",
    "stats": {}
  },
  {
    "gem_code": "amethyst",
    "slot": "armor",
    "description": "+5% Max HP",
    "stats": {
      "maxHp": 5
    }
  },
  {
    "gem_code": "topaz",
    "slot": "weapon",
    "description": "+10% Peluang Critical Hit.",
    "stats": {}
  },
  {
    "gem_code": "topaz",
    "slot": "armor",
    "description": "+10 Speed.",
    "stats": {
      "speed": 10
    }
  },
  {
    "gem_code": "sapphire",
    "slot": "weapon",
    "description": "15% peluang memperlambat musuh.",
    "stats": {}
  },
  {
    "gem_code": "sapphire",
    "slot": "armor",
    "description": "+15% Magic Defense.",
    "stats": {
      "defense": 15
    }
  },
  {
    "gem_code": "diamond",
    "slot": "weapon",
    "description": "+10% Kerusakan Serangan Dasar.",
    "stats": {
      "attack": 10
    }
  },
  {
    "gem_code": "diamond",
    "slot": "armor",
    "description": "5% peluang blok total.",
    "stats": {}
  }
];

export const WORLD_MONSTERS = [
  {
    "code": "goblin",
    "name": "Goblin Pencuri",
    "description": "Makhluk kecil licik yang bergerak berkelompok dan suka mencuri.",
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
      "Veridian Labyrinth",
      "Crystalgrove Deeps"
    ],
    "is_boss": false
  },
  {
    "code": "wild_boar",
    "name": "Babi Hutan Liar",
    "description": "Hewan teritorial dengan taring tajam.",
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
      "Veridian Labyrinth"
    ],
    "is_boss": false
  },
  {
    "code": "forest_spider",
    "name": "Laba-laba Hutan",
    "description": "Laba-laba predator penjebak mangsa dengan jaring sutra.",
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
      "Veridian Labyrinth",
      "Crystalgrove Deeps"
    ],
    "is_boss": false
  },
  {
    "code": "minotaur",
    "name": "Minotaur",
    "description": "Monster setengah manusia setengah banteng penjaga labirin kuno.",
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
      "Veridian Labyrinth"
    ],
    "is_boss": false
  },
  {
    "code": "giant_bat",
    "name": "Kelelawar Raksasa",
    "description": "Kelelawar penghuni gua berukuran tidak wajar.",
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
      "Crystalgrove Deeps"
    ],
    "is_boss": false
  },
  {
    "code": "slime",
    "name": "Slime Gua",
    "description": "Gumpalan cairan lengket yang menyerap apa saja di sekitarnya.",
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
      "Crystalgrove Deeps",
      "Sunken Serenity"
    ],
    "is_boss": false
  },
  {
    "code": "stone_golem",
    "name": "Golem Batu",
    "description": "Sebongkah batu yang dihidupkan sihir kuno, pukulannya lambat namun mematikan.",
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
      "Crystalgrove Deeps"
    ],
    "is_boss": false
  },
  {
    "code": "harpy",
    "name": "Harpy",
    "description": "Monster setengah wanita setengah burung dengan pekikan mematikan.",
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
      "Wyrms Tooth Peaks"
    ],
    "is_boss": false
  },
  {
    "code": "wyvern",
    "name": "Wyvern Muda",
    "description": "Kerabat jauh naga yang lebih kecil dan ganas.",
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
      "Wyrms Tooth Peaks"
    ],
    "is_boss": false
  },
  {
    "code": "swamp_serpent",
    "name": "Ular Rawa",
    "description": "Ular raksasa yang bersembunyi di perairan keruh.",
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
      "Sunken Serenity"
    ],
    "is_boss": false
  },
  {
    "code": "goblin_chieftain",
    "name": "Kepala Suku Goblin",
    "description": "Goblin veteran yang selamat dari puluhan pertempuran.",
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
    "description": "Penjaga kuno Kuil Tenggelam, tiap tetes darahnya menumbuhkan kepala baru.",
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
    "description": "Griffin alpha penguasa Puncak Langit.",
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
export function seedWorldContent(db) {
  const insertBiome = db.prepare(`
    INSERT INTO biomes (code, name, description, is_hidden, unlocked_by)
    VALUES (@code, @name, @description, @is_hidden, @unlocked_by)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name, description = excluded.description,
      is_hidden = excluded.is_hidden, unlocked_by = excluded.unlocked_by
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
