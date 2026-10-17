import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/Input';
import { UserCircleIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon, CheckIcon } from '../../components/icons';
import type { CadastroForm } from '../../types';
import { ROTAS } from '../../routes/paths';
import { OPCOES_CONHECIMENTO, validarCadastro, temErros, type CampoCadastro, type ErrosCadastro } from './cadastroValidation';
import '../Login/Login.css';
import './Cadastro.css';

const FORM_INICIAL: CadastroForm = {
  nome: '',
  email: '',
  usuario: '',
  senha: '',
  confirmarSenha: '',
  nivelConhecimento: '',
};

export default function Cadastro() {
  const [form, setForm] = useState<CadastroForm>(FORM_INICIAL);
  const [erros, setErros] = useState<ErrosCadastro>({});
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const atualizar = (campo: CampoCadastro, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    // Limpa o erro do campo assim que o usuário mexe nele.
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const novosErros = validarCadastro(form);
    setErros(novosErros);
    if (temErros(novosErros)) return;

    setCarregando(true);
    setTimeout(() => {
      setCarregando(false);
      navigate(ROTAS.login, { replace: true, state: { cadastroRealizado: true } });
    }, 500);
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
    <div className="login-page cadastro-page">
      <div className="login-bg-line-1" aria-hidden="true" />
      <div className="login-bg-line-2" aria-hidden="true" />

      <form className="login-card cadastro-card" onSubmit={handleSubmit} noValidate>
        <div className="cadastro-header">
          <h1 className="cadastro-title">
            Criar conta na <span className="txt-green">eco</span>
            <span className="txt-blue">tech</span>
          </h1>
          <p className="cadastro-subtitle">Preencha seus dados e responda uma pergunta rápida.</p>
        </div>

        <div className="login-fields">
          <Input
            icon={<UserCircleIcon width={18} height={18} />}
            placeholder="Nome completo"
            value={form.nome}
            onChange={(e) => atualizar('nome', e.target.value)}
            autoComplete="name"
            error={erros.nome}
          />
          <Input
            icon={<MailIcon width={18} height={18} />}
            placeholder="E-mail"
            type="email"
            value={form.email}
            onChange={(e) => atualizar('email', e.target.value)}
            autoComplete="email"
            error={erros.email}
          />
          <Input
            icon={<UserCircleIcon width={18} height={18} />}
            placeholder="Usuário"
            value={form.usuario}
            onChange={(e) => atualizar('usuario', e.target.value)}
            autoComplete="username"
            error={erros.usuario}
          />
          <Input
            icon={<LockIcon width={18} height={18} />}
            placeholder="Senha"
            type={mostrarSenha ? 'text' : 'password'}
            value={form.senha}
            onChange={(e) => atualizar('senha', e.target.value)}
            autoComplete="new-password"
            trailing={olho}
            error={erros.senha}
          />
          <Input
            icon={<LockIcon width={18} height={18} />}
            placeholder="Confirmar senha"
            type={mostrarSenha ? 'text' : 'password'}
            value={form.confirmarSenha}
            onChange={(e) => atualizar('confirmarSenha', e.target.value)}
            autoComplete="new-password"
            error={erros.confirmarSenha}
          />
        </div>

        <fieldset className="cadastro-quiz" aria-invalid={erros.nivelConhecimento ? true : undefined}>
          <legend className="cadastro-quiz-pergunta">Qual é o seu nível de conhecimento em tecnologia?</legend>
          <div className="cadastro-quiz-opcoes">
            {OPCOES_CONHECIMENTO.map((opcao) => {
              const selecionada = form.nivelConhecimento === opcao.valor;
              return (
                <label key={opcao.valor} className={`cadastro-opcao ${selecionada ? 'cadastro-opcao-ativa' : ''}`}>
                  <input
                    type="radio"
                    name="nivelConhecimento"
                    value={opcao.valor}
                    checked={selecionada}
                    onChange={(e) => atualizar('nivelConhecimento', e.target.value)}
                  />
                  <span className="cadastro-opcao-check" aria-hidden="true">
                    {selecionada && <CheckIcon width={12} height={12} />}
                  </span>
                  <span className="cadastro-opcao-texto">
                    <span className="cadastro-opcao-titulo">{opcao.titulo}</span>
                    <span className="cadastro-opcao-desc">{opcao.descricao}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {erros.nivelConhecimento && <span className="input-error">{erros.nivelConhecimento}</span>}
        </fieldset>

        <button type="submit" className="login-submit" disabled={carregando}>
          {carregando ? 'Cadastrando…' : 'Cadastrar'}
          {!carregando && <ArrowRightIcon width={18} height={18} />}
        </button>

        <p className="cadastro-rodape">
          Já tem uma conta? <Link to={ROTAS.login}>Entrar</Link>
        </p>
      </form>
    </div>
  );
}
