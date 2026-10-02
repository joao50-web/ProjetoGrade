import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  PlusOutlined,
  SearchOutlined,
  ReadOutlined,
  UserOutlined
} from '@ant-design/icons';

import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '14px 10px',
  fontSize: 16,
  textAlign: 'center'
};

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);

    try {
      const [resCursos, resPessoas] = await Promise.all([
        api.get('/cursos'),
        api.get('/pessoas').catch(() => ({ data: [] }))
      ]);

      setCursos(Array.isArray(resCursos.data) ? resCursos.data : []);
      setPessoas(Array.isArray(resPessoas.data) ? resPessoas.data : []);
    } catch (error) {
      console.error('Erro ao carregar cursos:', error);
      message.error('Erro ao carregar dados dos cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        ...values,
        coordenador_id: values.coordenador_id || null
      };

      if (editing) {
        await api.put(`/cursos/${editing.id}`, payload);
        message.success('Curso atualizado com sucesso!');
      } else {
        await api.post('/cursos', payload);
        message.success('Curso criado com sucesso!');
      }

      closeModal();
      await load();
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      message.error(error?.response?.data?.error || 'Erro ao salvar curso');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/cursos/${id}`);
      message.success('Curso removido com sucesso');
      await load();
    } catch (error) {
      const backendMsg = error?.response?.data?.error || '';
      const backendMsgLower = backendMsg.toLowerCase();

      if (
        backendMsgLower.includes('foreign') ||
        backendMsgLower.includes('constraint') ||
        backendMsgLower.includes('referenced') ||
        error?.response?.status === 500
      ) {
        message.error(
          'Não é possível excluir este curso pois ele já está sendo utilizado na grade horária ou no sistema.'
        );
        return;
      }

      console.error('Erro ao excluir curso:', error);
      message.error(backendMsg || 'Erro ao excluir curso');
    }
  };

  const edit = (curso) => {
    setEditing(curso);

    form.setFieldsValue({
      nome: curso.nome,
      coordenador_id: curso.coordenador_id || curso.coordenador?.id || null
    });

    setOpen(true);
  };

  const openNewModal = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = cursos.filter((curso) => {
    const nomeCurso = String(curso.nome || '').toLowerCase();
    const nomeCoordenador = String(curso.coordenador?.nome || '').toLowerCase();

    return (
      nomeCurso.includes(normalizedSearch) ||
      nomeCoordenador.includes(normalizedSearch)
    );
  });

  const renderText = (text, strong = false) => (
    <div style={{ padding: '8px 16px' }}>
      <span
        style={{
          fontSize: strong ? 17 : 16,
          fontWeight: strong ? 600 : 400,
          color: '#111827'
        }}
      >
        {text}
      </span>
    </div>
  );

  const columns = [
    {
      title: 'Curso',
      dataIndex: 'nome',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => renderText(text, true)
    },
    {
      title: 'Coordenador',
      dataIndex: 'coordenador',
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (coordenador) =>
        renderText(coordenador?.nome || 'Sem coordenador')
    },
    {
      title: 'Gerenciar disciplinas',
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Button
          icon={<BookOutlined />}
          onClick={() =>
            navigate(`/academico/cursos/${record.id}/disciplinas`)
          }
        >
          Gerenciar disciplinas
        </Button>
      )
    },
    {
      title: 'Editar',
      align: 'center',
      width: 100,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => edit(record)}
          aria-label={`Editar curso ${record.nome}`}
        />
      )
    },
    {
      title: 'Excluir',
      align: 'center',
      width: 100,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Popconfirm
          title="Deseja excluir este curso?"
          description="Essa ação não poderá ser desfeita."
          okText="Sim"
          cancelText="Não"
          onConfirm={() => remove(record.id)}
        >
          <Button
            danger
            icon={<DeleteOutlined />}
            aria-label={`Excluir curso ${record.nome}`}
          />
        </Popconfirm>
      )
    }
  ];

  return (
    <AppLayout>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}
      >
        <Input
          placeholder="Buscar curso ou coordenador..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          style={{ width: 320, height: 42 }}
          onChange={(event) => setSearch(event.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openNewModal}
          style={{ height: 42, fontWeight: 600 }}
        >
          Novo Curso
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 6 }}
        bordered
        columns={columns}
      />

      <Modal
        title={editing ? 'Editar Curso' : 'Novo Curso'}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="nome"
            label="Nome do Curso"
            rules={[{ required: true, message: 'Digite o nome do curso' }]}
          >
            <Input
              prefix={<ReadOutlined />}
              placeholder="Ex: Ciência da Computação"
            />
          </Form.Item>

          <Form.Item name="coordenador_id" label="Coordenador do Curso">
            <Select
              placeholder="Selecione o coordenador"
              allowClear
              showSearch
              optionFilterProp="children"
              suffixIcon={<UserOutlined />}
              filterOption={(input, option) =>
                String(option?.children || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {pessoas.map((pessoa) => (
                <Select.Option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
