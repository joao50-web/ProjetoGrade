// AppLayout.jsx
import { useMemo, useState } from 'react';
import { Layout, Menu, Typography, Breadcrumb } from 'antd';
import { TeamOutlined, ApartmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import logoBranco from '../assets/ufcspa-logo-branco.png';

const { Header, Sider, Content, Footer } = Layout;
const { Text, Title } = Typography;

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const rootSubmenuKeys = ['cadastro-admin', 'cadastro-academico'];
  const [openKeys, setOpenKeys] = useState(rootSubmenuKeys);

  const currentPage = useMemo(() => {
    switch (location.pathname) {
      case '/pessoas': return 'Pessoas';
      case '/usuarios': return 'Usuários';
      case '/cargos': return 'Cargos';
      case '/cursos': return 'Cursos';
      case '/disciplinas': return 'Disciplinas';
      case '/grade': return 'Grade Horária';
      default: return '';
    }
  }, [location.pathname]);

  const onOpenChange = keys => {
    const latest = keys.find(k => !openKeys.includes(k));
    if (rootSubmenuKeys.includes(latest)) setOpenKeys([latest]);
    else setOpenKeys([]);
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#e8ebf0' }}>
      {/* HEADER */}
      <Header
        style={{
          backgroundColor: '#093e5e',
          display: 'flex',
          alignItems: 'center',
          padding: '0 30px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        <img src={logoBranco} alt="UFCSPA" style={{ height: 50 }} />
      </Header>

      <Layout>
        {/* SIDEBAR */}
        <Sider
          width={220}
          style={{
            backgroundColor: '#e1edf6',
            borderRight: '1px solid #d3dce6',
            boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            onClick={({ key }) => navigate(key)}
            style={{ backgroundColor: '#e1edf6', height: '100%', fontSize: 13, paddingTop: 16,fontWeight: 500, }}
            theme="light"
          >
            <Menu.SubMenu
              key="cadastro-admin"
              icon={<TeamOutlined style={{ color: '#093e5e', fontSize: 12 }} />}
              title={<Text strong style={{ color: '#093e5e',fontSize: 12 }}>Cadastro Administrativo</Text>}
            >
              <Menu.Item key="/pessoas">Pessoas</Menu.Item>
              <Menu.Item key="/usuarios">Usuários</Menu.Item>
              <Menu.Item key="/cargos">Cargos</Menu.Item>
            </Menu.SubMenu>

            <Menu.SubMenu
              key="cadastro-academico"
              icon={<ApartmentOutlined style={{ color: '#093e5e', fontSize: 12}} />}
              title={<Text strong style={{ color: '#093e5e',fontSize: 12 }}>Cadastro Acadêmico</Text>}
            >
              <Menu.Item key="/cursos">Cursos</Menu.Item>
              <Menu.Item key="/disciplinas">Disciplinas</Menu.Item>
            </Menu.SubMenu>

            <Menu.Item
              key="/grade"
              icon={<CalendarOutlined style={{ color: '#093e5e', fontSize: 12 }} />}
            >
              Grade Horária
            </Menu.Item>
          </Menu>
        </Sider>

        {/* CONTENT */}
        <Content style={{ padding: '20px 42px', backgroundColor: '#e8ebf0' }}>
          {/* Breadcrumb e Título */}
          <div style={{ marginBottom: 10 }}>
        
            <Title level={2} style={{ margin: 0, color: '#093e5e', fontSize: 26 }}>{currentPage}</Title>
          </div>

          {/* Card central onde o conteúdo real da página entra */}
          <div style={{
            borderRadius: 12,
            padding: 24,
            backgroundColor: '#fff',
            boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #093e5e',
            transition: 'all 0.3s',
          }}>
            {children}
          </div>
        </Content>
      </Layout>

      {/* FOOTER */}
      <Footer style={{ backgroundColor: '#093e5e', color: '#fff', textAlign: 'center', fontSize: 12, padding: '12px 0' }}>
        © 2026 – Universidade Federal de Ciências da Saúde de Porto Alegre (UFCSPA)
      </Footer>
    </Layout>
  );
}