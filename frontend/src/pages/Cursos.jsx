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

/* ================= ESTILO DO HEADER ================= */
const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '3px 16px',
  fontSize: 14,
  textAlign: 'center'
};

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const navigate = useNavigate();

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const res = await api.get('/cursos');
      setCursos(res.data);
    } catch {
      message.error('Erro ao carregar cursos');
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  /* ================= CRUD ================= */
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

  /* ================= FILTRO ================= */
  const filtered = cursos.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      {/* ================= TOPO ================= */}
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

      {/* ================= TABELA ================= */}
      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        columns={[
          {
            title: 'Nome',
            dataIndex: 'nome',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: text => (
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                {text}
              </span>
            )
          },
          {
            title: 'Disciplinas',
            dataIndex: 'disciplinas',
            align: 'center',
            width: 160,
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (disciplinas = []) => (
              <Badge
                count={disciplinas.length}
                showZero
                style={{
                  backgroundColor: '#093e5e',
                  fontSize: 15
                }}
              />
            )
          },
          {
            title: 'Ações',
            align: 'center',
            width: 300,
            onHeaderCell: () => ({ style: headerCellStyle }),
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

      {/* ================= MODAL ================= */}
      <Modal
        title={editing ? 'Editar Curso' : 'Novo Curso'}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        okButtonProps={{
          style: {
            borderRadius: 6,
            backgroundColor: '#093e5e',
            border: 'none'
          }
        }}
        cancelButtonProps={{ style: { borderRadius: 6 } }}
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