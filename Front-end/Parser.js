// this sends request to backend
// file system is a nested obj to represent folders and string as values for files
async function transpileCDRCA(fileSystem) {
  const response = await fetch("/api/transpileCDRCA", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileSystem }),
  });
  return response.json();
}
