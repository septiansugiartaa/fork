import {useEffect,useState} from "react"
import {useParams,useNavigate} from "react-router-dom"
import api from "../../../config/api"
import {ArrowLeft,Loader2} from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas-pro"
import logoPesantren from "../../../assets/logo.png"

export default function ViewAbsensi({ rolePrefix }){
  const {id}=useParams()
  const navigate=useNavigate()

  const today=new Date()
  const [bulan,setBulan]=useState(today.getMonth()+1)
  const [tahun,setTahun]=useState(today.getFullYear())

  const [items,setItems]=useState([])
  const [absensi,setAbsensi]=useState([])
  const [loading,setLoading]=useState(true)
  const [kamar,setKamar]=useState(null)

  const namaBulan=[
    "Januari","Februari","Maret","April","Mei","Juni",
    "Juli","Agustus","September","Oktober","November","Desember"
  ]

  const daysInMonth=(month,year)=>{
    return new Date(year,month,0).getDate()
  }

  const fetchData=async()=>{
    try{
      setLoading(true)
      const [laporanRes,kamarRes]=await Promise.all([
        api.get(`/${rolePrefix}/absensi/kamar/${id}/laporan`,{params:{bulan,tahun}}),
        api.get(`/${rolePrefix}/absensi/kamar/${id}/detail`)
      ])
      setItems(laporanRes.data.items||[])
      setAbsensi(laporanRes.data.absensi||[])
      setKamar(kamarRes.data.data||null)
    }catch(err){
      console.error(err)
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    fetchData()
  },[bulan,tahun,id])

  const formatGender=(gender)=>{
    if(!gender)return "-"
    if(gender==="Laki_laki")return "Laki-laki"
    if(gender==="Perempuan")return "Perempuan"
    return gender
  }

  const jumlahHari=daysInMonth(bulan,tahun)

  const getStatus=(itemId,day)=>{
    const data=absensi.find(a=>{
      const tgl=new Date(a.tanggal).getDate()
      return tgl===day
    })
    if(!data)return null
    const detail=data.absensi_detail.find(d=>d.id_item===itemId)
    return detail?.status||null
  }

  const handleDownload=async()=>{
    const element=document.getElementById("paper")
    const canvas=await html2canvas(element,{
      scale:2,
      useCORS:true,
      backgroundColor:"#ffffff"
    })
    const imgData=canvas.toDataURL("image/jpeg",0.7)
    const pdf=new jsPDF("l","mm","a4")
    const imgWidth=297
    const imgHeight=(canvas.height*imgWidth)/canvas.width
    pdf.addImage(imgData,"JPEG",0,0,imgWidth,imgHeight)
    pdf.save(`Laporan-Absensi-${bulan}-${tahun}.pdf`)
  }

  if(loading)return(
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-green-600" size={40}/>
    </div>
  )

  return(
    <div className="space-y-6">

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={()=>navigate(-1)}>
          <ArrowLeft size={24}/>
        </button>
        <h1 className="text-2xl font-bold">
          Laporan Absensi Kebersihan
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label>Bulan</label>
        <select
          value={bulan}
          onChange={e=>setBulan(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {namaBulan.map((b,i)=>(
            <option key={i+1} value={i+1}>{b}</option>
          ))}
        </select>

        <label>Tahun</label>
        <select
          value={tahun}
          onChange={e=>setTahun(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          {Array.from({length:5},(_,i)=>(
            <option key={i}>{today.getFullYear()-2+i}</option>
          ))}
        </select>
      </div>

      <div className="paper-wrapper">

        <div
          id="paper"
          className="paper bg-white w-[297mm] px-6 sm:px-10 py-8 pb-[30mm] shadow-lg text-sm mx-auto"
        >

          <div className="relative border-b-2 border-black pb-3 mb-6">
            <img
              src={logoPesantren}
              className="absolute left-0 top-1 w-16 h-16"
            />
            <div className="text-center pl-16 sm:pl-0">
              <p className="text-[10px] font-bold">
                YAYASAN DARUNNA'IM YAPIA
              </p>
              <p className="text-[14px] font-bold">
                PONDOK PESANTREN MODERN DARUN-NA'IM YAPIA
              </p>
              <p className="text-[9px]">
                Jl. Demang Aria Rt.01 Rw.03 Desa Waru Jaya, Kec. Parung, Kab. Bogor
              </p>
              <p className="text-[9px]">
                Email: ponpesmodern.darunnaimyapia@gmail.com | IG: @ponpes_modern_darun_naim_yapia
              </p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-black tracking-wide">
              LAPORAN ABSENSI KEBERSIHAN KAMAR
            </h1>
            <p className="text-[12px] text-gray-500">
              Bulan {namaBulan[bulan-1]} Tahun {tahun}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-[12px]">
            <div className="flex">
              <p className="w-28 font-semibold">Nama Kamar</p>
              <p>: {kamar?.kamar||"-"}</p>
            </div>
            <div className="flex">
              <p className="w-28 font-semibold">Gender</p>
              <p>: {formatGender(kamar?.gender)}</p>
            </div>
          </div>

          <div className="bg-white border">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-2 py-1">No</th>
                  <th className="border px-2 py-1">Jenis Kegiatan</th>
                  <th className="border px-2 py-1">Waktu</th>
                  {Array.from({length:jumlahHari},(_,i)=>(
                    <th key={i} className="border px-1 py-1">
                      {i+1}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {items.map((item,index)=>(
                  <tr key={item.id_item}>
                    <td className="border px-2 py-1">{index+1}</td>
                    <td className="border px-2 py-1">{item.nama_item}</td>
                    <td className="border px-2 py-1">{item.waktu_pengerjaan?.replaceAll("_"," ")}</td>
                    {Array.from({length:jumlahHari},(_,i)=>{
                      const status=getStatus(item.id_item,i+1)
                      let color="bg-white"
                      if(status==="Dilakukan")color="bg-green-500"
                      if(status==="Tidak_Dilakukan")color="bg-red-500"
                      return(
                        <td key={i} className={`border w-6 h-6 ${color}`}/>
                      )
                    })}
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border"></div>
              <span>Dilakukan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 border"></div>
              <span>Tidak Dilakukan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border"></div>
              <span>Tidak Ada Absensi</span>
            </div>
          </div>

        </div>

      </div>

      <button
        onClick={handleDownload}
        className="fixed bottom-4 right-4 px-4 py-2 text-sm sm:bottom-6 sm:right-6 sm:px-6 sm:py-3 sm:text-base bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg print:hidden"
      >
        Download PDF
      </button>

    </div>
  )
}

<style>
{`
.paper-wrapper{
  width:100%;
  display:flex;
  justify-content:center;
}

.paper{
  transform-origin:top center;
}

#paper table,
#paper th,
#paper td{
  border:0.5px solid #d1d5db;
}

@media(max-width:1024px){
  .paper{
    transform:scale(0.85);
  }
}

@media(max-width:768px){
  .paper{
    transform:scale(0.7);
  }
}

@media(max-width:480px){
  .paper{
    transform:scale(0.55);
  }
}

@media print{
  .paper{
    transform:scale(1);
  }
}
`}
</style>
