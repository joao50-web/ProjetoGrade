import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Input,
  message,
  Popconfirm,
  Space,
  Typography
} from 'antd';

import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';
import moment from 'moment';

const { Text } = Typography;

/* ================= ESTILO PADRÃO ================= */
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

  /* ================= LOAD ================= */
  const loadLogs = async () => {
    setLoading(true);
    try {
      // 🔥 LIMITA PRA NÃO TRAVAR
      const response = await api.get('/logs?limit=50');
      setLogs(response.data);
    } catch {
      message.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  /* ================= MODAL ================= */
  const showDetails = (details) => {
    setCurrentDetails(details);
    setDetailsModalVisible(true);
  };

  const closeModal = () => {
    setDetailsModalVisible(false);
    setCurrentDetails(null);
  };

  /* ================= FILTRO ================= */
  const filteredLogs = logs.filter(log =>
    [log.acao, log.entidade, log.usuario?.login, log.usuario?.pessoa?.nome]
      .some(v => v && v.toLowerCase().includes(search.toLowerCase()))
  );

  /* ================= RENDER ================= */
  const renderText = (text, strong = false) => (
    <div style={{ padding: '8px 20px' }}>
      <span style={{
        fontSize: strong ? 17 : 16,
        fontWeight: strong ? 500 : 400
      }}>
        {text || 'N/A'}
      </span>
    </div>
  );

  /* ================= AÇÕES ================= */
  const limparAntigos = async () => {
    try {
      await api.delete('/logs/old?dias=30');
      message.success('Logs antigos removidos');
      loadLogs();
    } catch {
      message.error('Erro ao limpar logs');
    }
  };

  const limparTudo = async () => {
    try {
      await api.delete('/logs/all');
      message.success('Todos os logs removidos');
      loadLogs();
    } catch {
      message.error('Erro ao limpar logs');
    }
  };

  /* ================= COLUNAS ================= */
  const columns = [
    {
      title: 'Data/Hora',
      dataIndex: 'data_hora',
      align: 'left',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) =>
        renderText(moment(text).format('DD/MM/YYYY HH:mm:ss'))
    },
    {
      title: 'Usuário',
      align: 'left',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) =>
        renderText(
          record.usuario?.pessoa?.nome ||
          record.usuario?.login,
          true
        )
    },
    {
      title: 'Ação',
      dataIndex: 'acao',
      align: 'left',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: renderText
    },
    {
      title: 'Entidade',
      dataIndex: 'entidade',
      align: 'left',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: renderText
    },
    {
      title: 'ID',
      dataIndex: 'entidade_id',
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => renderText(text)
    },
    {
      title: 'Detalhes',
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => showDetails(record.detalhes)}
          style={{
            fontSize: 16,
            borderColor: '#cccccc',
            backgroundColor: '#f9f9f9'
          }}
        >
          Ver
        </Button>
      )
    }
  ];

  return (
    <AppLayout>

      {/* ================= TOPO ================= */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 20
      }}>
        <Input
          placeholder="Buscar log..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 280, fontSize: 16 }}
          onChange={e => setSearch(e.target.value)}
        />

        <Space>
          <Popconfirm
            title="Remover logs antigos (30 dias)?"
            onConfirm={limparAntigos}
          >
            <Button danger icon={<DeleteOutlined />}>
              Limpar antigos
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Excluir TODOS os logs?"
            onConfirm={limparTudo}
          >
            <Button danger type="primary">
              Limpar tudo
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* ================= TABELA ================= */}
      <Table
        rowKey="id"
        dataSource={filteredLogs}
        pagination={{ pageSize: 10 }}
        loading={loading}
        bordered
        columns={columns}
        style={{ fontSize: 16 }}
        scroll={{ x: 'max-content' }}
      />

      {/* ================= MODAL ================= */}
      <Modal
        title="Detalhes do Log"
        open={detailsModalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        <pre style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          fontSize: 14
        }}>
          {JSON.stringify(currentDetails, null, 2)}
        </pre>
      </Modal>

    </AppLayout>
  );
}