import React from 'react';
import { Bot, Lightbulb, BookOpen, Mail, ArrowUpRight } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    title: 'Explain AI Simply',
    prompt: 'Explain artificial intelligence in simple terms.',
    icon: Lightbulb,
    color: 'text-amber-600 bg-amber-50 border-amber-100'
  },
  {
    title: 'Productive Habits',
    prompt: 'Give me five productive habits for students.',
    icon: BookOpen,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
  },
  {
    title: 'Professional Email',
    prompt: 'Write a professional email for a job application.',
    icon: Mail,
    color: 'text-blue-600 bg-blue-50 border-blue-100'
  }
];

export default function WelcomeScreen({ onSelectPrompt }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[55vh] sm:min-h-[60vh] text-center px-4 my-auto">
      {/* Brand Icon */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-5">
        <Bot className="w-8 h-8 sm:w-9 sm:h-9" />
      </div>

      {/* Heading & Subtitle */}
      <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight mb-2">
        Askio
      </h2>
      <p className="text-sm sm:text-base text-[#64748B] max-w-md mx-auto mb-8 leading-relaxed">
        Your AI. Your Answers. Askio.
      </p>

      {/* Suggested Prompts Cards */}
      <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        {SUGGESTED_PROMPTS.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelectPrompt(item.prompt)}
              type="button"
              className="group p-3.5 sm:p-4 rounded-xl bg-white border border-[#E2E8F0] hover:border-blue-500/40 hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`p-1.5 rounded-lg border ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#172033] mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                  "{item.prompt}"
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
