import { useEffect, useState, type FormEvent } from 'react';
import { ROTAS } from '../../routes/paths';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import Button from '../../components/Button';
import {
  GearIcon,
  ThemeOffIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
  LockIcon,
  ChevronRightIcon,
  LogoutIcon,
  ShieldIcon,
  BellIcon,
  MailIcon,
  PhoneIcon,
  CheckIcon,
} from '../../components/icons';
import { ApiError, ecotechApi, type PreferenciasNotificacao } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Configuracoes.css';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'toggle-on' : ''}`}
      onClick={onChange}
    >
      <span className="toggle-knob" />
    </button>
  );
}

export default function Configuracoes({ openMenu }: { openMenu?: () => void }) {
  const { theme, setTheme } = useTheme();
  const { usuario, email, logout } = useAuth();
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  const [notificacoes, setNotificacoes] = useState<PreferenciasNotificacao>({ horta: true, email: false, sistema: true });
  const { horta: notifHorta, email: notifEmail, sistema: notifSistema } = notificacoes;

  useEffect(() => {
    let ativo = true;
    ecotechApi.obterNotificacoes().then((p) => ativo && setNotificacoes(p), () => undefined);
    return () => {
      ativo = false;
    };
  }, []);

  // Otimista: muda na hora e volta atrás se o backend recusar.
  const alternarNotificacao = (chave: keyof PreferenciasNotificacao) => {
    const anterior = notificacoes;
    const novo = !anterior[chave];
    setNotificacoes({ ...anterior, [chave]: novo });
    ecotechApi.salvarNotificacoes({ [chave]: novo }).then(setNotificacoes, () => setNotificacoes(anterior));
  };

  const [senhaModalAberta, setSenhaModalAberta] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaErro, setSenhaErro] = useState('');
  const [senhaSucesso, setSenhaSucesso] = useState(false);

  const salvarSenha = async (e: FormEvent) => {
    e.preventDefault();
    setSenhaErro('');
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setSenhaErro('Preencha todos os campos.');
      return;
    }
    // Mesma regra do backend (8 a 72 caracteres).
    if (novaSenha.length < 8) {
      setSenhaErro('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setSenhaErro('As senhas não coincidem.');
      return;
    }
    try {
      await ecotechApi.trocarSenha(senhaAtual, novaSenha);
    } catch (erro) {
      setSenhaErro(erro instanceof ApiError && erro.status === 401 ? 'Senha atual incorreta.' : erro instanceof Error ? erro.message : 'Não foi possível trocar a senha.');
      return;
    }
    setSenhaSucesso(true);
    setTimeout(() => {
      setSenhaModalAberta(false);
      setSenhaSucesso(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    }, 1200);
  };

  const sair = () => {
    logout();
    navigate(ROTAS.login, { replace: true });
  };

  return (
    <>
      <Header icon={<GearIcon width={21} height={21} />} title="Configurações" subtitle="Personalize sua experiência no sistema" onOpenMenu={openMenu} />
      <div className="page-body">
        <div className="config-row">
          <Card title="Aparência" icon={<ThemeOffIcon width={18} height={18} />}>
            <p className="config-hint">Escolha o tema do sistema</p>
            <div className="theme-options">
              <button
                className={`theme-option ${theme === 'dark' ? 'theme-option-active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                {theme === 'dark' && (
                  <span className="theme-check">
                    <CheckIcon width={13} height={13} />
                  </span>
                )}
                <MoonIcon width={22} height={22} />
                <strong>Tema escuro</strong>
                <span>Mais conforto para uso noturno.</span>
              </button>
              <button
                className={`theme-option ${theme === 'light' ? 'theme-option-active' : ''}`}
                onClick={() => setTheme('light')}
              >
                {theme === 'light' && (
                  <span className="theme-check">
                    <CheckIcon width={13} height={13} />
                  </span>
                )}
                <SunIcon width={22} height={22} />
                <strong>Tema claro</strong>
                <span>Ideal para ambientes bem iluminados.</span>
              </button>
            </div>
          </Card>

          <Card title="Perfil do usuário" icon={<UserCircleIcon width={18} height={18} />}>
            <p className="config-hint">Gerencie suas informações de acesso</p>
            <div className="profile-row">
              <div className="profile-avatar">
                <UserCircleIcon width={34} height={34} />
              </div>
              <div className="profile-fields">
                <div><span>Nome</span><strong>{usuario || 'Usuário'}</strong></div>
                <div><span>E-mail</span><strong>{email || '--'}</strong></div>
                <div><span>Nível de acesso</span><span className="access-pill">Usuário</span></div>
              </div>
            </div>
            <button className="settings-link-row" onClick={() => setSenhaModalAberta(true)}>
              <LockIcon width={18} height={18} />
              <span>
                <strong>Alterar senha</strong>
                <small>Atualize sua senha de acesso ao sistema</small>
              </span>
              <ChevronRightIcon width={16} height={16} />
            </button>
          </Card>
        </div>

        <div className="config-row config-row-3">
          <Card title="Sair do sistema" icon={<LogoutIcon width={18} height={18} />}>
            <p className="config-hint">Encerre sua sessão com segurança</p>
            <Button variant="danger" fullWidth icon={<LogoutIcon width={16} height={16} />} onClick={sair}>
              Sair
            </Button>
          </Card>

          <Card title="Área técnica" icon={<ShieldIcon width={18} height={18} />}>
            <p className="config-hint">Configurações avançadas (não visível para usuários comuns)</p>
            <Input
              icon={<LockIcon width={16} height={16} />}
              value={apiUrl ? '•'.repeat(Math.min(apiUrl.length, 24)) : '••••••••••••'}
              disabled
              placeholder="Endereço da API"
            />
            <small className="api-hint">Definido em VITE_API_URL (.env)</small>
          </Card>

          <Card title="Notificações" icon={<BellIcon width={18} height={18} />}>
            <p className="config-hint">Gerencie como deseja receber os alertas</p>
            <div className="notif-list">
              <div className="notif-row">
                <BellIcon width={17} height={17} />
                <span>
                  <strong>Alertas da horta</strong>
                  <small>Problemas, avisos e irrigação</small>
                </span>
                <Toggle checked={notifHorta} onChange={() => alternarNotificacao('horta')} label="Alertas da horta" />
              </div>
              <div className="notif-row">
                <MailIcon width={17} height={17} />
                <span>
                  <strong>Notificações por e-mail</strong>
                  <small>Receba resumos e relatórios</small>
                </span>
                <Toggle checked={notifEmail} onChange={() => alternarNotificacao('email')} label="Notificações por e-mail" />
              </div>
              <div className="notif-row">
                <PhoneIcon width={17} height={17} />
                <span>
                  <strong>Notificações no sistema</strong>
                  <small>Avisos em tempo real</small>
                </span>
                <Toggle checked={notifSistema} onChange={() => alternarNotificacao('sistema')} label="Notificações no sistema" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={senhaModalAberta} onClose={() => setSenhaModalAberta(false)} title="Alterar senha">
        {senhaSucesso ? (
          <div className="empty-state">
            <CheckIcon width={30} height={30} />
            <strong>Senha atualizada com sucesso!</strong>
          </div>
        ) : (
          <form className="edit-plant-form" onSubmit={salvarSenha}>
            <Input label="Senha atual" type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
            <Input label="Nova senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
            <Input label="Confirmar nova senha" type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
            {senhaErro && <p className="login-error">{senhaErro}</p>}
            <div className="edit-form-actions">
              <Button type="button" variant="ghost" fullWidth onClick={() => setSenhaModalAberta(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" fullWidth>
                Salvar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
