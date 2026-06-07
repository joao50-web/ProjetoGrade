import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

/* =========================================
   HEADER STYLE (AZUL PADRÃO SISTEMA)
========================================= */

const headerCellStyle = {
  backgroundColor: "#093e5e",
  color: "#ffffff",
  fontWeight: 600,
  padding: "14px 10px",
  fontSize: 16,
  textAlign: "center",
};

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const load = async () => {
    try {
      const resCursos = await api.get("/cursos");
      setCursos(resCursos.data || []);
    } catch {
      message.error("Erro ao carregar cursos");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (values) => {
    try {
      if (editing) {
        await api.put(`/cursos/${editing.id}`, values);
        message.success("Curso atualizado");
      } else {
        await api.post("/cursos", values);
        message.success("Curso criado");
      }

      closeModal();
      load();
    } catch {
      message.error("Erro ao salvar curso");
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/cursos/${id}`);
      message.success("Curso removido com sucesso");
      load();
    } catch (error) {
      const backendMsg = error?.response?.data?.error;
      if (
        backendMsg?.includes("foreign") ||
        backendMsg?.includes("constraint") ||
        backendMsg?.includes("referenced") ||
        error?.response?.status === 500
      ) {
        message.error(
          "Não é possível excluir este curso pois ele já está sendo utilizado em grades horárias ou registros do sistema."
        );
        return;
      }
      message.error("Erro ao excluir curso");
    }
  };

  const edit = (curso) => {
    setEditing(curso);
    form.setFieldsValue({
      nome: curso.nome,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = cursos.filter((c) =>
    c.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const renderText = (text, strong = false) => (
    <div style={{ padding: '8px 16px' }}>
      <span
        style={{
          fontSize: strong ? 17 : 16,
          fontWeight: strong ? 600 : 400,
          color: '#111827',
        }}
      >
        {text}
      </span>
    </div>
  );

  const columns = [
    {
      title: "Curso",
      dataIndex: "nome",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (t) => renderText(t, true),
    },
    {
      title: "Disciplinas",
      dataIndex: "disciplinas",
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (disciplinas = []) => renderText(`${disciplinas.length} disciplina${disciplinas.length !== 1 ? "s" : ""}`),
    },
    {
      title: "Gerenciar",
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Button 
          icon={<BookOutlined />} 
          onClick={() => navigate(`/academico/cursos/${record.id}/disciplinas`)}
        >
          Ver Disciplinas
        </Button>
      ),
    },
    {
      title: "Editar Curso",
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => edit(record)} />
      ),
    },
    {
      title: "Excluir",
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Popconfirm
          title="Deseja excluir este curso?"
          onConfirm={() => remove(record.id)}
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <AppLayout>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <Input
          placeholder="Buscar curso..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          style={{ width: 300, height: 42 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
        >
          Novo Curso
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        columns={columns}
      />

      <Modal
        title={editing ? "Editar Curso" : "Novo Curso"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="nome"
            label="Nome do Curso"
            rules={[{ required: true, message: "Digite o nome do curso" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}