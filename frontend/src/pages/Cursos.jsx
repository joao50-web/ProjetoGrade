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
  Badge,
  Pagination,
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

/* ================= ESTILO DO HEADER ================= */
const headerCellStyle = {
  backgroundColor: "#093e5e",
  color: "#ffffff",
  fontWeight: 600,
  padding: "3px 16px",
  fontSize: 14,
  textAlign: "center",
};

/* ================= QTD DE ITENS POR PÁGINA NA LISTA INTERNA ================= */
const PAGE_SIZE = 5;

export default function Cursos() {
  const [cursos, setCursos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();
  const navigate = useNavigate();

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      const res = await api.get("/cursos");
      // Adiciona estado de paginação interna para cada curso
      const data = res.data.map((c) => ({ ...c, currentPage: 1 }));
      setCursos(data);
    } catch {
      message.error("Erro ao carregar cursos");
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  /* ================= CRUD ================= */
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

  /* ================= FILTRO ================= */
  const filtered = cursos.filter((c) =>
    c.nome?.toLowerCase().includes(search.toLowerCase()),
  );

  /* ================= PAGINAÇÃO INTERNA ================= */
  const handlePageChange = (cursoId, page) => {
    setCursos((prev) =>
      prev.map((c) => (c.id === cursoId ? { ...c, currentPage: page } : c)),
    );
  };

  /* ================= COLUNAS ================= */
  const columns = [
    {
      title: "Nome",
      dataIndex: "nome",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => (
        <span style={{ fontSize: 15, fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: "Disciplinas",
      dataIndex: "disciplinas",
      align: "left",
      width: 300,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (disciplinas = [], record) => {
        const start = (record.currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageItems = disciplinas.slice(start, end);

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Badge
              count={disciplinas.length}
              showZero
              style={{
                backgroundColor: "#093e5e",
                fontSize: 13,
                marginBottom: 2,
              }}
            />
            {pageItems.map((d) => (
              <span key={d.id} style={{ fontSize: 12 }}>
                {d.codigo} - {d.nome}
              </span>
            ))}
            {disciplinas.length > PAGE_SIZE && (
              <Pagination
                size="small"
                simple
                current={record.currentPage}
                pageSize={PAGE_SIZE}
                total={disciplinas.length}
                onChange={(page) => handlePageChange(record.id, page)}
                style={{ marginTop: 2, textAlign: "center" }}
              />
            )}
          </div>
        );
      },
    },
    {
      title: "Ações",
      align: "center",
      width: 300,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <Space size={14}>
          <Button
            icon={<BookOutlined />}
            onClick={() => navigate(`/cursos/${r.id}/disciplinas`)}
            style={{ borderRadius: 6 }}
          >
            Disciplinas
          </Button>

          <Button
            icon={<EditOutlined />}
            onClick={() => edit(r)}
            style={{ borderRadius: 6 }}
          />

          <Popconfirm
            title="Excluir este curso?"
            onConfirm={() => remove(r.id)}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              style={{ borderRadius: 6 }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AppLayout>
      {/* ================= TOPO ================= */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Input
          placeholder="Buscar curso"
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 260 }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ borderRadius: 6 }}
        >
          Novo Curso
        </Button>
      </div>

      {/* ================= TABELA ================= */}
      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        columns={columns}
      />

      {/* ================= MODAL ================= */}
      <Modal
        title={editing ? "Editar Curso" : "Novo Curso"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        okButtonProps={{
          style: {
            borderRadius: 6,
            backgroundColor: "#093e5e",
            border: "none",
          },
        }}
        cancelButtonProps={{ style: { borderRadius: 6 } }}
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="nome"
            label="Nome do Curso"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}
