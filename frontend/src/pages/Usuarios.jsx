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

// Azul institucional fraco para cargos
const cargoColors = {
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
    <div style={{ padding: '8px 20px' }}>
      <span style={{
        fontSize: strong ? 17 : 16,
        fontWeight: strong ? 500 : 400
      }}>
        {text}
      </span>
    </div>
  );

  const renderCargo = (descricao) => {
    const style = cargoColors[descricao] || { bg: '#e1ebf7', color: '#093e5e' };
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

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Input
          placeholder="Buscar pessoa..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 280, fontSize: 16 }}
          onChange={e => setSearch(e.target.value)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ fontSize: 16 }}>
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
            render: (_, r) => {
              return r.usuario?.id
                ? <CheckCircleTwoTone twoToneColor="#52c41a" />
                : (
                  <Tooltip title="Não possui usuário vinculado">
                    <CloseCircleTwoTone twoToneColor="#ff4d4f" />
                  </Tooltip>
                );
            }
          },
          {
            title: 'Ações',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => {
              const possuiUsuario = Boolean(r.usuario?.id);

              return (
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
        style={{ fontSize: 16 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? 'Editar Pessoa' : 'Nova Pessoa'}
        open={open}
        onCancel={closeModal}
        onOk={save}
        confirmLoading={loading}
        okText="Salvar"
        cancelText="Cancelar"
        bodyStyle={{ fontSize: 16 }}
      >
        <Form layout="vertical" form={form} style={{ fontSize: 16 }}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input style={{ fontSize: 16 }} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input style={{ fontSize: 16 }} />
          </Form.Item>
          <Form.Item name="cargo_id" label="Cargo" rules={[{ required: true }]}>
            <Select style={{ fontSize: 16 }}>
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