import { useMemo, useState } from "react";
import { Layout, Menu, Typography } from "antd";
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

  const rootSubmenuKeys = ["cadastro-admin", "cadastro-academico"];
  const [openKeys, setOpenKeys] = useState(rootSubmenuKeys);

  /* ================= TÍTULO DINÂMICO ================= */
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

  const onOpenChange = (keys) => {
    const latest = keys.find((k) => !openKeys.includes(k));
    if (rootSubmenuKeys.includes(latest)) {
      setOpenKeys([latest]);
    } else {
      setOpenKeys([]);
    }
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
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          position: "relative", // necessário para o absolute funcionar
          height: 60, // ajuste a altura do header conforme precisar
        }}
      >
        {/* Logo à esquerda */}
        <img src={logoBranco} alt="UFCSPA" style={{ height: 80 }} />

        {/* Logo centralizado */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 10, // <--- aqui você controla para cima ou para baixo
            transform: "translateX(-50%)",
          }}
        >
          <img src={logoCentral} alt="UFCSPA" style={{ height: 30 }} />
        </div>

        {/* Elemento à direita se precisar */}
      </Header>

      <Layout>
     {/* ================= SIDEBAR ================= */}
<Sider
  width={200}
  style={{
    backgroundColor: "#e1edf6",
    borderRight: "1px solid #d3dce6",
  }}
>
  {/* ESTILOS DE HOVER E SELEÇÃO */}
  <style>
    {`
      /* HOVER */
      .ant-menu-item:hover,
      .ant-menu-submenu-title:hover {
        background-color: #3a4f64 !important;
      }

      .ant-menu-item:hover a,
      .ant-menu-item:hover span,
      .ant-menu-submenu-title:hover a,
      .ant-menu-submenu-title:hover span {
        color: #ffffff !important;
      }

      .ant-menu-item:hover .anticon,
      .ant-menu-submenu-title:hover .anticon {
        color: #ffffff !important;
      }

      /* ITEM SELECIONADO */
      .ant-menu-item-selected {
        background-color: #3a4f64 !important;
      }

      .ant-menu-item-selected a,
      .ant-menu-item-selected span,
      .ant-menu-item-selected .anticon {
        color: #ffffff !important;
        font-weight: 600;
      }

      .ant-menu-item-selected::after {
        border-right: 3px solid #093e5e;
      }
    `}
  </style>


          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            onClick={({ key }) => navigate(key)}
            style={{
              backgroundColor: "#e1edf6",
              height: "100%",
              fontSize: 13,
              paddingTop: 16,
              fontWeight: 500,
            }}
            theme="light"
          >
            {/* INÍCIO */}
            <Menu.Item
              key="/home"
              icon={<HomeOutlined style={{ color: "#093e5e", fontSize: 12 }} />}
            >
              <Text style={{ color: "#093e5e", fontSize: 13 }}>Início</Text>
            </Menu.Item>

            {/* CADASTRO ADMINISTRATIVO */}
            <Menu.SubMenu
              key="cadastro-admin"
              icon={<TeamOutlined style={{ color: "#093e5e", fontSize: 12 }} />}
              title={
                <Text style={{ color: "#093e5e", fontSize: 13 }}>
                  Cadastro Administrativo
                </Text>
              }
            >
              <Menu.Item key="/pessoas">
                <Text style={{ color: "#1e293b", fontSize: 13 }}>Pessoas</Text>
              </Menu.Item>
              <Menu.Item key="/usuarios">
                <Text style={{ color: "#1e293b", fontSize: 13 }}>Usuários</Text>
              </Menu.Item>
              <Menu.Item key="/cargos">
                <Text style={{ color: "#1e293b", fontSize: 13 }}>Cargos</Text>
              </Menu.Item>
            </Menu.SubMenu>

            {/* CADASTRO ACADÊMICO */}
            <Menu.SubMenu
              key="cadastro-academico"
              icon={
                <ApartmentOutlined style={{ color: "#093e5e", fontSize: 12 }} />
              }
              title={
                <Text style={{ color: "#093e5e", fontSize: 13 }}>
                  Cadastro Acadêmico
                </Text>
              }
            >
              <Menu.Item key="/cursos">
                <Text style={{ color: "#1e293b", fontSize: 13 }}>Cursos</Text>
              </Menu.Item>
              <Menu.Item key="/disciplinas">
                <Text style={{ color: "#1e293b", fontSize: 13 }}>
                  Disciplinas
                </Text>
              </Menu.Item>
            </Menu.SubMenu>

            {/* GRADE HORÁRIA */}
            <Menu.Item
              key="/grade-horaria"
              icon={
                <CalendarOutlined style={{ color: "#093e5e", fontSize: 12 }} />
              }
            >
              <Text style={{ color: "#093e5e", fontSize: 13 }}>
                Grade Horária
              </Text>
            </Menu.Item>
          </Menu>
        </Sider>

        {/* ================= CONTEÚDO ================= */}
        <Content
          style={{
            padding: "24px 48px",
            backgroundColor: "#e8ebf0",
          }}
        >
          {/* TÍTULO */}
          <Title
            level={2}
            style={{
              margin: "0 0 12px",
              color: "#093e5e",
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 0.2,
            }}
          >
            {currentPage}
          </Title>

          {/* CONTAINER CENTRAL */}
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

      {/* ================= FOOTER ================= */}
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
