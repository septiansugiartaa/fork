import { useParams } from "react-router-dom";

function DetailMateri() {
  const { id } = useParams();

  console.log("ID Materi:", id);

  return (
    <div>
      <h1>Detail Materi ID: {id}</h1>
    </div>
  );
}

export default DetailMateri;