import { Outlet } from "react-router-dom";

export default function GradeLayout() {
  return (
    <div style={{ padding: "24px" }}>
      <header style={{ marginBottom: "16px" }}>
        <h2>Grade Horária</h2>
        <hr />
      </header>

      <Outlet />
    </div>
  );
}