import { useEffect, useState, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, message, Popconfirm, Typography, Card, Spin, Select, Space, Drawer, Tooltip, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SearchOutlined, ApartmentOutlined, CalendarOutlined } from '@ant-design/icons';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const { Text, Title } = Typography;

const headerCellStyle = { 
  backgroundColor: '#093e5e', 
  color: '#ffffff', 
  fontWeight: 600, 
  padding: '14px 20px', 
  fontSize: 16, 
  textAlign: 'center' 
};

const THEME = {
  primary: "#0b3d5c",
  bgHeader: "#0b3d5c",
  textWhite: "#ffffff",
  borderColor: "#e5e7eb",
  separatorColor: "#cbd5e1",
};

const miniGradeHeaderStyle = { backgroundColor: THEME.bgHeader, color: THEME.textWhite, fontWeight: "700", fontSize: "12px", textAlign: "center", padding: "8px 4px", textTransform: "uppercase" };
const horarioCellStyle = { backgroundColor: "#f9fafb", color: THEME.primary, fontWeight: "700", textAlign: "center", fontSize: "13px", padding: "4px", borderRight: `2px solid ${THEME.separatorColor}` };

/* =========================================
   COMPONENTE MINI GRADE
========================================= */
function MiniGradeContent({ departamentos }) {
  const [departamentoId, setDepartamentoId] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [grade, setGrade] = useState([]);
  const [loading, setLoading] = useState(false);

  const diasFixos = [
    { id: 1, nome: "SEG" }, { id: 2, nome: "TER" }, { id: 3, nome: "QUA" }, { id: 4, nome: "QUI" }, { id: 5, nome: "SEX" }
  ];

  useEffect(() => {
    api.get("/horarios").then(res => {
      setHorarios((res.data || []).sort((a, b) => a.id - b.id));
    }).catch(() => message.error("Erro ao carregar horários"));
  }, []);

  useEffect(() => {
    if (departamentoId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      api.get("/grade-horaria", { params: { departamento_id: departamentoId } })
        .then(res => setGrade(res.data || []))
        .catch(() => message.error("Erro ao carregar grade"))
        .finally(() => setLoading(false));
    } else {
      setGrade([]);
    }
  }, [departamentoId]);

  const gradeMap = useMemo(() => {
    const map = {};
    grade.forEach((g) => {
      const key = `${g.horario_id}-${g.dia_semana_id}`;
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    return map;
  }, [grade]);

  const columns = [
    {
      title: "HORA", dataIndex: "descricao", width: 85, fixed: "left", align: "center",
      onHeaderCell: () => ({ style: miniGradeHeaderStyle }),
      onCell: () => ({ style: horarioCellStyle }),
    },
    ...diasFixos.map((dia) => ({
      title: dia.nome, width: 160, align: "center",
      onHeaderCell: () => ({ style: miniGradeHeaderStyle }),
      render: (_, record) => {
        const items = gradeMap[`${record.id}-${dia.id}`] || [];
        return (
          <div style={{ minHeight: "60px", padding: "2px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {items.map((item, idx) => (
              <Tooltip 
                key={idx} 
                title={
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.disciplina?.nome}</div>
                    <div>Curso: {item.curso}</div>
                    {item.turma && <div>Turma: {item.turma}</div>}
                  </div>
                }
                placement="topLeft"
              >
                <div 
                  style={{ 
                    backgroundColor: "#ffffff", 
                    border: "1px solid #d1d5db", 
                    borderLeft: `4px solid ${THEME.primary}`,
                    borderRadius: "4px", 
                    padding: "4px 6px",
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ 
                    fontWeight: "700", 
                    color: "#1f2937", 
                    fontSize: "11px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: "1.2"
                  }}>
                    {item.disciplina?.nome}
                  </div>
                  <div style={{ 
                    fontSize: "10px", 
                    color: "#6b7280", 
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {item.curso}
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>
        );
      },
    })),
  ];

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ marginBottom: 20, background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 15 }}>
        <Text strong style={{ color: THEME.primary }}>Departamento:</Text>
        <Select
          placeholder="Selecione para visualizar o quadro"
          style={{ width: 400 }}
          allowClear
          onChange={setDepartamentoId}
          options={departamentos.map(d => ({ value: d.id, label: `${d.sigla} - ${d.nome}` }))}
        />
        <Tag color="blue" style={{ marginLeft: 'auto' }}>Passe o mouse sobre as aulas para ver detalhes</Tag>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "100px" }}><Spin size="large" tip="Organizando Grade..." /></div>
      ) : (
        <Table
          rowKey="id"
          dataSource={horarios}
          columns={columns}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 800, y: 'calc(100vh - 280px)' }}
          locale={{ emptyText: departamentoId ? "Nenhuma aula agendada" : "Selecione um departamento" }}
        />
      )}
    </div>
  );
}

/* =========================================
   PÁGINA PRINCIPAL
========================================= */
export default function Departamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const [open, setOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departamentos');
      setDepartamentos(Array.isArray(res.data) ? res.data : []);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      message.error('Erro ao carregar departamentos.');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editing) await api.put(`/departamentos/${editing.id}`, values);
      else await api.post('/departamentos', values);
      
      message.success('Departamento salvo com sucesso!');
      setOpen(false);
      setEditing(null);
      form.resetFields();
      load();
    } catch (err) {
      if (err.errorFields) return;
      message.error(err.response?.data?.error || 'Erro ao salvar departamento');
    } finally { setLoading(false); }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/departamentos/${id}`);
      message.success('Departamento removido com sucesso');
      load();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      message.error('Não é possível excluir este departamento pois ele já está sendo utilizado no sistema.');
    }
  };

  const filtered = departamentos.filter(d => 
    [d.nome, d.sigla].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Input 
          placeholder="Buscar departamento..." 
          prefix={<SearchOutlined />} 
          allowClear 
          style={{ width: 300, height: 42 }} 
          onChange={e => setSearch(e.target.value)} 
        />
        <Space>
          <Button 
            type="default"
            icon={<CalendarOutlined />} 
            onClick={() => setDrawerOpen(true)} 
            style={{ height: 42, color: '#093e5e', borderColor: '#093e5e', fontWeight: 600 }}
          >
            Quadro de Horários
          </Button>

          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }} 
            style={{ height: 42, fontWeight: 600 }}
          >
            Novo Departamento
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={filtered}
        loading={loading}
        bordered
        pagination={{ pageSize: 6 }}
        columns={[
          { title: 'Departamento', dataIndex: 'nome', onHeaderCell: () => ({ style: headerCellStyle }), render: (t) => <div style={{ padding: '8px 16px', fontSize: 16, fontWeight: 600 }}>{t}</div> },
          { title: 'Sigla', dataIndex: 'sigla', align: 'center', onHeaderCell: () => ({ style: headerCellStyle }), render: (t) => <div style={{ padding: '8px 16px', fontSize: 16 }}>{t}</div> },
          {
            title: 'Editar', align: 'center', width: 120, onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => <Button icon={<EditOutlined />} onClick={() => { setEditing(r); form.setFieldsValue(r); setOpen(true); }} />
          },
          {
            title: 'Excluir', align: 'center', width: 120, onHeaderCell: () => ({ style: headerCellStyle }),
            render: (_, r) => (
              <Popconfirm title="Deseja excluir este departamento?" onConfirm={() => remove(r.id)}>
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )
          }
        ]}
      />

      <Modal title={editing ? "Editar Departamento" : "Novo Departamento"} open={open} onCancel={() => setOpen(false)} onOk={save} confirmLoading={loading} okText="Salvar">
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="nome" label="Nome" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input prefix={<ApartmentOutlined />} />
          </Form.Item>
          <Form.Item name="sigla" label="Sigla" rules={[{ required: true, message: 'Obrigatório' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={<Title level={4} style={{ margin: 0, color: '#fff' }}>Quadro Semanal por Departamento</Title>}
        placement="right"
        width="90%"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        headerStyle={{ background: '#093e5e', color: '#fff' }}
        bodyStyle={{ background: '#f5f7fa', padding: '10px' }}
      >
        <MiniGradeContent departamentos={departamentos} />
      </Drawer>
    </AppLayout>
  );
}