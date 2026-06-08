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

// Paleta de cores para hierarquias
const hierarquiaColors = {
  Administrador: { bg: '#f5f4f0', color: '#093e5e' },
  'Secretario de curso': { bg: '#f5f4f0', color: '#093e5e' },
  Coordenador: { bg: '#f5f4f0', color: '#093e5e' },
  PROGRAD: { bg: '#f5f4f0', color: '#093e5e' },
  Professor: { bg: '#f5f4f0', color: '#093e5e' }
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [hierarquias, setHierarquias] = useState([]);
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
      const [usuariosRes, pessoasRes, hierarquiasRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/pessoas'),
        api.get('/hierarquias')
      ]);
      setUsuarios(usuariosRes.data || []);
      setPessoas(pessoasRes.data || []);
      setHierarquias(hierarquiasRes.data || []);
    } catch (err) {
      console.error(err);
      message.error('Erro ao carregar dados');
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
        await api.put(`/usuarios/${editing.id}`, values);
        message.success('Usuário atualizado com sucesso');
      } else {
        await api.post('/usuarios', values);
        message.success('Usuário criado com sucesso');
      }

      closeModal();
      load();
    } catch (err) {
      console.error(err);
      if (err.errorFields) return;
      message.error(err.response?.data?.error || 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     REMOVER
  ========================================= */

  const remove = async (id) => {
    try {
      await api.delete(`/usuarios/${id}`);
      message.success('Usuário removido com sucesso');
      load();
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.error || 'Erro ao remover usuário');
    }
  };

  /* =========================================
     EDITAR
  ========================================= */

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
        fontWeight: strong ? 600 : 400,
        color: '#111827'
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
          padding: '5px 6px',
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
      {/* TOPO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Input
          placeholder="Buscar usuário..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          style={{ width: 300, height: 42 }}
          onChange={e => setSearch(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
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
            title: 'Editar',
            align: 'center',
            width: 140,
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <Tooltip title="Editar usuário">
                <Button
                  icon={<EditOutlined />}
                  onClick={() => edit(r)}
                />
              </Tooltip>
            )
          },
          {
            title: 'Excluir',
            align: 'center',
            width: 140,
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <Popconfirm
                title="Excluir este usuário?"
                onConfirm={() => remove(r.id)}
              >
                <Tooltip title="Excluir usuário">
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            )
          }
        ]}
        style={{ fontSize: 16 }}
        scroll={{ x: 'max-content' }}
      />

      {/* MODAL */}
      <Modal
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
        open={open}
        onCancel={closeModal}
        onOk={save}
        confirmLoading={loading}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="pessoa_id"
            label="Pessoa"
            rules={[{ required: true, message: 'Selecione uma pessoa' }]}
          >
            <Select
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
              placeholder="Login do usuário"
            />
          </Form.Item>

          <Form.Item
            name="senha"
            label={editing ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
            rules={editing ? [] : [{ required: true, message: 'Informe a senha' }]}
          >
            <Input.Password
              placeholder={editing ? 'Nova senha (opcional)' : 'Senha'}
            />
          </Form.Item>

          <Form.Item
            name="hierarquia_id"
            label="Hierarquia"
            rules={[{ required: true, message: 'Selecione uma hierarquia' }]}
          >
            <Select placeholder="Selecione uma hierarquia">
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