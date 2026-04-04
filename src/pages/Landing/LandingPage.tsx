import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Monitor, ShieldCheck, Globe, ChevronRight, FileText, Users, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-900 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">SGLM <span className="text-blue-600">Pro</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/publico')} className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors">Telão Público</button>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            Acessar Sistema
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-48 pb-32 px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 -skew-x-12 translate-x-1/4 -z-10" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-block bg-blue-50 px-4 py-1.5 rounded-full text-xs font-black text-blue-600 uppercase tracking-widest border border-blue-100">
              Gestão Legislativa 4.0
            </div>
            <h2 className="text-7xl font-black leading-[1.05] text-gray-900">
              Modernidade e <span className="text-blue-600">Transparência</span> para o Legislativo.
            </h2>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-lg">
              Sistema completo para gestão de sessões plenárias, votação eletrônica em tempo real e transmissão pública.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center gap-3"
              >
                Começar Agora <ChevronRight size={20} />
              </button>
              <button className="px-10 py-5 bg-gray-50 text-gray-700 rounded-2xl font-black text-lg hover:bg-gray-100 transition-all border border-gray-100">
                Ver Demonstração
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-gray-200 border border-gray-100 p-4 relative z-10">
              <img 
                src="https://picsum.photos/seed/dashboard/1200/800" 
                alt="Dashboard" 
                className="rounded-[2rem] w-full shadow-inner"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -top-10 -right-10 bg-blue-600 w-40 h-40 rounded-full blur-3xl opacity-20" />
            <div className="absolute -bottom-10 -left-10 bg-teal-400 w-40 h-40 rounded-full blur-3xl opacity-20" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-gray-50 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <h3 className="text-4xl font-black text-gray-900">Tudo o que sua Câmara precisa.</h3>
            <p className="text-gray-500 font-medium text-lg">Módulos integrados para cada papel fundamental no processo legislativo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Votação Eletrônica', 
                desc: 'Interface intuitiva para vereadores votarem com segurança e rapidez.',
                icon: ShieldCheck,
                color: 'bg-blue-600'
              },
              { 
                title: 'Controle de Sessão', 
                desc: 'Painel completo para a Presidência gerenciar o rito e os tempos de fala.',
                icon: Clock,
                color: 'bg-teal-500'
              },
              { 
                title: 'Transparência Total', 
                desc: 'Telão público e transmissão em tempo real para acompanhamento da população.',
                icon: Globe,
                color: 'bg-indigo-600'
              },
            ].map((f, i) => (
              <div key={i} className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 hover:y-[-8px] transition-all group">
                <div className={`${f.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-white shadow-lg`}>
                  <f.icon size={32} />
                </div>
                <h4 className="text-2xl font-black text-gray-900 mb-4">{f.title}</h4>
                <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto bg-blue-900 rounded-[4rem] p-20 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { label: 'Câmaras Atendidas', value: '150+' },
              { label: 'Votos Processados', value: '2.5M' },
              { label: 'Disponibilidade', value: '99.9%' },
            ].map((s, i) => (
              <div key={i} className="space-y-2">
                <p className="text-6xl font-black">{s.value}</p>
                <p className="text-blue-300 font-bold uppercase tracking-widest text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 p-2 rounded-xl text-white">
              <LayoutDashboard size={24} />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">SGLM <span className="text-blue-600">Pro</span></h1>
          </div>
          <p className="text-gray-400 text-sm font-medium">© 2026 SGLM Pro. Todos os direitos reservados.</p>
          <div className="flex gap-8 text-sm font-bold text-gray-500">
            <a href="#" className="hover:text-blue-600">Termos</a>
            <a href="#" className="hover:text-blue-600">Privacidade</a>
            <a href="#" className="hover:text-blue-600">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
