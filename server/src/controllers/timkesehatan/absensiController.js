const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const dayjs = require("dayjs")
const utc = require("dayjs/plugin/utc")
const timezone = require("dayjs/plugin/timezone")

dayjs.extend(utc)
dayjs.extend(timezone)

exports.getKamarList = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 5 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const whereCondition = {
      is_active: true
    };

    if (search.trim()) {
      whereCondition.kamar = {
        contains: search
      };
    }

    const [data, total] = await prisma.$transaction([
      prisma.kamar.findMany({
        where: whereCondition,
        skip,
        take: Number(limit),
        orderBy: { kamar: "asc" },
        select: {
          id: true,
          kamar: true,
          gender: true,
          heading_absensi: {
            where: { is_active: true },
            orderBy: { tanggal: "desc" },
            take: 1,
            select: { tanggal: true }
          }
        }
      }),

      prisma.kamar.count({ where: whereCondition })
    ]);

    /* hitung absensi bulan ini */

    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const kamarIds = data.map(k => k.id);

    const absensiBulanIni = await prisma.heading_absensi.groupBy({
      by: ["id_kamar"],
      where: {
        id_kamar: { in: kamarIds },
        tanggal: { gte: firstDayMonth },
        is_active: true
      },
      _count: { id_heading: true }
    });

    const mapAbsensi = {};

    absensiBulanIni.forEach(a => {
      mapAbsensi[a.id_kamar] = a._count.id_heading;
    });

    const finalData = data.map(kamar => ({
      ...kamar,
      total_absensi_bulan_ini: mapAbsensi[kamar.id] || 0
    }));

    res.json({
      success: true,
      data: finalData,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getKamarDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const kamar = await prisma.kamar.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        kamar: true,
        lokasi: true,
        gender: true,
        kapasitas: true
      }
    });

    if (!kamar) {
      return res.status(404).json({
        success: false,
        message: "Kamar tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: kamar
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAbsensiByKamar = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 5 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      prisma.heading_absensi.count({
        where: {
          id_kamar: Number(id),
          is_active: true
        }
      }),

      prisma.heading_absensi.findMany({
        where: {
          id_kamar: Number(id),
          is_active: true
        },
        orderBy: { tanggal: "desc" },
        skip,
        take: Number(limit),
        include: {
          users: {
            select: {
              id: true,
              nama: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAbsensiDetail = async (req,res)=>{
  try{
    const {id_heading} = req.params
    const data = await prisma.heading_absensi.findUnique({
      where:{
        id_heading:Number(id_heading)
      },
      include:{
        absensi_detail:true
      }
    })

    if(!data){
      return res.status(404).json({
        success:false,
        message:"Data absensi tidak ditemukan"
      })
    }

    res.json({
      success:true,
      data
    })

  }catch(error){
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}


exports.updateAbsensi = async (req,res)=>{
  try{
    const {id_heading} = req.params
    const {jawaban} = req.body

    let parsedJawaban

    try{
      parsedJawaban = typeof jawaban === "string"
        ? JSON.parse(jawaban)
        : jawaban
    }catch{
      return res.status(400).json({
        success:false,
        message:"Format jawaban tidak valid"
      })
    }

    if(!Array.isArray(parsedJawaban) || parsedJawaban.length===0){
      return res.status(400).json({
        success:false,
        message:"Checklist absensi kosong"
      })
    }

    await prisma.$transaction(async(tx)=>{
      await tx.absensi_detail.deleteMany({
        where:{
          id_heading:Number(id_heading)
        }
      })

      const detailData = parsedJawaban.map(item=>({
        id_heading:Number(id_heading),
        id_item:Number(item.id_item),
        status:item.status === "Tidak Dilakukan"
          ? "Tidak_Dilakukan"
          : "Dilakukan",
        is_active:true
      }))

      await tx.absensi_detail.createMany({
        data:detailData
      })
    })

    res.json({
      success:true,
      message:"Absensi berhasil diperbarui"
    })

  }catch(error){
    console.error("UPDATE ABSENSI ERROR:",error)
    res.status(500).json({
      success:false,
      message:"Terjadi kesalahan server"
    })
  }
}

exports.getLatestAbsensi = async (req, res) => {
  try {
    const { id } = req.params;

    const latest = await prisma.heading_absensi.findFirst({
      where: {
        id_kamar: Number(id),
        is_active: true
      },
      orderBy: { tanggal: "desc" },
      include: {
        users: {
          select: {
            id: true,
            nama: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: latest
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getSantriByKamar = async (req, res) => {

  try {

    const { id } = req.params;

    const data = await prisma.kamar_santri.findMany({
      where: {
        id_kamar: Number(id),
        is_active: true
      },
      include: {
        users: {
          select: {
            id: true,
            nama: true,
            nip: true
          }
        }
      }
    });

    res.json({
      success: true,
      data
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

exports.getItemKebersihan = async (req, res) => {
  try {

    const data = await prisma.item_kebersihan.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        id_item: "asc"
      }
    });

    res.json({
      success: true,
      data
    });

  } catch (error) {

    console.error("ITEM KEBERSIHAN ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.createAbsensi = async (req,res)=>{
  try{

    const {id_kamar,jawaban}=req.body

    if(!id_kamar){
      return res.status(400).json({
        success:false,
        message:"ID kamar wajib diisi"
      })
    }

    let parsedJawaban

    try{
      parsedJawaban = typeof jawaban === "string"
        ? JSON.parse(jawaban)
        : jawaban
    }catch{
      return res.status(400).json({
        success:false,
        message:"Format jawaban tidak valid"
      })
    }

    if(!Array.isArray(parsedJawaban) || parsedJawaban.length===0){
      return res.status(400).json({
        success:false,
        message:"Checklist absensi belum diisi"
      })
    }

    const today = dayjs().tz("Asia/Jakarta").format("YYYY-MM-DD")

    const startDate = new Date(`${today} 00:00:00`)
    const endDate = new Date(`${today} 23:59:59`)

    const existing = await prisma.heading_absensi.findFirst({
      where:{
        id_kamar:Number(id_kamar),
        tanggal:{
          gte:startDate,
          lte:endDate
        },
        is_active:true
      }
    })

    if(existing){
      return res.status(400).json({
        success:false,
        message:"Absensi hari ini sudah dibuat"
      })
    }

    const tanggal = new Date(`${today} 12:00:00`)

    await prisma.$transaction(async(tx)=>{

      const heading = await tx.heading_absensi.create({
        data:{
          id_kamar:Number(id_kamar),
          id_timkes:req.user?.id || 1,
          tanggal:tanggal,
          is_active:true
        }
      })

      const detailData = parsedJawaban.map(item=>({
        id_heading:heading.id_heading,
        id_item:Number(item.id_item),
        status:item.status === "Tidak Dilakukan"
          ? "Tidak_Dilakukan"
          : "Dilakukan",
        is_active:true
      }))

      await tx.absensi_detail.createMany({
        data:detailData
      })

    })

    res.status(201).json({
      success:true,
      message:"Absensi berhasil disimpan"
    })

  }catch(error){

    console.error("CREATE ABSENSI ERROR:",error)

    res.status(500).json({
      success:false,
      message:"Terjadi kesalahan pada server"
    })
  }
}

exports.getLaporanAbsensi = async(req,res)=>{
  try{
    const {id}=req.params
    const {bulan,tahun}=req.query
    const month=Number(bulan)
    const year=Number(tahun)
    const start=new Date(year,month-1,1)
    const end=new Date(year,month,0,23,59,59)

    const items=await prisma.item_kebersihan.findMany({
      where:{is_active:true},
      orderBy:{id_item:"asc"}
    })

    const absensi=await prisma.heading_absensi.findMany({
      where:{
        id_kamar:Number(id),
        tanggal:{gte:start,lte:end},
        is_active:true
      },
      include:{
        absensi_detail:true
      }
    })

    res.json({
      success:true,
      items,
      absensi
    })
  } catch(error){
    res.status(500).json({
      success:false,
      message:error.message
    })
  }
}
