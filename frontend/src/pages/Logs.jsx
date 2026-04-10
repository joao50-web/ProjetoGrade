import { useEffect, useState } from 'react';
import { Table, Button, Modal, Input, message, Space } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

// =========================
// STYLE
// =========================

const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#fff',
  fontWeight: 600,
  padding: '12px 16px',
  fontSize: 15,
  textAlign: 'left'
};

// =========================
// FORMATADORES
// =========================

const formatDate = (dateString) => {
  if (!dateString) return '—';

  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
};

const getActionData = (acao) => {
  if (!acao) return { action: '—', entity: '—' };

  const [method, route] = acao.split(' ');
  const entity = route?.split('/')[1] || 'registro';

  const cleanEntity = entity.replace('-', ' ').replace(/s$/, '');

  const actions = {
    POST: 'Criou',
    PUT: 'Atualizou',
    DELETE: 'Removeu'
  };

  return {
    action: actions[method] || method,
    entity: cleanEntity
  };
};

const formatUsuario = (log) =>
  log?.usuario?.pessoa?.nome ||
  log?.usuario?.login ||
  'Desconhecido';

// =========================
// DETALHES
// =========================

const formatDetails = (details) => {
  if (!details) return 'Nenhum detalhe registrado.';

  return `
📄 DETALHES DO REGISTRO
────────────────────────

🧾 Dados:
${JSON.stringify(details.body || {}, null, 2)}

🔎 Parâmetros:
${JSON.stringify(details.params || {}, null, 2)}

🔍 Filtros:
${JSON.stringify(details.query || {}, null, 2)}
  `.trim();
};

// =========================
// PDF EXPORT
// =========================

const exportPDF = async () => {
  const element = document.getElementById("relatorio-logs");

  if (!element) {
    message.error("Erro ao gerar PDF");
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("relatorio-logs.pdf");

  } catch (err) {
    console.error(err);
    message.error("Falha ao gerar PDF");
  }
};

// =========================
// EXCEL EXPORT
// =========================

const exportExcel = (logs) => {
  const data = logs.map((log) => {
    const { action, entity } = getActionData(log.acao || '');

    return {
      Data: formatDate(log.data_hora),
      Usuario: formatUsuario(log),
      Acao: action,
      Entidade: entity
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, "Logs");

  XLSX.writeFile(wb, "relatorio-logs.xlsx");
};

// =========================
// COMPONENTE
// =========================

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch {
      message.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const openModal = (data) => {
    setDetails(data);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setDetails(null);
  };

  const filteredLogs = logs.filter((log) =>
    [log.acao, log.entidade, log.usuario?.login, log.usuario?.pessoa?.nome]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      title: 'Data',
      dataIndex: 'data_hora',
      render: formatDate,
      onHeaderCell: () => ({ style: headerCellStyle })
    },
    {
      title: 'Usuário',
      render: formatUsuario,
      onHeaderCell: () => ({ style: headerCellStyle })
    },
    {
      title: 'Ação',
      dataIndex: 'acao',
      render: (v) => getActionData(v).action,
      onHeaderCell: () => ({ style: headerCellStyle })
    },
    {
      title: 'Entidade',
      dataIndex: 'acao',
      render: (v) => getActionData(v).entity,
      onHeaderCell: () => ({ style: headerCellStyle })
    },
    {
      title: 'Detalhes',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openModal(record.detalhes)}
        >
          Ver
        </Button>
      ),
      onHeaderCell: () => ({ style: headerCellStyle })
    }
  ];

  return (
    <AppLayout>

      {/* BOTÕES */}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={exportPDF}>
          Exportar PDF
        </Button>

        <Button onClick={() => exportExcel(filteredLogs)}>
          Exportar Excel
        </Button>

        <Input
          placeholder="Buscar logs..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 280 }}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Space>

      {/* ÁREA PDF */}
      <div id="relatorio-logs">
        <Table
          rowKey="id"
          dataSource={filteredLogs}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          columns={columns}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* MODAL */}
      <Modal
        title="Detalhes do Registro"
        open={open}
        onCancel={closeModal}
        footer={null}
        width={720}
      >
        <pre style={{
          whiteSpace: 'pre-wrap',
          fontSize: 13,
          lineHeight: 1.6,
          background: '#fafafa',
          padding: 14,
          borderRadius: 6,
          border: '1px solid #eee'
        }}>
          {formatDetails(details)}
        </pre>
      </Modal>

    </AppLayout>
  );
}