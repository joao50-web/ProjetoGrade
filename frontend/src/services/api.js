import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://192.168.1.40:3001'
});

// 🔐 INTERCEPTOR DEBUGGER
api.interceptors.request.use(config => {
  const usuarioString = localStorage.getItem('usuario');
  
  console.log("🔍 [Interceptor] LocalStorage 'usuario':", usuarioString);

  if (usuarioString) {
    const usuarioObj = JSON.parse(usuarioString);
    console.log("🔍 [Interceptor] Objeto parseado:", usuarioObj);

    const token = usuarioObj.token;

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ [Interceptor] Token anexado com sucesso!");
    } else {
      console.warn("⚠️ [Interceptor] Usuário logado, mas o 'token' não foi encontrado direto na raiz do objeto!");
    }
  } else {
    console.warn("⚠️ [Interceptor] Nenhum usuário no LocalStorage!");
  }

  return config;
});

// 👤 Usuário logado
export function getUsuarioLogado() {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
}