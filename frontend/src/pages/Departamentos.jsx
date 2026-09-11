import { useEffect, useState, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Space } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ApartmentOutlined } from '@ant-design/icons';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

/* =========================================
   PALETA DE CORES (Variada, sem verdes)
========================================= */
const paletaPastelSuave = [
  "#FFF6DF", // Creme
  "#F9EBCF", // Bege
  "#F3DDB5", // Areia
  "#EBD3A9", // Ocre claro
  "#F8D8C2", // Pêssego
  "#F2C6B5", // Salmão claro
  "#F2D5D5", // Rosa claro
  "#EBD9E8", // Lilás claro
  "#DED7ED", // Roxo pastel
  "#D4DDF0", // Azul claro 1
  "#C9DFED", // Azul claro 2
  "#C4DDE3", // Azul claro 3
  "#B3E5FC", // AZUL NOVO (substituiu o verde)
  "#BBDEFB", // AZUL NOVO (substituiu o verde)
  "#D0E8F2", // AZUL NOVO (substituiu o verde)
  "#E2E1DC"  // Cinza claro
];

/* =========================================
   ESTILOS GERAIS
========================================= */
const headerCellStyle = { 
  backgroundColor: '#093e5e', 
  color: '#ffffff', 
  fontWeight: 600, 
  padding: '14px 20px', 
  fontSize: 16, 
  textAlign: 'center' 
};

/* =========================================
   PÁGINA PRINCIPAL
========================================= */
export default function Departamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departamentos');
      setDepartamentos(Array.isArray(res.data) ? res.data : []);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      message.error('Erro ao carregar departamentos.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // MAPEAMENTO DE CORES PARA OS DEPARTAMENTOS
  const departamentoCoresMap = useMemo(() => {
    const map = {};
    departamentos.forEach((dep, index) => {
      map[dep.id] = paletaPastelSuave[index % paletaPastelSuave.length];
    });
    return map;
  }, [departamentos]);

  const save = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editing) await api.put(`/departamentos/${editing.id}`, values);
      else await api.post('/departamentos', values);
      
      message.success('Departamento salvo com sucesso!');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      load();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.error || 'Erro ao salvar departamento');
    } finally { setLoading(false); }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/departamentos/${id}`);
      message.success('Departamento removido com sucesso');
      load();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      message.error('Não é possível excluir este departamento pois ele já está sendo utilizado no sistema.');
    }
  };

  const filtered = departamentos.filter(d => 
    [d.nome, d.sigla].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Input 
          placeholder="Buscar departamento..." 
          prefix={<SearchOutlined />} 
          allowClear 
          style={{ width: 300, height: 42 }} 
          onChange={e => setSearch(e.target.value)} 
        />
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }} 
            style={{ height: 42, fontWeight: 600 }}
          >
            Novo Departamento
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        loading={loading}
        bordered
        pagination={{ pageSize: 6 }}
        columns={[
          { 
            title: 'Departamento', 
            dataIndex: 'nome', 
            onHeaderCell: () => ({ style: headerCellStyle }), 
            render: (text, record) => {
              const cor = departamentoCoresMap[record.id];
              return (
                <div style={{ padding: '8px 16px', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span 
                    style={{ 
                      width: 14, 
                      height: 14, 
                      borderRadius: '50%', 
                      backgroundColor: cor, 
                      display: 'inline-block',
                      border: '1px solid rgba(0,0,0,0.1)' 
                    }} 
                  />
                  {text}
                </div>
              );
            } 
          },
          { 
            title: 'Sigla', 
            dataIndex: 'sigla', 
            align: 'center', 
            onHeaderCell: () => ({ style: headerCellStyle }), 
            render: (text, record) => {
              const cor = departamentoCoresMap[record.id];
              return (
                <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ 
                    backgroundColor: cor, 
                    padding: '4px 16px', 
                    borderRadius: '6px', 
                    fontSize: 15, 
                    fontWeight: 600, 
                    color: '#333',
                    border: '1px solid rgba(0,0,0,0.05)',
                    display: 'inline-block'
                  }}>
                    {text}
                  </div>
                </div>
              );
            } 
          },
          {
            title: 'Editar', align: 'center', width: 120, onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => <Button icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setOpen(true); }} />
          },
          {
            title: 'Excluir', align: 'center', width: 120, onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <Popconfirm title="Deseja excluir este departamento?" onConfirm={() => remove(r.id)}>
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )
          }
        ]}
      />

      <Modal title={editing ? "Editar Departamento" : "Novo Departamento"} open={open} onCancel={() => setOpen(false)} onOk={save} confirmLoading={loading} okText="Salvar">
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input prefix={<ApartmentOutlined />} />
          </Form.Item>
          <Form.Item name="sigla" label="Sigla" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}