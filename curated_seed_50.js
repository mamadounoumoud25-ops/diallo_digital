const db = require('./db/database');

const products = [
    // AUDIO APPLE (8 items)
    {
        name: "AirPods Pro 2 (USB-C)",
        description: "Les derniers AirPods Pro avec réduction active du bruit de niveau supérieur et son immersif.",
        price: 3200000,
        category: "Audio Apple",
        image: "https://m.media-amazon.com/images/I/61f1YfTkTDL._AC_SX679_.jpg",
        stock: 25
    },
    {
        name: "AirPods Max - Gris Sidéral",
        description: "Casque circum-auriculaire offrant un son haute fidélité et une annulation active du bruit incroyable.",
        price: 6500000,
        category: "Audio Apple",
        image: "https://m.media-amazon.com/images/I/81xUAMXlsEL._AC_SX679_.jpg",
        stock: 5
    },
    {
        name: "AirPods Max - Argent",
        description: "L'élégance de l'Argent alliée à la performance acoustique d'Apple.",
        price: 6500000,
        category: "Audio Apple",
        image: "https://m.media-amazon.com/images/I/81PQT-pR6AL._AC_SX679_.jpg",
        stock: 3
    },
    {
        name: "AirPods 3ème Génération",
        description: "Tout nouveau design avec audio spatial et recharge MagSafe.",
        price: 2100000,
        category: "Audio Apple",
        image: "https://m.media-amazon.com/images/I/615ekapl+pL._AC_SX679_.jpg",
        stock: 30
    },
    {
        name: "AirPods 2ème Génération",
        description: "Les classiques d'Apple. Simplicité et performance sans fil.",
        price: 1350000,
        category: "Audio Apple",
        image: "https://m.media-amazon.com/images/I/7120GgUKj3L._AC_SX679_.jpg",
        stock: 50
    },
    {
        name: "Beats Studio Pro - Noir",
        description: "Le son légendaire de Beats avec annulation du bruit et audio spatial.",
        price: 3500000,
        category: "Audio Apple",
        image: "https://m.media-amazon.com/images/I/51+uA1M4BmL._AC_SX679_.jpg",
        stock: 10
    },
    {
        name: "HomePod Mini - Bleu",
        description: "Une enceinte compacte avec un son étonnamment puissant pour sa taille.",
        price: 1500000,
        category: "Audio Apple",
        image: "https://m.media-amazon.com/images/I/61mOnW-v9tL._AC_SX679_.jpg",
        stock: 12
    },
    {
        name: "Powerbeats Pro - Noir",
        description: "Écouteurs sport totalement sans fil, résistants à la sueur et à l'eau.",
        price: 2400000,
        category: "Audio Apple",
        image: "https://m.media-amazon.com/images/I/61P9TsuQ60L._AC_SX679_.jpg",
        stock: 8
    },

    // AUDIO PREMIUM (12 items)
    {
        name: "Sony WH-1000XM5 - Noir",
        description: "Le leader du marché en réduction de bruit et qualité sonore exceptionnelle.",
        price: 4200000,
        category: "Casques",
        image: "https://m.media-amazon.com/images/I/61+96u+Ww+L._AC_SX679_.jpg",
        stock: 15
    },
    {
        name: "Sony WF-1000XM5 Black",
        description: "La meilleure réduction de bruit au monde dans des écouteurs compacts.",
        price: 2800000,
        category: "Audio Tech",
        image: "https://m.media-amazon.com/images/I/61S-l1u9EKL._AC_SX679_.jpg",
        stock: 20
    },
    {
        name: "Bose QuietComfort Ultra",
        description: "Audio immersif et réduction de bruit légendaire par Bose.",
        price: 4800000,
        category: "Casques",
        image: "https://m.media-amazon.com/images/I/51y19Jg69jL._AC_SX679_.jpg",
        stock: 10
    },
    {
        name: "Bose QC Earbuds II",
        description: "Réduction de bruit personnalisée à votre oreille.",
        price: 2600000,
        category: "Audio Tech",
        image: "https://m.media-amazon.com/images/I/51OaEqxW4dL._AC_SX679_.jpg",
        stock: 15
    },
    {
        name: "Sennheiser Momentum 4",
        description: "Son haute fidélité et autonomie record de 60 heures.",
        price: 3900000,
        category: "Casques",
        image: "https://m.media-amazon.com/images/I/71Xm049O22L._AC_SX679_.jpg",
        stock: 5
    },
    {
        name: "JBL Tour One M2",
        description: "Un son pur et une technologie de réduction de bruit adaptative.",
        price: 3200000,
        category: "Casques",
        image: "https://m.media-amazon.com/images/I/61+vYpY69DL._AC_SX679_.jpg",
        stock: 8
    },
    {
        name: "Marshall Major IV Black",
        description: "Design iconique, plus de 80 heures d'autonomie sans fil.",
        price: 1800000,
        category: "Casques",
        image: "https://m.media-amazon.com/images/I/617vK4V84pL._AC_SX679_.jpg",
        stock: 25
    },
    {
        name: "Marshall Monitor II A.N.C.",
        description: "Son premium inspiré de la scène rock avec réduction de bruit.",
        price: 2900000,
        category: "Casques",
        image: "https://m.media-amazon.com/images/I/71S9L8wN7pL._AC_SX679_.jpg",
        stock: 5
    },
    {
        name: "Jabra Elite 10 - Titanium",
        description: "Écouteurs polyvalents pour le travail et la vie quotidienne.",
        price: 2400000,
        category: "Audio Tech",
        image: "https://m.media-amazon.com/images/I/71R3yL2L-XL._AC_SX679_.jpg",
        stock: 15
    },
    {
        name: "Soundcore Life Q30",
        description: "Excellent rapport qualité/prix avec réduction de bruit active.",
        price: 950000,
        category: "Casques",
        image: "https://m.media-amazon.com/images/I/61S6h9v6oOL._AC_SX679_.jpg",
        stock: 40
    },
    {
        name: "Soundcore Liberty 4 NC",
        description: "Réduction de bruit certifiée Hi-Res pour un prix imbattable.",
        price: 1200000,
        category: "Audio Tech",
        image: "https://m.media-amazon.com/images/I/51TjP6W1m4L._AC_SX679_.jpg",
        stock: 20
    },
    {
        name: "B&W Px7 S2e - Forest",
        description: "Casque audiophile mêlant design luxueux et son exceptionnel.",
        price: 4500000,
        category: "Casques",
        image: "https://m.media-amazon.com/images/I/71-0Y4eI9gL._AC_SX679_.jpg",
        stock: 3
    },

    // SMARTPHONES & TABLETTES (10 items)
    {
        name: "iPhone 15 Pro Max 256GB",
        description: "Le summum de la technologie Apple : Titane, puce A17 Pro et Zoom 5x.",
        price: 16500000,
        category: "Smartphones",
        image: "https://m.media-amazon.com/images/I/81+GI70zYHL._AC_SX679_.jpg",
        stock: 5
    },
    {
        name: "iPhone 15 128GB - Bleu",
        description: "Design en verre teinté, Dynamic Island et caméra 48 Mpx.",
        price: 10500000,
        category: "Smartphones",
        image: "https://m.media-amazon.com/images/I/71d7rjTSy9L._AC_SX679_.jpg",
        stock: 10
    },
    {
        name: "iPhone 14 128GB - Mauve",
        description: "Performance fiable, autonomie longue durée et photos superbes.",
        price: 8500000,
        category: "Smartphones",
        image: "https://m.media-amazon.com/images/I/619m8rLBWUL._AC_SX679_.jpg",
        stock: 8
    },
    {
        name: "Samsung Galaxy S24 Ultra",
        description: "Le fleuron Android avec Galaxy AI et un écran ultra lumineux.",
        price: 15000000,
        category: "Smartphones",
        image: "https://m.media-amazon.com/images/I/71Rza7bJCML._AC_SL1500_.jpg",
        stock: 4
    },
    {
        name: "Samsung Galaxy Z Fold 5",
        description: "L'écran pliable ultime pour la productivité et le divertissement.",
        price: 18000000,
        category: "Smartphones",
        image: "https://m.media-amazon.com/images/I/716n6vjgSlL._AC_SL1500_.jpg",
        stock: 2
    },
    {
        name: "iPad Air M2 11 - 128GB",
        description: "Puissance de la puce M2 dans un design léger et coloré.",
        price: 8500000,
        category: "Tablettes",
        image: "https://m.media-amazon.com/images/I/61N6K6l9L2L._AC_SL1500_.jpg",
        stock: 6
    },
    {
        name: "iPad Pro M4 13 - 256GB",
        description: "L'écran Ultra Retina XDR et la finesse record du M4.",
        price: 18500000,
        category: "Tablettes",
        image: "https://m.media-amazon.com/images/I/61Ym7nN1mXL._AC_SL1500_.jpg",
        stock: 3
    },
    {
        name: "Google Pixel 8 Pro - Obsidian",
        description: "Le meilleur de l'IA Google avec un appareil photo exceptionnel.",
        price: 11000000,
        category: "Smartphones",
        image: "https://m.media-amazon.com/images/I/81S7H4q5k1L._AC_SL1500_.jpg",
        stock: 5
    },
    {
        name: "OnePlus 12 - Silky Black",
        description: "Performances extrêmes et recharge ultra rapide.",
        price: 9500000,
        category: "Smartphones",
        image: "https://m.media-amazon.com/images/I/718X8c9L7vL._AC_SL1500_.jpg",
        stock: 4
    },
    {
        name: "Apple Watch Series 9",
        description: "Capteurs de santé avancés et geste 'Toucher deux fois'.",
        price: 5200000,
        category: "Accessoires",
        image: "https://m.media-amazon.com/images/I/71m6L9q2L8L._AC_SL1500_.jpg",
        stock: 12
    },

    // GAMING & CONSOLES (10 items)
    {
        name: "PlayStation 5 Slim (Disc Version)",
        description: "Design plus fin, performances 4K et chargement ultra-rapide.",
        price: 6800000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/51051HiS9OL._AC_SL1500_.jpg",
        stock: 10
    },
    {
        name: "Xbox Series X 1TB",
        description: "La console la plus puissante jamais conçue par Microsoft.",
        price: 6500000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/61JGkhqxHxL._AC_SL1500_.jpg",
        stock: 5
    },
    {
        name: "Nintendo Switch OLED - Blanc",
        description: "Écran OLED vibrant pour jouer partout, en haute définition.",
        price: 4500000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/61Z7mP+P-WL._AC_SL1500_.jpg",
        stock: 12
    },
    {
        name: "Manette DualSense Edge",
        description: "Manette pro personnalisable pour des performances ultimes sur PS5.",
        price: 2600000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/61v0p4u-mVL._AC_SL1500_.jpg",
        stock: 6
    },
    {
        name: "Razer BlackShark V2 Pro",
        description: "Casque e-sport sans fil avec micro de qualité professionnelle.",
        price: 1900000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/616vYq-mZML._AC_SL1500_.jpg",
        stock: 10
    },
    {
        name: "SteelSeries Arctis Nova Pro",
        description: "Le maître incontesté de l'audio haute fidélité pour le jeu.",
        price: 3800000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/61vYpJ-P9ML._AC_SL1500_.jpg",
        stock: 4
    },
    {
        name: "Logitech G Pro X Superlight 2",
        description: "La souris la plus légère et rapide utilisée par les pros.",
        price: 1600000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/51H-mP+P0ML._AC_SL1500_.jpg",
        stock: 8
    },
    {
        name: "ASUS ROG Ally Z1 Extreme",
        description: "Console PC portable ultra-puissante pour jouer n'importe où.",
        price: 9500000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/71Y-l1u9EKL._AC_SL1500_.jpg",
        stock: 3
    },
    {
        name: "Clavier Razer Huntsman V3 Pro",
        description: "Switches optiques analogiques pour une réactivité maximale.",
        price: 2400000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/61vYp-P99ML._AC_SL1500_.jpg",
        stock: 5
    },
    {
        name: "Eldorado Gaming Desk",
        description: "Bureau ergonomique avec gestion des câbles intégrée.",
        price: 3500000,
        category: "Gaming",
        image: "https://m.media-amazon.com/images/I/41-0Y4eI9gL._AC_SL1500_.jpg",
        stock: 2
    },

    // ACCESSOIRES & LIFESTYLE (10 items)
    {
        name: "JBL Flip 6 - Black",
        description: "L'enceinte portable étanche avec un son puissant et profond.",
        price: 1600000,
        category: "Enceintes",
        image: "https://m.media-amazon.com/images/I/61S-l1u9EKL._AC_SX679_.jpg",
        stock: 25
    },
    {
        name: "Marshall Emberton II",
        description: "Le son légendaire dans une petite enceinte portable magnifique.",
        price: 2100000,
        category: "Enceintes",
        image: "https://m.media-amazon.com/images/I/71v-l1u9EKL._AC_SX679_.jpg",
        stock: 12
    },
    {
        name: "Sonos Era 100 - White",
        description: "Nouvelle icône de l'audio home intelligent avec son stéréo.",
        price: 3500000,
        category: "Enceintes",
        image: "https://m.media-amazon.com/images/I/51H-mP+P0ML._AC_SL1500_.jpg",
        stock: 6
    },
    {
        name: "DJI Mini 4 Pro Fly More",
        description: "Drone ultra-léger avec capteurs d'obstacles et vidéo 4K HDR.",
        price: 14500000,
        category: "Photo & Drone",
        image: "https://m.media-amazon.com/images/I/61v-l1u9EKL._AC_SL1500_.jpg",
        stock: 2
    },
    {
        name: "GoPro HERO12 Black",
        description: "L'action cam par excellence avec stabilisation HyperSmooth 6.0.",
        price: 4900000,
        category: "Photo & Drone",
        image: "https://m.media-amazon.com/images/I/51H-mP+P0ML._AC_SL1500_.jpg",
        stock: 8
    },
    {
        name: "Apple AirTag (Pack de 4)",
        description: "Ne perdez plus jamais vos objets de valeur.",
        price: 1400000,
        category: "Accessoires",
        image: "https://m.media-amazon.com/images/I/616-l1u9EKL._AC_SL1500_.jpg",
        stock: 20
    },
    {
        name: "Chargeur MagSafe Apple",
        description: "La recharge sans fil simplifiée et magnétique.",
        price: 650000,
        category: "Accessoires",
        image: "https://m.media-amazon.com/images/I/51H-mP+P0ML._AC_SL1500_.jpg",
        stock: 40
    },
    {
        name: "Belkin 3-in-1 MagSafe",
        description: "Rechargez votre iPhone, Watch et AirPods simultanément.",
        price: 1850000,
        category: "Accessoires",
        image: "https://m.media-amazon.com/images/I/61-l1u9EKL._AC_SL1500_.jpg",
        stock: 15
    },
    {
        name: "Insta360 X3 Camera",
        description: "Capturez tout à 360 degrés en 5.7K haute résolution.",
        price: 6500000,
        category: "Photo & Drone",
        image: "https://m.media-amazon.com/images/I/51-l1u9EKL._AC_SL1500_.jpg",
        stock: 4
    },
    {
        name: "Philips Hue Go 2.0",
        description: "Lampe connectée portable pour une ambiance parfaite partout.",
        price: 950000,
        category: "Maison Connectée",
        image: "https://m.media-amazon.com/images/I/41-l1u9EKL._AC_SL1500_.jpg",
        stock: 15
    }
];

db.serialize(() => {
    // 1. Nettoyage total
    db.run("DELETE FROM products", function(err) {
        if (err) return console.error("Erreur vidage table:", err.message);
        
        // 2. Reset Auto-incrément
        db.run("DELETE FROM sqlite_sequence WHERE name='products'", (err) => {
            if (err) console.error("Erreur reset auto-incrément:", err.message);
            
            // 3. Insertion des 50 nouveaux produits
            const stmt = db.prepare("INSERT INTO products (name, description, price, category, image, stock, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?)");
            
            products.forEach(p => {
                stmt.run(p.name, p.description, p.price, p.category, p.image, p.stock, 1);
            });
            
            stmt.finalize((err) => {
                if (err) console.error("Erreur finalisation statement:", err.message);
                else {
                    console.log("✅ Succès : Catalogue mis à jour avec 50 produits premium.");
                    console.log("📦 Catégories : Audio, Smartphones, Gaming, Accessoires.");
                }
                process.exit(0);
            });
        });
    });
});
