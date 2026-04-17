import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getUsuarioLogado } from "./services/api";

import Login from "./pages/Login";
import Home from "./pages/Home";

import Pessoas from "./pages/Pessoas";
import Usuarios from "./pages/Usuarios";
import Cargos from "./pages/Cargos";

import Departamentos from "./pages/Departamentos";
import Disciplinas from "./pages/Disciplinas";
import Cursos from "./pages/Cursos";
import CursoDisciplinas from "./pages/CursoDisciplinas";

import GradeHoraria from "./pages/GradeHoraria";
import Logs from "./pages/Logs";
import Relatorios from "./pages/Relatorios";

// ================= PROTEÇÃO
function PrivateRoute({ children, roles }) {
  const usuario = getUsuarioLogado();

  if (!usuario) return <Navigate to="/login" />;

  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/grade-horaria" />;
  }

  return children;
}

// ================= APP
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= AUTH ================= */}
        <Route path="/login" element={<Login />} />

        {/* ================= HOME ================= */}
        <Route
          path="/home"
          element={
            <PrivateRoute roles={["visualizacao", "edicao", "administrador"]}>
              <Home />
            </PrivateRoute>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/pessoas"
          element={
            <PrivateRoute roles={["administrador"]}>
              <Pessoas />
            </PrivateRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <PrivateRoute roles={["administrador"]}>
              <Usuarios />
            </PrivateRoute>
          }
        />

        <Route
          path="/cargos"
          element={
            <PrivateRoute roles={["administrador"]}>
              <Cargos />
            </PrivateRoute>
          }
        />

        <Route
          path="/logs"
          element={
            <PrivateRoute roles={["administrador"]}>
              <Logs />
            </PrivateRoute>
          }
        />

        {/* ================= ACADÊMICO (ORDEM CORRETA) ================= */}

        <Route
          path="/academico/departamentos"
          element={
            <PrivateRoute roles={["administrador"]}>
              <Departamentos />
            </PrivateRoute>
          }
        />

        <Route
          path="/academico/disciplinas"
          element={
            <PrivateRoute roles={["administrador"]}>
              <Disciplinas />
            </PrivateRoute>
          }
        />

        <Route
          path="/academico/cursos"
          element={
            <PrivateRoute roles={["administrador"]}>
              <Cursos />
            </PrivateRoute>
          }
        />

        <Route
          path="/academico/cursos/:id/disciplinas"
          element={
            <PrivateRoute roles={["administrador"]}>
              <CursoDisciplinas />
            </PrivateRoute>
          }
        />

        {/* ================= GRADE ================= */}
        <Route
          path="/grade-horaria"
          element={
            <PrivateRoute roles={["visualizacao", "edicao", "administrador"]}>
              <GradeHoraria />
            </PrivateRoute>
          }
        />

        {/* ================= RELATÓRIOS ================= */}
        <Route
          path="/relatorios"
          element={
            <PrivateRoute roles={["visualizacao", "edicao", "administrador"]}>
              <Relatorios />
            </PrivateRoute>
          }
        />

        {/* ================= DEFAULT ================= */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}