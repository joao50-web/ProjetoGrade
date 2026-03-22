import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Space,
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
  padding: "12px 16px",
  fontSize: 14,
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
    form.setFieldsValue({ nome: curso.nome });
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

  const columns = [
    {
      title: "Cursos",
      dataIndex: "nome",
      width: 260,
      ellipsis: true,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => (
        <div style={{ padding: "8px 16px" }}>
          <span
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "#1a1a1a",
            }}
          >
            {text}
          </span>
        </div>
      ),
    },

    /* 🔥 COLUNA MELHORADA */
    {
      title: "Disciplinas",
      dataIndex: "disciplinas",
      width: 420,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (disciplinas = []) => {
        const visible = disciplinas.slice(0, 3);
        const restantes = disciplinas.length > 3 ? disciplinas.length - 3 : 0;

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              padding: "10px 16px",
            }}
          >
            {/* BADGE CONTADOR */}
            <div
              style={{
                background: "linear-gradient(135deg, #e6f0f6, #f4f9fc)",
                color: "#093e5e",
                padding: "6px 14px",
                borderRadius: 30,
                fontSize: 13,
                fontWeight: 600,
                width: "fit-content",
                border: "1px solid #d6e4ec",
              }}
            >
              📚 {disciplinas.length} disciplinas
            </div>

            {/* LISTA */}
            {visible.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "1px solid #e6edf3",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f4f8fb";
                  e.currentTarget.style.transform = "scale(1.01)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {/* CÓDIGO ESTILO TAG */}
                <span
                  style={{
                    fontWeight: 600,
                    color: "#093e5e",
                    fontSize: 11,
                    background: "#e6f0f6",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  {d.codigo}
                </span>

                {/* NOME */}
                <span
                  style={{
                    fontSize: 14,
                    color: "#1a1a1a",
                  }}
                >
                  {d.nome}
                </span>
              </div>
            ))}

            {/* RESTANTES */}
            {restantes > 0 && (
              <span
                style={{
                  fontSize: 12,
                  color: "#666",
                  fontStyle: "italic",
                  paddingLeft: 4,
                }}
              >
                +{restantes} disciplinas adicionais
              </span>
            )}
          </div>
        );
      },
    },

    {
      title: "Ações",
      width: 300,
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <Space size={24}>
          <Button
            icon={<BookOutlined />}
            onClick={() => navigate(`/cursos/${r.id}/disciplinas`)}
          >
            Ver
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => edit(r)}
          >
            Editar
          </Button>

          <Popconfirm title="Excluir?" onConfirm={() => remove(r.id)}>
            <Button danger icon={<DeleteOutlined />}>
              Excluir
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <Input
          size="middle"
          placeholder="Buscar curso..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 260 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{
            height: 40,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Novo Curso
        </Button>
      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        style={{ borderRadius: 8 }}
        columns={columns}
      />

      <Modal
        title={editing ? "Editar Curso" : "Novo Curso"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="nome"
            label="Nome do Curso"
            rules={[{ required: true }]}
          >
            <Input size="middle" placeholder="Digite o nome do curso" />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}