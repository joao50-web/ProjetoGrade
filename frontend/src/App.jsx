import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Pessoas from './pages/Pessoas';
import Usuarios from './pages/Usuarios';
import Cargos from './pages/Cargos';
import Cursos from './pages/Cursos';
import Disciplinas from './pages/Disciplinas';
import GradeHoraria from './pages/GradeHoraria';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Cadastros */}
        <Route path="/pessoas" element={<Pessoas />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/cargos" element={<Cargos />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/disciplinas" element={<Disciplinas />} />

        {/* 📊 Grade Horária em página exclusiva */}
        <Route path="/grade-horaria" element={<GradeHoraria />} />
      </Routes>
    </BrowserRouter>
  );
}