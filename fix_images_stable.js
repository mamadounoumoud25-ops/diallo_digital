const db = require('./db/database');

const imageMap = {
    "AirPods Pro": "1588423637471-cd3dc7d45548",
    "AirPods Max": "1613040809024-b4ef7ba99bc3",
    "AirPods 3ème": "1610438235354-a6ae5528385c",
    "AirPods 2ème": "1588156979402-14fa7695cd8c",
    "Beats Studio": "1606220588913-b3eea4eceb54",
    "HomePod": "1610438235354-a6ae5528385c",
    "Powerbeats": "1610438235354-a6ae5528385c",
    "Sony WH-1000XM5": "1644931424111-383701729911",
    "Sony WF-1000XM5": "1599669454699-248893623440",
    "Bose QuietComfort": "1546435770-a30d172e0163",
    "Sennheiser": "1613040809024-b4ef7ba99bc3",
    "JBL Tour": "1599669454699-248893623440",
    "Marshall Major": "1610438235354-a6ae5528385c",
    "Marshall Monitor": "1606220588913-b3eea4eceb54",
    "Jabra": "1599669454699-248893623440",
    "Soundcore Life": "1610438235354-a6ae5528385c",
    "Soundcore Liberty": "1599669454699-248893623440",
    "Px7": "1546435770-a30d172e0163",
    "iPhone 15 Pro": "1695424076313-03cba3a76321",
    "iPhone 15": "1695424076313-03cba3a76321",
    "iPhone 14": "1510557880182-3d4d3cba3f21",
    "Samsung Galaxy S24": "1610945415287-321152a5592c",
    "Samsung Galaxy Z": "1610945415287-321152a5592c",
    "iPad Air": "1544244015-c4fc46b9ec1a",
    "iPad Pro": "1544244015-c4fc46b9ec1a",
    "Pixel 8": "1510557880182-3d4d3cba3f21",
    "OnePlus": "1510557880182-3d4d3cba3f21",
    "Apple Watch": "1508685096489-77a4ec39750c",
    "PlayStation 5": "1606144042614-b2417e99c4e3",
    "Xbox": "1612262942732-47da757754d1",
    "Nintendo": "1612262942732-47da757754d1",
    "DualSense": "1606144042614-b2417e99c4e3",
    "Razer BlackShark": "1613040809024-b4ef7ba99bc3",
    "SteelSeries": "1613040809024-b4ef7ba99bc3",
    "Logitech G": "1615662080201-7fa093539978",
    "ROG Ally": "1612262942732-47da757754d1",
    "Razer Huntsman": "1615662080201-7fa093539978",
    "Gaming Desk": "1553062407-98eeb64c6a62",
    "JBL Flip": "1608043152269-423dbba4e7e1",
    "Marshall Emberton": "1608043152269-423dbba4e7e1",
    "Sonos Era": "1608043152269-423dbba4e7e1",
    "DJI Mini": "1473580044171-460d3d528eb1",
    "GoPro": "1461800911222-2b6388f8d5b1",
    "AirTag": "1616424076313-03cba3a76321", // Better mock ID
    "MagSafe": "1588156979402-14fa7695cd8c",
    "Belkin": "1588156979402-14fa7695cd8c",
    "Insta360": "1461800911222-2b6388f8d5b1",
    "Philips Hue": "1558002038194-675031b26cc0"
};

db.all("SELECT id, name FROM products", (err, rows) => {
    if (err) return console.error(err);
    
    rows.forEach(row => {
        let unsplashId = "1505740420928-5e560c06d30e"; // Fallback: Casque générique
        
        for (const [key, id] of Object.entries(imageMap)) {
            if (row.name.includes(key)) {
                unsplashId = id;
                break;
            }
        }
        
        const finalUrl = `https://images.unsplash.com/photo-${unsplashId}?q=80&w=800&auto=format&fit=crop`;
        
        db.run("UPDATE products SET image = ? WHERE id = ?", [finalUrl, row.id], function(err) {
            if (err) console.error(`Error updating product ${row.id}:`, err.message);
            else console.log(`✅ Product ${row.id} (${row.name}) image updated to Unsplash.`);
        });
    });
});
