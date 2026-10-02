import { useEffect, useState } from 'react';
import {
  Card,
  Transfer,
  Button,
  message,
  Spin,
  Breadcrumb,
  Badge,
  Space,
  Select
} from 'antd';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const unicos = (valores) => [
  ...new Set(
    (valores || [])
      .map(Number)
      .filter(Number.isInteger)
  )
];

export default function CursoDisciplinas() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingTransfer, setLoadingTransfer] = useState(false);
  const [disciplinas, setDisciplinas] = useState([]);
  const [targetKeys, setTargetKeys] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [curriculos, setCurriculos] = useState([]);
  const [semestreId, setSemestreId] = useState(null);
  const [curriculoId, setCurriculoId] = useState(null);

  const contextoSelecionado = Boolean(semestreId && curriculoId);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [cursoRes, allDisc, semestresRes, curriculosRes] = await Promise.all([
        api.get(`/cursos/${id}`),
        api.get('/disciplinas'),
        api.get('/semestres'),
        api.get('/curriculos')
      ]);

      setCurso(cursoRes.data);
      setSemestres(Array.isArray(semestresRes.data) ? semestresRes.data : []);
      setCurriculos(Array.isArray(curriculosRes.data) ? curriculosRes.data : []);
      setDisciplinas(
        (Array.isArray(allDisc.data) ? allDisc.data : []).map((disciplina) => ({
          key: String(disciplina.id),
          title: `${disciplina.codigo || ''} - ${disciplina.nome || 'Sem nome'}`
        }))
      );
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      message.error('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisciplinasDoSemestre = async () => {
    if (!semestreId || !curriculoId) {
      setTargetKeys([]);
      return;
    }

    try {
      setLoadingTransfer(true);

      const response = await api.get(`/cursos/${id}/disciplinas`, {
        params: {
          semestre_id: Number(semestreId),
          curriculo_id: Number(curriculoId)
        }
      });

      const ids = (response.data || []).map((disciplina) => disciplina.id);
      setTargetKeys(unicos(ids).map(String));
    } catch (error) {
      console.error('Erro ao buscar disciplinas do contexto:', error);
      message.error('Erro ao buscar disciplinas deste semestre');
      setTargetKeys([]);
    } finally {
      setLoadingTransfer(false);
    }
  };

  const handleCurriculoChange = (value) => {
    // Limpa a seleção antiga para não misturar contextos.
    setTargetKeys([]);
    setCurriculoId(value ? Number(value) : null);
  };

  const handleSemestreChange = (value) => {
    // Limpa a seleção antiga para não misturar contextos.
    setTargetKeys([]);
    setSemestreId(value ? Number(value) : null);
  };

  const handleTransferChange = (keys) => {
    // Proteção adicional além do disabled visual do componente.
    if (!contextoSelecionado) {
      message.warning('Selecione o currículo e o semestre antes de adicionar disciplinas.');
      setTargetKeys([]);
      return;
    }

    setTargetKeys(unicos(keys).map(String));
  };

  const save = async () => {
    if (!contextoSelecionado) {
      message.warning('Selecione o currículo e o semestre antes de salvar.');
      return;
    }

    try {
      const ids = unicos(targetKeys);

      await api.post(`/cursos/${id}/disciplinas`, {
        semestre_id: Number(semestreId),
        curriculo_id: Number(curriculoId),
        disciplinas: ids
      });

      setTargetKeys(ids.map(String));
      message.success('Disciplinas do semestre salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar vínculos:', error);
      message.error(error.response?.data?.error || 'Erro ao salvar vínculos');
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  useEffect(() => {
    fetchDisciplinasDoSemestre();
  }, [id, semestreId, curriculoId]);

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link to="/academico/cursos">Cursos</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Disciplinas</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card
        style={{
          borderRadius: 12,
          boxShadow: '0 3px 10px rgba(0,0,0,0.06)'
        }}
        title={
          <span style={{ fontSize: 18, fontWeight: 600, color: '#093e5e' }}>
            Grade: {curso?.nome || '...'}
          </span>
        }
        extra={
          <Space size={12}>
            <Badge
              count={targetKeys.length}
              showZero
              style={{ backgroundColor: '#093e5e' }}
            />
            <Button onClick={() => navigate('/academico/cursos')}>
              Voltar
            </Button>
            <Button
              type="primary"
              onClick={save}
              disabled={!contextoSelecionado}
            >
              Salvar Semestre
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <Space
              size="large"
              style={{
                marginBottom: 16,
                width: '100%',
                maxWidth: 1020,
                alignItems: 'flex-end'
              }}
            >
              <div>
                <span
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontWeight: 500
                  }}
                >
                  Currículo:
                </span>
                <Select
                  placeholder="Selecione o currículo"
                  allowClear
                  style={{ width: 220 }}
                  value={curriculoId}
                  onChange={handleCurriculoChange}
                  options={curriculos.map((curriculo) => ({
                    value: Number(curriculo.id),
                    label: curriculo.descricao || curriculo.nome
                  }))}
                />
              </div>

              <div>
                <span
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontWeight: 500
                  }}
                >
                  Semestre:
                </span>
                <Select
                  placeholder="Selecione o semestre"
                  allowClear
                  style={{ width: 220 }}
                  value={semestreId}
                  onChange={handleSemestreChange}
                  options={semestres.map((semestre) => ({
                    value: Number(semestre.id),
                    label: semestre.descricao || semestre.nome
                  }))}
                />
              </div>
            </Space>

            {!contextoSelecionado && (
              <div
                style={{
                  width: '100%',
                  maxWidth: 1020,
                  marginBottom: 12,
                  color: '#64748b',
                  fontSize: 13,
                  textAlign: 'center'
                }}
              >
                Selecione o currículo e o semestre para adicionar disciplinas.
              </div>
            )}

            <Spin spinning={loadingTransfer} tip="Carregando semestre...">
              <Transfer
                dataSource={disciplinas}
                targetKeys={targetKeys}
                onChange={handleTransferChange}
                disabled={!contextoSelecionado || loadingTransfer}
                showSearch
                filterOption={(input, item) =>
                  item.title?.toLowerCase().includes(input.toLowerCase())
                }
                locale={{
                  searchPlaceholder: contextoSelecionado
                    ? 'Buscar disciplina'
                    : 'Selecione currículo e semestre',
                  notFoundContent: 'Nenhum resultado'
                }}
                operations={['Adicionar →', '← Remover']}
                render={(item) => (
                  <div style={{ padding: 4, fontWeight: 500 }}>
                    {item.title}
                  </div>
                )}
                listStyle={{
                  width: '42%',
                  minWidth: 320,
                  maxWidth: 1020,
                  height: 550,
                  borderRadius: 10
                }}
                style={{ width: '100%', maxWidth: 1500 }}
              />
            </Spin>
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
