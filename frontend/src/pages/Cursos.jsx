import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  PlusOutlined,
  SearchOutlined,
  ReadOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

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
  const [pessoas, setPessoas] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [resCursos, resPessoas] = await Promise.all([
        api.get("/cursos"),
        api.get("/pessoas").catch(() => ({ data: [] })),
      ]);

      setCursos(resCursos.data || []);
      setPessoas(resPessoas.data || []);
    } catch {
      message.error("Erro ao carregar dados dos cursos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (values) => {
    try {
      setLoading(true);
      if (editing) {
        await api.put(`/cursos/${editing.id}`, values);
        message.success("Curso atualizado com sucesso!");
      } else {
        await api.post("/cursos", values);
        message.success("Curso criado com sucesso!");
      }

      closeModal();
      load();
    } catch {
      message.error("Erro ao salvar curso");
    } finally {
      setLoading(false);
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
          "Não é possível excluir este curso pois ele já está sendo utilizado na grade horária ou sistema."
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
      coordenador_id: curso.coordenador_id || curso.coordenador?.id || null,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = cursos.filter((c) =>
    [c.nome, c.coordenador?.nome]
      .some((val) => val?.toLowerCase().includes(search.toLowerCase()))
  );

  const renderText = (text, strong = false) => (
    <div style={{ padding: "8px 16px" }}>
      <span
        style={{
          fontSize: strong ? 17 : 16,
          fontWeight: strong ? 600 : 400,
          color: "#111827",
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
      title: "Coordenador",
      dataIndex: "coordenador",
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (coordenador) => renderText(coordenador?.nome || "Sem coordenador"),
    },
    {
      title: "Disciplinas",
      dataIndex: "disciplinas",
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (disciplinas = []) =>
        renderText(
          `${disciplinas.length} disciplina${disciplinas.length !== 1 ? "s" : ""}`
        ),
    },
    {
      title: "Gerenciar",
      align: "center",
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
      title: "Editar",
      align: "center",
      width: 100,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Button icon={<EditOutlined />} onClick={() => edit(record)} />
      ),
    },
    {
      title: "Excluir",
      align: "center",
      width: 100,
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
      {/* CABEÇALHO DA PÁGINA COM INPUT NA ESQUERDA E BOTÃO NA DIREITA */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>

        <Input
          placeholder="Buscar curso ou coordenador..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          style={{ width: 320, height: 42 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            form.resetFields();
            setOpen(true);
          }}
          style={{ height: 42, fontWeight: 600 }}
        >
          Novo Curso
        </Button>

      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        loading={loading}
        pagination={{ pageSize: 6 }}
        bordered
        columns={columns}
      />

      <Modal
        title={editing ? "Editar Curso" : "Novo Curso"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Salvar"
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="nome"
            label="Nome do Curso"
            rules={[{ required: true, message: "Digite o nome do curso" }]}
          >
            <Input prefix={<ReadOutlined />} placeholder="Ex: Ciência da Computação" />
          </Form.Item>

          <Form.Item
            name="coordenador_id"
            label="Coordenador do Curso"
          >
            <Select
              placeholder="Selecione o coordenador"
              allowClear
              showSearch
              optionFilterProp="children"
              suffixIcon={<UserOutlined />}
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {pessoas.map((pessoa) => (
                <Select.Option key={pessoa.id} value={pessoa.id}>
                  {pessoa.nome}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}