import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Space,
  Tag,
  Tooltip
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  UserOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

// Paleta de cores para hierarquias (mesmo padrão de cargoColors em Pessoas)
const hierarquiaColors = {
  Administrador: { bg: '#f5f4f0', color: '#093e5e' },
  'Secretario de curso': { bg: '#f5f4f0', color: '#093e5e' },
  Coordenador: { bg: '#f5f4f0', color: '#093e5e' },
  PROGRAD: { bg: '#f5f4f0', color: '#093e5e' },
  Professor: { bg: '#f5f4f0', color: '#093e5e' }
};

const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '14px 20px',
  fontSize: 16,
  textAlign: 'center'
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [hierarquias, setHierarquias] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
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
      setPessoas(pessoasRes.data);
      setHierarquias(hierarquiasRes.data);
    } catch {
      message.error('Erro ao carregar dados');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editing) {
        await api.put(`/usuarios/${editing.id}`, values);
      } else {
        await api.post('/usuarios', values);
      }

      closeModal();
      load();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      load();
    } catch (err) {
      message.error(err.response?.data?.error || 'Erro ao remover usuário');
    }
  };

  const edit = (usuario) => {
    setEditing(usuario);

    form.setFieldsValue({
      pessoa_id: usuario.pessoa?.id,
      login: usuario.login,
      senha: '',
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

  const renderText = (text, strong = false) => (
    <div style={{ padding: '8px 20px' }}>
      <span style={{
        fontSize: strong ? 17 : 16,
        fontWeight: strong ? 500 : 400
      }}>
        {text}
      </span>
    </div>
  );

  const renderHierarquia = (descricao) => {
    const style = hierarquiaColors[descricao] || { bg: '#e1ebf7', color: '#093e5e' };
    return (
      <div style={{ padding: '8px 20px' }}>
        <Tag style={{
          background: style.bg,
          color: style.color,
          borderRadius: 12,
          padding: '5px 16px',
          fontSize: 15,
          fontWeight: 500
        }}>
          {descricao}
        </Tag>
      </div>
    );
  };

  // Filtra apenas pessoas que ainda não possuem usuário (para criação)
  // Na edição, inclui a pessoa do próprio usuário sendo editado
  const pessoasDisponiveis = pessoas.filter(p =>
    !p.usuario?.id || (editing && p.id === editing.pessoa?.id)
  );

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Input
          placeholder="Buscar usuário..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 280, fontSize: 16 }}
          onChange={e => setSearch(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ fontSize: 16 }}
        >
          Novo Usuário
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        columns={[
          {
            title: 'Pessoa',
            dataIndex: ['pessoa', 'nome'],
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (text) => renderText(text, true)
          },
          {
            title: 'Login',
            dataIndex: 'login',
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
              <Space size={20}>
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  onClick={() => edit(r)}
                  style={{
                    fontSize: 16,
                    color: '#333333',
                    borderColor: '#cccccc',
                    backgroundColor: '#f9f9f9'
                  }}
                />
                <Popconfirm
                  title="Excluir este usuário?"
                  onConfirm={() => remove(r.id)}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }
        ]}
        style={{ fontSize: 16 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
        open={open}
        onCancel={closeModal}
        onOk={save}
        confirmLoading={loading}
        okText="Salvar"
        cancelText="Cancelar"
        bodyStyle={{ fontSize: 16 }}
      >
        <Form layout="vertical" form={form} style={{ fontSize: 16 }}>
          <Form.Item
            name="pessoa_id"
            label="Pessoa"
            rules={[{ required: true, message: 'Selecione uma pessoa' }]}
          >
            <Select
              style={{ fontSize: 16 }}
              disabled={Boolean(editing)}
              placeholder="Selecione uma pessoa"
              showSearch
              optionFilterProp="children"
            >
              {pessoasDisponiveis.map(p => (
                <Select.Option key={p.id} value={p.id}>
                  {p.nome}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="login"
            label="Login"
            rules={[{ required: true, message: 'Informe o login' }]}
          >
            <Input
              prefix={<UserOutlined />}
              style={{ fontSize: 16 }}
              placeholder="Login do usuário"
            />
          </Form.Item>

          <Form.Item
            name="senha"
            label={editing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
            rules={editing ? [] : [{ required: true, message: 'Informe a senha' }]}
          >
            <Input.Password
              style={{ fontSize: 16 }}
              placeholder={editing ? 'Nova senha (opcional)' : 'Senha'}
            />
          </Form.Item>

          <Form.Item
            name="hierarquia_id"
            label="Hierarquia"
            rules={[{ required: true, message: 'Selecione uma hierarquia' }]}
          >
            <Select style={{ fontSize: 16 }} placeholder="Selecione uma hierarquia">
              {hierarquias.map(h => (
                <Select.Option key={h.id} value={h.id}>
                  {h.descricao}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}