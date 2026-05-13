require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { notifyAdminNewOrder, notifySellerLowStock } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "DIALLO_DIGITAL_FALLBACK_KEY";
const ADMIN_REGISTRATION_KEY = process.env.ADMIN_REGISTRATION_KEY || null;

// Dossier pour les images
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// Middlewares de Sécurité
app.use(helmet({
    contentSecurityPolicy: false, // Désactivé pour permettre le chargement d'images externes (Amazon, Apple, etc.)
}));

// Limitation de débit (Rate Limiting)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limite chaque IP à 100 requêtes par fenêtre
    message: { error: "Trop de requêtes effectuées depuis cette IP, veuillez réessayer plus tard." }
});
app.use('/api/', limiter); // Appliquer uniquement aux routes API

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware Authentification
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const token = bearer[1];
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: "Token invalide ou expiré" });
            }
            req.userId = decoded.id;
            req.userRole = decoded.role;
            next();
        });
    } else {
        res.status(401).json({ error: "Accès refusé. Token manquant." });
    }
};

const authenticateAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.userRole === 'admin') {
            next();
        } else {
            res.status(403).json({ error: "Droits d'administrateur requis." });
        }
    });
};

const verifyCustomerToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const token = bearer[1];
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) {
                return res.status(403).json({ error: "Token invalide ou expiré" });
            }
            req.customerId = decoded.id; // Store customer ID
            next();
        });
    } else {
        res.status(401).json({ error: "Connectez-vous pour continuer." });
    }
};

const verifySellerToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const token = bearer[1];
        jwt.verify(token, SECRET_KEY, (err, decoded) => {
            if (err) return res.status(403).json({ error: "Session vendeur expirée" });
            req.sellerId = decoded.id;
            next();
        });
    } else {
        res.status(401).json({ error: "Accès vendeur requis." });
    }
};

// =====================================
// AUTHENTIFICATION API
// =====================================

app.post('/api/auth/register', (req, res) => {
    const { username, password, registration_key } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Identifiants invalides" });

    // Vérification de la clé d'enregistrement admin
    if (!ADMIN_REGISTRATION_KEY || registration_key !== ADMIN_REGISTRATION_KEY) {
        return res.status(403).json({ error: "Clé d'enregistrement invalide. Création de compte non autorisée." });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Administrateur créé avec succès." });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "Utilisateur non trouvé." });

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid) return res.status(401).json({ error: "Mot de passe incorrect." });

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: 86400 }); // 24 hours
        res.json({ auth: true, token: token, role: user.role });
    });
});

// =====================================
// AUTHENTIFICATION CLIENT B2C
// =====================================

app.post('/api/auth/customer-register', (req, res) => {
    const { fullName, phone, password } = req.body;
    if (!fullName || !phone || !password) return res.status(400).json({ error: "Champs requis." });

    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run("INSERT INTO customers (full_name, phone, password_hash) VALUES (?, ?, ?)", [fullName, phone, hashedPassword], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) return res.status(400).json({ error: "Ce numéro est déjà utilisé." });
            return res.status(500).json({ error: err.message });
        }
        
        const token = jwt.sign({ id: this.lastID, phone: phone }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ message: "Inscription réussie", token, user: { id: this.lastID, full_name: fullName, phone: phone, delivery_zone: null, address: null } });
    });
});

app.post('/api/auth/customer-login', (req, res) => {
    const { phone, password } = req.body;

    db.get("SELECT * FROM customers WHERE phone = ?", [phone], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "Numéro de téléphone introuvable." });

        const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
        if (!passwordIsValid) return res.status(401).json({ error: "Mot de passe incorrect." });

        const token = jwt.sign({ id: user.id, phone: user.phone }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, full_name: user.full_name, phone: user.phone, delivery_zone: user.delivery_zone, address: user.address } });
    });
});

app.put('/api/customer/profile', verifyCustomerToken, (req, res) => {
    const { fullName, delivery_zone, address } = req.body;
    db.run(
        "UPDATE customers SET full_name = ?, delivery_zone = ?, address = ? WHERE id = ?",
        [fullName, delivery_zone, address, req.customerId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Profil mis à jour" });
        }
    );
});

app.get('/api/customer/orders', verifyCustomerToken, (req, res) => {
    db.all("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [req.customerId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

// =====================================
// MARKETPLACE API
// =====================================

app.post('/api/sellers/apply', (req, res) => {
    const { store_name, owner_name, phone, email, category, password } = req.body;
    if (!store_name || !owner_name || !phone || !category || !password) {
        return res.status(400).json({ error: "Veuillez remplir tous les champs requis, y compris le mot de passe." });
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run(
        "INSERT INTO sellers (store_name, owner_name, phone, email, category, password_hash) VALUES (?, ?, ?, ?, ?, ?)",
        [store_name, owner_name, phone, email, category, hashedPassword],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Votre demande a été soumise avec succès. Nous vous contacterons bientôt !" });
        }
    );
});

app.get('/api/admin/sellers', authenticateAdmin, (req, res) => {
    db.all("SELECT * FROM sellers ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});
app.put('/api/admin/sellers/:id/status', authenticateAdmin, (req, res) => {
    const { status } = req.body;
    db.run("UPDATE sellers SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Statut mis à jour." });
    });
});

app.delete('/api/admin/sellers/:id', authenticateAdmin, (req, res) => {
    const sellerId = req.params.id;
    
    db.serialize(() => {
        // 1. Supprimer les produits du vendeur
        db.run("DELETE FROM products WHERE seller_id = ?", [sellerId], (err) => {
            if (err) console.error("Erreur suppression produits vendeur:", err.message);
        });

        // 2. Supprimer le vendeur
        db.run("DELETE FROM sellers WHERE id = ?", [sellerId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Vendeur et ses produits supprimés avec succès." });
        });
    });
});


app.get('/api/admin/products/pending', authenticateAdmin, (req, res) => {
    db.all("SELECT p.*, s.store_name FROM products p JOIN sellers s ON p.seller_id = s.id WHERE p.is_approved = 0", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.put('/api/admin/products/:id/approve', authenticateAdmin, (req, res) => {
    db.run("UPDATE products SET is_approved = 1 WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Produit approuvé avec succès." });
    });
});

app.post('/api/auth/seller-login', (req, res) => {
    const { phone, password } = req.body;
    db.get("SELECT * FROM sellers WHERE phone = ?", [phone], (err, seller) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!seller) return res.status(404).json({ error: "Compte vendeur introuvable." });
        if (seller.status !== 'approved') return res.status(403).json({ error: "Votre compte est en attente d'approbation ou a été rejeté." });

        const passwordIsValid = bcrypt.compareSync(password, seller.password_hash);
        if (!passwordIsValid) return res.status(401).json({ error: "Mot de passe incorrect." });

        const token = jwt.sign({ id: seller.id, store_name: seller.store_name, owner_name: seller.owner_name }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, seller: { id: seller.id, store_name: seller.store_name, owner_name: seller.owner_name } });
    });
});

// =====================================
// SELLER DASHBOARD API
// =====================================

app.get('/api/seller/products', verifySellerToken, (req, res) => {
    db.all("SELECT * FROM products WHERE seller_id = ?", [req.sellerId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.post('/api/seller/products', verifySellerToken, upload.single('image_file'), (req, res) => {
    const { name, description, price, stock, category } = req.body;
    let image_url = req.body.image;

    if (req.file) {
        image_url = '/uploads/' + req.file.filename;
    }

    if (!image_url) {
        return res.status(400).json({ error: "Une image ou un lien est requis." });
    }

    db.run(
        "INSERT INTO products (name, description, price, stock, category, image, seller_id, is_approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [name, description, price, stock, category, image_url, req.sellerId, 0], // is_approved = 0 par défaut pour les vendeurs
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Produit ajouté. En attente de validation par l'admin.", id: this.lastID });
        }
    );
});

app.put('/api/seller/products/:id', verifySellerToken, upload.single('image_file'), (req, res) => {
    const { name, description, price, stock, category } = req.body;
    let image_url = req.body.image;

    if (req.file) {
        image_url = '/uploads/' + req.file.filename;
    }

    let query, params;
    if (image_url) {
        query = "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, image = ?, is_approved = 0 WHERE id = ? AND seller_id = ?";
        params = [name, description, price, stock, category, image_url, req.params.id, req.sellerId];
    } else {
        query = "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, is_approved = 0 WHERE id = ? AND seller_id = ?";
        params = [name, description, price, stock, category, req.params.id, req.sellerId];
    }

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Produit non trouvé ou non autorisé." });
        res.json({ message: "Produit mis à jour. En attente de re-validation." });
    }
    );
});

app.delete('/api/seller/products/:id', verifySellerToken, (req, res) => {
    db.run(
        "DELETE FROM products WHERE id = ? AND seller_id = ?",
        [req.params.id, req.sellerId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Produit non trouvé ou non autorisé." });
            res.json({ message: "Produit supprimé avec succès." });
        }
    );
});

app.get('/api/seller/orders', verifySellerToken, (req, res) => {
    db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Filtrer les commandes pour ne garder que les articles du vendeur
        const sellerOrders = rows.map(order => {
            const items = JSON.parse(order.items);
            const myItems = items.filter(item => item.seller_id == req.sellerId);
            
            if (myItems.length > 0) {
                const myTotal = myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const commission = myTotal * 0.10;
                const net = myTotal - commission;
                
                return {
                    ...order,
                    items: JSON.stringify(myItems),
                    seller_subtotal: myTotal,
                    commission: commission,
                    seller_net: net
                };
            }
            return null;
        }).filter(o => o !== null);

        res.json({ message: "success", data: sellerOrders });
    });
});

// =====================================
// FRONT-END API
// =====================================

// Get all products 
app.get('/api/products', (req, res) => {
    const { category, search } = req.query;
    let query = "SELECT p.*, s.store_name FROM products p LEFT JOIN sellers s ON p.seller_id = s.id WHERE p.is_approved = 1";
    let params = [];

    if (category) {
        query += " AND p.category = ?";
        params.push(category);
    }

    if (search) {
        query += " AND (p.name LIKE ? OR p.description LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(400).json({ "error": err.message });
        const data = rows.map(p => ({
            ...p,
            store_name: p.store_name || "Diallo Digital"
        }));
        res.json({ "message": "success", "data": data });
    });
});

// Get active sellers for filters
app.get('/api/public/sellers', (req, res) => {
    db.all("SELECT id, store_name FROM sellers WHERE status = 'approved' ORDER BY store_name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

// Get delivery zones
app.get('/api/delivery-zones', (req, res) => {
    db.all("SELECT * FROM delivery_zones ORDER BY name ASC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.get('/api/products/:id', (req, res) => {
    db.get("SELECT p.*, s.store_name FROM products p LEFT JOIN sellers s ON p.seller_id = s.id WHERE p.id = ?", [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ "error": err.message });
        if (!row) return res.status(404).json({ "error": "Produit non trouvé" });
        const data = {
            ...row,
            store_name: row.store_name || "Diallo Digital"
        };
        res.json({ "message": "success", "data": data });
    });
});

// Admin: Add or update delivery zone
app.post('/api/delivery-zones', authenticateAdmin, (req, res) => {
    const { id, name, price } = req.body;
    if (!name || isNaN(price)) return res.status(400).json({ error: "Nom et prix valides requis" });
    
    if (id) {
        db.run("UPDATE delivery_zones SET name = ?, price = ? WHERE id = ?", [name, price, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Zone mise à jour", id: id });
        });
    } else {
        db.run("INSERT INTO delivery_zones (name, price) VALUES (?, ?)", [name, price], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Zone ajoutée", id: this.lastID });
        });
    }
});

// Admin: Delete delivery zone
app.delete('/api/delivery-zones/:id', authenticateAdmin, (req, res) => {
    db.run("DELETE FROM delivery_zones WHERE id = ?", [req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Zone supprimée" });
    });
});

// Create an order (Checkout)
app.post('/api/orders', (req, res) => {
    const { items, total, customer_name, customer_phone, delivery_zone, address, payment_method, payment_ref, user_id } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: "Le panier est vide." });

    // 1. Vérification collective des stocks avant de commencer
    const productIds = items.map(i => i.id);
    db.all(`SELECT id, name, stock FROM products WHERE id IN (${productIds.join(',')})`, [], (err, products) => {
        if (err) return res.status(500).json({ error: "Erreur vérification stock." });
        
        for (const item of items) {
            const product = products.find(p => p.id === item.id);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({ error: `Stock insuffisant pour ${item.name}. (Disponible: ${product ? product.stock : 0})` });
            }
        }

        // 2. Création de la commande
        const itemsJson = JSON.stringify(items);
        const finalAddress = address || delivery_zone || 'N/A';
        const finalUserId = user_id && !isNaN(user_id) ? user_id : null;

        db.run(
            "INSERT INTO orders (user_id, customer_name, customer_phone, address, payment_method, payment_ref, total, items, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [finalUserId, customer_name || 'Nouveau Client', customer_phone || 'NC', finalAddress, payment_method || 'WhatsApp', payment_ref || null, total, itemsJson, 'En attente'],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                const orderId = this.lastID;
                
                // 3. Déduction des stocks et alertes
                items.forEach(item => {
                    db.run(
                        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?", 
                        [item.quantity, item.id, item.quantity], 
                        (err) => { 
                            if (err) console.error("Erreur déduction stock:", err);
                            
                            // 4. Vérifier si stock bas (< 5) pour alerte email
                            db.get("SELECT p.name, p.stock, s.email FROM products p LEFT JOIN sellers s ON p.seller_id = s.id WHERE p.id = ?", [item.id], (err, pInfo) => {
                                if (!err && pInfo && pInfo.stock < 5 && pInfo.email) {
                                    notifySellerLowStock(pInfo.email, pInfo.name, pInfo.stock);
                                }
                            });
                        }
                    );
                });

                // 5. Notification Admin
                notifyAdminNewOrder({ id: orderId, customer_name, customer_phone, total, payment_method });

                res.json({ message: "Commande validée avec succès", orderId: orderId });
            }
        );
    });
});

// =====================================
// ADMIN API (SÉCURISÉE)
// =====================================

app.use('/api/admin', verifyToken);

// Obtenir toutes les commandes
app.get('/api/admin/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.get('/api/admin/reviews', (req, res) => {
    db.all("SELECT * FROM reviews ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.get('/api/admin/seller-requests', (req, res) => {
    db.all("SELECT * FROM seller_requests ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

// Mettre à jour le statut d'une commande
app.put('/api/admin/orders/:id/status', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Statut mis à jour avec succès" });
    });
});

// Ajouter un produit (avec upload d'image ou URL)
app.post('/api/admin/products', upload.single('image_file'), (req, res) => {
    const { name, description, price, stock, category } = req.body;
    let image_url = req.body.image; // Récupère l'URL saisie si présente

    if (req.file) {
        // Un fichier a été uploadé, il est prioritaire
        image_url = '/uploads/' + req.file.filename;
    }

    if (!image_url || image_url.trim() === "") {
        console.error("Tentative d'ajout sans image pour le produit:", name);
        return res.status(400).json({ error: "Une image ou un lien est requis." });
    }

    console.log(`Ajout produit: ${name}, Image: ${image_url}`);

    db.run(
        "INSERT INTO products (name, description, price, stock, category, image, video_url) VALUES (?,?,?,?,?,?,?)",
        [name, description, parseFloat(price), parseInt(stock), category, image_url.trim(), req.body.video_url],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Produit ajouté avec succès", id: this.lastID });
        }
    );
});

// Modifier un produit
app.put('/api/admin/products/:id', upload.single('image_file'), (req, res) => {
    const { name, description, price, stock, category, video_url } = req.body;
    let image_url = req.body.image;

    if (req.file) {
        image_url = '/uploads/' + req.file.filename;
    }

    // Si on a une nouvelle image, on met à jour tout, sinon on met à jour sans changer l'image si aucune info n'est passée
    let query, params;
    if (image_url) {
        query = "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, image = ?, video_url = ? WHERE id = ?";
        params = [name, description, parseFloat(price), parseInt(stock), category, image_url, video_url, req.params.id];
    } else {
        query = "UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, video_url = ? WHERE id = ?";
        params = [name, description, parseFloat(price), parseInt(stock), category, video_url, req.params.id];
    }

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Produit mis à jour" });
    }
    );
});

// Supprimer un produit
app.delete('/api/admin/products/:id', (req, res) => {
    db.run("DELETE FROM products WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Produit supprimé" });
    });
});

// ==========================================
// Avis Clients
// ==========================================
app.get('/api/products/:id/reviews', (req, res) => {
    db.all("SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC", [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "success", data: rows });
    });
});

app.post('/api/products/:id/reviews', (req, res) => {
    const { user_name, rating, comment } = req.body;
    db.run(
        "INSERT INTO reviews (product_id, user_name, rating, comment) VALUES (?,?,?,?)",
        [req.params.id, user_name, parseInt(rating), comment],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "success", id: this.lastID });
        }
    );
});

// ==========================================
// Candidatures Vendeurs (Marketplace)
// ==========================================
app.post('/api/seller-requests', (req, res) => {
    const { store_name, contact_name, phone, email, category } = req.body;
    db.run(
        "INSERT INTO seller_requests (store_name, contact_name, phone, email, category) VALUES (?,?,?,?,?)",
        [store_name, contact_name, phone, email, category],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "success", id: this.lastID });
        }
    );
});

// ==========================================
// Newsletter Abonnés
// ==========================================
app.post('/api/newsletter', (req, res) => {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Adresse email invalide." });
    }
    db.run(
        "INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)",
        [email],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) {
                return res.json({ message: "already_subscribed" });
            }
            res.json({ message: "success", id: this.lastID });
        }
    );
});

app.get('/api/newsletter', verifyToken, (req, res) => {
    db.all("SELECT * FROM newsletter_subscribers ORDER BY subscribed_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ==========================================
// Route catch-all — Renvoie vers index.html pour le SPA
// ==========================================
app.use((req, res, next) => {
    // Si c'est une requête API qui n'a pas été trouvée, on renvoie une 404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "Route API introuvable." });
    }
    // Pour tout le reste, on renvoie index.html
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack);
    res.status(500).json({ error: "Erreur interne du serveur." });
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Serveur Diallo Digital démarré sur le port ${PORT}`);
    console.log(`🚀 Environnement : ${process.env.NODE_ENV || 'production'}`);
});
