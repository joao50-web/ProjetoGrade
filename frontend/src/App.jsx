import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getUsuarioLogado } from './services/api';

import Login from './pages/Login';
import Home from './pages/Home';
import Pessoas from './pages/Pessoas';
import Usuarios from './pages/Usuarios';
import Cargos from './pages/Cargos';
import Cursos from './pages/Cursos';
import Disciplinas from './pages/Disciplinas';
import CursoDisciplinas from './pages/CursoDisciplinas';
import GradeHoraria from './pages/GradeHoraria';
import Logs from './pages/Logs';

function PrivateRoute({ children, roles }) {
  const usuario = getUsuarioLogado();
  console.log(usuario)
  if (!usuario) return <Navigate to="/login" />;

  if (!roles.includes(usuario.role)) {
    return <Navigate to="/grade-horaria" />; // redireciona se não tiver permissão
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Home para todos usuários logados */}
        <Route
          path="/home"
          element={
            <PrivateRoute roles={['visualizacao','edicao','administrador']}>
           
                <Home />
           
            </PrivateRoute>
          }
        />

        {/* Apenas administradores */}
        <Route
          path="/pessoas"
          element={
            <PrivateRoute roles={['administrador']}>
            
                <Pessoas />
             
            </PrivateRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <PrivateRoute roles={['administrador']}>
             
                <Usuarios />
             
            </PrivateRoute>
          }
        />
        <Route
          path="/cargos"
          element={
            <PrivateRoute roles={['administrador']}>
              
                <Cargos />
             
            </PrivateRoute>
          }
        />
        <Route
          path="/cursos"
          element={
            <PrivateRoute roles={['administrador']}>
              
                <Cursos />
             
            </PrivateRoute>
          }
        />
        <Route
          path="/disciplinas"
          element={
            <PrivateRoute roles={['administrador']}>
              
                <Disciplinas />
          
            </PrivateRoute>
          }
        />
        <Route
          path="/cursos/:id/disciplinas"
          element={
            <PrivateRoute roles={['administrador']}>
            
                <CursoDisciplinas />
            
            </PrivateRoute>
          }
        />

        {/* Todos os usuários podem acessar a Grade Horária */}
        <Route
          path="/grade-horaria"
          element={
            <PrivateRoute roles={['visualizacao','edicao','administrador']}>
              
                <GradeHoraria />
          
            </PrivateRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <PrivateRoute roles={['administrador']}>
              <Logs />
            </PrivateRoute>
          }
        />

        {/* Redireciona qualquer rota desconhecida */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}