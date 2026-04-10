import { useMemo, useState, useEffect, useRef } from "react";
import { Layout, Menu, Typography, Button } from "antd";
import { getUsuarioLogado } from '../services/api';

import {
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined,
  IdcardOutlined,
  BookOutlined,
  LogoutOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

import { useNavigate, useLocation } from "react-router-dom";

import logoBranco from "../imagens/logo_branco.png";
import logoCentral from "../imagens/titulo_branco_2.png";

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openKeys, setOpenKeys] = useState([]);
  const [collapsed, setCollapsed] = useState(true);

  const hoverTimeout = useRef(null);

  /* ================= LOGOUT ================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  /* ================= CONTROLE SUBMENU ================= */

  useEffect(() => {
    let keys = [];

    if (
      location.pathname === "/pessoas" ||
      location.pathname === "/usuarios" ||
      location.pathname === "/cargos" ||
      location.pathname === "/logs"
    ) {
      keys = ["cadastro-admin"];
    }

    if (
      location.pathname === "/cursos" ||
      location.pathname === "/disciplinas"
    ) {
      keys = ["cadastro-academico"];
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpenKeys(keys);
  }, [location.pathname]);

   const usuario = getUsuarioLogado ()
  /* ================= TITULO PAGINA ================= */

  const currentPage = useMemo(() => {
    switch (location.pathname) {
      case "/home":
        return "Início";
      case "/pessoas":
        return "Pessoas";
      case "/usuarios":
        return "Usuários";
      case "/cargos":
        return "Cargos";
      case "/cursos":
        return "Cursos";
      case "/disciplinas":
        return "Disciplinas";
      case "/grade-horaria":
        return "Grade Horária";
      case "/logs":
        return "Histórico de Atividades";
      default:
        return "";
    }
  }, [location.pathname]);

  /* ================= MENU ================= */

  const menuItems = useMemo(() => {
    if (usuario.role !== "administrador") {
      return [
        {
          key: "/grade-horaria",
          icon: <CalendarOutlined />,
          label: "Grade Horária",
        },
      ];
    } else {
      return [
        { key: "/home", icon: <HomeOutlined />, label: "Início" },
        {
          key: "cadastro-admin",
          icon: <TeamOutlined />,
          label: "Cadastro Administrativo",
          children: [
            { key: "/pessoas", icon: <UserOutlined />, label: "Pessoas" },
            { key: "/usuarios", icon: <IdcardOutlined />, label: "Usuários" },
            { key: "/cargos", icon: <TeamOutlined />, label: "Cargos" },
            { key: "/logs", icon: <HistoryOutlined />, label: "Histórico" },
          ],
        },
        {
          key: "cadastro-academico",
          icon: <ApartmentOutlined />,
          label: "Cadastro Acadêmico",
          children: [
            { key: "/cursos", icon: <ApartmentOutlined />, label: "Cursos" },
            { key: "/disciplinas", icon: <BookOutlined />, label: "Disciplinas" },
          ],
        },
        { key: "/grade-horaria", icon: <CalendarOutlined />, label: "Grade Horária" },
      ];
    }
  }, [usuario.role]);

  const handleMenuClick = ({ key }) => navigate(key);

  const onOpenChange = (keys) => {
    const latestKey = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latestKey ? [latestKey] : []);
  };

  /* ================= HOVER SUAVE ================= */

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);

    hoverTimeout.current = setTimeout(() => {
      setCollapsed(false);
    }, 80);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);

    hoverTimeout.current = setTimeout(() => {
      setCollapsed(true);
    }, 250);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* HEADER */}

      <Header
        style={{
          backgroundColor: "#093e5e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          height: 40,
          position: "relative",
        }}
      >
        {/* Logo esquerda */}
        <img src={logoBranco} alt="UFCSPA" style={{ height: 58 }} />

        {/* Logo central */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <img src={logoCentral} alt="UFCSPA" style={{ height: 18 }} />
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
            height: 30,
            padding: "0 10px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.22)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.12)";
          }}
        >
          Sair
        </Button>
      </Header>

      <Layout>
        {/* SIDEBAR */}

        <Sider
          collapsed={collapsed}
          width={260}
          collapsedWidth={80}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundColor: "#f0f6fa",
            borderRight: "1px solid #d9e4ec",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: collapsed
              ? "2px 0 6px rgba(0,0,0,0.05)"
              : "4px 0 12px rgba(0,0,0,0.08)",
          }}
        >
          <Menu
            mode="inline"
            items={menuItems}
            selectedKeys={[location.pathname]}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={onOpenChange}
            onClick={handleMenuClick}
            inlineCollapsed={collapsed}
            style={{
              backgroundColor: "#f0f6fa",
              borderRight: "none",
              fontSize: 15,
              paddingTop: 20,
              transition: "all 0.3s ease",
            }}
          />
        </Sider>

        {/* CONTEÚDO */}

        <Content
          style={{
            padding: "5px 40px",
            backgroundColor: "#f5f7fa",
            transition: "all 0.3s ease",
          }}
        >
          <Title
            level={2}
            style={{
              marginBottom: 20,
              color: "#093e5e",
              fontWeight: 600,
            }}
          >
            {currentPage}
          </Title>

          <div
            style={{
              background: "#ffffff",
              padding: "40px",
              borderRadius: 10,
              border: "1px solid #e4eaf0",
              borderTop: "3px solid #093e5e",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>

      {/* FOOTER */}

      <Footer
        style={{
          textAlign: "center",
          backgroundColor: "#093e5e",
          color: "#ffffff",
          fontSize: 11,
          padding: "10px 0px",
          lineHeight: 1.2,
        }}
      >
        © 2026 – Universidade Federal de Ciências da Saúde de Porto Alegre
      </Footer>
    </Layout>
  );
}