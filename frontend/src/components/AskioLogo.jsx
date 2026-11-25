import React, { useId } from 'react';

/**
 * Reusable Askio Brand Logo Icon & Wordmark matching the official dark squircle + gradient A + orbital swoosh + sparkle design.
 */
export function AskioLogoIcon({ className = 'w-8 h-8', animated = false }) {
  const uid = useId().replace(/:/g, '');
  const bgId = `askio-bg-${uid}`;
  const aGradId = `askio-a-${uid}`;
  const swooshId = `askio-swoosh-${uid}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      className={`${className} ${animated ? 'animate-logoPulse' : ''}`}
      aria-label="Askio Logo"
    >
      <defs>
        <linearGradient id={bgId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B0F26" />
          <stop offset="100%" stopColor="#191645" />
        </linearGradient>
        <linearGradient id={aGradId} x1="15%" y1="15%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id={swooshId} x1="10%" y1="70%" x2="90%" y2="40%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="55%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>

      <rect width="100" height="100" rx="24" fill={`url(#${bgId})`} />

      <path
        d="M27 77 L45 27 C46.5 23 50.5 23 52 27 L70 77"
        stroke={`url(#${aGradId})`}
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M17 65 C33 47 59 46 77 56"
        stroke="#0E112D"
        strokeWidth="10"
        strokeLinecap="round"
      />

      <path
        d="M16 66 C33 47 59 45 78 56 C79.5 57 79 60 76.5 60 C58 51 35 53 18 67.5 C16.5 68.5 14.8 67.2 16 66 Z"
        fill={`url(#${swooshId})`}
      />

      <path
        d="M75 18 C75.7 23.8 77.2 25.3 83 26 C77.2 26.7 75.7 28.2 75 34 C74.3 28.2 72.8 26.7 67 26 C72.8 25.3 74.3 23.8 75 18 Z"
        fill="#FFFFFF"
        className={animated ? 'origin-[75px_26px] animate-sparkleTwinkle' : ''}
      />
    </svg>
  );
}

/**
 * Askio Wordmark with signature blue-violet gradient 'o' as shown in brand guidelines.
 */
export function AskioWordmark({ className = 'text-base' }) {
  return (
    <span className={`font-bold tracking-tight text-slate-950 dark:text-white select-none ${className}`}>
      Aski
      <span className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
        o
      </span>
    </span>
  );
}
