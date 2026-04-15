const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendEmail({ to, subject, html }) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to,
            subject,
            html,
        });
        console.log("Email envoyé: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email:", error);
        return null;
    }
}

async function notifyAdminNewOrder(order) {
    const subject = `🛍️ Nouvelle commande #${order.id} sur Diallo Digital`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
            <h2 style="color: #1d1d1f; border-bottom: 2px solid #000; padding-bottom: 10px;">Nouvelle commande reçue !</h2>
            <p style="font-size: 16px;">Une nouvelle commande vient d'être passée sur votre boutique.</p>
            <div style="background: #f5f5f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>ID Commande :</strong> #${order.id}</p>
                <p><strong>Client :</strong> ${order.customer_name}</p>
                <p><strong>Téléphone :</strong> ${order.customer_phone}</p>
                <p><strong>Total :</strong> <span style="font-size: 18px; color: #2997ff;">${order.total.toLocaleString()} GNF</span></p>
                <p><strong>Méthode de paiement :</strong> ${order.payment_method}</p>
            </div>
            <p style="text-align: center; margin-top: 30px;">
                <a href="${process.env.BASE_URL || 'http://localhost:3000'}/admin.html" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Gérer les commandes</a>
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #86868b; text-align: center;">Diallo Digital - L'excellence numérique à Conakry</p>
        </div>
    `;
    return sendEmail({ to: process.env.ADMIN_EMAIL, subject, html });
}

async function notifySellerLowStock(sellerEmail, productName, currentStock) {
    const subject = `⚠️ Alerte Stock Bas : ${productName}`;
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; border-radius: 10px; padding: 20px;">
            <h2 style="color: #dc2626;">⚠️ Stock presque épuisé !</h2>
            <p>Bonjour,</p>
            <p>Le produit suivant atteint un niveau critique dans votre inventaire :</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                <p style="font-size: 18px; font-weight: bold; margin: 0;">${productName}</p>
                <p style="color: #dc2626; font-size: 16px; margin-top: 5px;">Stock actuel : <strong>${currentStock}</strong> pièces restantes.</p>
            </div>
            <p>Veuillez réapprovisionner votre stock dès que possible pour éviter de rater des ventes.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #86868b; text-align: center;">Diallo Digital Marketplace</p>
        </div>
    `;
    return sendEmail({ to: sellerEmail, subject, html });
}

module.exports = {
    sendEmail,
    notifyAdminNewOrder,
    notifySellerLowStock
};
