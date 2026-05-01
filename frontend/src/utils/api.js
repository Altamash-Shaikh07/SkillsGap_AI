import axios from "axios";

const API = "http://127.0.0.1:8000/api";

export const uploadResume = (file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post(`${API}/upload-resume`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const analyzeSkills = (data, token) => {
  return axios.post(`${API}/analyze-skills`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};