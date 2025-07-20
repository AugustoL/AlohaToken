import { filebaseURL } from "./constants";

export const fetchOffchainData = async (offchainHash: String) => {
  const dataFetch = await fetch(filebaseURL+offchainHash);
  return await dataFetch.json();
};

export const uploadToIPFS = async (data: any): Promise<string> => {
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const file = new File([blob], "data.json", { type: "application/json" });
  const formData = new FormData();
  formData.append('file', file);

  const apiKey = process.env.REACT_APP_FILEBASE_API_KEY;
  const res = await fetch('https://rpc.filebase.io/api/v0/add', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });
  if (!res.ok) throw new Error(`IPFS upload failed: ${res.statusText}`);
  const json = await res.json();
  return json.Hash;
};