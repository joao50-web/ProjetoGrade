import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Tooltip,
  Tag
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '10px 12px',
  fontSize: 13,
  textAlign: 'center'
};

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const load = async () => {
    try {
      const res = await api.get('/disciplinas');
      const dados = res.data.map(d => ({
        ...d,
        codigo: d.codigo || d.cod_disciplina || '',
        tipo: d.tipo || 'Obrigatória'
      }));
      setDisciplinas(dados);
    } catch {
      message.error('Erro ao carregar disciplinas');
    }
  };

  const loadAux = async () => {
    try {
      const [c] = await Promise.all([api.get('/cursos')]);
      setCursos(c.data);
    } catch {
      message.error('Erro ao carregar dados');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    loadAux();
  }, []);

  const submit = async (values) => {
    try {
      if (editing) {
        await api.put(`/disciplinas/${editing.id}`, values);
        await api.post(`/disciplinas/${editing.id}/relations`, { cursos: values.cursos || [] });
        message.success('Atualizada');
      } else {
        const res = await api.post('/disciplinas', values);
        await api.post(`/disciplinas/${res.data.id}/relations`, { cursos: values.cursos || [] });
        message.success('Criada');
      }
      closeModal();
      load();
    } catch {
      message.error('Erro ao salvar');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/disciplinas/${id}`);
      message.success('Removida');
      load();
    } catch {
      message.error('Erro ao excluir');
    }
  };

  const edit = (disciplina) => {
    setEditing(disciplina);
    form.setFieldsValue(disciplina);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = disciplinas.filter(d =>
    d.nome?.toLowerCase().includes(search.toLowerCase()) ||
    d.codigo?.toLowerCase().includes(search.toLowerCase())
  );


  const getTipoTag = (tipo) => {
    switch(tipo) {
      case 'Obrigatória': return <Tag color="blue">{tipo}</Tag>;
      case 'Optativa': return <Tag color="green">{tipo}</Tag>;
      case 'Multicurso': return <Tag color="purple">{tipo}</Tag>;
      default: return <Tag>{tipo}</Tag>;
    }
  };

  return (
    <AppLayout>

      {/* TOPO */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        width: '100%'
      }}>
        <Input
          placeholder="Buscar disciplina..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 260, height: 36 }}
          onChange={e => setSearch(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ height: 36, padding: '0 16px' }}
        >
          Nova Disciplina
        </Button>
      </div>

      {/* TABELA */}
      <Table
        rowKey="id"
        dataSource={filtered}
        bordered
        size="middle"
        pagination={{ pageSize: 6 }}
        style={{ width: '100%' }}
        columns={[

          {
            title: 'Código',
            dataIndex: 'codigo',
            width: 140,
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: text => (
              <div style={{ padding: '10px 12px' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{text}</span>
              </div>
            )
          },

          {
            title: 'Disciplina',
            dataIndex: 'nome',
            width: 300,
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: text => (
              <div style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{text}</span>
              </div>
            )
          },

          {
            title: 'Tipo de Disciplina',
            dataIndex: 'tipo',
            width: 160,
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: tipo => (
              <div style={{ padding: '10px 12px' }}>
                {getTipoTag(tipo)}
              </div>
            )
          },

      {
  title: 'Ações',
  dataIndex: 'acoes',
  width: 120,
  onHeaderCell: () => ({ style: headerCellStyle }),
  render: (_, r) => (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start', // 👈 alinhado à esquerda
      gap: 30,
      paddingLeft: 2
    }}>
      <Tooltip title="Editar">
        <Button type="text" icon={<EditOutlined />} onClick={() => edit(r)} />
      </Tooltip>
      <Popconfirm title="Excluir?" onConfirm={() => remove(r.id)}>
        <Tooltip title="Excluir">
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Tooltip>
      </Popconfirm>
    </div>
  )
}

        ]}
      />

      {/* MODAL */}
      <Modal
        title={editing ? 'Editar Disciplina' : 'Nova Disciplina'}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item name="codigo" label="Código" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="nome" label="Nome" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="tipo" label="Tipo de Disciplina" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Obrigatória">Obrigatória</Select.Option>
              <Select.Option value="Optativa">Optativa</Select.Option>
              <Select.Option value="Multicurso">Multicurso</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="cursos" label="Cursos">
            <Select mode="multiple">
              {cursos.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  {c.nome}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

    </AppLayout>
  );
}