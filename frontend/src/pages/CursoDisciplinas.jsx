import { useEffect, useState } from "react";
import { Card, Transfer, Button, message, Spin, Breadcrumb, Badge, Space, Select } from "antd";
import { Link, useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

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

  // Carrega os dados iniciais (Listas de opções)
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [cursoRes, allDisc, semestresRes, curriculosRes] = await Promise.all([
        api.get(`/cursos/${id}`),
        api.get("/disciplinas"),
        api.get("/semestres"), 
        api.get("/curriculos"), 
      ]);

      setCurso(cursoRes.data);
      setSemestres(semestresRes.data);
      setCurriculos(curriculosRes.data);

      setDisciplinas(
        allDisc.data.map((d) => ({
          key: d.id.toString(),
          title: `${d.codigo || ""} - ${d.nome || "Sem nome"}`,
        }))
      );
    } catch (error) {
      console.error(error);
      message.error("Erro ao carregar dados iniciais");
    } finally {
      setLoading(false);
    }
  };

  // Busca as disciplinas atreladas sempre que Semestre ou Currículo mudarem
  const fetchDisciplinasDoSemestre = async () => {
    if (!semestreId || !curriculoId) {
      setTargetKeys([]); // Limpa o lado direito se não tiver semestre/currículo selecionado
      return;
    }

    try {
      setLoadingTransfer(true);
      const response = await api.get(`/cursos/${id}/disciplinas`, {
        params: { semestre_id: semestreId, curriculo_id: curriculoId }
      });
      
      // Joga para o lado direito apenas as disciplinas deste semestre específico
      setTargetKeys(response.data.map((d) => d.id.toString()));
    } catch (error) {
      console.error(error);
      message.error("Erro ao buscar disciplinas deste semestre");
    } finally {
      setLoadingTransfer(false);
    }
  };

  const save = async () => {
    if (!semestreId || !curriculoId) {
      return message.warning("Selecione o Currículo e o Semestre antes de salvar!");
    }

    try {
      // Envia apenas o array de IDs (números), junto com o semestre/currículo por fora
      await api.post(`/cursos/${id}/disciplinas`, {
        semestre_id: semestreId,
        curriculo_id: curriculoId,
        disciplinas: targetKeys.map(Number),
      });

      message.success("Disciplinas do semestre salvas com sucesso!");
    } catch {
      message.error("Erro ao salvar vínculos");
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [id]);

  // Dispara a busca automática quando usuário trocar o Select
  useEffect(() => {
    fetchDisciplinasDoSemestre();
  }, [semestreId, curriculoId]);

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <Breadcrumb>
          <Breadcrumb.Item><Link to="/academico/cursos">Cursos</Link></Breadcrumb.Item>
          <Breadcrumb.Item>Disciplinas</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card
        style={{ borderRadius: 12, boxShadow: "0 3px 10px rgba(0,0,0,0.06)" }}
        title={<span style={{ fontSize: 18, fontWeight: 600, color: "#093e5e" }}>📚 Grade: {curso?.nome || "..."}</span>}
        extra={
          <Space size={12}>
            <Badge count={targetKeys.length} showZero style={{ backgroundColor: "#093e5e" }} />
            <Button onClick={() => navigate("/academico/cursos")}>Voltar</Button>
            <Button type="primary" onClick={save}>Salvar Semestre</Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            
            <Space size="large" style={{ marginBottom: 24, width: "100%", maxWidth: 1020, justifyContent: "flex-start" }}>
              <div>
                <span style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Currículo:</span>
                <Select placeholder="Selecione..." style={{ width: 200 }} value={curriculoId} onChange={setCurriculoId}>
                  {curriculos.map((c) => <Select.Option key={c.id} value={c.id}>{c.descricao || c.nome}</Select.Option>)}
                </Select>
              </div>
              <div>
                <span style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Semestre:</span>
                <Select placeholder="Selecione..." style={{ width: 200 }} value={semestreId} onChange={setSemestreId}>
                  {semestres.map((s) => <Select.Option key={s.id} value={s.id}>{s.descricao || s.nome}</Select.Option>)}
                </Select>
              </div>
            </Space>

            <Spin spinning={loadingTransfer} tip="Carregando semestre...">
              <Transfer
                dataSource={disciplinas}
                targetKeys={targetKeys}
                onChange={setTargetKeys}
                showSearch
                filterOption={(input, item) => item.title?.toLowerCase().includes(input.toLowerCase())}
                locale={{ searchPlaceholder: "Buscar disciplina", notFoundContent: "Nenhum resultado" }}
                operations={["Adicionar →", "← Remover"]}
                render={(item) => <div style={{ padding: "4px", fontWeight: 500 }}>{item.title}</div>}
                listStyle={{ width: "42%", minWidth: 320, maxWidth: 1020, height: 550, borderRadius: 10 }}
                style={{ width: "100%", maxWidth: 1500 }}
              />
            </Spin>
          </div>
        )}
      </Card>
    </AppLayout>
  );
}