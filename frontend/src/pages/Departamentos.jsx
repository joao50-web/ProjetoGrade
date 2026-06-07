import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ApartmentOutlined } from '@ant-design/icons';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const { Text } = Typography;

/* =========================================
   HEADER STYLE (AZUL PADRÃO SISTEMA)
========================================= */

const headerCellStyle = { 
  backgroundColor: '#093e5e', 
  color: '#ffffff', 
  fontWeight: 600, 
  padding: '14px 20px', 
  fontSize: 16, 
  textAlign: 'center' 
};

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
    } catch (err) {
      message.error('Erro ao carregar departamentos.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

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
    } catch (error) {
      message.error('Não é possível excluir este departamento pois ele já está sendo utilizado no sistema.');
    }
  };

  const filtered = departamentos.filter(d => 
    [d.nome, d.sigla].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const renderText = (text, strong = false) => (
    <div style={{ padding: '8px 16px' }}>
      <span
        style={{
          fontSize: strong ? 17 : 16,
          fontWeight: strong ? 600 : 400,
          color: '#111827',
        }}
      >
        {text}
      </span>
    </div>
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
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }} 
          style={{ height: 42 }}
        >
          Novo Departamento
        </Button>
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
            render: (t) => renderText(t, true) 
          },
          { 
            title: 'Sigla', 
            dataIndex: 'sigla', 
            align: 'center', 
            onHeaderCell: () => ({ style: headerCellStyle }), 
            render: (t) => renderText(t) 
          },
          {
            title: 'Editar',
            align: 'center',
            width: 120,
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <Button 
                icon={<EditOutlined />} 
                onClick={() => { setEditing(r); form.setFieldsValue(r); setOpen(true); }} 
              />
            ),
          },
          {
            title: 'Excluir',
            align: 'center',
            width: 120,
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <Popconfirm 
                title="Deseja excluir este departamento?" 
                onConfirm={() => remove(r.id)}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          }
        ]}
      />

      <Modal 
        title={editing ? "Editar Departamento" : "Novo Departamento"} 
        open={open} 
        onCancel={() => setOpen(false)} 
        onOk={save} 
        confirmLoading={loading}
        okText="Salvar"
      >
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