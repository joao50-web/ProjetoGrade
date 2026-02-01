import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

export default function Cargos() {
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
    setCargos((await api.get('/cargos')).data);
  };

  const submit = async (values) => {
    try {
      if (editing) {
        await api.put(`/cargos/${editing.id}`, values);
        message.success('Cargo atualizado');
      } else {
        await api.post('/cargos', values);
        message.success('Cargo criado');
      }

      closeModal();
      load();
    } catch {
      message.error('Erro ao salvar cargo');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/cargos/${id}`);
      message.success('Cargo removido');
      load();
    } catch (err) {
      message.error(err.response?.data?.error || 'Erro ao excluir cargo');
    }
  };

  const edit = (cargo) => {
    setEditing(cargo);
    form.setFieldsValue({
      descricao: cargo.descricao
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  useEffect(() => { load(); }, []);

  const filteredCargos = cargos.filter(c =>
    filterByText(search, [c.descricao])
  );


  return (
    <AppLayout>
      <Card
        title="Cargos"
        extra={
          <Button type="primary" onClick={() => setOpen(true)}>
            Novo Cargo
          </Button>
          
        }
      >
      <Input.Search
          placeholder="Buscar cargos"
          allowClear
          style={{ width: 300, marginBottom: 16 }}
          onChange={e => setSearch(e.target.value)}
        />
        <Table
          rowKey="id"
          dataSource={filteredCargos}
          columns={[
            { title: 'Descrição', dataIndex: 'descricao' },
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
                    title="Tem certeza que deseja excluir este cargo?"
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
        title={editing ? 'Editar Cargo' : 'Novo Cargo'}
        open={open}
        onCancel={closeModal}
        okText="Salvar"
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="descricao"
            label="Descrição"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
