'use client';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Mountain Range (Top) - Fixed Original Sage Green */}
      <path 
        d="M25 45C35 32 45 40 55 28C65 16 85 35 95 45" 
        stroke="#9CAF88" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Pine Tree (Left) - Fixed Original Forest Green */}
      <path 
        d="M35 62L41 55H38L44 48H41L47 41L32 41L38 48H35L41 55H38L44 62" 
        fill="#2D5A27"
        transform="translate(-7, 0)"
      />
      <rect x="29" y="62" width="2.5" height="3" fill="#2D5A27" />

      {/* Main Caravan Body - Fixed Original Forest Green */}
      {/* Upper shell */}
      <path 
        d="M48 45H78C84 45 87 48 87 54V62C87 64 85 66 82 66H48C45 66 43 64 43 60V50C43 47 45 45 48 45Z" 
        stroke="#2D5A27" 
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Lower solid half */}
      <path 
        d="M43 56V62C43 64 45 66 48 66H82C85 66 87 64 87 62V56H43Z" 
        fill="#2D5A27"
      />
      
      {/* Window Details - Using fixed white to preserve original contrast */}
      <rect x="49" y="49" width="12" height="6" rx="1.5" stroke="#2D5A27" strokeWidth="1.8" fill="white" />
      <path d="M64 49H72V61H64V49Z" stroke="#2D5A27" strokeWidth="1.8" fill="white" />
      <circle cx="70" cy="55" r="0.8" fill="#2D5A27" />
      <rect x="76" y="49" width="6" height="6" rx="1.5" stroke="#2D5A27" strokeWidth="1.5" fill="white" />

      {/* Center Wheel */}
      <circle cx="58" cy="66" r="6" fill="white" stroke="#2D5A27" strokeWidth="3" />
      <circle cx="58" cy="66" r="1.5" fill="#2D5A27" />

      {/* Main Ground Line - Fixed Original Forest Green */}
      <line x1="25" y1="69" x2="95" y2="69" stroke="#2D5A27" strokeWidth="2.5" strokeLinecap="round" />

      {/* Curved Orange Path - Fixed Original Sunset Orange */}
      <path 
        d="M38 78C50 71 70 71 90 73L87 77C70 75 50 75 38 82Z" 
        fill="#FF8C42" 
      />

      {/* Hitch Detail (Right side) */}
      <rect x="91" y="67" width="4" height="1.5" fill="#2D5A27" />
      <line x1="93" y1="67" x2="93" y2="72" stroke="#2D5A27" strokeWidth="1.8" />
    </svg>
  );
}
