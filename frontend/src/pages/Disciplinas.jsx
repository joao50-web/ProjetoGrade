import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Space
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '14px 20px',
  fontSize: 16,
  textAlign: 'center'
};

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/disciplinas');
      setDisciplinas(res.data);
    } catch {
      message.error('Erro ao carregar disciplinas');
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editing) {
        await api.put(`/disciplinas/${editing.id}`, values);
      } else {
        await api.post('/disciplinas', values);
      }

      closeModal();
      load();
    } catch (err) {
      message.error(err.response?.data?.error || 'Erro ao salvar disciplina');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/disciplinas/${id}`);
      message.success('Disciplina removida');
      load();
    } catch {
      message.error('Erro ao excluir disciplina');
    }
  };

  const edit = (disciplina) => {
    setEditing(disciplina);
    form.setFieldsValue({
      nome: disciplina.nome,
      codigo: disciplina.codigo
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = disciplinas.filter(d =>
    [d.nome, d.codigo].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const renderText = (text, strong = false) => (
    <div style={{ padding: '8px 16px' }}>
      <span style={{ fontSize: strong ? 17 : 16, fontWeight: strong ? 500 : 400 }}>
        {text}
      </span>
    </div>
  );

  return (
    <AppLayout>

      {/* TOPO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Input
          placeholder="Buscar disciplina..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 280, fontSize: 16 }}
          onChange={e => setSearch(e.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ height: 40, fontWeight: 500, fontSize: 16 }}
        >
          Nova Disciplina
        </Button>
      </div>

      {/* TABELA */}
      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        style={{ borderRadius: 10 }}
        columns={[

          {
            title: 'Código',
            dataIndex: 'codigo',
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: renderText
          },

          {
            title: 'Nome',
            dataIndex: 'nome',
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: text => renderText(text, true)
          },

          {
            title: 'Editar Disciplina',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, record) => (
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => edit(record)}
                style={{
                  fontSize: 16,
                  color: '#333',
                  borderColor: '#ccc',
                  backgroundColor: '#f9f9f9'
                }}
              />
            )
          },

          {
            title: 'Excluir',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, record) => (
              <Popconfirm
                title="Excluir esta disciplina?"
                onConfirm={() => remove(record.id)}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  style={{ fontSize: 16 }}
                />
              </Popconfirm>
            )
          }

        ]}
        scroll={{ x: 'max-content' }}
      />

      {/* MODAL */}
      <Modal
        title={editing ? 'Editar Disciplina' : 'Nova Disciplina'}
        open={open}
        onCancel={closeModal}
        onOk={save}
        okText="Salvar"
        confirmLoading={loading}
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
            <Input style={{ fontSize: 16 }} />
          </Form.Item>

          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input style={{ fontSize: 16 }} />
          </Form.Item>
        </Form>
      </Modal>

    </AppLayout>
  );
}