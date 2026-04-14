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
        <h1>Nouvelle commande reçue !</h1>
        <p><strong>Client :</strong> ${order.customer_name}</p>
        <p><strong>Téléphone :</strong> ${order.customer_phone}</p>
        <p><strong>Total :</strong> ${order.total.toLocaleString()} GNF</p>
        <p><strong>Méthode :</strong> ${order.payment_method}</p>
        <hr>
        <p>Consultez votre tableau de bord admin pour plus de détails.</p>
    `;
    return sendEmail({ to: process.env.ADMIN_EMAIL, subject, html });
}

async function notifySellerLowStock(sellerEmail, productName, currentStock) {
    const subject = `⚠️ Alerte Stock Bas : ${productName}`;
    const html = `
        <h2>Votre stock est presque épuisé !</h2>
        <p>Le produit <strong>${productName}</strong> n'a plus que <strong>${currentStock}</strong> unités en stock.</p>
        <p>Veuillez réapprovisionner votre stock dès que possible pour éviter les ruptures.</p>
        <hr>
        <p>Diallo Digital Marketplace</p>
    `;
    return sendEmail({ to: sellerEmail, subject, html });
}

module.exports = {
    sendEmail,
    notifyAdminNewOrder,
    notifySellerLowStock
};
