import axios from "axios";

const API_URL = "http://localhost:5000/api/diplomas";

export async function createDiploma(formData) {
  const response = await axios.post(`${API_URL}/create`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
}

export async function getDiplomas() {
  const response = await axios.get(`${API_URL}`);
  return response.data;
}

export async function getDiplomaByTokenId(tokenId) {
  const response = await axios.get(`${API_URL}/${tokenId}`);
  return response.data;
}

export async function getDiplomasByIndex(index) {
  const response = await axios.get(`${API_URL}/by-index/${index}`);
  return response.data;
}

export async function getValidDiplomaByIndex(index) {
  const response = await axios.get(`${API_URL}/valid-by-index/${index}`);
  return response.data;
}

export async function getDiplomasByAddress(address) {
  const response = await axios.get(`${API_URL}/by-address/${address}`);
  return response.data;
}

export async function validateDiploma(tokenId) {
  const response = await axios.post(`${API_URL}/validate`, { tokenId });
  return response.data;
}

export async function invalidateDiploma(tokenId) {
  const response = await axios.post(`${API_URL}/invalidate`, { tokenId });
  return response.data;
}

