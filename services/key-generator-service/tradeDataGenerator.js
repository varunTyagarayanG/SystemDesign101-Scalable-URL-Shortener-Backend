const mysql = require('mysql2/promise');

// --- Utility Functions ---
function seededRandom(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function randomInt(min, max, seed) {
    return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

function generateISIN(seed) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let isin = "";
    for (let i = 0; i < 12; i++) {
        isin += chars.charAt(Math.floor(seededRandom(seed + i) * chars.length));
    }
    return isin;
}

function generateCleanTradeData(count = 100, baseSeed = 42) {
    const cleanData = [];

    for (let i = 0; i < count; i++) {
        const seed = baseSeed + i;
        const tDate = new Date(2025, 0, 1 + (i % 30)).toISOString().split('T')[0];
        const sDate = new Date(2025, 0, 2 + (i % 30)).toISOString().split('T')[0];

        cleanData.push([
            `TID${100000 + i}`,
            generateISIN(seed),
            randomInt(100, 10000, seed),
            randomInt(50, 5000, seed + 1000),
            tDate,
            sDate,
            `CounterParty_${(i % 10) + 1}`,
            i % 2 === 0 ? "BUY" : "SELL",
            `BRK_${(i % 5) + 1}`,
            `Company_${(i % 20) + 1}`
        ]);
    }

    return cleanData;
}

function generateNoisyTradeData(cleanData, baseSeed = 42) {
    const noisyData = JSON.parse(JSON.stringify(cleanData));
    const total = cleanData.length;
    const noisyCount = Math.floor(total * 0.2);

    const noisyIndicesQty = new Set();
    const noisyIndicesPrice = new Set();

    while (noisyIndicesQty.size < noisyCount) {
        noisyIndicesQty.add(randomInt(0, total - 1, baseSeed + noisyIndicesQty.size * 3));
    }
    while (noisyIndicesPrice.size < noisyCount) {
        noisyIndicesPrice.add(randomInt(0, total - 1, baseSeed + noisyIndicesPrice.size * 7));
    }

    [...noisyIndicesQty].forEach((idx, i) => {
        let original = noisyData[idx][2];
        let delta = Math.floor(original * (seededRandom(baseSeed + i) * 0.3 + 0.05));
        noisyData[idx][2] += (i % 2 === 0 ? delta : -delta);
    });

    [...noisyIndicesPrice].forEach((idx, i) => {
        let original = noisyData[idx][3];
        let delta = (i % 10 === 0)
            ? Math.floor(original * 1.5)
            : Math.floor(original * (seededRandom(baseSeed + 200 + i) * 0.25 + 0.05));
        noisyData[idx][3] += (i % 2 === 0 ? delta : -delta);
    });

    return noisyData;
}

// --- Main Script ---
async function main() {
    console.log("🔌 Connecting to MySQL...");
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Tyagi#2004', // update if needed
        database: 'TradeData'   // ensure this DB exists
    });
    console.log("✅ Connected to MySQL");

    console.log("📦 Creating tables...");
    await connection.query(`
        CREATE TABLE IF NOT EXISTS trade_clean (
            trade_id VARCHAR(20) PRIMARY KEY,
            isin VARCHAR(20),
            quantity INT,
            price INT,
            t_date DATE,
            s_date DATE,
            c_party VARCHAR(30),
            side VARCHAR(5),
            b_id VARCHAR(30),
            com_name VARCHAR(50)
        )
    `);
    await connection.query(`CREATE TABLE IF NOT EXISTS trade_noisy LIKE trade_clean`);
    console.log("✅ Tables ready");

    console.log("🧪 Generating clean data...");
    const cleanData = generateCleanTradeData();

    console.log("🧪 Generating noisy data...");
    const noisyData = generateNoisyTradeData(cleanData);

    const insertSQL = `INSERT INTO trade_clean VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertSQL2 = `INSERT INTO trade_noisy VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    console.log("📥 Inserting clean data in batches...");
    for (let i = 0; i < cleanData.length; i += 10) {
        const batch = cleanData.slice(i, i + 10);
        await Promise.all(batch.map(row => connection.execute(insertSQL, row)));
    }
    console.log("✅ Clean data inserted");

    console.log("📥 Inserting noisy data in batches...");
    for (let i = 0; i < noisyData.length; i += 10) {
        const batch = noisyData.slice(i, i + 10);
        await Promise.all(batch.map(row => connection.execute(insertSQL2, row)));
    }
    console.log("✅ Noisy data inserted");

    await connection.end();
    console.log("🔚 Done. Connection closed.");
    process.exit(0);
}

// ✅ Invoke the main function
main().catch(err => {
    console.error("❌ Error:", err);
    process.exit(1);
});
