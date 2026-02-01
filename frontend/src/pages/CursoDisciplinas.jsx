import { useEffect, useState } from 'react';
import { Card, Transfer, Button, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { Breadcrumb, Badge, Space } from 'antd';
import { Link } from 'react-router-dom';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

export default function CursoDisciplinas() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disciplinas, setDisciplinas] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);

const load = async () => {
  try {
    setLoading(true);

    const [cursoRes, all, vinculadas] = await Promise.all([
      api.get(`/cursos/${id}`),
      api.get('/disciplinas'),
      api.get(`/cursos/${id}/disciplinas`)
    ]);

    setCurso(cursoRes.data);

    setDisciplinas(
      all.data.map(d => ({
        key: d.id.toString(),
        title: d.nome
      }))
    );

    setTargetKeys(
      vinculadas.data.map(d => d.id.toString())
    );
  } finally {
    setLoading(false);
  }
};


  const save = async () => {
    try {
      await api.post(`/cursos/${id}/disciplinas`, {
        disciplinas: targetKeys.map(Number)
      });

      message.success('Disciplinas associadas com sucesso');
      navigate('/cursos');
    } catch {
      message.error('Erro ao salvar associações');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppLayout>
      <Breadcrumb style={{ marginBottom: 16 }}>
      <Breadcrumb.Item>
        <Link to="/cursos">Cursos</Link>
      </Breadcrumb.Item>
      <Breadcrumb.Item>Disciplinas</Breadcrumb.Item>
    </Breadcrumb>
<Card
  title={`Disciplinas do Curso: ${curso?.nome || ''}`}
  extra={
    <Space>
      <Badge
        count={targetKeys.length}
        showZero
        style={{ backgroundColor: '#0B3A4A' }}
      />

      <Button onClick={() => navigate('/cursos')}>
        Voltar
      </Button>

      <Button type="primary" onClick={save}>
        Salvar
      </Button>
    </Space>
  }
>


        {loading ? (
          <Spin />
        ) : (
          <Transfer
            dataSource={disciplinas}
            targetKeys={targetKeys}
            onChange={setTargetKeys}
            render={item => item.title}
            showSearch
            listStyle={{ width: 1000, height: 500 }}
          />
        )}
      </Card>
    </AppLayout>
  );
}
