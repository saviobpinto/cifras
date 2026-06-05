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

                    {/* Right Interactive Smartphone Mockup */}
                    <div className="lg:col-span-5 flex justify-center w-full pt-6 lg:pt-0">
                        {/* Phone Container */}
                        <div className="relative w-[300px] h-[600px] sm:w-[325px] sm:h-[650px] bg-slate-950 rounded-[45px] p-3.5 shadow-2xl border-[10px] border-slate-900 ring-4 ring-slate-800/20 z-10 flex flex-col overflow-hidden select-none">
                            
                            {/* Dynamic Island */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black rounded-full z-30 flex items-center justify-between px-3">
                                <span className="size-1 rounded-full bg-slate-800"></span>
                                <span className="w-2.5 h-1.5 rounded-full bg-slate-900"></span>
                            </div>

                            {/* Phone Screen Area */}
                            <div className="bg-background-light dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex-1 rounded-[32px] overflow-hidden flex flex-col relative border border-slate-200 dark:border-slate-800">
                                
                                {/* Status Bar */}
                                <div className="h-8 bg-[#1e293b]/95 text-white/90 px-6 flex items-center justify-between text-[10px] font-bold select-none z-20">
                                    <span>09:41</span>
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">signal_cellular_4_bar</span>
                                        <span className="text-[9px] font-bold">5G</span>
                                        <span className="material-symbols-outlined text-[13px]">battery_5_bar</span>
                                    </div>
                                </div>

                                {/* App Header (Matches SongViewer.jsx style) */}
                                <header className="flex-none z-20 w-full bg-[#1e293b]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
                                    <div className="flex items-center justify-center size-8 rounded-full text-slate-400">
                                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center justify-center mx-2 overflow-hidden text-center">
                                        <h1 className="text-white text-xs font-extrabold truncate leading-tight">Garota de Ipanema</h1>
                                        <div className="flex items-center gap-1 text-[9px] text-slate-400">
                                            <span>Tom Jobim</span>
                                            <span className="size-0.5 rounded-full bg-slate-500"></span>
                                            <span>Orig: G</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="flex items-center justify-center size-8 rounded-full text-slate-400">
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                        </div>
                                        <div className="flex items-center justify-center size-8 rounded-full text-slate-400">
                                            <span className="material-symbols-outlined text-[16px]">playlist_add</span>
                                        </div>
                                    </div>
                                </header>

                                {/* Main Content (Song Lyrics & Chords) */}
                                <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6 pb-48 font-mono text-xs text-left relative bg-background-light dark:bg-[#0f172a]">
                                    
                                    {/* Active custom pause banner */}
                                    <div className="bg-primary text-white py-1.5 px-3 rounded-lg shadow-md font-sans text-[10px] font-extrabold flex items-center justify-between mb-4 animate-pulse">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">schedule</span> 
                                            Pausa Ativa: P{"{12}"}
                                        </span>
                                        <span className="bg-black/20 px-1.5 py-0.5 rounded text-[8px]">12s</span>
                                    </div>

                                    {/* Song Title and Artist in viewer body */}
                                    <div className="border-b border-dashed border-slate-200 dark:border-slate-800 pb-3 mb-4 font-sans">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-primary">MÚSICA 1 DE 1</span>
                                        <h2 className="text-base font-black text-slate-900 dark:text-white mt-0.5">Garota de Ipanema</h2>
                                        <p className="text-[10px] text-slate-500 font-medium">Tom Jobim</p>
                                    </div>

                                    {/* Section Badge */}
                                    <p className="mt-4 mb-3 text-primary/80 font-bold text-[9px] uppercase tracking-widest font-sans bg-slate-100 dark:bg-white/5 inline-block px-1.5 py-0.5 rounded">
                                        INTRODUÇÃO
                                    </p>

                                    {/* Cifra content */}
                                    <div className="space-y-4 pt-2">
                                        <div className="relative font-mono leading-[2.5] text-slate-800 dark:text-slate-200 text-[11px]">
                                            <span className="relative inline-block w-0 h-0 align-baseline">
                                                <span className="absolute left-0 bottom-0 -translate-y-[1.25em] text-primary font-bold text-[10px] leading-none whitespace-nowrap">Gmaj7</span>
                                            </span>
                                            Olha que coisa mais linda, mais cheia de graça
                                        </div>
                                        
                                        <div className="relative font-mono leading-[2.5] text-slate-800 dark:text-slate-200 text-[11px]">
                                            <span className="relative inline-block w-0 h-0 align-baseline">
                                                <span className="absolute left-0 bottom-0 -translate-y-[1.25em] text-primary font-bold text-[10px] leading-none whitespace-nowrap">A9</span>
                                            </span>
                                            É ela, menina, que vem e que passa
                                        </div>

                                        <div className="relative font-mono leading-[2.5] text-slate-800 dark:text-slate-200 text-[11px]">
                                            <span className="relative inline-block w-0 h-0 align-baseline">
                                                <span className="absolute left-0 bottom-0 -translate-y-[1.25em] text-primary font-bold text-[10px] leading-none whitespace-nowrap">Am7</span>
                                            </span>
                                            Num doce balanço a caminho do
                                            <span className="relative inline-block w-0 h-0 align-baseline">
                                                <span className="absolute left-0 bottom-0 -translate-y-[1.25em] text-primary font-bold text-[10px] leading-none whitespace-nowrap">D7/9-</span>
                                            </span>
                                            mar
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Controls (Matches SongViewer.jsx Controls style) */}
                                <div className="absolute left-3 right-3 bottom-3.5 z-20 bg-white dark:bg-[#1a2332] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl p-3 flex flex-col gap-3 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95">
                                    <div className="flex items-center justify-between gap-3">
                                        {/* Key Transpose */}
                                        <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg p-0.5 border border-slate-200 dark:border-white/5">
                                            <div className="size-8 flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-sm">remove</span>
                                            </div>
                                            <div className="flex flex-col items-center w-8">
                                                <span className="text-[7px] text-slate-400 font-bold uppercase">Key</span>
                                                <span className="text-slate-900 dark:text-white font-extrabold text-xs leading-none">G</span>
                                            </div>
                                            <div className="size-8 flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-sm">add</span>
                                            </div>
                                        </div>

                                        {/* Auto Scroll Toggle */}
                                        <div className="flex-1 flex items-center justify-between px-3 h-9 rounded-lg bg-primary text-white shadow-md shadow-primary/10">
                                            <div className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-base">pause_circle</span>
                                                <span className="font-extrabold text-[11px]">Auto-Scroll</span>
                                            </div>
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-black/20 text-white/90">
                                                ON
                                            </span>
                                        </div>
                                    </div>

                                    {/* Speed Control Slider Mockup */}
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-sm">speed</span>
                                        <div className="flex-1 h-3 flex items-center">
                                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg relative">
                                                <div className="absolute left-0 top-0 h-full w-[45%] bg-primary rounded-lg"></div>
                                                <div className="absolute left-[45%] top-1/2 -translate-y-1/2 size-2 bg-primary rounded-full shadow"></div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-800 dark:text-white w-6 text-right font-mono">1.2x</span>
                                    </div>

                                    {/* Font Size Control Slider Mockup */}
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <span className="material-symbols-outlined text-sm">format_size</span>
                                        <div className="flex-1 h-3 flex items-center">
                                            <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg relative">
                                                <div className="absolute left-0 top-0 h-full w-[25%] bg-primary rounded-lg"></div>
                                                <div className="absolute left-[25%] top-1/2 -translate-y-1/2 size-2 bg-primary rounded-full shadow"></div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-800 dark:text-white w-6 text-right font-mono">14px</span>
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
