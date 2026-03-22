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

/* ================= CORES SUAVES ================= */
const hierarquiaColors = {
  Coordenador: { bg: '#e6f4ff' },
  Professor: { bg: '#e8f5ff' },
  Estagiario: { bg: '#f6ffed' },
  Estagiário: { bg: '#f6ffed' },
  Admin: { bg: '#fff1f0' }
};

/* ================= HEADER ================= */
const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '12px 16px',
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

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

  const filtered = usuarios.filter(u =>
    [u.login, u.pessoa?.nome, u.hierarquia?.descricao]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  /* PADRÃO TEXTO */
  const renderText = (text, strong = false) => (
    <div style={{ padding: '6px 16px' }}>
      <span style={{
        fontSize: strong ? 16 : 15,
        fontWeight: strong ? 500 : 400
      }}>
        {text}
      </span>
    </div>
  );

  /* TAG HIERARQUIA */
  const renderHierarquia = (descricao) => {
    const style = hierarquiaColors[descricao] || { bg: '#fafafa' };

    return (
      <div style={{ padding: '6px 16px' }}>
        <Tag
          style={{
            background: style.bg,
            borderRadius: 12,
            padding: '4px 14px',
            fontSize: 13,
            fontWeight: 500,
            border: '1px solid #d9d9d9'
          }}
        >
          {descricao}
        </Tag>
      </div>
    );
  };

  return (
    <AppLayout>

      {/* TOPO */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 18
      }}>
        <Input
          placeholder="Buscar usuário..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 260 }}
          onChange={e => setSearch(e.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ height: 40, fontWeight: 500 }}
        >
          Novo Usuário
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
            title: 'Login',
            dataIndex: 'login',
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: text => renderText(text, true)
          },

          {
            title: 'Pessoa',
            dataIndex: ['pessoa', 'nome'],
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: renderText
          },

          {
            title: 'Hierarquia',
            dataIndex: ['hierarquia', 'descricao'],
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: renderHierarquia
          },

          {
            title: 'Ações',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <Space size={18}>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => edit(r)}
                  style={{ fontSize: 18 }}
                />

                <Popconfirm
                  title="Excluir este usuário?"
                  onConfirm={() => remove(r.id)}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ fontSize: 18 }}
                  />
                </Popconfirm>
              </Space>
            )
          }

        ]}
      />

      {/* MODAL */}
      <Modal
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={submit}>

          {!editing && (
            <Form.Item name="pessoa_id" label="Pessoa" rules={[{ required: true }]}>
              <Select placeholder="Selecione">
                {pessoas.map(p => (
                  <Select.Option key={p.id} value={p.id}>
                    {p.nome}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="login" label="Login" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="senha" label="Senha" rules={!editing ? [{ required: true }] : []}>
            <Input.Password />
          </Form.Item>

          <Form.Item name="hierarquia_id" label="Hierarquia" rules={[{ required: true }]}>
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