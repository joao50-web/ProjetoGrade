import { useEffect, useState } from 'react';
import {
  Card,
  Select,
  Table,
  Typography,
  Row,
  Col,
  Input,
  Button,
  message
} from 'antd';

import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const { Title } = Typography;

export default function GradeHoraria() {
  const [cursos, setCursos] = useState([]);
  const [coordenadores, setCoordenadores] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [dias, setDias] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinasLoaded, setDisciplinasLoaded] = useState(false);

  // contexto fixo
  const [contexto, setContexto] = useState({
    curso_id: null,
    coordenador_id: null,
    semestre_id: null
  });

  // inputs manuais
  const [anoInput, setAnoInput] = useState('');
  const [curriculoInput, setCurriculoInput] = useState('');

  // grade
  const [gradeExistente, setGradeExistente] = useState([]);
  const [gradeDraft, setGradeDraft] = useState([]);

  // ===== LOAD FIXOS =====
  useEffect(() => {
    api.get('/cursos').then(r => setCursos(r.data));
    api.get('/pessoas/coordenadores').then(r => setCoordenadores(r.data));
    api.get('/semestres').then(r => setSemestres(r.data));
    api.get('/horarios').then(r => setHorarios(r.data));
    api.get('/dias-semana').then(r => setDias(r.data));


  }, []);

const resolveAnoCurriculo = async () => {
  const anoRes = await api.post('/anos/get-or-create', {
    descricao: anoInput
  });

  const curriculoRes = await api.post('/curriculos/get-or-create', {
    descricao: curriculoInput
  });

  return {
    ano_id: anoRes.data.id,
    curriculo_id: curriculoRes.data.id
  };
};


  // ===== DISCIPLINAS POR CURSO =====
useEffect(() => {
  if (!contexto.curso_id) return;

  setDisciplinasLoaded(false);

  api
    .get(`/cursos/${contexto.curso_id}/disciplinas-professores`)
    .then(r => {
      setDisciplinas(r.data);
      setDisciplinasLoaded(true);
    });
}, [contexto.curso_id]);


  // ===== CARREGAR GRADE EXISTENTE =====
useEffect(() => {
  const ready =
    contexto.curso_id &&
    contexto.semestre_id &&
    contexto.coordenador_id &&
    anoInput.length === 6 &&
    curriculoInput.length === 4 &&
    disciplinasLoaded;
    console.log(import.meta.env.VITE_API_URL);

  if (!ready) return;

  (async () => {
    const { ano_id, curriculo_id } = await resolveAnoCurriculo();

    const res = await api.get('/grade-horaria', {
      params: {
        curso_id: contexto.curso_id,
        semestre_id: contexto.semestre_id,
        ano_id,
        curriculo_id
      }
    });

    setGradeDraft(
      res.data.map(g => ({
        horario_id: g.horario_id,
        dia_semana_id: g.dia_semana_id,
        disciplina_id: g.disciplina_id,
        professor_id: g.professor_id
      }))
    );
  })();
    }, [
      contexto,
      anoInput,
      curriculoInput,
      disciplinasLoaded
    ]);


  // ===== ATUALIZAR SLOT (LOCAL) =====
const updateSlot = ({
  horario_id,
  dia_semana_id,
  disciplina_id,
  professor_id
}) => {
  setGradeDraft(prev => {
    const copy = [...prev];

    const idx = copy.findIndex(
      s =>
        s.horario_id === horario_id &&
        s.dia_semana_id === dia_semana_id
    );

    if (idx >= 0) {
      copy[idx] = {
        ...copy[idx],
        disciplina_id,
        professor_id
      };
    } else {
      copy.push({
        horario_id,
        dia_semana_id,
        disciplina_id,
        professor_id
      });
    }

    return copy;
  });
};


  // ===== SALVAR GRADE =====
  const saveGrade = async () => {

      // 🔒 validação do ano letivo
    if (!/^\d{4}\/[12]$/.test(anoInput)) {
      message.error('Ano letivo inválido (AAAA/1 ou AAAA/2)');
      return;
    }

    // 🔒 validação do currículo
    if (!/^\d{4}$/.test(curriculoInput)) {
      message.error('Currículo inválido (AAAA)');
      return;
    }
    try {
      const anoRes = await api.post('/anos/get-or-create', {
        descricao: anoInput
      });

      const curriculoRes = await api.post('/curriculos/get-or-create', {
        descricao: curriculoInput
      });

      await api.post('/grade-horaria/save', {
        
        contexto: {
          curso_id: contexto.curso_id,
          coordenador_id: contexto.coordenador_id,
          semestre_id: contexto.semestre_id,
          ano_id: anoRes.data.id,
          curriculo_id: curriculoRes.data.id
        },
        slots: gradeDraft
      });
      console.log('GRADE A ENVIAR:', gradeDraft);
      message.success('Grade salva com sucesso');
    } catch {
      message.error('Erro ao salvar a grade');
    }
  };

const buildValue = (disciplina_id, professor_id) =>
  disciplina_id && professor_id
    ? `${disciplina_id}-${professor_id}`
    : undefined;



  // ===== TABELA =====
  const columns = [
    {
      title: 'Horário',
      render: r => r.horario
    },
    ...dias.map(d => ({
      title: d.descricao,
      dataIndex: `dia_${d.id}`,
      render: (value, record) => (
        <Select
          showSearch
          allowClear
          optionFilterProp="label"
          style={{ width: 260 }}
          dropdownStyle={{ maxHeight: 260 }}
          value={value}
          onChange={newValue => {
            if (!newValue) {
              updateSlot({
                horario_id: record.horario_id,
                dia_semana_id: d.id,
                disciplina_id: null,
                professor_id: null
              });
              return;
            }

            const [disciplina_id, professor_id] = newValue
              .split('-')
              .map(Number);

            updateSlot({
              horario_id: record.horario_id,
              dia_semana_id: d.id,
              disciplina_id,
              professor_id
            });
          }}
          options={disciplinas.map(opt => ({
            value: `${opt.disciplina_id}-${opt.professor_id}`,
            label: (
              <div style={{ whiteSpace: 'normal', lineHeight: 1.2 }}>
                <strong>{opt.disciplina_nome}</strong>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {opt.professor_nome}
                </div>
              </div>
            )
          }))}
        />
      )
    }))

  ];

const dataSource = horarios.map(h => {
  const row = {
    key: h.id,
    horario: h.descricao,
    horario_id: h.id
  };

  dias.forEach(d => {
    const cell = gradeDraft.find(
      g =>
        g.horario_id === h.id &&
        g.dia_semana_id === d.id
    );

    row[`dia_${d.id}`] = cell
      ? `${cell.disciplina_id}-${cell.professor_id}`
      : undefined;
  });

  return row;
});


  return (
    <AppLayout>
      <Title level={4}>Grade Horária</Title>

      {/* FORMULÁRIO SUPERIOR */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <label>Curso</label>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              onChange={v => setContexto(c => ({ ...c, curso_id: v }))}
              options={cursos.map(c => ({
                value: c.id,
                label: c.nome
              }))}
            />
          </Col>

          <Col span={6}>
            <label>Coordenador</label>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: '100%' }}
              onChange={v =>
                setContexto(c => ({ ...c, coordenador_id: v }))
              }
              options={coordenadores.map(p => ({
                value: p.id,
                label: p.nome
              }))}
            />
          </Col>

          <Col span={4}>
            <label>Ano</label>
            <Input
            placeholder="Ex: 2026/1"
            maxLength={6}
            value={anoInput}
            onChange={e => setAnoInput(e.target.value)}
          />

          </Col>

          <Col span={4}>
            <label>Semestre</label>
            <Select
              style={{ width: '100%' }}
              onChange={v =>
                setContexto(c => ({ ...c, semestre_id: v }))
              }
              options={semestres.map(s => ({
                value: s.id,
                label: s.descricao
              }))}
            />
          </Col>

          <Col span={4}>
            <label>Currículo</label>
            <Input
              placeholder="AAAA"
              maxLength={4}
              value={curriculoInput}
              onChange={e =>
                setCurriculoInput(e.target.value.replace(/\D/g, ''))
              }
            />
          </Col>
        </Row>
      </Card>

      {/* TABELA */}
      <Card
        extra={
          <Button
            type="primary"
            size="large"
            onClick={saveGrade}
            disabled={
              !contexto.curso_id ||
              !contexto.coordenador_id ||
              !contexto.semestre_id ||
              anoInput.length !== 6 ||
              curriculoInput.length !== 4
            }
          >
            Salvar Grade
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
        />
        <Button
          type="default"
          size="large"
          onClick={async () => {
            // validações
            if (!/^\d{4}\/[12]$/.test(anoInput)) {
              message.error('Ano letivo inválido (AAAA/1 ou AAAA/2)');
              return;
            }

            if (!/^\d{4}$/.test(curriculoInput)) {
              message.error('Currículo inválido (AAAA)');
              return;
            }

            // resolve ids
            const anoRes = await api.post('/anos/get-or-create', {
              descricao: anoInput
            });

            const curriculoRes = await api.post('/curriculos/get-or-create', {
              descricao: curriculoInput
            });

            const params = new URLSearchParams({
              curso_id: contexto.curso_id,
              ano_id: anoRes.data.id,
              curriculo_id: curriculoRes.data.id
            });

            window.open(
              `${import.meta.env.VITE_API_URL}/relatorios/grade-horaria/pdf?${params}`,
              '_blank'
            );
          }}
          disabled={
            !contexto.curso_id ||
            !contexto.coordenador_id ||
            !contexto.semestre_id ||
            !anoInput ||
            !curriculoInput
          }
        >
          Gerar PDF
        </Button>


      </Card>
    </AppLayout>
  );
}
