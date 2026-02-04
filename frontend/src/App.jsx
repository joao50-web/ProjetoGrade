import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Home from './pages/Home';
import Pessoas from './pages/Pessoas';
import Usuarios from './pages/Usuarios';
import Cargos from './pages/Cargos';
import Cursos from './pages/Cursos';
import Disciplinas from './pages/Disciplinas';
import CursoDisciplinas from './pages/CursoDisciplinas'; // <-- IMPORT CORRETO
import GradeHoraria from './pages/GradeHoraria';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Home / Boas-vindas */}
        <Route path="/home" element={<Home />} />

        {/* Cadastros */}
        <Route path="/pessoas" element={<Pessoas />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/cargos" element={<Cargos />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/disciplinas" element={<Disciplinas />} />

        {/* Curso específico: Disciplinas */}
        <Route path="/cursos/:id/disciplinas" element={<CursoDisciplinas />} />

        {/* Grade Horária */}
        <Route path="/grade-horaria" element={<GradeHoraria />} />
      </Routes>
    </BrowserRouter>
  );
}