import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form,
  Input, Select, message, Popconfirm
} from 'antd';

import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

export default function Pessoas() {
  const [pessoas, setPessoas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const filterByText = (value, fields) =>
    fields.some(field =>
      field?.toLowerCase().includes(value.toLowerCase())
    );



  const load = async () => {
    setPessoas((await api.get('/pessoas')).data);
    setCargos((await api.get('/cargos')).data);
  };

  const save = async () => {
    try {
      const values = form.getFieldsValue();

      if (editing) {
        await api.put(`/pessoas/${editing.id}`, values);
        message.success('Pessoa atualizada');
      } else {
        await api.post('/pessoas', values);
        message.success('Pessoa criada');
      }

      setOpen(false);
      setEditing(null);
      form.resetFields();
      load();
    } catch {
      message.error('Erro ao salvar');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/pessoas/${id}`);
      message.success('Pessoa removida');
      load();
    } catch (err) {
      message.error(err.response?.data?.error || 'Erro ao excluir');
    }
  };

  const edit = (pessoa) => {
    setEditing(pessoa);
    form.setFieldsValue({
      nome: pessoa.nome,
      email: pessoa.email,
      cargo_id: pessoa.cargo?.id
    });
    setOpen(true);
  };

  const filteredPessoas = pessoas.filter(p =>
    filterByText(search, [
      p.nome,
      p.email,
      p.cargo?.descricao
    ])
  );


  useEffect(() => { load(); }, []);

  return (
    <AppLayout>
      <Card
        title="Pessoas"
        extra={
          <Button type="primary" onClick={() => setOpen(true)}>
            Nova Pessoa
          </Button>
        }
      >
      <Input.Search
        placeholder="Buscar pessoa"
        allowClear
        style={{ width: 300, marginBottom: 16 }}
        onChange={e => setSearch(e.target.value)}
      />

        <Table
          rowKey="id"
          dataSource={filteredPessoas}
          columns={[
            { title: 'Nome', dataIndex: 'nome' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Cargo', dataIndex: ['cargo', 'descricao'] },
            {
              title: 'Usuário',
              align: 'center',
              render: (_, r) =>
                r.usuario
                  ? <CheckCircleTwoTone twoToneColor="#52c41a" />
                  : <CloseCircleTwoTone twoToneColor="#ff4d4f" />
            },
            {
              title: 'Ações',
              align: 'center',
              render: (_, r) => (
                <>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => edit(r)}
                  />

                  <Popconfirm
                    title="Tem certeza que deseja excluir?"
                    onConfirm={() => remove(r.id)}
                  >
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                </>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editing ? 'Editar Pessoa' : 'Nova Pessoa'}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        onOk={save}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="cargo_id" label="Cargo" rules={[{ required: true }]}>
            <Select>
              {cargos.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  {c.descricao}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
