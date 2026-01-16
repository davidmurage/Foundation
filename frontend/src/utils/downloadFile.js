// src/utils/downloadFile.js
import axios from "axios";

export async function downloadFile({ url, token, filename }) {
  const res = await axios.get(url, {
    responseType: "blob",
    headers: { Authorization: `Bearer ${token}` },
  });

  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
