import React from 'react';

const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 z-[2000] flex flex-col items-center justify-center text-slate-900 dark:text-white overflow-hidden perspective-[1000px]">
            {/* Deep Abstract Auras */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-600/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] rounded-full"></div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Logo Cluster */}
                <div className="relative mb-10 group" style={{ animation: 'scaleLogoUp 2s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                    <div className="absolute inset-0 bg-emerald-400/20 blur-[60px] rounded-full scale-[2] animate-pulse"></div>
                    <div className="absolute inset-0 bg-white/10 blur-[20px] rounded-full scale-110"></div>

                    {/* 3D Floating Icon */}
                    <div className="text-[9rem] relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] leading-none filter contrast-125 transform transition-transform group-hover:scale-110 duration-700 select-none preserve-3d"
                        style={{ animation: 'floatZ 4s ease-in-out infinite' }}>
                        🍃
                    </div>
                </div>

                {/* Staggered Text Reveal */}
                <div className="overflow-hidden">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-b from-black via-slate-400 to-slate-600 select-none"
                        style={{ animation: 'slideUpText 1s cubic-bezier(0.16, 1, 0.3, 1) forwards', transform: 'translateY(100%)' }}>
                        MEALers
                    </h1>
                </div>

                <div className="opacity-0" style={{ animation: 'fadeInDelay 1s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards' }}>
                    <p className="text-slate-900 dark:text-white font-black tracking-[0.5em] text-xs md:text-sm uppercase bg-white/10 px-10 py-4 rounded-full backdrop-blur-3xl border border-slate-300 dark:border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)] select-none">
                        connect
                    </p>
                </div>
            </div>

            {/* Cinematic Loading Ring instead of dots */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center justify-center opacity-0" style={{ animation: 'fadeInDelay 1s cubic-bezier(0.16, 1, 0.3, 1) 1s forwards' }}>
                <div className="relative flex items-center justify-center w-16 h-16">
                    <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeDasharray="4 8" />
                    </svg>
                    <div className="w-8 h-8 rounded-full border border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399] animate-ping"></div>
                </div>
                <span className="absolute -bottom-8 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Initializing System</span>
            </div>

            <style>{`
            @keyframes scaleLogoUp {
                0% { transform: scale(0.5) translateZ(-500px); opacity: 0; }
                100% { transform: scale(1) translateZ(0); opacity: 1; }
            }
            @keyframes slideUpText {
                0% { transform: translateY(100%); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes fadeInDelay {
                0% { opacity: 0; transform: translateY(10px); }
                100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes floatZ {
                0%, 100% { transform: translateY(0) rotateX(0) rotateY(0); }
                50% { transform: translateY(-15px) rotateX(10deg) rotateY(10deg); }
            }
            .animate-pulse-slow {
                animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .animate-spin-slow {
                animation: spin 8s linear infinite;
            }
        `}</style>
        </div>
    );
};

export default SplashScreen;