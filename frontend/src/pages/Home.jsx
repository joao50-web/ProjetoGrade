import { Card, Button, Typography, Space, Divider } from 'antd';
import {
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import HomeLayout from '../components/HomeLayout';

const { Title, Text } = Typography;

export default function Home() {
  const navigate = useNavigate();

  return (
    <HomeLayout>
      {/* CABEÇALHO INSTITUCIONAL */}
      <div style={{ marginBottom: 28 }}>
        <Title level={2} style={{ marginBottom: 4, color: '#093e5e' }}>
          Sistema de Gestão Acadêmica
        </Title>
        <Text type="secondary">
          Universidade Federal de Ciências da Saúde de Porto Alegre
        </Text>
      </div>

      <Divider />

      {/* MÓDULOS */}
      <Space size={32} wrap style={{ marginTop: 14 }}>
        <Card
          style={{
            width: 350,
            borderRadius: 8,
            border: '1px solid #000000',
          }}
        >
          <Space direction="vertical" size={12}>
            <TeamOutlined style={{ fontSize: 28, color: '#093e5e' }} />
            <Title level={3} style={{ margin: 0 }}>
              Cadastro Administrativo
            </Title>
            <Text type="secondary">
              Pessoas, usuários e cargos.
            </Text>
            <Button type="primary" onClick={() => navigate('/pessoas')}>
              Acessar módulo
            </Button>
          </Space>
        </Card>

        <Card
          style={{
            width: 320,
            borderRadius: 8,
            border: '1px solid #000000',
          }}
        >
          <Space direction="vertical" size={12}>
            <ApartmentOutlined style={{ fontSize: 28, color: '#093e5e' }} />
            <Title level={3} style={{ margin: 0 }}>
              Cadastro Acadêmico
            </Title>
            <Text type="secondary">
              Cursos e disciplinas.
            </Text>
            <Button type="primary" onClick={() => navigate('/cursos')}>
              Acessar módulo
            </Button>
          </Space>
        </Card>

        <Card
          style={{
            width: 320,
            borderRadius: 8,
            border: '1px solid #000000',
          }}
        >
          <Space direction="vertical" size={12}>
            <CalendarOutlined style={{ fontSize: 28, color: '#093e5e' }} />
            <Title level={3} style={{ margin: 0 }}>
              Grade Horária
            </Title>
            <Text type="secondary">
              Organização de horários.
            </Text>
            <Button onClick={() => navigate('/grade-horaria')}>
              Acessar módulo
            </Button>
          </Space>
        </Card>
      </Space>
    </HomeLayout>
  );
}