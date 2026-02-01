import { Layout, Menu } from 'antd';
import {
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined
} from '@ant-design/icons';

import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
//import logo from '../assets/ufcspa-logo.png';
import logoBranco from '../assets/ufcspa-logo-branco.png';

const { Header, Sider, Content, Footer } = Layout;

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Submenus existentes
  const rootSubmenuKeys = ['cadastro-admin', 'cadastro-academico'];

  // Começam abertos
  const [openKeys, setOpenKeys] = useState(rootSubmenuKeys);

  const onOpenChange = (keys) => {
    // Mantém somente submenus válidos
    const filteredKeys = keys.filter(k => rootSubmenuKeys.includes(k));
    setOpenKeys(filteredKeys);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          backgroundColor: '#0B3A4A',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <img src={logoBranco} alt="UFCSPA" style={{ height: 32 }} />
      </Header>

      <Layout>
        <Sider
          width={260}
          collapsible={false}
          style={{ backgroundColor: '#FFFFFF' }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={openKeys}
            onOpenChange={onOpenChange}
            onClick={({ key }) => navigate(key)}
            style={{ height: '100%' }}
          >
            <Menu.SubMenu
              key="cadastro-admin"
              icon={<TeamOutlined />}
              title="Cadastro Administrativo"
            >
              <Menu.Item key="/pessoas">Pessoas</Menu.Item>
              <Menu.Item key="/usuarios">Usuários</Menu.Item>
              <Menu.Item key="/cargos">Cargos</Menu.Item>
            </Menu.SubMenu>

            <Menu.SubMenu
              key="cadastro-academico"
              icon={<ApartmentOutlined />}
              title="Cadastro Acadêmico"
            >
              <Menu.Item key="/cursos">Cursos</Menu.Item>
              <Menu.Item key="/disciplinas">Disciplinas</Menu.Item>
            </Menu.SubMenu>

            <Menu.Item key="/grade" icon={<CalendarOutlined />}>
              Grade Horária
            </Menu.Item>
          </Menu>
        </Sider>

        <Content style={{ padding: 24, backgroundColor: '#EAF2F6' }}>
          {children}
        </Content>
      </Layout>

      <Footer
  style={{
    backgroundColor: '#0B3A4A',
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 12,
    padding: '12px 0'
  }}
    >
      © 2026 – Universidade Federal de Ciências da Saúde de Porto Alegre (UFCSPA).
      Todos os direitos reservados.
    </Footer>

    </Layout>
  );
}
