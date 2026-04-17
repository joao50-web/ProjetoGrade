import React, { useMemo, useState, useEffect } from "react";
import { Layout, Menu, Typography, Button } from "antd";
import { getUsuarioLogado } from "../services/api";

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
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";

import { useNavigate, useLocation } from "react-router-dom";

import logoBranco from "../imagens/logo_branco.png";
import logoCentral from "../imagens/titulo_branco_2.png";

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState([]);

  const usuario = getUsuarioLogado();
  const isAdmin = usuario?.role?.toLowerCase() === "administrador";

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ✅ ROTAS CORRETAS (AGORA PADRONIZADO COM /academico)
  const pageMap = {
    "/home": "Início",

    "/pessoas": "Pessoas",
    "/usuarios": "Usuários",
    "/cargos": "Cargos",
    "/logs": "Histórico",

    "/academico/departamentos": "Departamentos",
    "/academico/disciplinas": "Disciplinas",
    "/academico/cursos": "Cursos",

    "/grade-horaria": "Grade Horária",
    "/relatorios": "Relatórios",
  };

  const currentPage = pageMap[location.pathname] || "";

  /* ================= MENU ABERTO INTELIGENTE ================= */
  useEffect(() => {
    const path = location.pathname;

    if (
      path.startsWith("/pessoas") ||
      path.startsWith("/usuarios") ||
      path.startsWith("/cargos") ||
      path.startsWith("/logs")
    ) {
      setOpenKeys(["admin"]);
      return;
    }

    if (path.startsWith("/academico")) {
      setOpenKeys(["academico"]);
      return;
    }

    setOpenKeys([]);
  }, [location.pathname]);

  /* ================= MENU ================= */
  const menuItems = useMemo(() => {
    if (!isAdmin) {
      return [
        { key: "/grade-horaria", icon: <CalendarOutlined />, label: "Grade Horária" },
        { key: "/relatorios", icon: <BarChartOutlined />, label: "Relatórios" },
      ];
    }

    return [
      { key: "/home", icon: <HomeOutlined />, label: "Início" },

      { type: "divider" },

      {
        key: "admin",
        label: "Administrativo",
        children: [
          { key: "/pessoas", icon: <UserOutlined />, label: "Pessoas" },
          { key: "/usuarios", icon: <IdcardOutlined />, label: "Usuários" },
          { key: "/cargos", icon: <TeamOutlined />, label: "Cargos" },
          { key: "/logs", icon: <HistoryOutlined />, label: "Histórico" },
        ],
      },

      {
        key: "academico",
        label: "Acadêmico",
        children: [
          {
            key: "/academico/departamentos",
            icon: <ApartmentOutlined />,
            label: "Departamentos",
          },
          {
            key: "/academico/disciplinas",
            icon: <BookOutlined />,
            label: "Disciplinas",
          },
          {
            key: "/academico/cursos",
            icon: <BookOutlined />,
            label: "Cursos",
          },
        ],
      },

      { type: "divider" },

      {
        key: "/grade-horaria",
        icon: <CalendarOutlined />,
        label: "Grade Horária",
      },
      {
        key: "/relatorios",
        icon: <BarChartOutlined />,
        label: "Relatórios",
      },
    ];
  }, [isAdmin]);

  const handleMenuClick = ({ key }) => {
    if (location.pathname !== key) {
      navigate(key);
    }
  };

  /* ================= CONTROLE DO MENU ================= */
  const onOpenChange = (keys) => {
    const latest = keys.find((k) => !openKeys.includes(k));

    if (latest) {
      setOpenKeys([latest]);
    } else {
      setOpenKeys(keys);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#093e5e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          height: 44,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: "#fff" }}
          />
          <img src={logoBranco} alt="logo" style={{ height: 38 }} />
        </div>

        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <img src={logoCentral} alt="titulo" style={{ height: 18 }} />
        </div>

        <Button
          size="small"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            borderRadius: 6,
            height: 26,
            fontSize: 12,
          }}
        >
          Sair
        </Button>
      </Header>

      <Layout>
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          width={200}
          collapsedWidth={65}
          style={{
            background: "#ffffff",
            borderRight: "1px solid #e5e7eb",
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
            motion={false}
            style={{
              border: "none",
              fontSize: 13,
              paddingTop: 6,
            }}
          />
        </Sider>

        <Content
          style={{
            padding: "15px 25px",
            background: "#f5f7fa",
          }}
        >
          <Title level={4} style={{ color: "#093e5e", marginBottom: 10 }}>
            {currentPage}
          </Title>

          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>

      <Footer
        style={{
          textAlign: "center",
          background: "#093e5e",
          color: "#fff",
          fontSize: 10,
          padding: "6px",
        }}
      >
        © 2026 – UFCSPA
      </Footer>
    </Layout>
  );
}

export default React.memo(AppLayout);