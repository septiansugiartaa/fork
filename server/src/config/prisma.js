const { PrismaClient } = require('@prisma/client');

// Singleton pattern: satu instance dipakai di seluruh aplikasi.
// Tanpa ini, setiap controller yang melakukan `new PrismaClient()` akan
// membuka connection pool baru — menyebabkan exhausted DB connections di production.

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    // Di development, simpan instance di global object agar tidak
    // dibuat ulang setiap kali hot-reload terjadi.
    if (!global.__prisma) {
        global.__prisma = new PrismaClient({
            log: ['warn', 'error'],
        });
    }
    prisma = global.__prisma;
}

module.exports = prisma;
