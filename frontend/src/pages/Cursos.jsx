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
    c.nome?.toLowerCase().includes(search.toLowerCase()),
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
          <span style={{ fontSize: 17, fontWeight: 600 }}>{text}</span>
        </div>
      ),
    },

    /* COLUNA DISCIPLINAS COM BOTÃO */
    {
      title: "Disciplinas",
      dataIndex: "disciplinas",
      width: 420,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (disciplinas = [], record) => {
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              border: "1px solid #f0f0f0",
              padding: "10px",
              borderRadius: 8,
            }}
          >
            {/* TOPO: CONTADOR + BOTÃO */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "2px 46px",
                }}
              >
                📚 {disciplinas.length} disciplinas
              </span>

              <Button
                size="small"
                icon={<BookOutlined />}
                onClick={() => navigate(`/cursos/${record.id}/disciplinas`)}
                style={{
                  fontSize: 16  ,
                  padding: "14px 38px",
                  marginRight: "60px"
                  
                }}
                >
                Ver
              </Button>
            </div>

            {/* RESTANTES */}
          </div>
        );
      },
    },

    /* AÇÕES SEM O BOTÃO VER */
    {
      title: "Ações",
      width: 160,
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => edit(r)}>
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
          marginBottom: 8,
        }}
      >
        <Input
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
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="nome"
            label="Nome do Curso"
            rules={[{ required: true }]}
          >
            <Input placeholder="Digite o nome do curso" />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
