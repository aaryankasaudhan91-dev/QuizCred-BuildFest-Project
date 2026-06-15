import React, { useState, useRef, useEffect } from 'react';
import { triggerHaptic } from '../services/haptics';

interface AppStoryProps {
  onBack: () => void;
}

const stories = [
  {
    id: 1,
    bg: "bg-slate-50 dark:bg-slate-950",
    accent: "text-rose-500",
    shadow: "shadow-rose-500/20",
    icon: "🌏",
    title: "The Paradox",
    text: "We live in a world where 1/3 of all food produced is lost or wasted...",
    sub: "That's 1.3 billion tons every year."
  },
  {
    id: 2,
    bg: "bg-amber-950",
    accent: "text-amber-500",
    shadow: "shadow-amber-500/20",
    icon: "🥣",
    title: "The Reality",
    text: "...Yet, over 800 million people go to sleep hungry every single night.",
    sub: "It's not a lack of food. It's a disconnect."
  },
  {
    id: 3,
    bg: "bg-emerald-950",
    accent: "text-emerald-400",
    shadow: "shadow-emerald-500/20",
    icon: "🌉",
    title: "The Bridge",
    text: "MEALers Connect was built to solve this logistics problem.",
    sub: "We connect those with surplus to those in need."
  },
  {
    id: 4,
    bg: "bg-blue-950",
    accent: "text-blue-400",
    shadow: "shadow-blue-500/20",
    icon: "🤝",
    title: "How It Works",
    text: "Donors post food. Volunteers pick it up. Communities get fed.",
    sub: "Verified. Tracked. Safe."
  },
  {
    id: 5,
    bg: "bg-indigo-950",
    accent: "text-indigo-400",
    shadow: "shadow-indigo-500/20",
    icon: "✨",
    title: "Your Impact",
    text: "Every donation saves CO2 and fills a stomach.",
    sub: "Join the movement today.",
    isLast: true
  }
];

const Z_DISTANCE = 1500;
const TOTAL_SCENES = stories.length;

const AppStory: React.FC<AppStoryProps> = ({ onBack }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [maxScroll, setMaxScroll] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Set initial scroll boundaries
    if (scrollRef.current) {
        setMaxScroll(scrollRef.current.scrollHeight - scrollRef.current.clientHeight);
    }
    
    // Resize handler to recalculate boundaries if device rotates
    const handleResize = () => {
        if (scrollRef.current) {
            setMaxScroll(scrollRef.current.scrollHeight - scrollRef.current.clientHeight);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollY(target.scrollTop);
    // Haptics at threshold boundaries
    const newProgress = target.scrollTop / maxScroll;
    const oldProgress = scrollY / maxScroll;
    const currentIdx = Math.round(newProgress * (TOTAL_SCENES - 1));
    const oldIdx = Math.round(oldProgress * (TOTAL_SCENES - 1));
    if (currentIdx !== oldIdx) {
        triggerHaptic('selection');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 2; 
      const y = (clientY / window.innerHeight - 0.5) * 2;
      setMousePos({ x, y });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!scrollRef.current) return;
    const phaseScroll = maxScroll / (TOTAL_SCENES - 1);
    
    if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        scrollRef.current.scrollBy({ top: phaseScroll, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollRef.current.scrollBy({ top: -phaseScroll, behavior: 'smooth' });
    } else if (e.key === 'Escape') {
        onBack();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maxScroll, onBack]);

  const progress = maxScroll > 0 ? scrollY / maxScroll : 0;
  const activeIndex = Math.min(Math.floor(progress * (TOTAL_SCENES - 1) + 0.5), TOTAL_SCENES - 1);
  const currentStory = stories[activeIndex] || stories[0];

  return (
    <div className="fixed inset-0 z-[2000] bg-black text-slate-900 dark:text-white font-sans overflow-hidden" onMouseMove={handleMouseMove}>
      
      {/* 1. Backdrop Color Interpolation Layer */}
      <div 
         className={`absolute inset-0 transition-colors duration-1000 ${currentStory.bg} opacity-80`}
      />

      {/* 2. Top UI Overlay (Fixed) */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-2 p-4 pointer-events-none">
        {stories.map((_, idx) => {
           let barOpacity = "opacity-20";
           if (idx < activeIndex) barOpacity = "opacity-100";
           if (idx === activeIndex) {
              const localProg = (progress * (TOTAL_SCENES - 1)) - activeIndex; // ranges roughly -0.5 to 0.5 near active
              // fill dynamically
              const fill = Math.max(0, Math.min(100, (localProg + 0.5) * 100));
              return (
                <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white shadow-[0_0_10px_white]" style={{ width: `${fill}%` }}></div>
                </div>
              );
           }
           return (
             <div key={idx} className={`h-1 flex-1 bg-white rounded-full transition-all duration-300 ${barOpacity}`} />
           );
        })}
      </div>

      <button 
        onClick={() => { triggerHaptic('impactLight'); onBack(); }}
        className="absolute top-8 right-8 z-[2050] p-4 bg-white/10 backdrop-blur-xl rounded-full hover:bg-white/30 transition-all border border-slate-300 dark:border-white/20 group active:scale-95 cursor-pointer shadow-2xl"
      >
        <svg className="w-6 h-6 text-slate-900 dark:text-white group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {/* 3. The 3D Scene Container */}
      <div 
         className="absolute inset-0 pointer-events-none" 
         style={{ perspective: 1200 }}
      >
          {/* Parallax Rotation Wrapper */}
          <div 
             className="absolute inset-0 w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
             style={{ 
                transformStyle: 'preserve-3d',
                transform: `rotateX(${mousePos.y * -15}deg) rotateY(${mousePos.x * 15}deg)`
             }}
          >
              {/* Traveling "Camera" Wrapper */}
              <div 
                 className="absolute w-full h-full flex items-center justify-center transition-transform duration-[100ms] ease-out"
                 style={{ 
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(${progress * (TOTAL_SCENES - 1) * Z_DISTANCE}px)`
                 }}
              >
                 {/* Render all story layers far away along the Z-axis */}
                 {stories.map((story, i) => {
                    const cardZ = i * -Z_DISTANCE;
                    const camZ = progress * (TOTAL_SCENES - 1) * Z_DISTANCE;
                    const dist = camZ + cardZ;

                    // Visibility logic
                    // if dist > 100, camera passed it. It should disappear quickly.
                    // if dist < -Z_DISTANCE * 2, it's far away, fade it.
                    let opacity = 0;
                    if (dist > 100) {
                        opacity = Math.max(0, 1 - (dist / 100)); // fades immediately behind camera
                    } else {
                        opacity = Math.max(0, 1 - Math.abs(dist) / 1800);
                    }

                    // A slight twist to cards ahead adds a dynamic tunnel feel
                    const tunnelRotate = dist < 0 ? `rotateY(${Math.abs(dist)/100}deg)` : 'rotateY(0deg)';

                    // Only render if it's somewhat visible for performance
                    if (opacity < 0.01) return null;

                    return (
                        <div 
                            key={story.id}
                            className="absolute flex items-center justify-center p-4 w-full max-w-4xl will-change-transform"
                            style={{
                                transformStyle: 'preserve-3d',
                                transform: `translateZ(${cardZ}px) ${tunnelRotate}`,
                                opacity: opacity,
                                // Add glass blur based on distance
                                filter: `blur(${Math.abs(dist) > 200 ? Math.min(10, Math.abs(dist)/200) : 0}px)`
                            }}
                        >
                            {/* Glass Card */}
                            <div className={`
                                relative w-full rounded-[3rem] p-10 md:p-20 
                                bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl 
                                border border-slate-200 dark:border-white/10 ${story.shadow} shadow-[0_40px_100px_rgba(0,0,0,0.5)]
                                flex flex-col items-center text-center
                                transform-gpu transition-all
                            `}>
                                {/* Floating decorative globes behind text */}
                                <div className={`absolute top-0 right-0 w-64 h-64 ${story.accent.replace('text-', 'bg-')} opacity-20 blur-[80px] rounded-full mix-blend-screen animate-pulse`} style={{ transform: 'translateZ(-50px)' }}></div>
                                <div className="absolute bottom-10 left-10 w-48 h-48 bg-white opacity-5 blur-[60px] rounded-full" style={{ transform: 'translateZ(-20px)' }}></div>

                                {/* Content floats dramatically off the glass panel */}
                                <div className="text-8xl md:text-[8rem] mb-10 filter drop-shadow-2xl animate-bounce-slow" style={{ transform: 'translateZ(120px)' }}>
                                    {story.icon}
                                </div>
                                <h2 className={`text-4xl md:text-7xl font-black mb-8 tracking-tighter ${story.accent}`} style={{ transform: 'translateZ(90px)' }}>
                                    {story.title}
                                </h2>
                                <p className="text-xl md:text-4xl font-black leading-tight max-w-3xl mx-auto mb-8 text-slate-900 dark:text-white drop-shadow-md" style={{ transform: 'translateZ(60px)' }}>
                                    {story.text}
                                </p>
                                <p className="text-sm md:text-xl font-bold text-slate-600 dark:text-slate-300 uppercase tracking-[0.3em]" style={{ transform: 'translateZ(30px)' }}>
                                    {story.sub}
                                </p>
                            </div>
                        </div>
                    );
                 })}
              </div>
          </div>
      </div>

      {/* 4. Native Invisible Scroll Container (For touch & wheel capture) */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto scrollbar-hide z-[2010]"
      >
          {/* This empty div defines the scroll height. 100dvh per scene difference = totalScenes * 100dvh */}
          <div style={{ height: `${TOTAL_SCENES * 100}dvh` }} className="w-full"></div>
      </div>

      {/* 5. Interactive UI Overlays (z-index higher than scroll container so they are clickable) */}
      {activeIndex === TOTAL_SCENES - 1 && progress > 0.95 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[2050] animate-fade-in">
            <button 
                onClick={() => { triggerHaptic('success'); onBack(); }}
                className="px-12 py-5 bg-white text-slate-900 rounded-full font-black uppercase text-sm tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_60px_rgba(255,255,255,0.4)]"
            >
                Start Volunteering
            </button>
        </div>
      )}

      {progress < 0.95 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[2050] text-slate-900 dark:text-white/50 animate-bounce pointer-events-none flex flex-col items-center">
            <span className="text-[10px] uppercase font-black tracking-widest mb-2">Scroll To Explore</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        </div>
      )}
    </div>
  );
};

export default AppStory;
