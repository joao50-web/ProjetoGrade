import { Layout } from 'antd';
import logoBranco from '../imagens/logo_branco.png';
import logoCentral from '../imagens/titulo_branco_2.png';

const { Header, Content, Footer } = Layout;

export default function HomeLayout({ children }) {
  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#e8ebf0' }}>
      {/* ================= HEADER ================= */}
      <Header
        style={{
          backgroundColor: '#093e5e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between', // mantém logo esquerda/direita
          padding: '0 20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          position: 'relative', // necessário para o logo central absoluto
          height: 60, // altura do header ajustável
        }}
      >
        {/* Logo à esquerda */}
        <img src={logoBranco} alt="UFCSPA" style={{ height: 80 }} />

        {/* Logo centralizado */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 10, // ⬅ ajuste vertical do logo central
            transform: 'translateX(-50%)',
          }}
        >
          <img src={logoCentral} alt="UFCSPA" style={{ height: 30 }} />
        </div>

        {/* Espaço para elemento à direita se precisar */}
        <div></div>
      </Header>

      {/* CONTENT */}
     <Content
  style={{
    padding: '55px 56px',
    backgroundColor: '#e8ebf0',
    display: 'flex',
    justifyContent: 'center',
  }}
>
  <div
    style={{
      width: '100%',
      maxWidth: 1200,   // 🔥 container central maior
      borderRadius: 10,
      padding: '32px 40px',
      backgroundColor: '#fff',
      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
      borderTop: '5px solid #093e5e',
    }}
  >
    {children}
  </div>
</Content>

      {/* FOOTER */}
      <Footer
        style={{
          backgroundColor: '#093e5e',
          color: '#fff',
          textAlign: 'center',
          fontSize: 12,
          padding: '12px 0',
        }}
      >
        © 2026 – Universidade Federal de Ciências da Saúde de Porto Alegre (UFCSPA)
      </Footer>
    </Layout>
  );
}