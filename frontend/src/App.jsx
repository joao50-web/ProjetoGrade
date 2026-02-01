import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Pessoas from './pages/Pessoas';
import Usuarios from './pages/Usuarios';
import Cargos from './pages/Cargos';
import Cursos from './pages/Cursos';
import Disciplinas from './pages/Disciplinas';
import CursoDisciplinas from './pages/CursoDisciplinas';
import GradeHoraria from './pages/GradeHoraria';
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/pessoas" element={<Pessoas />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/cargos" element={<Cargos />} />
        <Route path="/cursos" element={<Cursos />} />
        <Route path="/disciplinas" element={<Disciplinas />} />
        <Route
          path="/cursos/:id/disciplinas"
          element={<CursoDisciplinas />}
        />
        <Route path="/grade" element={<GradeHoraria />} />

      </Routes>
    </BrowserRouter>
  );
}
