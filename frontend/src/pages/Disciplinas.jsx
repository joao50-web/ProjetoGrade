import { useEffect, useState } from 'react';

import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Popconfirm,
  message,
} from 'antd';

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

/* ======================================================
   HEADER
====================================================== */

const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '14px 20px',
  fontSize: 16,
  textAlign: 'center',
};

/* ======================================================
   COMPONENTE
====================================================== */

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] =
    useState([]);

  const [open, setOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [form] = Form.useForm();

  /* ======================================================
     CARREGAR
  ====================================================== */

  const load = async () => {
    try {
      const res =
        await api.get('/disciplinas');

      setDisciplinas(
        res.data || []
      );

    } catch (err) {
      console.error(err);

      message.error(
        'Erro ao carregar disciplinas'
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ======================================================
     SALVAR
  ====================================================== */

  const save = async () => {
    try {
      const values =
        await form.validateFields();

      setLoading(true);

      if (editing) {
        await api.put(
          `/disciplinas/${editing.id}`,
          values
        );

        message.success(
          'Disciplina atualizada com sucesso'
        );

      } else {
        await api.post(
          '/disciplinas',
          values
        );

        message.success(
          'Disciplina criada com sucesso'
        );
      }

      closeModal();

      load();

    } catch (err) {
      console.error(err);

      message.error(
        err.response?.data?.error ||
          'Erro ao salvar disciplina'
      );

    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     REMOVER
  ====================================================== */

  const remove = async (id) => {
    try {

      await api.delete(
        `/disciplinas/${id}`
      );

      message.success(
        'Disciplina removida com sucesso'
      );

      load();

    } catch (err) {
      console.error(err);

      const erro =
        err.response?.data?.error;

      // 🔥 mensagem amigável do backend
      if (erro) {
        message.error(erro);
      } else {
        message.error(
          'Erro ao excluir disciplina'
        );
      }
    }
  };

  /* ======================================================
     EDITAR
  ====================================================== */

  const edit = (disciplina) => {

    setEditing(disciplina);

    form.setFieldsValue({
      nome: disciplina.nome,
      codigo: disciplina.codigo,
    });

    setOpen(true);
  };

  /* ======================================================
     FECHAR MODAL
  ====================================================== */

  const closeModal = () => {

    setOpen(false);

    setEditing(null);

    form.resetFields();
  };

  /* ======================================================
     FILTRO PESQUISA
  ====================================================== */

  const filtered =
    disciplinas.filter((d) => {

      const texto =
        `${d.nome || ''} ${d.codigo || ''}`
          .toLowerCase();

      return texto.includes(
        search.toLowerCase()
      );
    });

  /* ======================================================
     RENDER TEXTO
  ====================================================== */

  const renderText = (
    text,
    strong = false
  ) => (
    <div
      style={{
        padding: '8px 16px',
      }}
    >
      <span
        style={{
          fontSize:
            strong ? 17 : 16,

          fontWeight:
            strong ? 600 : 400,

          color: '#111827',
        }}
      >
        {text}
      </span>
    </div>
  );

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <AppLayout>

      {/* ==========================================
          TOPO
      ========================================== */}

      <div
        style={{
          display: 'flex',

          justifyContent:
            'space-between',

          alignItems: 'center',

          marginBottom: 20,

          gap: 12,

          flexWrap: 'wrap',
        }}
      >

        <Input
          placeholder="Buscar disciplina..."
          prefix={<SearchOutlined />}
          allowClear
          value={search}
          style={{
            width: 300,
            fontSize: 16,
            height: 42,
          }}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            setOpen(true)
          }
          style={{
            height: 42,
            fontWeight: 600,
            fontSize: 15,
            background:
              '#1677ff',
          }}
        >
          Nova Disciplina
        </Button>

      </div>

      {/* ==========================================
          TABELA
      ========================================== */}

      <Table
        rowKey="id"
        dataSource={filtered}
        pagination={{
          pageSize: 6,
        }}
        bordered
        size="middle"
        scroll={{
          x: 'max-content',
        }}
        columns={[

          /* CÓDIGO */

          {
            title: 'Código',

            dataIndex: 'codigo',

            align: 'left',

            width: 180,

            onHeaderCell: () => ({
              style:
                headerCellStyle,
            }),

            render: (text) =>
              renderText(text),
          },

          /* NOME */

          {
            title: 'Nome',

            dataIndex: 'nome',

            align: 'left',

            onHeaderCell: () => ({
              style:
                headerCellStyle,
            }),

            render: (text) =>
              renderText(
                text,
                true
              ),
          },

          /* EDITAR */

          {
            title:
              'Editar Disciplina',

            align: 'center',

            width: 180,

            onHeaderCell: () => ({
              style:
                headerCellStyle,
            }),

            render: (_, record) => (
              <Button
                icon={
                  <EditOutlined />
                }
                onClick={() =>
                  edit(record)
                }
                style={{
                  fontSize: 16,

                  color: '#333',

                  borderColor:
                    '#d1d5db',

                  backgroundColor:
                    '#f9fafb',
                }}
              />
            ),
          },

          /* EXCLUIR */

          {
            title: 'Excluir',

            align: 'center',

            width: 120,

            onHeaderCell: () => ({
              style:
                headerCellStyle,
            }),

            render: (_, record) => (
              <Popconfirm
                title="Excluir disciplina?"
                description="Essa ação não poderá ser desfeita."
                okText="Excluir"
                cancelText="Cancelar"
                onConfirm={() =>
                  remove(record.id)
                }
              >
                <Button
                  type="text"
                  danger
                  icon={
                    <DeleteOutlined />
                  }
                  style={{
                    fontSize: 18,
                  }}
                />
              </Popconfirm>
            ),
          },

        ]}
      />

      {/* ==========================================
          MODAL
      ========================================== */}

      <Modal
        title={
          editing
            ? 'Editar Disciplina'
            : 'Nova Disciplina'
        }
        open={open}
        onCancel={closeModal}
        onOk={save}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={loading}
        destroyOnClose
      >

        <Form
          layout="vertical"
          form={form}
        >

          <Form.Item
            name="codigo"
            label="Código"
            rules={[
              {
                required: true,
                message:
                  'Informe o código',
              },
            ]}
          >
            <Input
              style={{
                fontSize: 16,
                height: 42,
              }}
            />
          </Form.Item>

          <Form.Item
            name="nome"
            label="Nome"
            rules={[
              {
                required: true,
                message:
                  'Informe o nome',
              },
            ]}
          >
            <Input
              style={{
                fontSize: 16,
                height: 42,
              }}
            />
          </Form.Item>

        </Form>

      </Modal>

    </AppLayout>
  );
}