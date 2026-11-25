import React from 'react';
import { Globe, CloudSun, Calculator, Mail, ArrowUpRight } from 'lucide-react';
import { AskioLogoIcon, AskioWordmark } from './AskioLogo';

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
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 px-2 sm:px-4 my-auto">
      {/* Floating Hero Askio Brand Emblem */}
      <div className="relative mb-4 sm:mb-5 animate-floatSlow">
        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-sky-400/25 via-indigo-500/25 to-purple-500/25 blur-xl pointer-events-none" />
        <AskioLogoIcon className="relative w-14 h-14 sm:w-20 sm:h-20 shadow-xl shadow-indigo-500/15 rounded-2xl" animated />
      </div>

      {/* Wordmark & Tagline */}
      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-center mb-1.5 sm:mb-2 animate-fadeIn">
        <AskioWordmark className="text-3xl sm:text-5xl" />
      </h1>
      <p className="text-sm sm:text-lg font-medium text-slate-500 dark:text-slate-400 text-center max-w-lg mx-auto mb-6 sm:mb-10 leading-relaxed animate-fadeIn">
        Your AI. Your Answers. Askio.
      </p>

      {/* Staggered 4-card Suggestion Grid (2x2 on mobile, 4-col on desktop) */}
      <div className="w-full max-w-3xl grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-left">
        {SUGGESTED_PROMPTS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.prompt)}
              type="button"
              style={{ animationDelay: `${index * 65}ms` }}
              className="opacity-0 animate-messageIn group relative p-3 sm:p-4 rounded-2xl bg-slate-50/90 dark:bg-[#1E1F20] hover:bg-white dark:hover:bg-[#282A2C] border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5 dark:hover:shadow-black/40 transition-all duration-200 text-left flex flex-col justify-between min-h-[104px] sm:min-h-[126px] cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="flex items-center justify-between w-full mb-3">
                <span className={`p-2 rounded-xl ${item.iconBg} transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
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
