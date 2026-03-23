import axios from "axios";

const client = axios.create({
  baseURL: "",  // Vite proxies /api and /images to localhost:8000
});

export async function getStatus() {
  const { data } = await client.get("/api/status");
  return data;  // { status, progress, message }
}

export async function getValImages() {
  const { data } = await client.get("/api/val-images");
  return data.images;  // [{filename, label}]
}

export async function retrieve(filename, topN) {
  const { data } = await client.post("/api/retrieve", {
    filename,
    top_n: topN,
  });
  return data;  // { query, results: [{rank, filename, label, similarity}] }
}
