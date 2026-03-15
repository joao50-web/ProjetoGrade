import { Layout, Card, Form, Input, Button, Typography, message } from "antd";
import { MailOutlined, LockOutlined } from "@ant-design/icons";
import { api } from "../services/api";

import logoBranco from "../imagens/titulo_branco.png";
import logoCard from "../imagens/titulo_azul.png";

const { Header, Footer, Content } = Layout;
const { Title, Text } = Typography;

export default function Login() {

  const onFinish = async (values) => {
    try {

      const res = await api.post("/auth/login", {
        login: values.email,
        senha: values.senha
      });

      localStorage.setItem("token", res.data.token);

      message.success("Login realizado com sucesso");

      window.location.href = "/home";

    } catch (err) {

      message.error(
        err.response?.data?.error || "Erro ao realizar login"
      );

    }
  };

  return (

    <Layout
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f7fb"
      }}
    >

      {/* HEADER */}

      <Header
        style={{
          backgroundColor: "#093e5e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 72
        }}
      >
     

        <img
          src={logoBranco}
          alt="UFCSPA"
          style={{
            height: 110,
            objectFit: "contain"
          }}
        />

      </Header>

      {/* CONTEÚDO */}

      <Content
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px"
        }}
      >

        <Card
          style={{
            width: 440,
            borderRadius: 18,
            borderTop: "4px solid #093e5e",
            boxShadow: "0 15px 40px rgba(0,0,0,0.10)",
            border: "none"
          }}
          bodyStyle={{
            padding: 36
          }}
        >

          {/* LOGO DO CARD */}

          <div
            style={{
              textAlign: "center",
              marginBottom: 24
            }}
          >
            <img
              src={logoCard}
              alt="UFCSPA"
              style={{
                height: 65,
                objectFit: "contain"
              }}
            />
          </div>

          {/* TÍTULO */}

          <div style={{ textAlign: "center", marginBottom: 28 }}>

            <Title
              level={3}
              style={{
                color: "#093e5e",
                marginBottom: 6
              }}
            >
              Acesso ao Sistema
            </Title>

            <Text type="secondary">
              Utilize suas credenciais institucionais
            </Text>

          </div>

          {/* FORM */}

          <Form layout="vertical" onFinish={onFinish}>

            <Form.Item
              label="E-mail"
              name="email"
              rules={[{ required: true, message: "Informe seu e-mail" }]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="seu.email@ufcspa.edu.br"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item
              label="Senha"
              name="senha"
              rules={[{ required: true, message: "Informe sua senha" }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="••••••••"
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              style={{
                backgroundColor: "#093e5e",
                borderColor: "#093e5e",
                height: 46,
                borderRadius: 10,
                marginTop: 10,
                fontWeight: 500
              }}
            >
              Entrar
            </Button>

          </Form>

        </Card>

      </Content>

      {/* FOOTER */}

      <Footer
        style={{
          backgroundColor: "#093e5e",
          color: "#ffffff",
          textAlign: "center",
          fontSize: 12,
          padding: "12px 0"
        }}
      >
        © 2026 – Universidade Federal de Ciências da Saúde de Porto Alegre
      </Footer>

    </Layout>
  );
}