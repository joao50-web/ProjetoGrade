import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3001'
});

// 🔐 INTERCEPTOR CORRIGIDO
api.interceptors.request.use(config => {
  const usuario = localStorage.getItem('usuario');

  if (usuario) {
    const { token } = JSON.parse(usuario);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// 👤 Usuário logado
export function getUsuarioLogado() {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
}