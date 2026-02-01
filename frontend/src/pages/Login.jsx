import { Layout, Card, Form, Input, Button, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import logo from '../assets/ufcspa-logo.png';

const { Header, Footer, Content } = Layout;
const { Title, Text } = Typography;

export default function Login() {

  const onFinish = async (values) => {
    try {
      const res = await api.post('/auth/login', {
        login: values.email, // ou email, conforme backend
        senha: values.senha
      });

      localStorage.setItem('token', res.data.token);
      message.success('Login realizado com sucesso');

      window.location.href = '/dashboard';
    } catch (err) {
      message.error(
        err.response?.data?.error || 'Erro ao realizar login'
    );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#EAF2F6' }}>
      <Header style={{ backgroundColor: '#0B3A4A', height: 56 }} />

      <Content style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card
          style={{ width: 400, borderRadius: 14, boxShadow: '0 16px 40px rgba(0,0,0,0.18)' }}
          bodyStyle={{ padding: 28 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src={logo} alt="UFCSPA" style={{ maxWidth: 150 }} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <Title level={4}>Acesso ao Sistema</Title>
            <Text type="secondary">Entre com suas credenciais</Text>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item name="email" rules={[{ required: true }]}>
              <Input prefix={<MailOutlined />} placeholder="seu.email@ufcspa.edu.br" size="large" />
            </Form.Item>

            <Form.Item name="senha" rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large"
              style={{ backgroundColor: '#0B3A4A', height: 42, borderRadius: 8 }}>
              Entrar
            </Button>

            <Button block size="large"
              style={{ marginTop: 10, height: 42, borderRadius: 8, borderColor: '#0B3A4A', color: '#0B3A4A' }}>
              Registrar-se
            </Button>
          </Form>
        </Card>
      </Content>

      <Footer style={{ backgroundColor: '#0B3A4A', height: 48 }} />
    </Layout>
  );
}
