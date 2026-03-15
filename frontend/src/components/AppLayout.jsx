import { useMemo, useState, useEffect } from "react";
import { Layout, Menu, Typography, Button } from "antd";
import {
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined,
  IdcardOutlined,
  BookOutlined,
  LogoutOutlined
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
      location.pathname === "/cargos"
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
      default:
        return "";
    }

  }, [location.pathname]);

  /* ================= MENU ================= */

  const menuItems = [

    {
      key: "/home",
      icon: <HomeOutlined />,
      label: "Início",
    },

    {
      key: "cadastro-admin",
      icon: <TeamOutlined />,
      label: "Cadastro Administrativo",
      children: [
        {
          key: "/pessoas",
          icon: <UserOutlined />,
          label: "Pessoas",
        },
        {
          key: "/usuarios",
          icon: <IdcardOutlined />,
          label: "Usuários",
        },
        {
          key: "/cargos",
          icon: <TeamOutlined />,
          label: "Cargos",
        },
      ],
    },

    {
      key: "cadastro-academico",
      icon: <ApartmentOutlined />,
      label: "Cadastro Acadêmico",
      children: [
        {
          key: "/cursos",
          icon: <ApartmentOutlined />,
          label: "Cursos",
        },
        {
          key: "/disciplinas",
          icon: <BookOutlined />,
          label: "Disciplinas",
        },
      ],
    },

    {
      key: "/grade-horaria",
      icon: <CalendarOutlined />,
      label: "Grade Horária",
    },

  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const onOpenChange = (keys) => {

    const latestKey = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latestKey ? [latestKey] : []);

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
          height: 64,
          position: "relative"
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
          <img src={logoCentral} alt="UFCSPA" style={{ height: 28 }} />
        </div>

        {/* BOTÃO SAIR */}
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          style={{
            color: "#ffffff",
            fontWeight: 500,
            fontSize: 14
          }}
        >
          Sair
        </Button>

      </Header>

      <Layout>

        {/* SIDEBAR */}

        <Sider
          width={260}
          style={{
            backgroundColor: "#f0f6fa",
            borderRight: "1px solid #d9e4ec",
          }}
        >

          <Menu
            mode="inline"
            items={menuItems}
            selectedKeys={[location.pathname]}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            onClick={handleMenuClick}
            style={{
              backgroundColor: "#f0f6fa",
              borderRight: "none",
              fontSize: 14,
              paddingTop: 20,
            }}
          />

        </Sider>

        {/* CONTEÚDO */}

        <Content
          style={{
            padding: "30px 50px",
            backgroundColor: "#f5f7fa",
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
              padding: "30px",
              borderRadius: 10,
              border: "1px solid #e4eaf0",
              borderTop: "4px solid #093e5e",
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
          fontSize: 12,
        }}
      >
        © 2026 – Universidade Federal de Ciências da Saúde de Porto Alegre
      </Footer>

    </Layout>
  );
}