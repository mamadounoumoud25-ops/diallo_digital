/**
 * Script de peuplement - Produits Apple AirPods
 * Lancez avec : node seed-airpods.js
 */

require('dotenv').config();
const db = require('./db/database');

const airpodsProducts = [
    // ══════════════════════════════════════════
    // AIRPODS PRO
    // ══════════════════════════════════════════
    {
        name: "Apple AirPods Pro 2ème Génération",
        description: "Les AirPods Pro de 2ème génération offrent une Réduction active du bruit jusqu'à 2x plus puissante. Audio Spatial personnalisé avec suivi dynamique de la tête. Boîtier de charge MagSafe avec haut-parleur intégré. Jusqu'à 30h d'autonomie avec le boîtier. Résistant à la transpiration et à l'eau (IP54). Puce H2 pour des performances audio exceptionnelles.",
        price: 1850000,
        stock: 15,
        category: "Écouteurs",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1660803972361"
    },
    {
        name: "Apple AirPods Pro 2 - USB-C",
        description: "AirPods Pro (2ème génération) avec boîtier de charge USB-C. Réduction active du bruit avancée, mode Transparence, Audio Spatial. Compatible MagSafe. Son adaptif qui ajuste l'audio selon votre environnement. Nouveauté : connexion USB-C pour une charge universelle.",
        price: 1950000,
        stock: 12,
        category: "Écouteurs",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MTJV3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1694014975863"
    },
    {
        name: "Apple AirPods 4 avec Réduction du Bruit Active",
        description: "Les AirPods 4 redéfinissent le confort avec un nouveau design ouvert et une puissante Réduction active du bruit. Puce H2, Audio Spatial, mode Transparence, jusqu'à 30h d'autonomie avec le boîtier. Résistant à l'eau et à la transpiration (IP54). Sans embouts en silicone pour un confort naturel toute la journée.",
        price: 1650000,
        stock: 20,
        category: "Écouteurs",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MUWY3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1724072683595"
    },
    {
        name: "Apple AirPods 4",
        description: "Les AirPods 4 avec un tout nouveau design ergonomique et confortable. Son de haute qualité avec puce H2, Audio Spatial avec suivi de la tête, mode Transparence. Jusqu'à 30h d'autonomie cumulative. Boîtier de charge USB-C. Résistance à la transpiration IPX4.",
        price: 1250000,
        stock: 25,
        category: "Écouteurs",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MUXP3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1724072683595"
    },
    // ══════════════════════════════════════════
    // AIRPODS MAX
    // ══════════════════════════════════════════
    {
        name: "Apple AirPods Max - Minuit",
        description: "AirPods Max : une expérience audio hors du commun dans un casque supra-auriculaire premium. Réduction active du bruit, Audio Computationnel, Audio Spatial avec suivi dynamique de la tête. Puce H1 dans chaque oreillette. Coussinets magnétiques interchangeables. Jusqu'à 20h d'écoute. Coloris Minuit.",
        price: 4500000,
        stock: 8,
        category: "Casque Audio",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQTP3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1694014975863"
    },
    {
        name: "Apple AirPods Max - Lumière Stellaire",
        description: "AirPods Max dans un coloris Lumière Stellaire élégant. Casque supra-auriculaire haut de gamme avec Réduction active du bruit avancée et Audio Spatial. Structure en aluminium anodisé et coussinets en maille. Puce H1 x2, contrôles intuitifs via la Digital Crown. Boîtier de charge USB-C inclus.",
        price: 4500000,
        stock: 6,
        category: "Casque Audio",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQTQ3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1694014975863"
    },
    {
        name: "Apple AirPods Max - Rose",
        description: "AirPods Max en coloris Rose pastel. Le casque premium d'Apple avec Réduction active du bruit, mode Transparence adaptatif et Audio Spatial immersif. Conçu pour une utilisation prolongée grâce à son coussin en maille et son arceau en aluminium léger.",
        price: 4500000,
        stock: 5,
        category: "Casque Audio",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQTJ3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1694014975863"
    },
    // ══════════════════════════════════════════
    // AIRPODS CLASSIQUES
    // ══════════════════════════════════════════
    {
        name: "Apple AirPods (2ème Génération)",
        description: "Les AirPods classiques avec puce H1 pour une connexion ultra-rapide. Jusqu'à 24h d'autonomie avec le boîtier de charge. Activation mains-libres de Siri. Résistance à la transpiration pour le sport. Son clair et net pour appels et musique. Boîtier de charge Lightning.",
        price: 850000,
        stock: 30,
        category: "Écouteurs",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MV7N2?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1551489688000"
    },
    {
        name: "Apple AirPods (3ème Génération)",
        description: "AirPods 3ème génération avec nouveau design redessiné inspiré des AirPods Pro. Audio Spatial avec suivi dynamique de la tête. Jusqu'à 30h d'autonomie avec le boîtier. Résistance à l'eau et à la transpiration IPX4. Puce H1, commande Force Sensor. Boîtier MagSafe.",
        price: 1150000,
        stock: 18,
        category: "Écouteurs",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MME73?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1632925958000"
    },
    // ══════════════════════════════════════════
    // ACCESSOIRES AIRPODS
    // ══════════════════════════════════════════
    {
        name: "Coque AirPods Pro 2 MagSafe - Transparente",
        description: "Coque de protection officielle Apple pour AirPods Pro (2ème génération). Compatible MagSafe pour une charge rapide. Protection contre les rayures et chocs. Matière silicone douce. Design transparent pour laisser voir la couleur de votre boîtier. Accès total aux boutons et ports.",
        price: 120000,
        stock: 50,
        category: "Accessoires",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQHM3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1660803972361"
    },
    {
        name: "Coque AirPods Pro - Silicone Noir",
        description: "Coque en silicone de qualité premium pour AirPods Pro. Protection totale contre les chocs et égratignures. Matière antidérapante, prise en main assurée. Compatible avec la charge sans fil. Disponible en noir mat élégant. Accès facile au bouton de couplage.",
        price: 85000,
        stock: 40,
        category: "Accessoires",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MWN83?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1597872247000"
    },
    {
        name: "Câble de Charge USB-C vers MagSafe",
        description: "Câble Apple USB-C vers MagSafe pour charger votre boîtier AirPods Pro 2 ou AirPods 4. Longueur 1 mètre, tressage nylon résistant. Compatible avec les chargeurs USB-C et adaptateurs Apple. Recharge rapide du boîtier. Idéal pour usage quotidien.",
        price: 95000,
        stock: 60,
        category: "Accessoires",
        image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MK0X2FE?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1607635857000"
    }
];

// ════════════════════════════════════════════════════
// Insertion dans la base de données
// ════════════════════════════════════════════════════
console.log("🚀 Démarrage de l'insertion des produits AirPods...\n");

let insertCount = 0;
let errorCount = 0;

const insertProduct = (product, index) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            db.run(
                `INSERT INTO products (name, description, price, stock, category, image, is_approved) VALUES (?, ?, ?, ?, ?, ?, 1)`,
                [product.name, product.description, product.price, product.stock, product.category, product.image],
                function(err) {
                    if (err) {
                        console.error(`❌ Erreur pour "${product.name}": ${err.message}`);
                        errorCount++;
                    } else {
                        console.log(`✅ [${index + 1}/${airpodsProducts.length}] Ajouté: ${product.name} (ID: ${this.lastID})`);
                        insertCount++;
                    }
                    resolve();
                }
            );
        }, index * 150); // délai de 150ms entre chaque insertion
    });
};

// Exécuter toutes les insertions
(async () => {
    for (let i = 0; i < airpodsProducts.length; i++) {
        await insertProduct(airpodsProducts[i], i);
    }

    setTimeout(() => {
        console.log(`\n════════════════════════════════════`);
        console.log(`✅ Terminé ! ${insertCount} produit(s) ajouté(s)`);
        if (errorCount > 0) console.log(`❌ ${errorCount} erreur(s)`);
        console.log(`════════════════════════════════════`);
        console.log(`🌐 Relancez votre serveur et visitez votre site pour voir les produits !`);
        process.exit(0);
    }, airpodsProducts.length * 150 + 500);
})();
