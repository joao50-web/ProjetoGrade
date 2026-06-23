import { useEffect, useState } from 'react';

import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  message,
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '14px 30px',
  fontSize: 16,
  textAlign: 'center',
};

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  /* =========================================
     LOAD
  ========================================= */

  const load = async () => {
    try {
      const res = await api.get('/disciplinas');
      setDisciplinas(res.data || []);
    } catch (err) {
      console.error(err);
      message.error('Erro ao carregar disciplinas');
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================
     SALVAR
  ========================================= */

  const save = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editing) {
        await api.put(`/disciplinas/${editing.id}`, values);
        message.success('Disciplina atualizada com sucesso');
      } else {
        await api.post('/disciplinas', values);
        message.success('Disciplina criada com sucesso');
      }

      closeModal();
      load();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || 'Erro ao salvar disciplina');
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     REMOVER
  ========================================= */

  const remove = async (id) => {
    try {
      await api.delete(`/disciplinas/${id}`);
      message.success('Disciplina removida com sucesso');
      load();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || 'Erro ao excluir disciplina');
    }
  };

  /* =========================================
     EDITAR
  ========================================= */

  const edit = (disciplina) => {
    setEditing(disciplina);

    form.setFieldsValue({
      codigo: disciplina.codigo,
      nome: disciplina.nome,
      carga_horaria: disciplina.carga_horaria, 
    });

    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = disciplinas.filter((d) => {
    const texto = `${d.nome || ''} ${d.codigo || ''}`.toLowerCase();
    return texto.includes(search.toLowerCase());
  });

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
      {/* TOPO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Input
          placeholder="Buscar disciplina..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          style={{ width: 300, height: 42 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Nova Disciplina
        </Button>
      </div>

      {/* TABELA */}
      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        columns={[
          {
            title: 'Código',
            dataIndex: 'codigo',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (t) => renderText(t),
          },
          {
            title: 'Disciplina',
            dataIndex: 'nome',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (t) => renderText(t, true),
          },
          {
            title: 'Carga Horária',
            dataIndex: 'carga_horaria',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (t) => renderText(`${t || 0}h`),
          },
          {
            title: 'Editar',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, record) => (
              <Button icon={<EditOutlined />} onClick={() => edit(record)} />
            ),
          },
          {
            title: 'Excluir',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, record) => (
              <Popconfirm
                title="Excluir disciplina?"
                onConfirm={() => remove(record.id)}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]}
      />

      {/* MODAL */}
      <Modal
        title={editing ? 'Editar Disciplina' : 'Nova Disciplina'}
        open={open}
        onCancel={closeModal}
        onOk={save}
        confirmLoading={loading}
        okText="Salvar"
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="carga_horaria"
            label="Carga Horária"
            rules={[{ required: true, message: 'Informe a carga horária' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}