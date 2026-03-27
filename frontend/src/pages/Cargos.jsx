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
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";

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

export default function Cargos() {
  const [cargos, setCargos] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const response = await api.get("/cargos");
      setCargos(response.data);
    } catch {
      message.error("Erro ao carregar cargos");
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const submit = async (values) => {
    try {
      editing
        ? await api.put(`/cargos/${editing.id}`, values)
        : await api.post("/cargos", values);

      message.success(editing ? "Cargo atualizado" : "Cargo criado");
      closeModal();
      load();
    } catch {
      message.error("Erro ao salvar cargo");
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/cargos/${id}`);
      message.success("Cargo removido");
      load();
    } catch {
      message.error("Erro ao excluir cargo");
    }
  };

  const edit = (cargo) => {
    setEditing(cargo);
    form.setFieldsValue({ descricao: cargo.descricao });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    form.resetFields();
  };

  const filtered = cargos.filter((c) =>
    c.descricao?.toLowerCase().includes(search.toLowerCase()),
  );

  const renderText = (text) => (
    <div style={{ padding: "6px 16px" }}>
      <span style={{ fontSize: 15, fontWeight: 500 }}>{text}</span>
    </div>
  );

  const buttonStyle = {
    height: 36,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 12px",
    fontSize: 16,
  };

  return (
    <AppLayout>
      {/* TOPO */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
        <Input
          placeholder="Buscar cargo..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 260 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
          style={{ height: 40, fontWeight: 500 }}
        >
          Novo Cargo
        </Button>
      </div>

      {/* TABELA */}
      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{ pageSize: 6 }}
        bordered
        style={{ borderRadius: 10 }}
        columns={[
          {
            title: "Descrição",
            dataIndex: "descricao",
            align: "left",
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: renderText,
          },

          {
            title: "Adicionar Cargo",
            align: "center",
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "8px 0" }}>
                <Button
                  size="middle"
                  icon={<EditOutlined />}
                  onClick={() => edit(r)}
                  style={buttonStyle}
                >
                  Editar
                </Button>
              </div>
            ),
          },

          {
            title: "Excluir",
            align: "center",
            onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <Popconfirm
                  title="Deseja realmente excluir este cargo?"
                  onConfirm={() => remove(r.id)}
                >
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    style={{ fontSize: 18 }}
                  />
                </Popconfirm>
              </div>
            ),
          },
        ]}
      />

      {/* MODAL */}
      <Modal
        title={editing ? "Editar Cargo" : "Novo Cargo"}
        open={open}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText="Salvar"
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={submit}>
          <Form.Item
            name="descricao"
            label="Descrição"
            rules={[{ required: true }]}
          >
            <Input placeholder="Digite o cargo" />
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}