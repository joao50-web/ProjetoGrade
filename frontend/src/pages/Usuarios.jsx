import { useEffect, useState } from 'react';
import {
  Card,
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

const hierarquiaColors = {
  Coordenador: 'gold',
  Professor: 'blue',
  Estagiario: 'green',
  Estagiário: 'green',
  Admin: 'volcano'
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [hierarquias, setHierarquias] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const filterByText = (value, fields) =>
    fields.some(field =>
      field?.toLowerCase().includes(value.toLowerCase())
    );

  const load = async () => {
    setUsuarios((await api.get('/usuarios')).data);
    setPessoas((await api.get('/pessoas')).data.filter(p => !p.usuario));
    setHierarquias((await api.get('/hierarquias')).data);
  };

  const submit = async (values) => {
    try {
      if (editing) {
        await api.put(`/usuarios/${editing.id}`, values);
        message.success('Usuário atualizado');
      } else {
        await api.post('/usuarios', values);
        message.success('Usuário criado');
      }
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

  const filteredUsuarios = usuarios.filter(u =>
    filterByText(search, [
      u.login,
      u.pessoa?.nome,
      u.hierarquia?.descricao
    ])
  );

  useEffect(() => { load(); }, []);

  return (
    <AppLayout>
      {/* TOPO */}
      <div style={{
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Input
          placeholder="Buscar usuários"
          allowClear
          prefix={<SearchOutlined />}
          style={{ width: 300, borderRadius: 6 }}
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

      {/* TABELA */}
      <Table
        rowKey="id"
        dataSource={filteredUsuarios}
        pagination={{ pageSize: 5 }}
        bordered
        style={{
          borderRadius: 6,
          overflow: 'hidden',
          fontSize: 100   // ⬅️ AQUI
        }}
        columns={[
          {

            title: 'Login',
            dataIndex: 'login',
            render: text => (
              <span style={{ fontSize: 16, fontWeight: 600 }}>
                {text}
              </span>
            )

          },
          {

            title: 'Pessoa',
            dataIndex: ['pessoa', 'nome'],
            render: nome => (
              <span style={{ fontSize: 16 }}>
                {nome}
              </span>
            )

          },

          {
            title: 'Hierarquia',
            dataIndex: ['hierarquia', 'descricao'],
            render: descricao => (
              <Tag
                color={hierarquiaColors[descricao] || 'default'}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  padding: '4px 10px'
                }}
              >
                {descricao}
              </Tag>
            )
          },
          {
            title: 'Ações',
            align: 'center',
            render: (_, r) => (
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => edit(r)}
                  style={{ borderRadius: 6 }}
                />
                <Popconfirm
                  title="Tem certeza que deseja excluir este usuário?"
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
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
        open={open}
        onCancel={closeModal}
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
        onOk={() => form.submit()}
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