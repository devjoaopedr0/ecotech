import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROTAS } from '../../../routes/paths';
import { useAuth } from '../../context/AuthContext';
import { ROTA_INICIAL, nivelSalvo } from '../../utils/nivel';
import Input from '../../components/Input';
import { UserCircleIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon, DropletIcon, WifiIcon, BellIcon, AlertOctagonIcon, CheckCircleIcon } from '../../components/icons';
import './Login.css';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const cadastroRealizado = (useLocation().state as { cadastroRealizado?: boolean } | null)?.cadastroRealizado;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!usuario.trim() || !senha.trim()) {
      setErro('Preencha usuário e senha para continuar.');
      return;
    }
    setCarregando(true);
    setTimeout(() => {
      const ok = login(usuario, senha);
      setCarregando(false);
      if (ok) {
        navigate(ROTA_INICIAL[nivelSalvo(usuario)], { replace: true });
      } else {
        setErro('Usuário ou senha inválidos.');
      }
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-bg-leaf" aria-hidden="true">
        <svg width="420" height="620" viewBox="0 0 420 620" fill="none">
          <path d="M210 20c110 0 170 130 170 260S320 540 210 600C100 540 40 410 40 280S100 20 210 20Z" stroke="#1c3350" strokeWidth="2" fill="none" />
        </svg>
      </div>
      <div className="login-bg-line-1" aria-hidden="true" />
      <div className="login-bg-line-2" aria-hidden="true" />

      {/* Painel de marca (telas largas): o que o sistema faz, com uma prévia do tipo de informação do painel. */}
      <aside className="login-marca" aria-hidden="true">
        <span className="login-marca-eyebrow">Agricultura inteligente</span>
        <h2>Cada gota no lugar certo.</h2>
        <p>Sensores de umidade no solo, irrigação automática e alertas que explicam o que fazer — para hortas que crescem com menos água.</p>
        <div className="login-preview">
          <div className="login-preview-topo"><span>Horta Principal</span><small>agora</small></div>
          <div className="login-preview-linha login-preview-critico">
            <AlertOctagonIcon width={15} height={15} />
            <span>Alface · Canteiro 02</span>
            <strong>27%</strong>
          </div>
          <div className="login-preview-linha">
            <CheckCircleIcon width={15} height={15} />
            <span>Tomate · Canteiro 01</span>
            <strong>58%</strong>
          </div>
          <div className="login-preview-acao"><DropletIcon width={14} height={14} /> Irrigação recomendada: 4 min</div>
        </div>
        <ul className="login-pontos">
          <li><WifiIcon width={16} height={16} /> Leituras contínuas dos sensores</li>
          <li><DropletIcon width={16} height={16} /> Irrigação por planta, manual ou automática</li>
          <li><BellIcon width={16} height={16} /> Alertas com causa e recomendação</li>
        </ul>
      </aside>

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <svg width="70" height="70" viewBox="0 0 42 42" fill="none">
            <path d="M6 21c0-10 8-16 24-16 0 15-7 24-17 24-4 0-7-2-7-8Z" stroke="url(#lg1)" strokeWidth="2.2" fill="none" />
            <path d="M11 30c4-6 9-12 17-17" stroke="url(#lg1)" strokeWidth="2.2" strokeLinecap="round" />
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="42" y2="42">
                <stop offset="0" stopColor="#22c55e" />
                <stop offset="1" stopColor="#2fb6f0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="login-logo-text">
            <span className="login-logo-title">
              <span className="txt-green">eco</span>
              <span className="txt-blue">tech</span>
            </span>
            <span className="login-logo-sub">SOLUTIONS</span>
          </div>
        </div>

        <div className="login-titulo">
          <h1>Entrar</h1>
          <p>Acesse o painel da sua horta.</p>
        </div>

        <div className="login-fields">
          <Input
            icon={<UserCircleIcon width={18} height={18} />}
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
          />
          <Input
            icon={<LockIcon width={18} height={18} />}
            placeholder="Senha"
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            trailing={
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
              </button>
            }
          />
          <label className="login-checkbox">
            <input type="checkbox" checked={mostrarSenha} onChange={(e) => setMostrarSenha(e.target.checked)} />
            Mostrar senha
          </label>
        </div>

        {cadastroRealizado && !erro && <p className="login-success">Cadastro realizado! Entre com seu usuário e senha.</p>}
        {erro && <p className="login-error" role="alert">{erro}</p>}

        <button type="submit" className="login-submit" disabled={carregando}>
          {carregando ? 'Entrando…' : 'Entrar'}
          {!carregando && <ArrowRightIcon width={18} height={18} />}
        </button>

        <p className="login-rodape">
          Não tem uma conta? <Link to={ROTAS.cadastro}>Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
}
