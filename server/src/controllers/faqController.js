const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getFaqList = async (req, res) => {
  try {
    const data = await prisma.faq.findMany({
      where: { is_active: true },
      orderBy: [{ urutan: 'asc' }, { id_faq: 'asc' }]
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
