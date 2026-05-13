const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DBSOURCE = process.env.DB_PATH || path.join(__dirname, "db.sqlite");

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error("Erreur de connexion à SQLite:", err.message);
        throw err;
    } else {
        console.log('Connecté à la base de données SQLite.');
        
        // Configuration initiale robuste
        db.serialize(() => {
            // Table Produits
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name text, 
                description text, 
                price REAL,
                image text,
                category text,
                stock INTEGER DEFAULT 10,
                video_url text
            )`, (err) => {
                if (err) console.error("Erreur table products:", err.message);
            });

            // Table Commandes
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NULL,
                customer_name text,
                customer_phone text,
                address text,
                payment_method text,
                payment_ref text,
                total REAL,
                items text, 
                status text DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error("Erreur table orders:", err.message);
                else {
                    db.run("ALTER TABLE orders ADD COLUMN items text", () => {});
                    db.run("ALTER TABLE orders ADD COLUMN customer_phone text", () => {});
                    db.run("ALTER TABLE orders ADD COLUMN user_id INTEGER NULL", () => {});
                }
            });

            // Table Customers (Clients B2C)
            db.run(`CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name text NOT NULL,
                phone text UNIQUE NOT NULL,
                password_hash text NOT NULL,
                delivery_zone text,
                address text,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error("Erreur table customers:", err.message);
            });

            // Table Vendeurs (Marketplace)
            db.run(`CREATE TABLE IF NOT EXISTS sellers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_name text NOT NULL,
                owner_name text NOT NULL,
                phone text NOT NULL,
                email text,
                category text NOT NULL,
                password_hash text,
                status text DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error("Erreur table sellers:", err.message);
            });

            // Table Zones de Livraison
            db.run(`CREATE TABLE IF NOT EXISTS delivery_zones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name text UNIQUE,
                price REAL
            )`, (err) => {
                if (err) console.error("Erreur table delivery_zones:", err.message);
                else {
                    // Zones par défaut (l'admin pourra les modifier/supprimer plus tard)
                    db.run("INSERT OR IGNORE INTO delivery_zones (name, price) VALUES ('Kaloum', 20000)");
                    db.run("INSERT OR IGNORE INTO delivery_zones (name, price) VALUES ('Ratoma - Kipé/Taouyah', 25000)");
                    db.run("INSERT OR IGNORE INTO delivery_zones (name, price) VALUES ('Ratoma - Cosa/Nongo', 30000)");
                    db.run("INSERT OR IGNORE INTO delivery_zones (name, price) VALUES ('Dixinn', 20000)");
                    db.run("INSERT OR IGNORE INTO delivery_zones (name, price) VALUES ('Matam', 25000)");
                    db.run("INSERT OR IGNORE INTO delivery_zones (name, price) VALUES ('Matoto - Aéroport/Gbessia', 30000)");
                    db.run("INSERT OR IGNORE INTO delivery_zones (name, price) VALUES ('Matoto - Entag/Coyah', 50000)");
                }
            });

            // Table Avis Produits
            db.run(`CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER,
                user_name text,
                rating INTEGER,
                comment text,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products (id)
            )`, (err) => {
                if (err) console.error("Erreur table reviews:", err.message);
            });

            // Table Candidatures Vendeurs (Marketplace)
            db.run(`CREATE TABLE IF NOT EXISTS seller_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_name text,
                contact_name text,
                phone text,
                email text,
                category text,
                status text DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error("Erreur table seller_requests:", err.message);
            });

            // Table Newsletter Abonnés
            db.run(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email text UNIQUE,
                subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) console.error("Erreur table newsletter_subscribers:", err.message);
            });

            // Table Utilisateurs (Admin & Clients)
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username text UNIQUE,
                password text,
                role text DEFAULT 'admin' -- 'admin' ou 'customer'
            )`, () => {
                const bcrypt = require('bcryptjs');
                const adminHash = bcrypt.hashSync('admin123', 8);
                db.run("INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', ?, 'admin')", [adminHash], (err) => {
                    if (!err) {
                        // Une fois l'admin créé, on vérifie s'il faut peupler les produits
                        seedProductsIfEmpty();
                    }
                });
            });
        });
    }
});

function seedProductsIfEmpty() {
    db.get("SELECT COUNT(*) as count FROM products", [], (err, row) => {
        if (err || (row && row.count > 0)) return;

        console.log("🌱 Base de données vide. Amorce des produits par défaut...");
        
        const initialProducts = [
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
                description: "Les AirPods 4 redéfinissent le confort avec un nouveau design ouvert et une puissante Réduction active du bruit. Puce H2, Audio Spatial, mode Transparence, jusqu'à 30h d'autonomie avec le boîtier. Résistant à l'eau et à la transpiration (IP54).",
                price: 1650000,
                stock: 20,
                category: "Écouteurs",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MUWY3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1724072683595"
            },
            {
                name: "Apple AirPods 4",
                description: "Les AirPods 4 avec un tout nouveau design ergonomique et confortable. Son de haute qualité avec puce H2, Audio Spatial avec suivi de la tête, mode Transparence. Jusqu'à 30h d'autonomie cumulative.",
                price: 1250000,
                stock: 25,
                category: "Écouteurs",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MUXP3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1724072683595"
            },
            {
                name: "Apple AirPods Max - Minuit",
                description: "AirPods Max : une expérience audio hors du commun dans un casque supra-auriculaire premium. Réduction active du bruit, Audio Computationnel, Audio Spatial. Puce H1 dans chaque oreillette.",
                price: 4500000,
                stock: 8,
                category: "Casque Audio",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQTP3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1694014975863"
            },
            {
                name: "Apple AirPods Max - Lumière Stellaire",
                description: "AirPods Max dans un coloris Lumière Stellaire élégant. Casque supra-auriculaire haut de gamme avec Réduction active du bruit avancée et Audio Spatial.",
                price: 4500000,
                stock: 6,
                category: "Casque Audio",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQTQ3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1694014975863"
            },
            {
                name: "Apple AirPods Max - Rose",
                description: "AirPods Max en coloris Rose pastel. Le casque premium d'Apple avec Réduction active du bruit, mode Transparence adaptatif et Audio Spatial immersif.",
                price: 4500000,
                stock: 5,
                category: "Casque Audio",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQTJ3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1694014975863"
            },
            {
                name: "Apple AirPods (2ème Génération)",
                description: "Les AirPods classiques avec puce H1 pour une connexion ultra-rapide. Jusqu'à 24h d'autonomie avec le boîtier de charge.",
                price: 850000,
                stock: 30,
                category: "Écouteurs",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MV7N2?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1551489688000"
            },
            {
                name: "Apple AirPods (3ème Génération)",
                description: "AirPods 3ème génération avec nouveau design redessiné. Audio Spatial avec suivi dynamique de la tête. Jusqu'à 30h d'autonomie avec le boîtier.",
                price: 1150000,
                stock: 18,
                category: "Écouteurs",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MME73?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1632925958000"
            },
            {
                name: "Coque AirPods Pro 2 MagSafe - Transparente",
                description: "Coque de protection officielle Apple pour AirPods Pro (2ème génération). Compatible MagSafe. Protection contre les rayures et chocs.",
                price: 120000,
                stock: 50,
                category: "Accessoires",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQHM3?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1660803972361"
            },
            {
                name: "Coque AirPods Pro - Silicone Noir",
                description: "Coque en silicone de qualité premium pour AirPods Pro. Protection totale contre les chocs et égratignures. Matière antidérapante.",
                price: 85000,
                stock: 40,
                category: "Accessoires",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MWN83?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1597872247000"
            },
            {
                name: "Câble de Charge USB-C vers MagSafe",
                description: "Câble Apple USB-C vers MagSafe pour charger votre boîtier AirPods Pro 2 ou AirPods 4. Longueur 1 mètre, tressage nylon.",
                price: 95000,
                stock: 60,
                category: "Accessoires",
                image: "https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MK0X2FE?wid=800&hei=800&fmt=jpeg&qlt=90&.v=1607635857000"
            }
        ];

        initialProducts.forEach(p => {
            db.run(
                "INSERT INTO products (name, description, price, stock, category, image, is_approved) VALUES (?, ?, ?, ?, ?, ?, 1)",
                [p.name, p.description, p.price, p.stock, p.category, p.image]
            );
        });
        console.log("✅ Produits d'amorce ajoutés avec succès.");
    });
}

// ==========================================
// MIGRATIONS & MAINTENANCE
// ==========================================

// Fonction pour ajouter une colonne si elle n'existe pas
function addColumnIfNotExists(tableName, columnName, definition) {
    db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) return;
        const exists = columns.some(c => c.name === columnName);
        if (!exists) {
            console.log(`🔧 Migration : Ajout de la colonne ${columnName} à ${tableName}...`);
            db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`, (err) => {
                if (err) console.error(`❌ Erreur migration ${columnName}:`, err.message);
                else console.log(`✅ Colonne ${columnName} ajoutée.`);
            });
        }
    });
}

// Exécution des migrations nécessaires
addColumnIfNotExists('products', 'seller_id', 'INTEGER NULL');
addColumnIfNotExists('products', 'is_approved', 'INTEGER DEFAULT 1');
addColumnIfNotExists('orders', 'items', 'TEXT');
addColumnIfNotExists('orders', 'customer_phone', 'TEXT');
addColumnIfNotExists('orders', 'user_id', 'INTEGER NULL');

module.exports = db;
