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
  Tag
} from 'antd';

import {
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const cargoColors = {
  Coordenador: { bg: '#e6f4ff', color: '#0958d9' },
  Professor: { bg: '#fff7e6', color: '#ad6800' }
};

export default function Pessoas() {
  const [pessoas, setPessoas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [pessoasRes, cargosRes] = await Promise.all([
        api.get('/pessoas'),
        api.get('/cargos')
      ]);
      setPessoas(pessoasRes.data);
      setCargos(cargosRes.data);
    } catch {
      message.error('Erro ao carregar dados');
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const values = form.getFieldsValue();
      editing
        ? await api.put(`/pessoas/${editing.id}`, values)
        : await api.post('/pessoas', values);

      message.success(editing ? 'Pessoa atualizada' : 'Pessoa criada');
      closeModal();
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
    } catch {
      message.error('Erro ao excluir');
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

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = pessoas.filter(p =>
    [p.nome, p.email, p.cargo?.descricao]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const renderCargo = (descricao) => {
    const style = cargoColors[descricao] || {
      bg: '#f0f0f0',
      color: '#595959'
    };

    return (
      <Tag
        style={{
          background: style.bg,
          color: style.color,
          borderRadius: 12,
          padding: '4px 12px',
          fontSize: 13,
          fontWeight: 500
        }}
      >
        {descricao}
      </Tag>
    );
  };

  return (
    <AppLayout>
      {/* TOPO */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 16
      }}>
        <Input
          placeholder="Buscar pessoa"
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
          Nova Pessoa
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
            title: 'Nome',
            dataIndex: 'nome',
            render: text => (
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                {text}
              </span>
            )
          },
          {
            title: 'Email',
            dataIndex: 'email',
            render: text => (
              <span style={{ fontSize: 16, color: '#1677ff' }}>
                {text}
              </span>
            )
          },
          {
            title: 'Cargo',
            dataIndex: ['cargo', 'descricao'],
            render: renderCargo
          },
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
              <Space size={14}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => edit(r)}
                  style={{ borderRadius: 6 }}
                />
                <Popconfirm
                  title="Excluir esta pessoa?"
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
        title={editing ? 'Editar Pessoa' : 'Nova Pessoa'}
        open={open}
        onCancel={closeModal}
        onOk={save}
        okText="Salvar"
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="cargo_id" label="Cargo" rules={[{ required: true }]}>
            <Select placeholder="Selecione">
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