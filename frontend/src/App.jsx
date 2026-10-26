import axios from "axios";
import { useEffect, useState } from "react";

function App() {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/cay-canh")
      .then((res) => setPlants(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Danh sách cây cảnh</h1>

      {plants.map((plant) => (
        <p key={plant.maCay}>
          {plant.tenCay} - {plant.giaBan} VNĐ
        </p>
      ))}
    </div>
  );
}

export default App;