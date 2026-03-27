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
  Administrador: { bg: '#dfecff8c' },
  'Secretario de curso': { bg: '#f4e2ff88' },
  Coordenador: { bg: '#eafaf1' },
  PROGRAD: { bg: '#fffeca88' },
  Professor: { bg: '#e8f5ff' }
};

const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '12px 16px',
  fontSize: 14,
  textAlign: 'center'
};

export default function Pessoas() {
  const [pessoas, setPessoas] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editing) {
        await api.put(`/pessoas/${editing.id}`, values);
      } else {
        await api.post('/pessoas', values);
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
      await api.delete(`/pessoas/${id}`);
      load();
    } catch (err) {
      message.error(err.response?.data?.error);
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

  const renderCargo = (descricao) => {
    const style = cargoColors[descricao] || { bg: '#fafafa' };

    return (
      <div style={{ padding: '6px 16px' }}>
        <Tag style={{
          background: style.bg,
          borderRadius: 12,
          padding: '4px 14px'
        }}>
          {descricao}
        </Tag>
      </div>
    );
  };

  return (
    <AppLayout>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
        <Input
          placeholder="Buscar pessoa..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 260 }}
          onChange={e => setSearch(e.target.value)}
        />

        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
          Nova Pessoa
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        columns={[

          {
            title: 'Nome',
            dataIndex: 'nome',
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (text) => renderText(text, true)
          },

          {
            title: 'Email',
            dataIndex: 'email',
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: renderText
          },

          {
            title: 'Cargo',
            dataIndex: ['cargo', 'descricao'],
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: renderCargo
          },

          {
            title: 'Usuário',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              r.usuario?.id
                ? <CheckCircleTwoTone twoToneColor="#52c41a" />
                : <CloseCircleTwoTone twoToneColor="#ff4d4f" />
            )
          },

          {
            title: 'Ações',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => {
              const possuiUsuario = Boolean(r.usuario?.id);

              return (
                <Space size={18}>
                  <Button type="text" icon={<EditOutlined />} onClick={() => edit(r)} />

                  <Tooltip
                    title={possuiUsuario ? 'Não é possível excluir: possui usuário vinculado' : ''}
                  >
                    {possuiUsuario ? (
                      <Button type="text" danger disabled icon={<DeleteOutlined />} />
                    ) : (
                      <Popconfirm
                        title="Excluir esta pessoa?"
                        onConfirm={() => remove(r.id)}
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    )}
                  </Tooltip>
                </Space>
              );
            }
          }

        ]}
      />

      <Modal
        title={editing ? 'Editar Pessoa' : 'Nova Pessoa'}
        open={open}
        onCancel={closeModal}
        onOk={save}
        confirmLoading={loading}
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