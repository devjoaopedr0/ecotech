import { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { LeafIcon } from '../../components/icons';
import type { Cultura } from '../../types';

/** Parâmetros compartilhados por todas as plantas da mesma cultura. Os limites de umidade ficam em "Editar planta". */
export default function CulturaCard({ cultura, onSalvar }: { cultura: Cultura; onSalvar: (dados: Partial<Cultura>) => void }) {
  const [f, setF] = useState(cultura);
  const [erro, setErro] = useState('');
  const num = (k: keyof Cultura) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: Number(e.target.value) }));

  const salvar = () => {
    if (f.temperaturaMin >= f.temperaturaMax || f.luminosidadeMin >= f.luminosidadeMax) {
      setErro('O valor mínimo deve ser menor que o máximo.');
      return;
    }
    if (f.irrigacoesPorDia <= 0 || f.cicloDias <= 0) {
      setErro('Frequência e ciclo devem ser maiores que zero.');
      return;
    }
    setErro('');
    onSalvar(f);
  };

  return (
    <Card title={`Parâmetros da cultura · ${cultura.nome}`} icon={<LeafIcon width={18} height={18} />}>
      <div className="edit-plant-form">
        <div className="range-fields">
          <span className="range-label">Temperatura ideal (°C)</span>
          <div className="range-inputs">
            <input type="number" aria-label="Temperatura mínima" value={f.temperaturaMin} onChange={num('temperaturaMin')} />
            <span>-</span>
            <input type="number" aria-label="Temperatura máxima" value={f.temperaturaMax} onChange={num('temperaturaMax')} />
          </div>
        </div>
        <div className="range-fields">
          <span className="range-label">Luminosidade ideal (lx)</span>
          <div className="range-inputs">
            <input type="number" step={1000} aria-label="Luminosidade mínima" value={f.luminosidadeMin} onChange={num('luminosidadeMin')} />
            <span>-</span>
            <input type="number" step={1000} aria-label="Luminosidade máxima" value={f.luminosidadeMax} onChange={num('luminosidadeMax')} />
          </div>
        </div>
        <div className="range-fields">
          <span className="range-label">Irrigações por dia (recomendado)</span>
          <div className="range-inputs">
            <input type="number" step={0.5} min={0.5} aria-label="Irrigações por dia" value={f.irrigacoesPorDia} onChange={num('irrigacoesPorDia')} />
          </div>
        </div>
        <div className="range-fields">
          <span className="range-label">Ciclo de cultivo (dias)</span>
          <div className="range-inputs">
            <input type="number" min={1} aria-label="Ciclo de cultivo" value={f.cicloDias} onChange={num('cicloDias')} />
          </div>
        </div>
        {erro && <p className="login-error">{erro}</p>}
        <Button type="button" variant="primary" fullWidth onClick={salvar}>
          Salvar parâmetros
        </Button>
        <small className="api-hint">Vale para todas as plantas de {cultura.nome}.</small>
      </div>
    </Card>
  );
}
