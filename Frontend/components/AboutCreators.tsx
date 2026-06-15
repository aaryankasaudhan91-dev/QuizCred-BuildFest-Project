import React from 'react';

// 1. Defined strong TypeScript interfaces
interface Creator {
  name: string;
  role: string;
  bio: string;
  color: string;
  icon: string;
  linkedin?: string; // Made optional for safety
  github?: string;
}

interface AboutCreatorsProps {
  onBack: () => void;
}

// 2. Extracted and strongly typed data (Typo fixed in UI/UX role)
const creators: Creator[] = [
  {
    name: "Akshay Paswan",
    role: "Full Stack Developer",
    bio: "Passionate about building scalable web applications and solving real-world problems through code. Led the architectural design of MEALers Connect.",
    color: "from-blue-500 to-indigo-600",
    icon: "👨‍💻",
    linkedin: "#",
    github: "#"
  },
  {
    name: "Surbhi Maurya",
    role: "UI/UX Designer",
    bio: "Focused on creating intuitive and accessible user experiences. Crafted the visual identity and seamless interactions of the platform.",
    color: "from-purple-500 to-pink-600",
    icon: "🎨",
    linkedin: "#",
    github: "#"
  },
  {
    name: "Aaryan Kasaudhan",
    role: "Backend & Logic Engineer",
    bio: "Expert in logic optimization and data structures. Ensured the reliability of the matching algorithms and database integrity.",
    color: "from-emerald-500 to-teal-600",
    icon: "⚙️",
    linkedin: "#",
    github: "#"
  },
  {
    name: "Jitendra Choudhary",
    role: "Backend Engineer",
    bio: "Specializes in building robust server-side architecture and managing APIs. Focused on optimizing performance and secure data flow.",
    color: "from-amber-500 to-orange-600",
    icon: "🖥️",
    linkedin: "#",
    github: "#"
  },
  {
    name: "Saniya Indulkar",
    role: "Frontend Engineer",
    bio: "Dedicated to bringing designs to life with clean, responsive code. Focused on seamless user interfaces and optimal frontend performance.",
    color: "from-cyan-500 to-blue-600",
    icon: "💻",
    linkedin: "#",
    github: "#"
  }
];

const AboutCreators: React.FC<AboutCreatorsProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in-up">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
      >
        <svg
          className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight drop-shadow-sm">
          Meet the Creators
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto text-lg leading-relaxed">
          MEALers Connect was built with ❤️ by a dedicated team of developers committed to using technology for social good.
        </p>
      </div>

      {/* Grid - Adjusted md:grid-cols-3 to include sm variations for cleaner scaling */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {creators.map((creator, idx) => (
          <div
            key={idx}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-xl dark:shadow-2xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative flex flex-col"
          >
            {/* Hover Background Accent */}
            <div className={`absolute inset-0 bg-gradient-to-br ${creator.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[2.5rem]`} />

            {/* Card Header Pattern */}
            <div className={`h-36 bg-gradient-to-r ${creator.color} relative overflow-hidden shrink-0`}>
              <div className="absolute inset-0 bg-black/10 dark:bg-black/20 pattern-dots" />
              <div className="absolute w-full h-full bg-white/20 blur-2xl -top-10 -right-10 rounded-full group-hover:scale-150 transition-transform duration-700" />

              {/* Avatar Icon container */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full p-1.5 shadow-xl group-hover:scale-110 transition-transform duration-500">
                  <div className="w-full h-full bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl">
                    {/* Added accessible label for emojis */}
                    <span role="img" aria-label={`${creator.role} icon`}>
                      {creator.icon}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Content */}
            <div className="pt-14 p-8 text-center relative z-10 flex flex-col flex-grow">
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                {creator.name}
              </h3>

              <div className="mb-5">
                <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                  {creator.role}
                </span>
              </div>

              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8 flex-grow">
                "{creator.bio}"
              </p>

              {/* Social Links - Changed to semantic <a> tags with explicit aria-labels */}
              <div className="flex justify-center gap-4 mt-auto">
                <a
                  href={creator.linkedin || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${creator.name}'s LinkedIn Profile`}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-emerald-500 hover:text-slate-900 dark:text-white dark:hover:bg-emerald-500 transition-all shadow-sm hover:shadow-emerald-500/20 hover:-translate-y-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>

                <a
                  href={creator.github || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${creator.name}'s GitHub Profile`}
                  className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-500 hover:text-slate-900 dark:text-white dark:hover:bg-blue-500 transition-all shadow-sm hover:shadow-blue-500/20 hover:-translate-y-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AboutCreators;