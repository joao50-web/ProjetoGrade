import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Tooltip,
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
  fontWeight: 600,
  padding: "10px 12px",
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
      const res = await api.get("/cursos");
      // assumindo que cada curso vem com "coordenador" {nome: ""}
      setCursos(res.data);
    } catch {
      message.error("Erro ao carregar cursos");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      message.success("Curso removido");
      load();
    } catch {
      message.error("Erro ao excluir curso");
    }
  };

  const edit = (curso) => {
    setEditing(curso);
    form.setFieldsValue({
      nome: curso.nome,
      coordenador: curso.coordenador?.nome || "",
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
    height: 32,
    padding: "0 12px",
    display: "flex",
    alignItems: "center",
    gap: 4,
  };

  const actionsGap = 12;

  const columns = [
    {
      title: "Cursos",
      dataIndex: "nome",
      width: 220,
      ellipsis: true,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => (
        <div style={{ padding: "10px 12px" }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>{text}</span>
        </div>
      ),
    },
    {
      title: "Disciplinas",
      dataIndex: "disciplinas",
      width: 220,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (disciplinas = [], record) => (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            gap: 72,
            padding: "8px 12px",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            📚 {disciplinas.length}
          </span>

          <Button
            size="small"
            icon={<BookOutlined />}
            onClick={() => navigate(`/cursos/${record.id}/disciplinas`)}
            style={buttonStyle}
          >
            Ver
          </Button>
        </div>
      ),
    },
    {
      title: "Coordenador",
      dataIndex: ["coordenador", "nome"],
      width: 180,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (nome) => (
        <div style={{ padding: "10px 12px" }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {nome || "—"}
          </span>
        </div>
      ),
    },
    {
      title: "Ações",
      width: 180,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            gap: actionsGap,
            paddingLeft: 12,
          }}
        >
          <Tooltip title="Editar">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => edit(r)}
              style={buttonStyle}
            />
          </Tooltip>
          <Popconfirm title="Excluir?" onConfirm={() => remove(r.id)}>
            <Tooltip title="Excluir">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={buttonStyle}
              />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      {/* TOPO */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          width: "100%",
        }}
      >
        <Input
          placeholder="Buscar curso..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 260, height: 36 }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ height: 36, padding: "0 16px" }}
        >
          Novo Curso
        </Button>
      </div>

      {/* TABELA */}
      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        size="middle"
        columns={columns}
        style={{ width: "100%" }}
      />

      {/* MODAL */}
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
            rules={[{ required: true }]}
          >
            <Input placeholder="Digite o nome do curso" />
          </Form.Item>

          <Form.Item
            name="coordenador"
            label="Coordenador"
          >
            <Input placeholder="Nome do coordenador" />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}