import { useEffect, useState } from "react";
import {
  Card,
  Transfer,
  Button,
  message,
  Spin,
  Breadcrumb,
  Badge,
  Space,
} from "antd";

import { Link, useParams, useNavigate } from "react-router-dom";

import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

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
        api.get("/disciplinas"),
        api.get(`/cursos/${id}/disciplinas`),
      ]);

      setCurso(cursoRes.data);

      setDisciplinas(
        all.data.map((d) => {
          const codigo = d.codigo || d.cod_disciplina || "";

          return {
            key: d.id.toString(),
            title: `${codigo} - ${d.nome || "Sem nome"}`,
          };
        }),
      );

      setTargetKeys(vinculadas.data.map((d) => d.id.toString()));
    } catch (error) {
      console.error(error);
      message.error("Erro ao carregar disciplinas");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    try {
      await api.post(`/cursos/${id}/disciplinas`, {
        disciplinas: targetKeys.map(Number),
      });

      message.success("Disciplinas salvas com sucesso");
      navigate("/academico/cursos");
    } catch {
      message.error("Erro ao salvar");
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return (
    <AppLayout>
      {/* BREADCRUMB */}
      <div style={{ marginBottom: 20 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link to="/academico/cursos">Cursos</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Disciplinas</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* CARD */}
      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
        }}
        title={
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#093e5e",
            }}
          >
            📚 Disciplinas do Curso: {curso?.nome || "..."}
          </span>
        }
        extra={
          <Space size={12}>
            <Badge
              count={targetKeys.length}
              showZero
              style={{ backgroundColor: "#093e5e" }}
            />

            <Button onClick={() => navigate("/academico/cursos")}>
              Voltar
            </Button>

            <Button type="primary" onClick={save}>
              Salvar
            </Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Transfer
              dataSource={disciplinas}
              targetKeys={targetKeys}
              onChange={setTargetKeys}
              showSearch
              filterOption={(input, item) =>
                item.title?.toLowerCase().includes(input.toLowerCase())
              }
              locale={{
                itemUnit: "disciplina",
                itemsUnit: "disciplinas",
                searchPlaceholder: "Buscar código ou disciplina",
                notFoundContent: "Nenhum resultado encontrado",
              }}
              operations={["Adicionar →", "← Remover"]}
              render={(item) => (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    fontWeight: 500,
                  }}
                >
                  {item.title}
                </div>
              )}
              listStyle={{
                width: "42%", 
                minWidth: 320, 
                maxWidth: 1020, 
                height: 550, 
                borderRadius: 10,
              }}
              style={{
                width: "100%",
                maxWidth: 1500,
              }}
            />
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
