import React, { useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useNavigate
} from 'react-router-dom';

import { AppProviders } from './context/AppProviders';
import { useAuthContext } from './context/AuthContext';
import { useGestaoContext } from './context/GestaoContext';
import { ToastProvider } from './context/ToastContext';

import { RotaPublica } from './guards/RotaPublica';
import { PrimeiroAcessoGuard } from './guards/PrimeiroAcessoGuard';
import { RotaPrivada } from './guards/RotaPrivada';
import { PermissaoGuard } from './guards/PermissaoGuard';
import { AdminGlobalGuard } from './guards/AdminGlobalGuard';
import { CamaraAtivaGuard } from './guards/CamaraAtivaGuard';

// --- Páginas ---
import { LandingPage } from './pages/Landing/LandingPage';
import { LoginPage } from './pages/Login/LoginPage';
import { PrimeiroAcessoPage } from './pages/Login/PrimeiroAcessoPage';
import { PainelVereadorPage } from './pages/Sistema/PainelVereadorPage';
import { PainelPresidentePage } from './pages/Sistema/PainelPresidentePage';
import { GestaoSistemaPage } from './pages/Sistema/GestaoSistemaPage';
import { PainelPublicoPage } from './pages/Publico/PainelPublicoPage';

import { 
  Layout, 
  LogOut, 
  User, 
  Building2, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

import { autenticacaoService } from './services/autenticacao.service';

/**
 * Layout Interno do Sistema.
 */
const InternalSystemLayout = () => {
  const { usuarioAtual, autenticacaoPronta, sair } = useAuthContext();
  const { camaras } = useGestaoContext();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Efeito de segurança: Se o usuário ficar nulo (logout), sai da rota privada imediatamente
  React.useEffect(() => {
    if (autenticacaoPronta && !usuarioAtual) {
      navigate('/login', { replace: true });
    }
  }, [usuarioAtual, autenticacaoPronta, navigate]);

  const handleLogout = async () => {
    await sair();
  };

  const currentCamara = camaras.find(c => c.id === usuarioAtual?.camara_id);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      <div className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">SGLM</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 shadow-xl md:shadow-none
        md:relative md:translate-x-0 h-full shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Layout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">SGLM</h1>
              <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Legislativo Digital</p>
            </div>
          </div>

          <nav className="space-y-6">
            <div>
              <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Instituição</div>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-gray-900 truncate">{currentCamara?.nome || 'Câmara Municipal'}</p>
                  <p className="text-[10px] text-gray-500 font-medium truncate">{currentCamara?.cidade}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Navegação</div>
              <div className="space-y-1">
                {usuarioAtual?.temPermissao('PAINEL_VISUALIZAR') && (
                  <button onClick={() => navigate('/sistema')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all text-left">
                    <Layout className="w-5 h-5" /> Painel Principal
                  </button>
                )}

                {usuarioAtual?.temPermissao('GERENCIAR_USUARIOS_E_CAMARAS') && (
                  <button onClick={() => navigate('/sistema/gestao')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all text-left">
                    <ShieldCheck className="w-5 h-5" /> Gestão Legislativa
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-gray-900 truncate">{usuarioAtual?.nome}</p>
              <p className="text-[10px] text-blue-600 font-black uppercase truncate">{usuarioAtual?.perfil}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-black transition-all border border-red-100 shadow-sm active:scale-95">
            <LogOut className="w-4 h-4" /> Sair do Sistema
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-200 hidden md:flex items-center justify-between px-8 z-10">
          <h2 className="text-sm font-bold text-gray-400">Painel Legislativo</h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route index element={
              usuarioAtual?.temPermissao('SISTEMA_ADMINISTRAR_TENANTS') 
                ? <Navigate to="gestao" replace /> 
                : usuarioAtual?.temPermissao('SESSAO_GERENCIAR') 
                  ? <PainelPresidentePage /> 
                  : <PainelVereadorPage />
            } />
            <Route 
              path="gestao" 
              element={
                <PermissaoGuard codigo="GERENCIAR_USUARIOS_E_CAMARAS">
                  <GestaoSistemaPage />
                </PermissaoGuard>
              } 
            />
          </Routes>
        </div>
      </main>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <AppProviders>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<RotaPublica><LoginPage /></RotaPublica>} />
            <Route path="/reset-password" element={<PrimeiroAcessoGuard><PrimeiroAcessoPage /></PrimeiroAcessoGuard>} />
            <Route path="/sistema/*" element={<InternalSystemLayout />} />
            <Route path="/publico/:camaraId?" element={<PainelPublicoPage />} />
          </Routes>
        </Router>
      </AppProviders>
    </ToastProvider>
  );
}

export default App;
