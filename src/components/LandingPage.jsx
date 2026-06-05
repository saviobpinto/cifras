import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

function LandingPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { session } = useAuth();
    
    // FAQ accordion state
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const handleCtaClick = () => {
        if (session) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleUpgradeClick = () => {
        if (session) {
            navigate('/settings');
        } else {
            navigate('/login');
        }
    };

    const faqItems = [
        {
            q: "Como instalo o aplicativo no meu celular (PWA)?",
            a: "Como o 'Meu Setlist' é um PWA (Progressive Web App), você não precisa gastar memória baixando das lojas. Basta abrir este site no navegador do celular (Safari no iPhone ou Chrome no Android), tocar em 'Compartilhar' ou no menu de opções do navegador e clicar em 'Adicionar à Tela de Início'. Ele será instalado instantaneamente e funcionará como um app nativo!"
        },
        {
            q: "O modo offline realmente funciona em qualquer lugar?",
            a: "Sim! Toda a sua biblioteca de músicas, setlists e configurações é salva localmente no banco de dados do seu dispositivo (IndexedDB). Você pode colocar o celular em Modo Avião e acessar suas cifras, afinador e metrônomo normalmente durante o show."
        },
        {
            q: "Eu preciso pagar alguma assinatura mensal?",
            a: "Não! O plano Premium é um pagamento único de R$ 29,90. Você paga apenas uma vez e tem acesso vitalício a todas as ferramentas atuais e futuras atualizações, sem cobranças recorrentes no seu cartão."
        },
        {
            q: "Posso criar minhas próprias cifras personalizadas?",
            a: "Com certeza! O aplicativo possui um editor de cifras completo onde você pode escrever ou colar suas letras e cifras. O app formata as cifras automaticamente nos tons selecionados."
        },
        {
            q: "Como funciona a sincronização em nuvem?",
            a: "Para usuários Premium, a sincronização é automática. Ao fazer login e conectar-se à internet, todas as alterações feitas offline no celular ou tablet são fundidas na nuvem de forma inteligente e segura (Supabase), sincronizando múltiplos aparelhos."
        }
    ];

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen antialiased flex flex-col transition-colors duration-300">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 bg-background-light/85 dark:bg-background-dark/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-8 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="flex items-center justify-center size-9 rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                            <span className="material-symbols-outlined text-[22px] font-bold">playlist_play</span>
                        </div>
                        <span className="text-lg font-black tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                            Meu Setlist
                        </span>
                    </div>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleCtaClick}
                            className="px-4 py-2 rounded-xl text-sm font-extrabold text-primary bg-primary/10 hover:bg-primary/20 active:scale-95 transition-all"
                        >
                            {session ? 'Ir para o Painel' : 'Entrar'}
                        </button>
                        {!session && (
                            <button 
                                onClick={handleCtaClick}
                                className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-extrabold text-white bg-primary hover:bg-primary-dark active:scale-95 shadow-md shadow-primary/10 transition-all"
                            >
                                Cadastrar Grátis
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-16 md:py-24 px-4 border-b border-slate-200 dark:border-slate-800/60">
                {/* Background Glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                    {/* Left Copy */}
                    <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left">
                        <span className="px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-primary/10 text-primary border border-primary/20">
                            ★ Pagamento Único Vitalício
                        </span>
                        
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                            Seu repertório de cifras. <br className="hidden sm:inline" />
                            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                                100% Organizado e Offline.
                            </span>
                        </h2>

                        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl">
                            Afinador, metrônomo, transposição de tom em um clique e mais de 30 mil cifras locais. Diga adeus às pastas de papel e às assinaturas mensais caras. Feito por músicos, para músicos.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
                            <button
                                onClick={handleCtaClick}
                                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-white bg-primary hover:bg-primary-dark active:scale-[0.98] shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 text-base"
                            >
                                <span className="material-symbols-outlined text-[20px]">music_note</span>
                                Começar Grátis
                            </button>
                            <button
                                onClick={handleUpgradeClick}
                                className="w-full sm:w-auto px-7 py-4 rounded-2xl font-extrabold text-slate-700 dark:text-slate-300 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
                            >
                                Obter Premium Vitalício (R$ 29,90)
                            </button>
                        </div>

                        <div className="flex items-center gap-6 mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span> Sem Mensalidade</span>
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span> Modo Offline Total</span>
                        </div>
                    </div>

                    {/* Right Interactive Multi-Device Mockup */}
                    <div className="lg:col-span-5 flex justify-center w-full pt-6 lg:pt-0">
                        <div className="relative w-full max-w-[340px] sm:max-w-[440px] h-[260px] sm:h-[340px] overflow-visible select-none">
                            
                            {/* 1. MONITOR MOCKUP (Desktop - Background Center) */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] aspect-[16/10] bg-slate-950 rounded-xl p-1 sm:p-1.5 shadow-2xl border border-slate-800 z-0 flex flex-col">
                                {/* Browser Bar */}
                                <div className="flex items-center gap-1 pb-1 border-b border-slate-800 text-[6px] sm:text-[8px] text-slate-500">
                                    <div className="flex gap-0.5">
                                        <span className="size-1 sm:size-1.5 rounded-full bg-rose-500/80"></span>
                                        <span className="size-1 sm:size-1.5 rounded-full bg-amber-500/80"></span>
                                        <span className="size-1 sm:size-1.5 rounded-full bg-emerald-500/80"></span>
                                    </div>
                                    <div className="flex-1 bg-slate-900/60 rounded px-1.5 py-0.2 mx-2 text-center text-[5px] sm:text-[7px] font-mono truncate">cifras.app/song/edit</div>
                                </div>
                                {/* Editor Workspace */}
                                <div className="flex-1 bg-slate-900 text-slate-300 p-1.5 sm:p-2.5 rounded-b-lg flex flex-col text-[6px] sm:text-[8px] leading-tight text-left">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1 sm:mb-2">
                                        <span className="font-extrabold text-white flex items-center gap-0.5"><span className="material-symbols-outlined text-[8px] sm:text-[10px]">edit</span> Editar Música</span>
                                        <span className="px-1 py-0.2 bg-primary/20 text-primary font-bold rounded">Salvo</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 mb-1 sm:mb-2">
                                        <div>
                                            <span className="text-[5px] sm:text-[7px] text-slate-500 font-bold block mb-0.2">Título</span>
                                            <div className="bg-slate-950 p-0.5 rounded font-bold text-white truncate border border-slate-800">Garota de Ipanema</div>
                                        </div>
                                        <div>
                                            <span className="text-[5px] sm:text-[7px] text-slate-500 font-bold block mb-0.2">Artista</span>
                                            <div className="bg-slate-950 p-0.5 rounded font-semibold truncate border border-slate-800">Tom Jobim</div>
                                        </div>
                                        <div>
                                            <span className="text-[5px] sm:text-[7px] text-slate-500 font-bold block mb-0.2">Tom</span>
                                            <div className="bg-slate-950 p-0.5 rounded font-bold text-primary truncate border border-slate-800">G (Sol Maior)</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-slate-950 p-1 sm:p-1.5 rounded border border-slate-800 font-mono text-slate-400 overflow-hidden leading-normal text-[5px] sm:text-[7px]">
                                        <p className="text-primary font-bold">[Gmaj7]</p>
                                        <p>Olha que coisa mais linda, mais cheia de graça</p>
                                        <p className="text-primary font-bold">[A9]</p>
                                        <p>É ela, menina, que vem e que passa</p>
                                        <p className="text-primary font-bold">[Am7]                       [D7/9-]</p>
                                        <p>Num doce balanço a caminho do mar</p>
                                    </div>
                                </div>
                                {/* Monitor Stand */}
                                <div className="absolute bottom-[-10px] sm:bottom-[-13px] left-1/2 -translate-x-1/2 w-10 sm:w-14 h-2.5 sm:h-3.5 bg-slate-800 rounded-t"></div>
                                <div className="absolute bottom-[-12px] sm:bottom-[-16px] left-1/2 -translate-x-1/2 w-14 sm:w-20 h-0.5 sm:h-1 bg-slate-700 rounded-full"></div>
                            </div>

                            {/* 2. TABLET MOCKUP (Overlapping Bottom-Left) */}
                            <div className="absolute bottom-1.5 left-[-15px] sm:left-[-25px] w-[50%] aspect-[3/4] bg-slate-950 rounded-xl p-1 shadow-2xl border border-slate-800 z-10 flex flex-col">
                                {/* Tablet Screen */}
                                <div className="bg-[#f8fafc] text-slate-900 flex-1 rounded-[10px] overflow-hidden flex flex-col p-1.5 sm:p-2.5 text-left relative">
                                    <div className="flex justify-between items-center border-b border-slate-200 pb-1 mb-1 sm:mb-2 text-[6px] sm:text-[8px]">
                                        <div>
                                            <h4 className="font-extrabold text-slate-800 truncate">Garota de Ipanema</h4>
                                            <p className="text-[5px] sm:text-[7px] text-slate-500 font-bold">Tom Jobim • Tom: G</p>
                                        </div>
                                        <span className="material-symbols-outlined text-[10px] sm:text-[14px] text-slate-400">arrow_downward</span>
                                    </div>
                                    <div className="flex-1 text-[5px] sm:text-[7px] leading-relaxed text-slate-600 space-y-1">
                                        <div className="text-slate-400 font-bold font-mono py-0.2 px-0.5 bg-slate-100 rounded inline-block text-[4px] sm:text-[6px]">P{'{12}'} (Introdução)</div>
                                        <div>
                                            <span className="text-primary font-bold mr-0.5 text-[5px] sm:text-[7px]">[Gmaj7]</span>
                                            Olha que coisa mais linda, mais cheia de graça
                                        </div>
                                        <div>
                                            É ela, menina, que vem e que passa
                                        </div>
                                        <div>
                                            <span className="text-primary font-bold mr-0.5 text-[5px] sm:text-[7px]">[A9]</span>
                                            Num doce balanço a caminho do mar
                                        </div>
                                    </div>
                                    {/* Scrolling active banner */}
                                    <div className="bg-primary/95 text-white py-0.5 px-1.5 rounded shadow text-[4px] sm:text-[6px] font-bold flex items-center justify-between animate-pulse">
                                        <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[6px] sm:text-[8px]">schedule</span> Pausa Ativa: 12s</span>
                                        <span>Introdução</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. SMARTPHONE MOCKUP (Overlapping Bottom-Right) */}
                            <div className="absolute bottom-0 right-[-15px] sm:right-[-25px] w-[30%] aspect-[9/19] bg-slate-950 rounded-xl p-0.5 shadow-2xl border border-slate-800 z-20 flex flex-col overflow-hidden">
                                {/* Screen Content: Tuner */}
                                <div className="bg-slate-900 text-white flex-1 rounded-[10px] overflow-hidden flex flex-col p-1 sm:p-2 text-[5px] sm:text-[7px] text-left relative">
                                    <div className="text-center font-bold text-[6px] sm:text-[8px] text-slate-400 border-b border-slate-800 pb-0.5 mb-1 sm:mb-2">Afinador</div>
                                    
                                    {/* Tuner dial display */}
                                    <div className="flex flex-col items-center flex-1 justify-center relative py-1 sm:py-2">
                                        {/* Simple Dial Arc */}
                                        <svg viewBox="0 0 100 60" className="w-full max-w-[50px] sm:max-w-[70px] overflow-visible">
                                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
                                            {/* Green center tick */}
                                            <line x1="50" y1="10" x2="50" y2="16" stroke="#10b981" strokeWidth="1.5" />
                                            {/* Needle aligned exactly at 0 degree (perfectly tuned) */}
                                            <line x1="50" y1="50" x2="50" y2="12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                                            <circle cx="50" cy="50" r="3" fill="#cbd5e1" />
                                        </svg>
                                        <span className="text-sm sm:text-base font-black text-emerald-500 leading-none mt-1 sm:mt-1.5 block">Lá</span>
                                        <span className="text-[4px] sm:text-[6px] font-mono text-slate-400 block mt-0.2">110.0 Hz</span>
                                        <span className="px-1 py-0.2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-bold text-[3.5px] sm:text-[5.5px] uppercase tracking-wider mt-1 block">Afinado!</span>
                                    </div>
                                    <div className="grid grid-cols-6 gap-0.5 font-bold text-center mt-1 pt-1 border-t border-slate-800 text-[4px] sm:text-[6px]">
                                        <span className="bg-slate-800 text-slate-400 rounded py-0.2">1E</span>
                                        <span className="bg-slate-800 text-slate-400 rounded py-0.2">2B</span>
                                        <span className="bg-slate-800 text-slate-400 rounded py-0.2">3G</span>
                                        <span className="bg-slate-800 text-slate-400 rounded py-0.2">4D</span>
                                        <span className="bg-emerald-500 text-white rounded py-0.2 scale-105">5A</span>
                                        <span className="bg-slate-800 text-slate-400 rounded py-0.2">6E</span>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </section>

            {/* Pain Point Comparison Section */}
            <section className="py-16 px-4 bg-slate-50 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800/60">
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                        Por que trocar as pastas e concorrentes pelo Meu Setlist?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-10">
                        O COMPARATIVO QUE FALA POR SI SÓ
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Competitors Card */}
                        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl flex flex-col text-left">
                            <h4 className="text-lg font-black text-rose-500 flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined">cancel</span> Outros Métodos / Apps
                            </h4>
                            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                <li className="flex items-start gap-2.5">
                                    <span className="material-symbols-outlined text-rose-500 text-lg mt-0.5">remove</span>
                                    Assinatura mensal recorrente (cobrada ano após ano).
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="material-symbols-outlined text-rose-500 text-lg mt-0.5">remove</span>
                                    Propagandas que travam a tela no meio da música.
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="material-symbols-outlined text-rose-500 text-lg mt-0.5">remove</span>
                                    Cifras somem se o sinal 4G/Wi-Fi falhar no palco.
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="material-symbols-outlined text-rose-500 text-lg mt-0.5">remove</span>
                                    Necessita abrir apps externos para afinar ou ter tempo.
                                </li>
                            </ul>
                        </div>

                        {/* Meu Setlist Card */}
                        <div className="bg-gradient-to-br from-white to-blue-50/20 dark:from-surface-dark dark:to-indigo-950/20 border border-primary/40 dark:border-primary/20 p-6 rounded-2xl flex flex-col text-left shadow-lg shadow-primary/5">
                            <h4 className="text-lg font-black text-emerald-500 flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined fill-1">check_circle</span> Meu Setlist App
                            </h4>
                            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300 font-semibold">
                                <li className="flex items-start gap-2.5">
                                    <span className="material-symbols-outlined text-emerald-500 text-lg mt-0.5">add</span>
                                    Pagamento único de R$ 29,90. Compre uma vez, use para sempre.
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="material-symbols-outlined text-emerald-500 text-lg mt-0.5">add</span>
                                    Totalmente limpo. Sem anúncios irritantes de tela cheia.
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="material-symbols-outlined text-emerald-500 text-lg mt-0.5">add</span>
                                    Modo Offline garantido: cifras salvas no seu aparelho.
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="material-symbols-outlined text-emerald-500 text-lg mt-0.5">add</span>
                                    Afinador e metrônomo integrados no mesmo painel de show.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Features Grid Section */}
            <section className="py-16 px-4 max-w-6xl mx-auto text-center">
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                    Funcionalidades projetadas para o palco
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-12">
                    O Controle completo da sua apresentação musical
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Feature 1: Tom */}
                    <div className="p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 rounded-2xl text-left hover:border-primary/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[22px]">exposure</span>
                        </div>
                        <h4 className="font-extrabold text-lg mb-2">Transposição de Tom</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Mude o tom de qualquer música instantaneamente para se adequar à sua voz ou para facilitar as posições no violão.
                        </p>
                    </div>

                    {/* Feature 2: Scroll */}
                    <div className="p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 rounded-2xl text-left hover:border-primary/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[22px]">arrow_downward</span>
                        </div>
                        <h4 className="font-extrabold text-lg mb-2">Rolagem Automática</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Toque sem precisar tocar na tela para passar a cifra. Ajuste a velocidade exata de acordo com a música.
                        </p>
                    </div>

                    {/* Feature 3: Pauses */}
                    <div className="p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 rounded-2xl text-left hover:border-primary/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[22px]">pause_circle</span>
                        </div>
                        <h4 className="font-extrabold text-lg mb-2">Pausas Personalizadas</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Programe pausas na rolagem (ex: `P{'{15}'}` para parar por 15s) nos solos, introduções ou trechos sem letra.
                        </p>
                    </div>

                    {/* Feature 4: Tuner */}
                    <div className="p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 rounded-2xl text-left hover:border-primary/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[22px]">tune</span>
                        </div>
                        <h4 className="font-extrabold text-lg mb-2">Afinador de Instrumentos</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Afinador de alta precisão cromática integrado com suporte a Violão, Guitarra, Ukulele, Baixo e Violino.
                        </p>
                    </div>

                    {/* Feature 5: Metronome */}
                    <div className="p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 rounded-2xl text-left hover:border-primary/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[22px]">av_timer</span>
                        </div>
                        <h4 className="font-extrabold text-lg mb-2">Metrônomo Estável</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Mantenha o tempo exato com clicks sintetizados sem flutuações de velocidade. Controle o compasso de forma rápida.
                        </p>
                    </div>

                    {/* Feature 6: Database */}
                    <div className="p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 rounded-2xl text-left hover:border-primary/50 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[22px]">database</span>
                        </div>
                        <h4 className="font-extrabold text-lg mb-2">+30.000 Cifras</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            Importe instantaneamente uma enorme coletânea de cifras prontas do catálogo direto para a sua biblioteca local.
                        </p>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 px-4 bg-slate-50 dark:bg-slate-800/20 border-t border-b border-slate-200 dark:border-slate-800/60">
                <div className="max-w-4xl mx-auto text-center">
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                        Quem usa, aprova
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-10">
                        Histórias reais de músicos brasileiros
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="p-5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 rounded-2xl relative">
                            <span className="material-symbols-outlined text-[40px] text-primary/10 absolute top-4 right-4">format_quote</span>
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                                "Toco em eventos e casamentos no interior. Havia locais onde o 3G simplesmente não pegava e eu precisava carregar pastas gigantes impressas. Com o modo offline do Meu Setlist, eu coloco o celular no suporte e toco as 4 horas de show garantido."
                            </p>
                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Lucas Andrade</h5>
                            <span className="text-[10px] text-slate-400 font-bold">Músico Solo & Violonista</span>
                        </div>

                        <div className="p-5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 rounded-2xl relative">
                            <span className="material-symbols-outlined text-[40px] text-primary/10 absolute top-4 right-4">format_quote</span>
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-4">
                                "Como líder de ministério na igreja, mudo o tom das cifras toda semana para ajustar à voz do cantor. A sincronização automática permite que eu edite tudo no computador em casa e tenha tudo atualizado no tablet no momento do ensaio."
                            </p>
                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Mariana Costa</h5>
                            <span className="text-[10px] text-slate-400 font-bold">Líder de Louvor</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-16 px-4 max-w-lg mx-auto text-center relative">
                {/* Glow behind card */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[90px] pointer-events-none"></div>

                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-8 border border-primary/30 shadow-2xl relative z-10">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-amber-500 text-slate-950">
                        OFERTA DE LANÇAMENTO
                    </span>
                    
                    <h3 className="text-2xl font-black mt-4">Acesso Vitalício Premium</h3>
                    <p className="text-xs text-slate-300 mt-2 font-medium">Libere todo o potencial do seu aplicativo de uma vez por todas.</p>

                    <div className="my-6">
                        <span className="text-5xl font-black font-mono">R$ 29,90</span>
                        <span className="text-xs text-slate-400 font-bold block mt-1">PAGAMENTO ÚNICO — SEM MENSALIDADE</span>
                    </div>

                    <div className="border-t border-white/10 pt-5 text-left space-y-3 mb-8">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                            <span className="material-symbols-outlined text-[18px] text-amber-400 fill-1">check_circle</span>
                            Músicas e setlists ilimitados
                        </div>
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                            <span className="material-symbols-outlined text-[18px] text-amber-400 fill-1">check_circle</span>
                            Backup e Sincronização em nuvem
                        </div>
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                            <span className="material-symbols-outlined text-[18px] text-amber-400 fill-1">check_circle</span>
                            Importação do catálogo completo (+30k cifras)
                        </div>
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-200">
                            <span className="material-symbols-outlined text-[18px] text-amber-400 fill-1">check_circle</span>
                            Afinador, metrônomo e ferramentas offline
                        </div>
                    </div>

                    <button
                        onClick={handleUpgradeClick}
                        className="w-full bg-primary hover:bg-primary-light text-white py-4 rounded-xl font-extrabold text-base transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                    >
                        Garantir Meu Acesso Vitalício
                    </button>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-16 px-4 bg-slate-50 dark:bg-slate-800/20 border-t border-slate-200 dark:border-slate-800/60 flex-1">
                <div className="max-w-2xl mx-auto">
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-10">
                        Perguntas Frequentes
                    </h3>

                    <div className="space-y-3">
                        {faqItems.map((item, idx) => {
                            const isOpen = openFaqIndex === idx;
                            return (
                                <div 
                                    key={idx} 
                                    className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden transition-all duration-300"
                                >
                                    <button
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full p-4 flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white"
                                    >
                                        <span>{item.q}</span>
                                        <span className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-400'}`}>
                                            keyboard_arrow_down
                                        </span>
                                    </button>
                                    
                                    <div 
                                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                            isOpen ? 'max-h-[200px] border-t border-slate-100 dark:border-slate-800/50' : 'max-h-0'
                                        }`}
                                    >
                                        <p className="p-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                            {item.a}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 dark:border-slate-800/80 py-8 px-4 bg-white dark:bg-background-dark transition-colors duration-300">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-white">
                            <span className="material-symbols-outlined text-[18px]">playlist_play</span>
                        </div>
                        <span className="font-black text-sm tracking-tight">Meu Setlist</span>
                    </div>
                    
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        © {new Date().getFullYear()} Meu Setlist. Feito com ♥ para músicos brasileiros.
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
