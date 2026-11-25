import React from 'react';
import { Sparkles, Globe, CloudSun, Calculator, Mail, ArrowUpRight } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    title: 'Real-Time Web Search',
    prompt: 'Search the web for the latest breakthroughs in AI.',
    icon: Globe,
    iconBg: 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
  },
  {
    title: 'Live Local Weather',
    prompt: 'What is the current weather right now?',
    icon: CloudSun,
    iconBg: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
  },
  {
    title: 'Math & Python Sandbox',
    prompt: 'Calculate 25% of 80,000 and verify it with Python.',
    icon: Calculator,
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  },
  {
    title: 'Professional Writing',
    prompt: 'Write a professional email for a job application.',
    icon: Mail,
    iconBg: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
  }
];

export default function WelcomeScreen({ onSelectPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[62vh] px-4 my-auto animate-fadeIn">
      {/* Gemini-inspired Sparkle Hero Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#202124] border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-300 mb-5 shadow-2xs">
        <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>Askio Intelligence</span>
      </div>

      {/* Hero Greeting */}
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-center mb-3">
        <span className="askio-gradient-text">Askio</span>
      </h1>
      <p className="text-base sm:text-xl font-medium text-slate-500 dark:text-slate-400 text-center max-w-lg mx-auto mb-10 leading-relaxed">
        Your AI. Your Answers. Askio.
      </p>

      {/* 2x2 / 4-card Suggestion Grid */}
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
        {SUGGESTED_PROMPTS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.prompt)}
              type="button"
              className="group relative p-4 rounded-2xl bg-slate-50/80 dark:bg-[#1E1F20] hover:bg-white dark:hover:bg-[#282A2C] border border-slate-200/80 dark:border-slate-800 hover:border-blue-400/50 dark:hover:border-blue-500/40 hover:shadow-md dark:hover:shadow-black/30 transition-all duration-200 text-left flex flex-col justify-between min-h-[126px] cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className={`p-2 rounded-xl ${item.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                  <Icon className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {item.prompt}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
