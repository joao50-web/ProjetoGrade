import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
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

/* ================= ESTILO DO HEADER ================= */
const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '3px 16px',
  fontSize: 14,
  textAlign: 'center'
};

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const res = await api.get('/disciplinas');
      setDisciplinas(res.data);
    } catch {
      message.error('Erro ao carregar disciplinas');
    }
  };

  const loadAux = async () => {
    const [c, p] = await Promise.all([
      api.get('/cursos'),
      api.get('/pessoas')
    ]);

    setCursos(c.data);
    setProfessores(
      p.data.filter(p => p.cargo?.descricao === 'Professor')
    );
  };

  useEffect(() => {
    load();
    loadAux();
  }, []);

  /* ================= CRUD ================= */
  const submit = async (values) => {
    try {
      if (editing) {
        await api.put(`/disciplinas/${editing.id}`, {
          nome: values.nome
        });

        await api.post(
          `/disciplinas/${editing.id}/relations`,
          {
            cursos: values.cursos || [],
            professores: values.professores || []
          }
        );

        message.success('Disciplina atualizada');
      } else {
        const res = await api.post('/disciplinas', {
          nome: values.nome
        });

        const disciplinaId = res.data.id;

        await api.post(
          `/disciplinas/${disciplinaId}/relations`,
          {
            cursos: values.cursos || [],
            professores: values.professores || []
          }
        );

        message.success('Disciplina criada');
      }

      closeModal();
      load();
    } catch {
      message.error('Erro ao salvar disciplina');
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

  const edit = async (disciplina) => {
    setEditing(disciplina);

    const res = await api.get(
      `/disciplinas/${disciplina.id}/relations`
    );

    form.setFieldsValue({
      nome: disciplina.nome,
      cursos: res.data.cursos.map(c => c.id),
      professores: res.data.professores.map(p => p.id)
    });

    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  /* ================= FILTRO ================= */
  const filtered = disciplinas.filter(d =>
    d.nome?.toLowerCase().includes(search.toLowerCase())
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
          placeholder="Buscar disciplina"
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
          Nova Disciplina
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
            title: 'Ações',
            align: 'center',
            width: 220,
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <Space size={14}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => edit(r)}
                  style={{ borderRadius: 6 }}
                />
                <Popconfirm
                  title="Excluir esta disciplina?"
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
        title={editing ? 'Editar Disciplina' : 'Nova Disciplina'}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        width={520}
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
            label="Nome da Disciplina"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="cursos" label="Cursos">
            <Select mode="multiple" allowClear placeholder="Selecione">
              {cursos.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  {c.nome}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="professores" label="Professores">
            <Select mode="multiple" allowClear placeholder="Selecione">
              {professores.map(p => (
                <Select.Option key={p.id} value={p.id}>
                  {p.nome}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}