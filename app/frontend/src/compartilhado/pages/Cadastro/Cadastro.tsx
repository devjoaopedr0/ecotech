import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/Input';
import {
  ArrowRightIcon,
  BellIcon,
  CheckIcon,
  ChevronLeftIcon,
  DropletIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  UserCircleIcon,
  WifiIcon,
} from '../../components/icons';
import type { CadastroForm, NivelDashboard } from '../../types';
import { ROTAS } from '../../../routes/paths';
import { ecotechApi, ApiError } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { ROTA_INICIAL, ROTULO_NIVEL, salvarNivel } from '../../utils/nivel';
import {
  CAMPOS_DADOS,
  CAMPOS_NIVEL,
  validarCadastro,
  temErros,
  type CampoCadastro,
  type ErrosCadastro,
} from './cadastroValidation';
import { NIVEIS_CADASTRO } from './niveisCadastro';
import PreviewNivel from './PreviewNivel';
import '../Login/Login.css';
import './Cadastro.css';

type Etapa = 1 | 2 | 3 | 4;

const ETAPAS: { numero: Etapa; rotulo: string }[] = [
  { numero: 1, rotulo: 'Boas-vindas' },
  { numero: 2, rotulo: 'Dados pessoais' },
  { numero: 3, rotulo: 'Nível de visualização' },
  { numero: 4, rotulo: 'Concluído' },
];

const FORM_INICIAL: CadastroForm = {
  nome: '',
  email: '',
  usuario: '',
  senha: '',
  confirmarSenha: '',
  nivel: '',
};

/* ------------------------------------------------------------------ peças visuais */

function LogoEcotech({ tamanho = 44 }: { tamanho?: number }) {
  const gradId = useId();
  return (
    <div className="cad-logo">
      <svg width={tamanho} height={tamanho} viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M6 21c0-10 8-16 24-16 0 15-7 24-17 24-4 0-7-2-7-8Z" stroke={`url(#${gradId})`} strokeWidth="2.2" fill="none" />
        <path d="M11 30c4-6 9-12 17-17" stroke={`url(#${gradId})`} strokeWidth="2.2" strokeLinecap="round" />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="42" y2="42">
            <stop offset="0" stopColor="#22c55e" />
            <stop offset="1" stopColor="#2fb6f0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="cad-logo-texto">
        <span className="cad-logo-titulo">
          <span className="txt-green">eco</span>
          <span className="txt-blue">tech</span>
        </span>
        <span className="cad-logo-sub">SOLUTIONS</span>
      </div>
    </div>
  );
}

function Progresso({ etapa }: { etapa: Etapa }) {
  return (
    <ol className="cad-progresso" aria-label={`Etapa ${etapa} de ${ETAPAS.length}`}>
      {ETAPAS.map(({ numero, rotulo }) => {
        const estado = numero < etapa || etapa === 4 ? 'feita' : numero === etapa ? 'atual' : 'pendente';
        return (
          <li key={numero} className={`cad-passo cad-passo-${estado}`} aria-current={estado === 'atual' ? 'step' : undefined}>
            <span className="cad-passo-marca" aria-hidden="true">
              {estado === 'feita' ? <CheckIcon width={12} height={12} /> : numero}
            </span>
            <span className="cad-passo-rotulo">{rotulo}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ página */

export default function Cadastro() {
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [form, setForm] = useState<CadastroForm>(FORM_INICIAL);
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [erroEnvio, setErroEnvio] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [nivelFinal, setNivelFinal] = useState<NivelDashboard | null>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // A cada etapa: volta ao topo e leva o foco ao título (leitores de tela anunciam a nova etapa).
  useEffect(() => {
    window.scrollTo({ top: 0 });
    tituloRef.current?.focus({ preventScroll: true });
  }, [etapa]);

  const atualizar = (campo: CampoCadastro, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
    if (erroEnvio) setErroEnvio('');
  };

  const avancarDados = (e: FormEvent) => {
    e.preventDefault();
    const novosErros = validarCadastro(form, CAMPOS_DADOS);
    setErros(novosErros);
    if (temErros(novosErros)) {
      const primeiro = CAMPOS_DADOS.find((c) => novosErros[c]);
      document.querySelector<HTMLInputElement>(`[name="${primeiro}"]`)?.focus();
      return;
    }
    setEtapa(3);
  };

  const concluir = async (e: FormEvent) => {
    e.preventDefault();
    const errosNivel = validarCadastro(form, CAMPOS_NIVEL);
    // Garante que os dados não ficaram inválidos (ex.: voltou e editou).
    const errosDados = validarCadastro(form, CAMPOS_DADOS);
    if (temErros(errosDados)) {
      setErros(errosDados);
      setEtapa(2);
      return;
    }
    setErros(errosNivel);
    if (temErros(errosNivel) || !form.nivel) return;

    const nivel = form.nivel;
    setEnviando(true);
    setErroEnvio('');
    try {
      const conta = await ecotechApi.cadastrarUsuario({
        nome: form.nome.trim(),
        email: form.email.trim(),
        usuario: form.usuario.trim(),
        senha: form.senha,
        nivel,
      });
      // O nível fica salvo na conta e é ele que o login usa para abrir a dashboard certa.
      salvarNivel(conta.usuario, conta.nivel);
      if (!login(conta.usuario, form.senha)) throw new ApiError(0, 'Falha ao entrar na conta criada.');
      setNivelFinal(conta.nivel);
      setForm((f) => ({ ...f, senha: '', confirmarSenha: '' }));
      setEtapa(4);
    } catch (err) {
      const detalhe = err instanceof ApiError ? (err.detalhe as { campo?: string; mensagem?: string } | undefined) : undefined;
      if (err instanceof ApiError && err.status === 409 && (detalhe?.campo === 'usuario' || detalhe?.campo === 'email')) {
        // Conflito em um dado pessoal: volta para a etapa 2 com o erro no campo.
        setErros({ [detalhe.campo]: detalhe.mensagem ?? 'Já está em uso.' });
        setEtapa(2);
      } else if (err instanceof ApiError && err.status === 0) {
        setErroEnvio('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      } else if (err instanceof ApiError && err.status === 400) {
        setErroEnvio(detalhe?.mensagem ?? 'Alguns dados não foram aceitos pelo servidor. Revise e tente novamente.');
      } else {
        setErroEnvio('Não foi possível concluir o cadastro agora. Tente novamente em instantes.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const olho = (
    <button
      type="button"
      className="login-eye-btn"
      onClick={() => setMostrarSenha((v) => !v)}
      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
    >
      {mostrarSenha ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
    </button>
  );

  return (
    <div className={`login-page cad-page cad-etapa-${etapa}`}>
      <div className="login-bg-line-1" aria-hidden="true" />
      <div className="login-bg-line-2" aria-hidden="true" />

      <div className="cad-shell">
        <header className="cad-topo">
          <LogoEcotech tamanho={38} />
          {etapa === 1 ? <span className="cad-contador">1/4</span> : <Progresso etapa={etapa} />}
        </header>

        {/* ---------------------------------------------------------- 1. Boas-vindas */}
        {etapa === 1 && (
          <section className="cad-card cad-boasvindas">
            <div className="cad-boasvindas-texto">
              <h1 ref={tituloRef} tabIndex={-1} className="cad-titulo cad-titulo-grande">
                Bem-vindo à <br />
                <span className="txt-green">eco</span>
                <span className="txt-blue">tech</span> Solutions!
              </h1>
              <p className="cad-texto">
                Crie sua conta em poucos passos e comece a acompanhar a umidade do solo e a irrigação da sua horta,
                com menos desperdício de água.
              </p>
              <ul className="cad-destaques">
                <li>
                  <span><WifiIcon width={16} height={16} /></span>
                  Monitoramento da umidade por sensores
                </li>
                <li>
                  <span><DropletIcon width={16} height={16} /></span>
                  Irrigação controlada planta a planta
                </li>
                <li>
                  <span><BellIcon width={16} height={16} /></span>
                  Alertas quando uma planta precisa de você
                </li>
              </ul>
              <div className="cad-acoes cad-acoes-inicio">
                <button type="button" className="login-submit cad-btn-principal" onClick={() => setEtapa(2)}>
                  Começar <ArrowRightIcon width={18} height={18} />
                </button>
                <p className="cad-rodape">
                  Já tem uma conta? <Link to={ROTAS.login}>Fazer login</Link>
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ---------------------------------------------------------- 2. Dados pessoais */}
        {etapa === 2 && (
          <form className="cad-card cad-dados" onSubmit={avancarDados} noValidate>
            <div className="cad-cabecalho">
              <h1 ref={tituloRef} tabIndex={-1} className="cad-titulo">
                Vamos começar pelos seus <span className="txt-green">dados pessoais</span>
              </h1>
              <p className="cad-texto">Essas informações identificam sua conta e são usadas para entrar no sistema.</p>
            </div>

            <div className="cad-campos">
              <Input
                label="Nome completo"
                name="nome"
                icon={<UserCircleIcon width={18} height={18} />}
                placeholder="Digite seu nome completo"
                value={form.nome}
                onChange={(e) => atualizar('nome', e.target.value)}
                autoComplete="name"
                error={erros.nome}
              />
              <Input
                label="E-mail"
                name="email"
                icon={<MailIcon width={18} height={18} />}
                placeholder="exemplo@dominio.com"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => atualizar('email', e.target.value)}
                autoComplete="email"
                error={erros.email}
              />
              <Input
                label="Usuário"
                name="usuario"
                icon={<UserCircleIcon width={18} height={18} />}
                placeholder="Como você vai entrar no sistema"
                value={form.usuario}
                onChange={(e) => atualizar('usuario', e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                error={erros.usuario}
              />
              <div className="cad-campos-duplos">
                <Input
                  label="Senha"
                  name="senha"
                  icon={<LockIcon width={18} height={18} />}
                  placeholder="Mínimo de 6 caracteres"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={form.senha}
                  onChange={(e) => atualizar('senha', e.target.value)}
                  autoComplete="new-password"
                  trailing={olho}
                  error={erros.senha}
                />
                <Input
                  label="Confirmar senha"
                  name="confirmarSenha"
                  icon={<LockIcon width={18} height={18} />}
                  placeholder="Repita a senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  value={form.confirmarSenha}
                  onChange={(e) => atualizar('confirmarSenha', e.target.value)}
                  autoComplete="new-password"
                  error={erros.confirmarSenha}
                />
              </div>
            </div>

            <div className="cad-acoes">
              <button type="button" className="cad-voltar" onClick={() => setEtapa(1)}>
                <ChevronLeftIcon width={16} height={16} /> Voltar
              </button>
              <button type="submit" className="login-submit cad-btn-principal">
                Próximo <ArrowRightIcon width={18} height={18} />
              </button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------------- 3. Nível de visualização */}
        {etapa === 3 && (
          <form className="cad-niveis" onSubmit={concluir} noValidate>
            <div className="cad-cabecalho cad-cabecalho-centro">
              <h1 ref={tituloRef} tabIndex={-1} className="cad-titulo cad-titulo-grande">
                Como você prefere <span className="txt-green">visualizar</span> os dados da sua horta?
              </h1>
              <p className="cad-texto">
                Escolha o nível de painel que mais combina com você. Ele define a dashboard que você verá ao entrar, e
                pode ser trocado depois em Configurações.
              </p>
            </div>

            <fieldset className="cad-niveis-grade" aria-invalid={erros.nivel ? true : undefined}>
              <legend className="sr-only">Nível de visualização</legend>
              {NIVEIS_CADASTRO.map(({ nivel, numero, titulo, descricao, recursos }) => {
                const selecionado = form.nivel === nivel;
                return (
                  <label key={nivel} className={`cad-nivel ${selecionado ? 'cad-nivel-ativo' : ''}`}>
                    <input
                      type="radio"
                      name="nivel"
                      value={nivel}
                      checked={selecionado}
                      onChange={() => atualizar('nivel', nivel)}
                    />
                    <PreviewNivel nivel={nivel} />
                    <span className="cad-nivel-cabeca">
                      <span className="cad-nivel-radio" aria-hidden="true" />
                      <span className="cad-nivel-numero">Nível {numero}</span>
                    </span>
                    <span className="cad-nivel-titulo">{titulo}</span>
                    <span className="cad-nivel-desc">{descricao}</span>
                    <span className="cad-nivel-recursos">
                      {recursos.map((r) => (
                        <span key={r}>
                          <CheckIcon width={14} height={14} /> {r}
                        </span>
                      ))}
                    </span>
                  </label>
                );
              })}
            </fieldset>

            {erros.nivel && <p className="input-error cad-msg-centro">{erros.nivel}</p>}
            {erroEnvio && (
              <p className="login-error cad-msg-centro" role="alert">
                {erroEnvio}
              </p>
            )}

            <div className="cad-acoes cad-acoes-niveis">
              <button type="button" className="cad-voltar" onClick={() => setEtapa(2)} disabled={enviando}>
                <ChevronLeftIcon width={16} height={16} /> Voltar
              </button>
              <button
                type="submit"
                className="login-submit cad-btn-principal cad-btn-concluir"
                disabled={!form.nivel || enviando}
                aria-describedby={!form.nivel ? 'cad-dica-nivel' : undefined}
              >
                {!form.nivel && <LockIcon width={17} height={17} />}
                {enviando ? 'Criando sua conta…' : 'Concluir cadastro'}
                {form.nivel && !enviando && <ArrowRightIcon width={18} height={18} />}
              </button>
            </div>
            {!form.nivel && (
              <p id="cad-dica-nivel" className="cad-dica">
                Selecione um nível para concluir.
              </p>
            )}
          </form>
        )}

        {/* ---------------------------------------------------------- 4. Concluído */}
        {etapa === 4 && nivelFinal && (
          <section className="cad-card cad-concluido">
            <LogoEcotech tamanho={52} />
            <span className="cad-concluido-icone" aria-hidden="true">
              <CheckIcon width={40} height={40} />
            </span>
            <h1 ref={tituloRef} tabIndex={-1} className="cad-titulo cad-titulo-grande">
              Cadastro concluído!
            </h1>
            <p className="cad-texto">
              Bem-vindo, <strong>{form.nome.trim().split(/\s+/)[0]}</strong>! Sua conta foi criada e você já está conectado.
              Seu painel <strong>{ROTULO_NIVEL[nivelFinal]}</strong> está pronto para acompanhar sua horta.
            </p>
            <button
              type="button"
              className="login-submit cad-btn-principal cad-btn-largo"
              onClick={() => navigate(ROTA_INICIAL[nivelFinal], { replace: true })}
            >
              Acessar meu painel {ROTULO_NIVEL[nivelFinal]} <ArrowRightIcon width={18} height={18} />
            </button>
            <p className="cad-dica">Você pode trocar o nível quando quiser em Configurações.</p>
          </section>
        )}
      </div>
    </div>
  );
}
