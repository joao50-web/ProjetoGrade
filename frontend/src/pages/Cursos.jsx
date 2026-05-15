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

const headerCellStyle = {
  backgroundColor: "#093e5e",
  color: "#ffffff",
  fontWeight: 700,
  padding: "14px 16px",
  fontSize: 18,
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

  /* ======================================================
     DELETE COM TRATAMENTO AMIGÁVEL
  ====================================================== */

  const remove = async (id) => {
    try {
      await api.delete(`/cursos/${id}`);

      message.success("Curso removido com sucesso");
      load();
    } catch (error) {
      const backendMsg = error?.response?.data?.error;

      // 🔥 TRATAMENTO DE CURSO EM USO (FOREIGN KEY)
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

      message.error("Não é possível excluir este curso pois ele já está sendo utilizado em grades horárias ou registros do sistema.");
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

  const buttonStyle = {
    height: 36,
    display: "flex",
    alignItems: "center",
    gap: 12,
  };

  const columns = [
    {
      title: "Curso",
      dataIndex: "nome",
      width: 260,
      ellipsis: true,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => (
        <div style={{ padding: "10px 54px" }}>
          <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
            {text}
          </p>
        </div>
      ),
    },
    {
      title: "Disciplinas",
      dataIndex: "disciplinas",
      width: 160,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (disciplinas = []) => (
        <div style={{ padding: "10px 14px" }}>
          <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
            {disciplinas.length} disciplina
            {disciplinas.length !== 1 ? "s" : ""}
          </p>
        </div>
      ),
    },
    {
      title: "Editar",
      width: 280,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <div style={{ display: "flex", gap: 20, padding: "10px 20px" }}>
          <Button
            icon={<BookOutlined />}
            onClick={() =>
              navigate(`/academico/cursos/${record.id}/disciplinas`)
            }
            style={buttonStyle}
          >
            Disciplinas
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => edit(record)}
            style={buttonStyle}
          >
            Editar
          </Button>
        </div>
      ),
    },
    {
      title: "Excluir",
      width: 90,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <div style={{ textAlign: "center" }}>
          <Popconfirm
            title="Deseja excluir este curso?"
            onConfirm={() => remove(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Input
          placeholder="Buscar curso..."
          prefix={<SearchOutlined />}
          style={{ width: 280, height: 38 }}
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
        size="middle"
        columns={columns}
      />

      <Modal
        title={editing ? "Editar Curso" : "Novo Curso"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="nome"
            label="Nome do Curso"
            rules={[
              { required: true, message: "Digite o nome do curso" },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}