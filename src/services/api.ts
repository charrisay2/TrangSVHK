import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  headers: {
    'Content-Type': 'application/json',
  },
});
// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
// email thì kèm tên với mã vd Nguyễn Việt Hồng hongnv660001@uni.edu.vn 
// giáo viên Nguyễn Sinh Cung cungns-gv001@uni.edu.vn 