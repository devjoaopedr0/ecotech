import { useMemo, useState, type FormEvent } from 'react';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Table from '../../components/Table';
import Input from '../../components/Input';
import StatusBadge from '../../components/StatusBadge';
import IconButton from '../../components/IconButton';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import {
  LeafIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DropletIcon,
  InfoBoxIcon,
  CalendarIcon,
  ClockIcon,
} from '../../components/icons';
import { usePlants, statusDaPlanta } from '../../context/PlantsContext';
import type { Plant } from '../../types';
import './Plantas.css';

const ITEMS_PER_PAGE = 8;

export default function Plantas({ openMenu }: { openMenu?: () => void }) {
  const { plantas, atualizarPlanta, removerPlanta } = usePlants();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [selecionadaId, setSelecionadaId] = useState<string>(plantas[0]?.id ?? '');
  const [excluirId, setExcluirId] = useState<string | null>(null);

  const [form, setForm] = useState({ nome: '', faixaMin: 0, faixaMax: 0 });

  const filtradas = useMemo(
    () => plantas.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase())),
    [plantas, busca]
  );

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITEMS_PER_PAGE));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const paginadas = filtradas.slice((paginaAtual - 1) * ITEMS_PER_PAGE, paginaAtual * ITEMS_PER_PAGE);

  const selecionada = plantas.find((p) => p.id === selecionadaId) || plantas[0];

  const abrirEdicao = (p: Plant) => {
    setSelecionadaId(p.id);
    setForm({ nome: p.nome, faixaMin: p.faixaMin, faixaMax: p.faixaMax });
  };

  const linhaSelecionada = (p: Plant) => {
    setSelecionadaId(p.id);
    setForm({ nome: p.nome, faixaMin: p.faixaMin, faixaMax: p.faixaMax });
  };

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    if (!selecionada) return;
    if (form.faixaMin >= form.faixaMax) {
      alert('A faixa mínima deve ser menor que a faixa máxima.');
      return;
    }
    atualizarPlanta(selecionada.id, {
      nome: form.nome.trim() || selecionada.nome,
      faixaMin: form.faixaMin,
      faixaMax: form.faixaMax,
    });
  };

  const cancelar = () => {
    if (!selecionada) return;
    setForm({ nome: selecionada.nome, faixaMin: selecionada.faixaMin, faixaMax: selecionada.faixaMax });
  };

  const confirmarExclusao = () => {
    if (!excluirId) return;
    removerPlanta(excluirId);
    if (excluirId === selecionadaId) {
      const restante = plantas.find((p) => p.id !== excluirId);
      setSelecionadaId(restante?.id ?? '');
    }
    setExcluirId(null);
  };

  const plantaParaExcluir = plantas.find((p) => p.id === excluirId);

  return (
    <>
      <Header icon={<LeafIcon width={21} height={21} />} title="Plantas" subtitle="Gerencie suas plantas e faixas de umidade" onOpenMenu={openMenu} />
      <div className="page-body">
        <div className="plantas-layout">
          <Card
            title="Lista de plantas"
            icon={<LeafIcon width={18} height={18} />}
            action={
              <div className="plantas-search">
                <Input
                  icon={<SearchIcon width={16} height={16} />}
                  placeholder="Buscar planta..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPagina(1);
                  }}
                />
              </div>
            }
            className="plantas-table-card"
          >
            <Table
              rowKey={(p) => p.id}
              rows={paginadas}
              emptyMessage="Nenhuma planta encontrada para essa busca."
              columns={[
                {
                  key: 'planta',
                  header: 'Planta',
                  render: (p) => (
                    <button className="plant-name-cell" onClick={() => linhaSelecionada(p)}>
                      <span className="plant-emoji">{p.emoji}</span>
                      {p.nome}
                    </button>
                  ),
                },
                { key: 'umidade', header: 'Umidade atual', render: (p) => `${p.umidadeAtual}%` },
                { key: 'faixa', header: 'Faixa ideal', render: (p) => `${p.faixaMin}% - ${p.faixaMax}%` },
                { key: 'status', header: 'Status', render: (p) => <StatusBadge status={statusDaPlanta(p)} /> },
                {
                  key: 'acoes',
                  header: 'Ações',
                  align: 'right',
                  render: (p) => (
                    <div className="row-actions">
                      <IconButton onClick={() => abrirEdicao(p)} aria-label={`Editar ${p.nome}`}>
                        <EditIcon width={15} height={15} />
                      </IconButton>
                      <IconButton variant="danger" onClick={() => setExcluirId(p.id)} aria-label={`Excluir ${p.nome}`}>
                        <TrashIcon width={15} height={15} />
                      </IconButton>
                    </div>
                  ),
                },
              ]}
            />

            <div className="plantas-pagination">
              <span>Mostrando {paginadas.length} de {filtradas.length} plantas</span>
              <div className="pagination-controls">
                <IconButton disabled={paginaAtual <= 1} onClick={() => setPagina((p) => Math.max(1, p - 1))} aria-label="Página anterior">
                  <ChevronLeftIcon width={15} height={15} />
                </IconButton>
                <span className="pagination-page">{paginaAtual}</span>
                <IconButton disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} aria-label="Próxima página">
                  <ChevronRightIcon width={15} height={15} />
                </IconButton>
              </div>
            </div>
          </Card>

          <div className="plantas-side">
            {selecionada && (
              <>
                <Card className="plant-preview-card">
                  <div className="plant-preview-avatar">{selecionada.emoji}</div>
                  <div className="plant-preview-info">
                    <strong>{selecionada.nome}</strong>
                    <StatusBadge status={statusDaPlanta(selecionada)} />
                    <div className="plant-preview-range">
                      <DropletIcon width={14} height={14} />
                      Faixa ideal de umidade
                      <strong>{selecionada.faixaMin}% - {selecionada.faixaMax}%</strong>
                    </div>
                  </div>
                </Card>

                <Card title="Editar planta" icon={<EditIcon width={18} height={18} />}>
                  <form className="edit-plant-form" onSubmit={salvar}>
                    <Input
                      label="Nome da planta"
                      value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    />
                    <div className="range-fields">
                      <span className="range-label">Faixa ideal de umidade</span>
                      <div className="range-inputs">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={form.faixaMin}
                          onChange={(e) => setForm((f) => ({ ...f, faixaMin: Number(e.target.value) }))}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={form.faixaMax}
                          onChange={(e) => setForm((f) => ({ ...f, faixaMax: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="edit-form-actions">
                      <Button type="button" variant="ghost" fullWidth onClick={cancelar}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary" fullWidth>
                        Salvar
                      </Button>
                    </div>
                  </form>
                </Card>

                <Card title="Informações adicionais" icon={<InfoBoxIcon width={18} height={18} />}>
                  <div className="info-grid info-grid-1col">
                    <div className="info-row"><span><CalendarIcon width={15} height={15} /> Data de cadastro</span><strong>{selecionada.dataCadastro}</strong></div>
                    <div className="info-row"><span><ClockIcon width={15} height={15} /> Última irrigação</span><strong>{selecionada.ultimaIrrigacao}</strong></div>
                    <div className="info-row"><span><LeafIcon width={15} height={15} /> Status da planta</span><StatusBadge status={statusDaPlanta(selecionada)} /></div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal open={!!excluirId} onClose={() => setExcluirId(null)} title="Excluir planta" width={380}>
        <p className="confirm-text">
          Tem certeza que deseja excluir <strong>{plantaParaExcluir?.nome}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div className="edit-form-actions">
          <Button variant="ghost" fullWidth onClick={() => setExcluirId(null)}>
            Cancelar
          </Button>
          <Button variant="danger" fullWidth onClick={confirmarExclusao}>
            Excluir
          </Button>
        </div>
      </Modal>
    </>
  );
}
