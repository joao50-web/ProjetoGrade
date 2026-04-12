import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Typography,
  Select,
  Tag
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  BookOutlined,
  ApartmentOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const { Text } = Typography;

// Estilo idêntico ao de Pessoas e Usuários
const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '14px 20px',
  fontSize: 16,
  textAlign: 'center'
};

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [departamentos, setDepartamentos] = useState([]); // ✅ ADICIONADO
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      const [resCursos, resDeptos] = await Promise.all([
        api.get('/cursos'),
        api.get('/departamentos') // ✅ Carrega departamentos para o Select
      ]);
      setCursos(resCursos.data);
      setDepartamentos(resDeptos.data);
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
        await api.put(`/cursos/${editing.id}`, values);
      } else {
        await api.post('/cursos', values);
      }

      closeModal();
      load();
      message.success('Curso salvo com sucesso!');
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/cursos/${id}`);
      load();
      message.success('Curso removido!');
    } catch (err) {
      message.error(err.response?.data?.error || 'Erro ao remover');
    }
  };

  const edit = (curso) => {
    setEditing(curso);
    form.setFieldsValue({
      nome: curso.nome,
      departamento_id: curso.departamento_id // ✅ Preenche o departamento na edição
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = cursos.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.departamento?.nome?.toLowerCase().includes(search.toLowerCase())
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

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Input
          placeholder="Buscar curso ou departamento..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 320, fontSize: 16 }}
          onChange={e => setSearch(e.target.value)}
        />
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setOpen(true)} 
          style={{ fontSize: 16, height: 40 }}
        >
          Novo Curso
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        columns={[
          {
            title: 'Nome do Curso',
            dataIndex: 'nome',
            align: 'left',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (text) => renderText(text, true)
          },
          {
            title: 'Departamento',
            dataIndex: ['departamento', 'nome'], // ✅ Mostra o nome do departamento
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (text) => text ? (
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 10px' }}>
                {text}
              </Tag>
            ) : <Text type="secondary">Não definido</Text>
          },
          {
            title: 'Ações',
            align: 'center',
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
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
                <Popconfirm
                  title="Excluir este curso?"
                  onConfirm={() => remove(r.id)}
                  okText="Sim"
                  cancelText="Não"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }
        ]}
        style={{ fontSize: 16 }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? 'Editar Curso' : 'Novo Curso'}
        open={open}
        onCancel={closeModal}
        onOk={save}
        confirmLoading={loading}
        okText="Salvar"
        cancelText="Cancelar"
        width={600}
      >
        <Form layout="vertical" form={form} style={{ marginTop: 20 }}>
          <Form.Item 
            name="nome" 
            label={<Text strong style={{ fontSize: 16 }}>Nome do Curso</Text>} 
            rules={[{ required: true, message: 'Informe o nome do curso' }]}
          >
            <Input 
              prefix={<BookOutlined />} 
              style={{ fontSize: 16, height: 40 }} 
              placeholder="Ex: Sistemas de Informação" 
            />
          </Form.Item>

          {/* ✅ NOVO: Seleção de Departamento */}
          <Form.Item 
            name="departamento_id" 
            label={<Text strong style={{ fontSize: 16 }}>Departamento Responsável</Text>} 
            rules={[{ required: true, message: 'Selecione o departamento' }]}
          >
            <Select 
              placeholder="Selecione o departamento"
              style={{ height: 40, fontSize: 16 }}
              suffixIcon={<ApartmentOutlined />}
            >
              {departamentos.map(d => (
                <Select.Option key={d.id} value={d.id}>
                  {d.nome} ({d.sigla})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}