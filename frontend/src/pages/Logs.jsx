import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography
} from 'antd';

import {
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';
import moment from 'moment';

const { Text } = Typography;

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

  const columns = [
    {
      title: 'Data/Hora',
      dataIndex: 'data_hora',
      key: 'data_hora',
      align: 'left',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => renderText(moment(text).format('DD/MM/YYYY HH:mm:ss'))
    },
    {
      title: 'Usuário',
      dataIndex: ['usuario', 'pessoa', 'nome'],
      key: 'usuario_nome',
      align: 'left',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text, record) => renderText(text || record.usuario?.login || 'N/A', true)
    },
    {
      title: 'Ação',
      dataIndex: 'acao',
      key: 'acao',
      align: 'left',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: renderText
    },
    {
      title: 'Entidade',
      dataIndex: 'entidade',
      key: 'entidade',
      align: 'left',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: renderText
    },
    {
      title: 'ID da Entidade',
      dataIndex: 'entidade_id',
      key: 'entidade_id',
      align: 'center',
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (text) => renderText(text || 'N/A')
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
          style={{
            fontSize: 16,
            color: '#333333',
            borderColor: '#cccccc',
            backgroundColor: '#f9f9f9'
          }}
        >
          Ver Detalhes
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
          style={{ width: 280, fontSize: 16 }}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

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

      <Modal
        title="Detalhes do Log"
        open={detailsModalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
        bodyStyle={{ fontSize: 16 }}
      >
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(currentDetails, null, 2)}
        </pre>
      </Modal>
    </AppLayout>
  );
}