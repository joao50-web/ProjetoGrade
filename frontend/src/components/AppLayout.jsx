import { useMemo, useState, useEffect } from "react";
import { Layout, Menu, Typography, Divider } from "antd";
import {
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import logoBranco from "../imagens/logo_branco.png";
import logoCentral from "../imagens/titulo_branco_2.png";

const { Header, Sider, Content, Footer } = Layout;
const { Text, Title } = Typography;

export default function AppLayout({ children }) {

  const navigate = useNavigate();
  const location = useLocation();
  const [openKeys, setOpenKeys] = useState([]);

  /* ================= SUBMENU ABERTO ================= */

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
      icon: <HomeOutlined style={{ fontSize: 14, color: "#374151" }} />,
      label: <Text style={{ fontSize: 13 }}>Início</Text>,
    },

    {
      type: "divider",
    },

    {
      key: "cadastro-admin",
      icon: <TeamOutlined style={{ fontSize: 16, color: "#093e5e" }} />,
      label: (
        <Text style={{ fontSize: 13, fontWeight: 600, color: "#093e5e" }}>
          Cadastro Administrativo
        </Text>
      ),
      children: [
        {
          key: "/pessoas",
          label: <Text style={{ fontSize: 13 }}>Pessoas</Text>,
        },
        {
          key: "/usuarios",
          label: <Text style={{ fontSize: 13 }}>Usuários</Text>,
        },
        {
          key: "/cargos",
          label: <Text style={{ fontSize: 13 }}>Cargos</Text>,
        },
      ],
    },

    {
      key: "cadastro-academico",
      icon: <ApartmentOutlined style={{ fontSize: 16, color: "#093e5e" }} />,
      label: (
        <Text style={{ fontSize: 13, fontWeight: 600, color: "#093e5e" }}>
          Cadastro Acadêmico
        </Text>
      ),
      children: [
        {
          key: "/cursos",
          label: <Text style={{ fontSize: 13 }}>Cursos</Text>,
        },
        {
          key: "/disciplinas",
          label: <Text style={{ fontSize: 13 }}>Disciplinas</Text>,
        },
      ],
    },

    {
      type: "divider",
    },

    {
      key: "/grade-horaria",
      icon: <CalendarOutlined style={{ fontSize: 14, color: "#374151" }} />,
      label: <Text style={{ fontSize: 13 }}>Grade Horária</Text>,
    },

  ];

  /* ================= CONTROLE SUBMENU ================= */

  const onOpenChange = (keys) => {

    const latestKey = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latestKey ? [latestKey] : []);

  };

  /* ================= CLIQUE MENU ================= */

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  return (

    <Layout style={{ minHeight: "100vh", backgroundColor: "#e8ebf0" }}>

      {/* HEADER */}

      <Header
        style={{
          backgroundColor: "#093e5e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          position: "relative",
          height: 60,
        }}
      >

        <img src={logoBranco} alt="UFCSPA" style={{ height: 70 }} />

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 5,
            transform: "translateX(-50%)",
          }}
        >
          <img src={logoCentral} alt="UFCSPA" style={{ height: 25 }} />
        </div>

      </Header>

      <Layout>

        {/* SIDEBAR */}

        <Sider
          width={250}
          style={{
            backgroundColor: "#e1edf6",
            borderRight: "1px solid #d3dce6",
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
              backgroundColor: "#e1edf6",
              height: "100%",
              fontSize: 13,
              paddingTop: 16,
              fontWeight: 500,
            }}
          />

        </Sider>

        {/* CONTEÚDO */}

        <Content
          style={{
            padding: "24px 48px",
            backgroundColor: "#e8ebf0",
          }}
        >

          <Title
            level={2}
            style={{
              margin: "0 0 12px",
              color: "#093e5e",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            {currentPage}
          </Title>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 8,
              padding: "28px 32px",
              border: "1px solid #e2e8f0",
              borderTop: "4px solid #093e5e",
            }}
          >
            {children}
          </div>

        </Content>

      </Layout>

      {/* FOOTER */}

      <Footer
        style={{
          backgroundColor: "#093e5e",
          color: "#ffffff",
          textAlign: "center",
          fontSize: 12,
          padding: "12px 0",
        }}
      >
        © 2026 – Universidade Federal de Ciências da Saúde de Porto Alegre
        (UFCSPA)
      </Footer>

    </Layout>
  );
}