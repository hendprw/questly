export const CLAIM_TYPES = {
    daily: {
        aliases: ['d', 'harian'],
        cooldown: 24 * 60 * 60, // in seconds
        rewards: {
            cash: 500,
            exp: 100,
            items: {
                wood: 4
            }
        },
        message: "Kamu berhasil mengklaim hadiah harianmu!"
    },
    weekly: {
        aliases: ['w', 'mingguan'],
        cooldown: 7 * 24 * 60 * 60, // in seconds
        rewards: {
            cash: 2500,
            gems: 5,
            items: {
                health_potion: 2
            }
        },
        message: "Hadiah mingguan berhasil diambil! Sampai jumpa minggu depan."
    },
    monthly: {
        aliases: ['m', 'bulanan'],
        cooldown: 30 * 24 * 60 * 60, // in seconds
        rewards: {
            gems: 3,
            exp: 5000,
            items: {
                "mythril_ore": 1 
            }
        },
        message: "Wow! Hadiah bulananmu luar biasa! Terima kasih sudah aktif bermain."
    }
};
