import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Space,
  Badge
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api.get('/cursos');
      setCursos(res.data);
    } catch {
      message.error('Erro ao carregar cursos');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (values) => {
    try {
      editing
        ? await api.put(`/cursos/${editing.id}`, values)
        : await api.post('/cursos', values);

      message.success(editing ? 'Curso atualizado' : 'Curso criado');
      closeModal();
      load();
    } catch {
      message.error('Erro ao salvar curso');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/cursos/${id}`);
      message.success('Curso removido');
      load();
    } catch {
      message.error('Erro ao excluir curso');
    }
  };

  const edit = (curso) => {
    setEditing(curso);
    form.setFieldsValue({ nome: curso.nome });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = cursos.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      {/* TOPO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16
        }}
      >
        <Input
          placeholder="Buscar curso"
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 260 }}
          onChange={e => setSearch(e.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ borderRadius: 6 }}
        >
          Novo Curso
        </Button>
      </div>

      {/* TABELA */}
      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered={false}
        columns={[
          {
            title: 'Nome',
            dataIndex: 'nome',
            render: text => (
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                {text}
              </span>
            )
          },
          {
            title: 'Disciplinas',
            dataIndex: 'disciplinas',
            align: 'center',
            width: 140,
            render: (disciplinas = []) => (
              <Badge
                count={disciplinas.length}
                showZero
                style={{
                  backgroundColor: '#093e5e',
                  fontSize: 13
                }}
              />
            )
          },
          {
            title: 'Ações',
            align: 'center',
            width: 260,
            render: (_, r) => (
              <Space size={14}>
                <Button
                  icon={<BookOutlined />}
                  onClick={() =>
                    navigate(`/cursos/${r.id}/disciplinas`)
                  }
                  style={{ borderRadius: 6 }}
                >
                  Disciplinas
                </Button>

                <Button
                  icon={<EditOutlined />}
                  onClick={() => edit(r)}
                  style={{ borderRadius: 6 }}
                />

                <Popconfirm
                  title="Excluir este curso?"
                  onConfirm={() => remove(r.id)}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    style={{ borderRadius: 6 }}
                  />
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />

      {/* MODAL */}
      <Modal
        title={editing ? 'Editar Curso' : 'Novo Curso'}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="nome"
            label="Nome do Curso"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}