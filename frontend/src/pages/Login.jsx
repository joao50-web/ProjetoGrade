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
      localStorage.setItem("usuario", JSON.stringify(res.data.usuario));

      const role = res.data.usuario.role;
      let redirect = "/home";
      if (role === "administrador") redirect = "/home";
      else if (role === "visualizacao" || role === "edicao") redirect = "/grade-horaria";

      message.success("Login realizado com sucesso");
      window.location.href = redirect;

    } catch (err) {
      message.error(err.response?.data?.error || "Erro ao realizar login");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f4f7fb" }}>

      {/* HEADER */}
      <Header
        style={{
          backgroundColor: "#093e5e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 90
        }}
      >
        <img
          src={logoBranco}
          alt="UFCSPA"
          style={{ height: 130, objectFit: "contain" }}
        />
      </Header>

      {/* CONTENT */}
      <Content
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px"
        }}
      >
        <Card
          style={{
            width: 450,
            borderRadius: 20,
            borderTop: "5px solid #093e5e",
            boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
            border: "none",
          }}
          bodyStyle={{ padding: 40 }}
        >

          {/* LOGO CARD */}
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <img
              src={logoCard}
              alt="UFCSPA"
              style={{ height: 70, objectFit: "contain" }}
            />
          </div>

          {/* TITLE */}
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <Title level={3} style={{ color: "#093e5e", marginBottom: 6 }}>
              Acesso ao Sistema
            </Title>
            <Text type="secondary">
              Utilize suas credenciais institucionais
            </Text>
          </div>

          {/* FORM */}
          <Form layout="vertical" onFinish={onFinish}>

            <Form.Item
              label="Login"
              name="email"
              rules={[{ required: true, message: "Informe seu e-mail" }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#093e5e" }} />}
                placeholder=""
                size="large"
                style={{
                  borderRadius: 10,
                  borderColor: "#d9d9d9",
                  height: 48,
                }}
              />
            </Form.Item>

            <Form.Item
              label="Senha"
              name="senha"
              rules={[{ required: true, message: "Informe sua senha" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#093e5e" }} />}
                placeholder="••••••••"
                size="large"
                style={{
                  borderRadius: 10,
                  borderColor: "#d9d9d9",
                  height: 48,
                }}
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
                height: 50,
                borderRadius: 12,
                marginTop: 10,
                fontWeight: 600,
                fontSize: 16,
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
          fontSize: 13,
          padding: "14px 0"
        }}
      >
        © 2026 – Universidade Federal de Ciências da Saúde de Porto Alegre
      </Footer>

    </Layout>
  );
}