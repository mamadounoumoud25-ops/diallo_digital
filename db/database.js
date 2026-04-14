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
                db.run("INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', ?, 'admin')", [adminHash]);
            });
        });
    }
});

// Migrations Silencieuses pour les vendeurs
db.run("ALTER TABLE products ADD COLUMN seller_id INTEGER NULL", () => {});
db.run("ALTER TABLE products ADD COLUMN is_approved INTEGER DEFAULT 1", () => {});

module.exports = db;
