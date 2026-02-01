import { useEffect, useState } from 'react';
import {
  Card,
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
  DeleteOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const filterByText = (value, fields) =>
    fields.some(field =>
      field?.toLowerCase().includes(value.toLowerCase())
    );


  const load = async () => {
    try {
      const res = await api.get('/disciplinas');
      setDisciplinas(res.data);
    } catch {
      message.error('Erro ao carregar disciplinas');
    }
  };

  const loadAux = async () => {
    const [c, p] = await Promise.all([
      api.get('/cursos'),
      api.get('/pessoas')
    ]);

    setCursos(c.data);
    setProfessores(
      p.data.filter(p => p.cargo?.descricao === 'Professor')
    );
  };

const submit = async (values) => {
  try {
    if (editing) {
      // === EDITAR ===
      await api.put(`/disciplinas/${editing.id}`, {
        nome: values.nome
      });

      await api.post(
        `/disciplinas/${editing.id}/relations`,
        {
          cursos: values.cursos || [],
          professores: values.professores || []
        }
      );

      message.success('Disciplina atualizada');
    } else {
      // === CRIAR ===
      const res = await api.post('/disciplinas', {
        nome: values.nome
      });

      const disciplinaId = res.data.id;

      await api.post(
        `/disciplinas/${disciplinaId}/relations`,
        {
          cursos: values.cursos || [],
          professores: values.professores || []
        }
      );

      message.success('Disciplina criada');
    }

    closeModal();
    load();
  } catch {
    message.error('Erro ao salvar disciplina');
  }
};


  const remove = async (id) => {
    try {
      await api.delete(`/disciplinas/${id}`);
      message.success('Disciplina removida');
      load();
    } catch {
      message.error('Erro ao excluir disciplina');
    }
  };

const edit = async (disciplina) => {
  setEditing(disciplina);

  const res = await api.get(
    `/disciplinas/${disciplina.id}/relations`
  );

  form.setFieldsValue({
    nome: disciplina.nome,
    cursos: res.data.cursos.map(c => c.id),
    professores: res.data.professores.map(p => p.id)
  });

  setOpen(true);
};

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  useEffect(() => {
    load();
    loadAux();
  }, []);
  const filteredDisciplinas = disciplinas.filter(d =>
    filterByText(search, [d.nome])
  );

  return (
    <AppLayout>
      <Card
        title="Disciplinas"
        extra={
          <Button type="primary" onClick={() => setOpen(true)}>
            Nova Disciplina
          </Button>
        }
      >
      <Input.Search
        placeholder="Buscar disciplina"
        allowClear
        style={{ width: 300, marginBottom: 16 }}
        onChange={e => setSearch(e.target.value)}
      />

        <Table
          rowKey="id"
          dataSource={filteredDisciplinas}
          columns={[
            {
              title: 'Nome',
              dataIndex: 'nome'
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
                    title="Tem certeza que deseja excluir esta disciplina?"
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
        title={editing ? 'Editar Disciplina' : 'Nova Disciplina'}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
        width={520}
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="nome"
            label="Nome da Disciplina"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="cursos" label="Cursos">
            <Select mode="multiple" allowClear>
              {cursos.map(c => (
                <Select.Option key={c.id} value={c.id}>
                  {c.nome}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="professores" label="Professores">
            <Select mode="multiple" allowClear>
              {professores.map(p => (
                <Select.Option key={p.id} value={p.id}>
                  {p.nome}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

        </Form>
      </Modal>
    </AppLayout>
  );
}
