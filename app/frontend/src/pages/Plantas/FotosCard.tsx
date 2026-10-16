import { useRef } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { CameraIcon, TrashIcon } from '../../components/icons';
import type { FotoPlanta } from '../../types';
import { formatarData } from '../../utils/format';

const DIA = 24 * 60 * 60 * 1000;
const MAX_LADO = 640;

/** Reduz a imagem antes de guardar (fotos ficam só em memória enquanto não houver backend). */
function reduzir(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, MAX_LADO / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Imagem inválida'));
    };
    img.src = url;
  });
}

export default function FotosCard({
  nome,
  plantioMs,
  fotos,
  onAdicionar,
  onRemover,
}: {
  nome: string;
  plantioMs: number | null;
  fotos: FotoPlanta[];
  onAdicionar: (src: string) => void;
  onRemover: (id: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  const escolher = async (e: React.ChangeEvent<HTMLInputElement>) => {
    for (const arquivo of Array.from(e.target.files ?? [])) {
      if (arquivo.type.startsWith('image/')) onAdicionar(await reduzir(arquivo).catch(() => ''));
    }
    e.target.value = '';
  };

  return (
    <Card
      title={`Histórico visual · ${nome}`}
      icon={<CameraIcon width={18} height={18} />}
      action={
        <Button type="button" variant="secondary" icon={<CameraIcon width={15} height={15} />} onClick={() => input.current?.click()}>
          Adicionar foto
        </Button>
      }
    >
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={escolher} aria-label="Adicionar foto" />
      {fotos.length === 0 ? (
        <p className="foto-empty">Nenhuma foto ainda. Adicione fotos ao longo do tempo para acompanhar o desenvolvimento.</p>
      ) : (
        <div className="foto-grid">
          {fotos.map((f) => (
            <figure key={f.id} className="foto-item">
              <img src={f.src} alt={`${nome} em ${formatarData(f.ts)}`} />
              <figcaption>
                <span>
                  {plantioMs !== null ? `Dia ${Math.max(1, Math.floor((f.ts - plantioMs) / DIA) + 1)}` : formatarData(f.ts)}
                  <small> · {formatarData(f.ts)}</small>
                </span>
                <button type="button" className="foto-remove" aria-label="Remover foto" onClick={() => onRemover(f.id)}>
                  <TrashIcon width={14} height={14} />
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      <small className="api-hint">As fotos ficam salvas apenas nesta sessão até existir um backend.</small>
    </Card>
  );
}
