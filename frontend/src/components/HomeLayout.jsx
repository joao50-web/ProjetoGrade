import { Layout } from 'antd';
import logoBranco from '../assets/ufcspa-logo-branco.png';

const { Header, Content, Footer } = Layout;

export default function HomeLayout({ children }) {
  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#e8ebf0' }}>
      {/* HEADER */}
      <Header
        style={{
          backgroundColor: '#093e5e',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        <img src={logoBranco} alt="UFCSPA" style={{ height: 50 }} />
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