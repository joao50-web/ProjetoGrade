import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
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

export default function Cargos() {
  const [cargos, setCargos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const response = await api.get('/cargos');
      setCargos(response.data);
    } catch {
      message.error('Erro ao carregar cargos');
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (values) => {
    try {
      editing
        ? await api.put(`/cargos/${editing.id}`, values)
        : await api.post('/cargos', values);

      message.success(editing ? 'Cargo atualizado' : 'Cargo criado');
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
    } catch {
      message.error('Erro ao excluir cargo');
    }
  };

  const edit = (cargo) => {
    setEditing(cargo);
    form.setFieldsValue({ descricao: cargo.descricao });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = cargos.filter(c =>
    c.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      {/* TOPO */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16
        }}
      >
        <Input
          placeholder="Buscar cargo"
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
          Novo Cargo
        </Button>
      </div>

      {/* TABELA */}
      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered={false}
        columns={[
          {
            title: 'Descrição',
            dataIndex: 'descricao',
            render: text => (
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                {text}
              </span>
            )
          },
          {
            title: 'Ações',
            align: 'center',
            render: (_, record) => (
              <Space size={14}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => edit(record)}
                  style={{ borderRadius: 6 }}
                />
                <Popconfirm
                  title="Excluir este cargo?"
                  onConfirm={() => remove(record.id)}
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
        title={editing ? 'Editar Cargo' : 'Novo Cargo'}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="descricao"
            label="Descrição"
            rules={[{ required: true, message: 'Campo obrigatório' }]}
          >
            <Input placeholder="Digite a descrição do cargo" />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}