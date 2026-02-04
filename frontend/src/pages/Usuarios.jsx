import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Popconfirm,
  message,
  Space,
  Tag
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

/* ================= CORES DAS HIERARQUIAS ================= */
const hierarquiaColors = {
  Coordenador: { bg: '#fff7e6' },
  Professor: { bg: '#e6f4ff' },
  Estagiario: { bg: '#f6ffed' },
  Estagiário: { bg: '#f6ffed' },
  Admin: { bg: '#fff1f0' }
};

/* ================= ESTILO DO HEADER ================= */
const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '3px 16px',
  fontSize: 14,
  textAlign: 'center'
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [hierarquias, setHierarquias] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const [usuariosRes, pessoasRes, hierarquiasRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/pessoas'),
        api.get('/hierarquias')
      ]);

      setUsuarios(usuariosRes.data);
      setPessoas(pessoasRes.data.filter(p => !p.usuario));
      setHierarquias(hierarquiasRes.data);
    } catch {
      message.error('Erro ao carregar dados');
    }
  };

  useEffect(() => { load(); }, []);

  /* ================= CRUD ================= */
  const submit = async (values) => {
    try {
      editing
        ? await api.put(`/usuarios/${editing.id}`, values)
        : await api.post('/usuarios', values);

      message.success(editing ? 'Usuário atualizado' : 'Usuário criado');
      closeModal();
      load();
    } catch (err) {
      message.error(err.response?.data?.error || 'Erro ao salvar usuário');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      message.success('Usuário removido');
      load();
    } catch {
      message.error('Erro ao excluir usuário');
    }
  };

  const edit = (usuario) => {
    setEditing(usuario);
    form.setFieldsValue({
      login: usuario.login,
      pessoa_id: usuario.pessoa?.id,
      hierarquia_id: usuario.hierarquia?.id
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  /* ================= FILTRO ================= */
  const filtered = usuarios.filter(u =>
    [u.login, u.pessoa?.nome, u.hierarquia?.descricao]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  /* ================= RENDER HIERARQUIA ================= */
  const renderHierarquia = (descricao) => {
    const style = hierarquiaColors[descricao] || { bg: '#f0f0f0' };

    return (
      <Tag
        style={{
          background: style.bg,
          color: '#000',
          borderRadius: 12,
          padding: '4px 14px',
          fontSize: 13,
          fontWeight: 500,
          border: '1px solid #d9d9d9'
        }}
      >
        {descricao}
      </Tag>
    );
  };

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
          placeholder="Buscar usuário"
          allowClear
          prefix={<SearchOutlined />}
          style={{ width: 280 }}
          onChange={e => setSearch(e.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ borderRadius: 6 }}
        >
          Novo Usuário
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
            title: 'Login',
            dataIndex: 'login',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: text => (
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                {text}
              </span>
            )
          },
          {
            title: 'Pessoa',
            dataIndex: ['pessoa', 'nome'],
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: nome => (
              <span style={{ fontSize: 15 }}>
                {nome}
              </span>
            )
          },
          {
            title: 'Hierarquia',
            align: 'center',
            dataIndex: ['hierarquia', 'descricao'],
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: renderHierarquia
          },
          {
            title: 'Ações',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <Space size={14}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => edit(r)}
                  style={{ borderRadius: 6 }}
                />
                <Popconfirm
                  title="Excluir este usuário?"
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
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
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
          {!editing && (
            <Form.Item
              name="pessoa_id"
              label="Pessoa"
              rules={[{ required: true }]}
            >
              <Select placeholder="Selecione a pessoa">
                {pessoas.map(p => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.nome}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="login"
            label="Login"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="senha"
            label="Senha"
            rules={!editing ? [{ required: true }] : []}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="hierarquia_id"
            label="Hierarquia"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              {hierarquias.map(h => (
                <Radio key={h.id} value={h.id}>
                  {h.descricao}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}