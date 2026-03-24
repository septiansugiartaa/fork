export default function SkorObservasi() {
  const rows = [
    {
      kategori: "Baik",
      skor: "6-7",
      keterangan: "Perilaku cuci tangan santri sudah sesuai standar"
    },
    {
      kategori: "Cukup",
      skor: "4-5",
      keterangan: "Perlu diingatkan dan dibimbing ulang"
    },
    {
      kategori: "Kurang",
      skor: "<=3",
      keterangan: "Perlu dilakukan edukasi ulang oleh Tim Mutu Kesehatan"
    }
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left uppercase tracking-wider text-xs text-gray-500 border-b border-gray-100">
              <th className="p-4 font-semibold">Kategori</th>
              <th className="p-4 font-semibold">Skor</th>
              <th className="p-4 font-semibold">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.kategori} className="hover:bg-gray-50 transition">
                <td className="p-4 font-semibold text-gray-800">{row.kategori}</td>
                <td className="p-4 text-gray-700">{row.skor}</td>
                <td className="p-4 text-gray-600">{row.keterangan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
