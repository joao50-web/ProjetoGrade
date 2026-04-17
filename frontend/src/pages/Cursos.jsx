import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
  Select,
  Tag,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  PlusOutlined,
  SearchOutlined,
  ApartmentOutlined,
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
  const [departamentos, setDepartamentos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [resCursos, resDeptos] = await Promise.all([
        api.get("/cursos"),
        api.get("/departamentos"),
      ]);

      setCursos(resCursos.data);
      setDepartamentos(resDeptos.data);
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
      departamento_id: curso.departamento_id,
    });
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
      width: 220,
      ellipsis: true,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => (
        <div style={{ padding: "10px 54px" }}>
          <p style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{text}</p>
        </div>
      ),
    },
    {
      title: "Departamento",
      dataIndex: ["departamento", "nome"],
      width: 180,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) =>
        text ? (
          <Tag color="blue" style={{ fontSize: 14 }}>
            {text}
          </Tag>
        ) : (
          <span style={{ color: "#999" }}>Não definido</span>
        ),
    },
    {
      title: "Disciplinas",
      dataIndex: "disciplinas",
      width: 140,
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
      width: 260,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            padding: "10px 20px",
          }}
        >
          <Button
            size="middle"
            icon={<BookOutlined />}
            onClick={() =>
              navigate(`/academico/cursos/${record.id}/disciplinas`)
            }
            style={buttonStyle}
          >
            Disciplinas
          </Button>

          <Button
            size="middle"
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
      width: 80,
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
      {/* TOPO */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Input
          placeholder="Buscar curso..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 280, height: 38 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ height: 38, padding: "0 18px" }}
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

          {/* ✅ DEPARTAMENTO */}
          <Form.Item
            name="departamento_id"
            label="Departamento"
            rules={[{ required: true, message: "Selecione o departamento" }]}
          >
            <Select
              placeholder="Selecione o departamento"
              suffixIcon={<ApartmentOutlined />}
            >
              {departamentos.map((d) => (
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
