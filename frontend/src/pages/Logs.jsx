import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Input,
  message
} from 'antd';

import {
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const headerCellStyle = {
  backgroundColor: '#093e5e',
  color: '#ffffff',
  fontWeight: 600,
  padding: '14px 20px',
  fontSize: 16,
  textAlign: 'center'
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [currentDetails, setCurrentDetails] = useState(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/logs');
      setLogs(response.data);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      message.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const showDetails = (details) => {
    setCurrentDetails(details);
    setDetailsModalVisible(true);
  };

  const closeModal = () => {
    setDetailsModalVisible(false);
    setCurrentDetails(null);
  };

  // 🔥 AÇÃO MAIS LEGÍVEL
  const formatAcao = (acao) => {
    if (!acao) return '';

    const [metodo, rota] = acao.split(' ');
    const entidade = rota?.split('/')[1] || '';

    const entidadeFormatada = entidade
      .replace('-', ' ')
      .replace(/s$/, '');

    switch (metodo) {
      case 'POST':
        return `Criou ${entidadeFormatada}`;
      case 'PUT':
        return `Atualizou ${entidadeFormatada}`;
      case 'DELETE':
        return `Removeu ${entidadeFormatada}`;
      default:
        return acao;
    }
  };

  const filteredLogs = logs.filter(log =>
    [log.acao, log.entidade, log.usuario?.login, log.usuario?.pessoa?.nome]
      .some(v => v && v.toLowerCase().includes(search.toLowerCase()))
  );

  const renderText = (text, strong = false) => (
    <div style={{ padding: '8px 20px' }}>
      <span style={{
        fontSize: strong ? 17 : 16,
        fontWeight: strong ? 500 : 400
      }}>
        {text}
      </span>
    </div>
  );

  const formatDate = (dateString) => {
    try {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date(dateString));
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      return dateString;
    }
  };

  // 🔥 DETALHES MAIS HUMANOS
  const formatDetails = (details) => {
    if (!details) return 'Sem informações adicionais.';

    const { body, query, params } = details;

    return `
📌 Informações da ação

🧾 Dados enviados:
${body && Object.keys(body).length ? JSON.stringify(body, null, 2) : 'Nenhum dado enviado'}

🔎 Parâmetros:
${params && Object.keys(params).length ? JSON.stringify(params, null, 2) : 'Nenhum parâmetro'}

🔍 Filtros:
${query && Object.keys(query).length ? JSON.stringify(query, null, 2) : 'Nenhum filtro'}

⚠️ Observação:
Esta ação foi registrada automaticamente pelo sistema.
    `;
  };

  const columns = [
    {
      title: 'Data/Hora',
      dataIndex: 'data_hora',
      key: 'data_hora',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => renderText(formatDate(text))
    },
    {
      title: 'Usuário',
      dataIndex: ['usuario', 'pessoa', 'nome'],
      key: 'usuario_nome',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text, record) =>
        renderText(text || record.usuario?.login || 'N/A', true)
    },
    {
      title: 'Ação',
      dataIndex: 'acao',
      key: 'acao',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => renderText(formatAcao(text))
    },
    {
      title: 'Entidade',
      dataIndex: 'entidade',
      key: 'entidade',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => renderText(text)
    },
    {
      title: 'Detalhes',
      key: 'detalhes',
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => showDetails(record.detalhes)}
        >
          Ver detalhes
        </Button>
      )
    }
  ];

  return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Input
          placeholder="Buscar log..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 280 }}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <Table
        rowKey="id"
        dataSource={filteredLogs}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
        columns={columns}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title="Detalhes da Ação"
        open={detailsModalVisible}
        onCancel={closeModal}
        footer={null}
        width={700}
      >
        <div style={{
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
          fontSize: 14,
          background: '#f5f5f5',
          padding: 15,
          borderRadius: 6
        }}>
          {formatDetails(currentDetails)}
        </div>
      </Modal>
    </AppLayout>
  );
}