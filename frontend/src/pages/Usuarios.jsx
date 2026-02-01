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
  message
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

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
      <Card
        title="Usuários"
        extra={<Button type="primary" onClick={() => setOpen(true)}>Novo Usuário</Button>}
      >
        <Input.Search
          placeholder="Buscar usuários"
          allowClear
          style={{ width: 300, marginBottom: 16 }}
          onChange={e => setSearch(e.target.value)}
        />
        <Table
          rowKey="id"
          dataSource={filteredUsuarios}
          columns={[
            { title: 'Login', dataIndex: 'login' },
            { title: 'Pessoa', dataIndex: ['pessoa', 'nome'] },
            { title: 'Hierarquia', dataIndex: ['hierarquia', 'descricao'] },
            {
              title: 'Ações',
              align: 'center',
              render: (_, r) => (
                <>
                  <Button type="link" icon={<EditOutlined />} onClick={() => edit(r)} />
                  <Popconfirm
                    title="Tem certeza que deseja excluir este usuário?"
                    onConfirm={() => remove(r.id)}
                  >
                    <Button type="link" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editing ? 'Editar Usuário' : 'Novo Usuário'}
        open={open}
        onCancel={closeModal}
        okText="Salvar"
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          {!editing && (
            <Form.Item
              name="pessoa_id"
              label="Pessoa"
              rules={[{ required: true }]}
            >
              <Select>
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
