


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

/* ================= CORES DOS CARGOS ================= */
const cargoColors = {
  Coordenador: { bg: '#e6f4ff' },
  Professor: { bg: '#fff7e6' }
};

/* ================= ESTILO DO CABEÇALHO ================= */
const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '3px 30px',
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

  /* ================= LOAD ================= */
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

  /* ================= SALVAR ================= */
  const save = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      if (editing) {
        await api.put(`/pessoas/${editing.id}`, values);
        message.success('Pessoa atualizada com sucesso');
      } else {
        await api.post('/pessoas', values);
        message.success('Pessoa criada com sucesso');
      }

      closeModal();
      load();

    } catch (err) {

      // Ignora erro de validação do form
      if (err.errorFields) return;

      message.error(
        err.response?.data?.error || 'Erro ao salvar pessoa'
      );

    } finally {
      setLoading(false);
    }
  };

  /* ================= REMOVER ================= */
  const remove = async (id) => {
    try {
      await api.delete(`/pessoas/${id}`);
      message.success('Pessoa removida com sucesso');
      load();
    } catch (err) {
      message.error(
        err.response?.data?.error ||
        'Não é possível excluir. Pessoa vinculada a usuário ou grade.'
      );
    }
  };

  /* ================= EDITAR ================= */
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

  /* ================= FILTRO ================= */
  const filtered = pessoas.filter(p =>
    [p.nome, p.email, p.cargo?.descricao]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  /* ================= RENDER CARGO ================= */
  const renderCargo = (descricao) => {
    const style = cargoColors[descricao] || { bg: '#f0f0f0' };

    return (
      <Tag
        style={{
          background: style.bg,
          color: '#000000',
          borderRadius: 12,
          padding: '4px 14px',
          fontSize: 13,
          fontWeight: 500,
          border: '1px solid #d9d9d9'
        }}
      >
        {descricao}
      </Tag>
    );
  };

  return (
    <AppLayout>

      {/* ================= TOPO ================= */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
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

      {/* ================= TABELA ================= */}
      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        columns={[
          {
            title: 'Nome',
            dataIndex: 'nome',
            onHeaderCell: () => ({ style: headerCellStyle }),
          },
          {
            title: 'Email',
            dataIndex: 'email',
            onHeaderCell: () => ({ style: headerCellStyle }),
          },
          {
            title: 'Cargo',
            align: 'center',
            dataIndex: ['cargo', 'descricao'],
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: renderCargo
          },
          {
            title: 'Usuário',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) =>
              r.usuario?.id
                ? <CheckCircleTwoTone twoToneColor="#52c41a" />
                : <CloseCircleTwoTone twoToneColor="#ff4d4f" />
          },
          {
            title: 'Ações',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => {

              const possuiUsuario = Boolean(r.usuario?.id);

              return (
                <Space size={14}>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => edit(r)}
                    style={{ borderRadius: 6 }}
                  />

                  {possuiUsuario ? (
                    <Button
                      danger
                      disabled
                      icon={<DeleteOutlined />}
                      style={{ borderRadius: 6 }}
                    />
                  ) : (
                    <Popconfirm
                      title="Excluir esta pessoa?"
                      description="Essa ação não pode ser desfeita."
                      onConfirm={() => remove(r.id)}
                      okText="Sim"
                      cancelText="Cancelar"
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        style={{ borderRadius: 6 }}
                      />
                    </Popconfirm>
                  )}
                </Space>
              );
            }
          }
        ]}
      />

      {/* ================= MODAL ================= */}
      <Modal
        title={editing ? 'Editar Pessoa' : 'Nova Pessoa'}
        open={open}
        onCancel={closeModal}
        onOk={save}
        confirmLoading={loading}
        okText="Salvar"
        destroyOnClose
      >
        <Form layout="vertical" form={form}>
          <Form.Item
            name="nome"
            label="Nome"
            rules={[{ required: true, message: 'Informe o nome' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Informe o email' },
              { type: 'email', message: 'Email inválido' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="cargo_id"
            label="Cargo"
            rules={[{ required: true, message: 'Selecione o cargo' }]}
          >
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