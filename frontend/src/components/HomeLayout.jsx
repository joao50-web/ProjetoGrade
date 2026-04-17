import { Layout, Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import logoBranco from "../imagens/logo_branco.png";
import logoCentral from "../imagens/titulo_branco_2.png";

const { Header, Content, Footer } = Layout;

export default function HomeLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 🔥 mantém consistência com AppLayout (zera tudo)
    localStorage.clear();
    navigate("/login");
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#e8ebf0" }}>
      {/* ================= HEADER ================= */}
      <Header
        style={{
          backgroundColor: "#093e5e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 44,
          position: "relative",
        }}
      >
        {/* LOGO ESQUERDA */}
        <img
          src={logoBranco}
          alt="UFCSPA"
          style={{ height: 38, objectFit: "contain" }}
        />

        {/* LOGO CENTRAL */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <img
            src={logoCentral}
            alt="UFCSPA"
            style={{ height: 18, objectFit: "contain" }}
          />
        </div>

        {/* BOTÃO SAIR */}
        <Button
          size="small"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{
            background: "rgba(255,255,255,0.12)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 8,
            height: 28,
            padding: "0 10px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.22)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.12)")
          }
        >
          Sair
        </Button>
      </Header>

      {/* ================= CONTENT ================= */}
      <Content
        style={{
          padding: "40px 40px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            borderRadius: 10,
            padding: "28px 32px",
            backgroundColor: "#fff",
            boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
            borderTop: "5px solid #093e5e",
          }}
        >
          {children}
        </div>
      </Content>

      {/* ================= FOOTER ================= */}
      <Footer
        style={{
          backgroundColor: "#093e5e",
          color: "#fff",
          textAlign: "center",
          fontSize: 11,
          padding: "10px",
        }}
      >
        © 2026 – Universidade Federal de Ciências da Saúde de Porto Alegre (UFCSPA)
      </Footer>
    </Layout>
  );
}