import React, { useState, useEffect } from 'react';

interface LampAnimationProps {
  isOn: boolean;
  onToggle: () => void;
  onLampHit?: () => void;
  onLampGoesOff?: () => void;
  className?: string;
}

export const LampAnimation: React.FC<LampAnimationProps> = ({
  isOn,
  onToggle,
  onLampHit,
  onLampGoesOff,
  className = '',
}) => {
  const [isPulling, setIsPulling] = useState(false);
  // carState: 'off' | 'driving' | 'crashed' | 'ready'
  const [carState, setCarState] = useState<'off' | 'driving' | 'crashed' | 'ready'>('off');
  // Visual states for the blast & lamp power
  const [isBlasting, setIsBlasting] = useState(false);
  const [lampShake, setLampShake] = useState(false);
  const [lampDamaged, setLampDamaged] = useState(false);

  // Play pull-switch click sound
  const playClickSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.045);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch {}
  };

  // Play car racing vroom sound
  const playCarDrivingAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.42);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {}
  };

  // Play massive explosive BLAST sound effect
  const playBlastSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // 1. Deep explosive sub-bass boom
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.65);

      gain.gain.setValueAtTime(0.8, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);

      // 2. White noise fiery burst
      const bufferSize = Math.floor(ctx.sampleRate * 0.55);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.55);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.65, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();
    } catch {}
  };

  const handlePullCord = () => {
    if (isPulling) return;
    setIsPulling(true);
    playClickSound();

    setTimeout(() => {
      onToggle();
    }, 120);

    setTimeout(() => {
      setIsPulling(false);
    }, 380);
  };

  // Main Car Driving -> Blast -> Lamp Goes Off Sequence
  useEffect(() => {
    if (isOn) {
      // Step 1: Car starts speeding towards the lamp
      setCarState('driving');
      setIsBlasting(false);
      setLampShake(false);
      setLampDamaged(false);
      playCarDrivingAudio();

      // Step 2: Car slams into lamp at ~500ms -> BLAST HAPPENS!
      const blastTimer = setTimeout(() => {
        setCarState('crashed');
        setIsBlasting(true);
        setLampShake(true);
        playBlastSound();

        // Step 3: After the blast (at ~850ms), the lamp goes OFF!
        const lampOffTimer = setTimeout(() => {
          setIsBlasting(false);
          setLampShake(false);
          setLampDamaged(true);

          // Tell parent that the blast finished, lamp goes off, and login page should pop up
          if (onLampGoesOff) {
            onLampGoesOff();
          } else if (onLampHit) {
            onLampHit();
          }
        }, 400);

        return () => clearTimeout(lampOffTimer);
      }, 500);

      return () => {
        clearTimeout(blastTimer);
      };
    } else {
      // When turned off manually or reset
      setCarState('off');
      setIsBlasting(false);
      setLampShake(false);
    }
  }, [isOn]);

  return (
    <div className={`relative flex flex-col items-center select-none w-full overflow-hidden ${className}`}>
      {/* Upper Scene Container: Lamp + Road + Driving Car + Blast */}
      <div className="relative w-full max-w-sm h-48 flex items-center justify-center">
        
        {/* CAR ANIMATION ELEMENT */}
        <div
          className={`absolute z-30 pointer-events-none transition-all ${
            carState === 'off'
              ? '-translate-x-[260px] opacity-0 bottom-4'
              : carState === 'driving'
              ? 'translate-x-[-10px] opacity-100 bottom-4 duration-500 ease-in'
              : carState === 'crashed'
              ? 'translate-x-[-16px] -rotate-6 opacity-100 bottom-4 duration-75 ease-out'
              : 'translate-x-[-14px] -rotate-3 opacity-100 bottom-4 duration-300'
          }`}
          style={{
            left: 'calc(50% - 95px)',
          }}
        >
          {/* Animated Red Sports Car SVG */}
          <div className="relative w-28 h-14">
            <svg viewBox="0 0 140 70" className="w-full h-full drop-shadow-lg">
              <defs>
                {/* Red Car Paint Gradient */}
                <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="60%" stopColor="#dc2626" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </linearGradient>

                {/* Car Windshield Gradient */}
                <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                {/* Headlight beam */}
                <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(254, 240, 138, 0.9)" />
                  <stop offset="100%" stopColor="rgba(254, 240, 138, 0)" />
                </linearGradient>
              </defs>

              {/* Headlight Ray beaming forward from front bumper when driving */}
              {carState === 'driving' && (
                <polygon
                  points="132,45 170,25 170,65"
                  fill="url(#headlightBeam)"
                  className="opacity-75 animate-pulse"
                />
              )}

              {/* Exhaust Smoke puffs when driving */}
              {carState === 'driving' && (
                <g className="animate-ping opacity-60">
                  <circle cx="4" cy="50" r="4" fill="#94a3b8" />
                  <circle cx="-5" cy="52" r="3" fill="#cbd5e1" />
                </g>
              )}

              {/* Smoke drifting from crushed hood after crash */}
              {(carState === 'crashed' || lampDamaged) && (
                <g className="animate-bounce opacity-70">
                  <circle cx="128" cy="30" r="5" fill="#64748b" />
                  <circle cx="134" cy="20" r="7" fill="#475569" />
                  <circle cx="124" cy="12" r="9" fill="#334155" />
                </g>
              )}

              {/* Car Body Main Shell */}
              <path
                d="M 10 50 L 22 50 C 24 40, 36 40, 38 50 L 92 50 C 94 40, 106 40, 108 50 L 132 50 C 135 50, 138 46, 136 42 L 128 36 C 122 35, 114 34, 106 28 L 86 16 C 80 12, 54 12, 42 16 L 24 28 C 16 32, 10 38, 8 44 Z"
                fill="url(#carBodyGrad)"
                stroke="#991b1b"
                strokeWidth="1.5"
              />

              {/* Front Windshield and Side Windows */}
              <path
                d="M 44 18 L 84 18 L 102 28 L 88 28 L 40 28 Z"
                fill="url(#glassGrad)"
                stroke="#0369a1"
                strokeWidth="1"
              />
              <path
                d="M 28 28 L 38 28 L 40 20 L 28 26 Z"
                fill="url(#glassGrad)"
              />

              {/* Headlight Lens */}
              <ellipse
                cx="134"
                cy="44"
                rx="4"
                ry="3"
                fill={carState === 'driving' ? '#fef08a' : '#475569'}
                stroke="#ca8a04"
                strokeWidth="1"
              />

              {/* Crushed Front Bumper on impact */}
              {carState !== 'off' && carState !== 'driving' && (
                <path
                  d="M 132 38 L 137 44 L 128 50"
                  stroke="#7f1d1d"
                  strokeWidth="2.5"
                  fill="none"
                />
              )}

              {/* Left Wheel */}
              <g className={carState === 'driving' ? 'animate-spin' : ''}>
                <circle cx="30" cy="50" r="9" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="30" cy="50" r="4.5" fill="#94a3b8" />
                <circle cx="30" cy="50" r="1.5" fill="#475569" />
              </g>

              {/* Right Wheel */}
              <g className={carState === 'driving' ? 'animate-spin' : ''}>
                <circle cx="100" cy="50" r="9" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="100" cy="50" r="4.5" fill="#94a3b8" />
                <circle cx="100" cy="50" r="1.5" fill="#475569" />
              </g>

              {/* Sports Car Rear Spoiler */}
              <path
                d="M 10 34 L 6 26 L 16 26 L 14 34 Z"
                fill="#b91c1c"
                stroke="#7f1d1d"
                strokeWidth="1"
              />
            </svg>
          </div>
        </div>

        {/* ========================================================
            DRAMATIC EXPLOSION / BLAST EFFECT ON COLLISION
           ======================================================== */}
        {isBlasting && (
          <div className="absolute z-50 left-[calc(50%-45px)] bottom-8 pointer-events-none flex items-center justify-center">
            {/* Multi-layered fiery shockwave & blast SVG */}
            <div className="relative w-28 h-28 animate-ping">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                {/* Outer Orange Fire Spikes */}
                <polygon
                  points="50,0 62,35 98,32 72,55 88,88 50,70 12,88 28,55 2,32 38,35"
                  fill="#f97316"
                  opacity="0.9"
                />
                {/* Mid Bright Yellow Core */}
                <polygon
                  points="50,12 59,38 85,36 67,54 78,78 50,65 22,78 33,54 15,36 41,38"
                  fill="#facc15"
                />
                {/* White Hot Explosion Center */}
                <circle cx="50" cy="50" r="16" fill="#ffffff" />
              </svg>
            </div>

            {/* Glowing Blast Shockwave Ring */}
            <div className="absolute w-36 h-36 rounded-full border-4 border-amber-400 bg-amber-500/20 blur-xs animate-ping" />

            {/* Comic Blast Label */}
            <div className="absolute -top-3 text-white font-black text-xs px-2.5 py-0.5 rounded-full bg-red-600 border border-yellow-300 shadow-xl uppercase tracking-wider animate-bounce select-none">
              💥 BLAST!
            </div>
          </div>
        )}

        {/* ========================================================
            THE TABLE LAMP (SHAKES DURING BLAST, GOES OFF AFTER BLAST)
           ======================================================== */}
        <div 
          className={`relative z-20 w-44 h-36 flex items-center justify-center transition-transform ${
            lampShake
              ? 'rotate-12 scale-110 duration-75 animate-bounce'
              : lampDamaged
              ? '-rotate-6 duration-300'
              : 'rotate-0 duration-300'
          }`}
        >
          <svg
            viewBox="0 0 200 160"
            className="w-full h-full overflow-visible drop-shadow-md"
          >
            <defs>
              {/* Lampshade On Gradient */}
              <linearGradient id="shadeOnGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#fef3c7" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>

              {/* Lampshade Off / Damaged Gradient */}
              <linearGradient id="shadeOffGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Stem Metallic Gradient */}
              <linearGradient id="stemGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>

              {/* Pull Cord Bead Glow Filter */}
              <filter id="beadGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.5" />
              </filter>

              {/* Warm Lamp Glow Filter */}
              <filter id="lampGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Lamp Base */}
            <ellipse
              cx="100"
              cy="148"
              rx="38"
              ry="9"
              fill="url(#stemGradient)"
              stroke="#475569"
              strokeWidth="1.5"
              className="transition-colors duration-300"
            />
            <ellipse
              cx="100"
              cy="146"
              rx="32"
              ry="6"
              fill={isOn && !lampDamaged ? '#f8fafc' : '#334155'}
              className="transition-colors duration-300"
            />

            {/* Lamp Stem / Vertical Pole (Target where car hits) */}
            <rect
              x="96.5"
              y="70"
              width="7"
              height="76"
              rx="3.5"
              fill="url(#stemGradient)"
              stroke="#475569"
              strokeWidth="1"
            />

            {/* Light Bulb under the shade: GOES OFF AFTER BLAST */}
            <circle
              cx="100"
              cy="76"
              r="12"
              fill={isOn && !lampDamaged ? '#fbbf24' : '#1e293b'}
              filter={isOn && !lampDamaged ? 'url(#lampGlow)' : undefined}
              className="transition-all duration-300"
            />

            {/* PULL CORD / CHAIN (Interactive) */}
            <g
              onClick={handlePullCord}
              className="cursor-pointer group"
            >
              {/* Extended click target area for easy tapping */}
              <rect
                x="122"
                y="65"
                width="36"
                height="80"
                fill="transparent"
              />

              {/* Pull Chain Line */}
              <line
                x1="134"
                y1="72"
                x2="134"
                y2={isPulling ? 122 : 98}
                stroke={isOn && !lampDamaged ? '#f59e0b' : '#94a3b8'}
                strokeWidth="2"
                strokeDasharray="2.5 2"
                strokeLinecap="round"
                className="transition-all duration-150 ease-out"
              />

              {/* Pull Chain Bead / Ball */}
              <circle
                cx="134"
                cy={isPulling ? 124 : 100}
                r={isPulling ? 6.5 : 5.5}
                fill={isOn && !lampDamaged ? '#f59e0b' : '#e2e8f0'}
                stroke={isOn && !lampDamaged ? '#d97706' : '#64748b'}
                strokeWidth="1.5"
                filter={isOn && !lampDamaged ? 'url(#beadGlow)' : undefined}
                className="transition-all duration-150 ease-out group-hover:scale-125 group-active:scale-95"
              />
            </g>

            {/* Lamp Shade: GOES OFF AFTER BLAST (Turns dark) */}
            <path
              d="M 52 72 C 52 30, 80 20, 100 20 C 120 20, 148 30, 148 72 Z"
              fill={isOn && !lampDamaged ? 'url(#shadeOnGradient)' : 'url(#shadeOffGradient)'}
              stroke={isOn && !lampDamaged ? '#fef08a' : '#475569'}
              strokeWidth="2"
              filter={isOn && !lampDamaged ? 'url(#lampGlow)' : undefined}
              className="transition-all duration-300"
            />

            {/* Lampshade Top Finial */}
            <ellipse
              cx="100"
              cy="20"
              rx="7"
              ry="3.5"
              fill="url(#stemGradient)"
              stroke="#475569"
              strokeWidth="1"
            />

            {/* Lampshade Bottom Rim Highlight */}
            <ellipse
              cx="100"
              cy="72"
              rx="48"
              ry="6"
              fill={isOn && !lampDamaged ? '#fef08a' : '#1e293b'}
              stroke={isOn && !lampDamaged ? '#f59e0b' : '#334155'}
              strokeWidth="1"
              className="transition-colors duration-300"
            />
          </svg>

          {/* Ambient Warm Halo: GOES OFF AFTER BLAST */}
          {isOn && !lampDamaged && (
            <div className="absolute top-2 w-32 h-24 rounded-full bg-amber-300/35 blur-xl pointer-events-none animate-pulse" />
          )}

          {/* Pull Cord Hint if Light is Off or Damaged */}
          {(!isOn || lampDamaged) && (
            <div
              onClick={handlePullCord}
              className="absolute -right-3 top-20 bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-lg border border-amber-300 animate-bounce cursor-pointer flex items-center gap-1"
            >
              <span>{lampDamaged ? 'Pull to reboot' : 'Pull cord'}</span>
              <span>↓</span>
            </div>
          )}
        </div>
      </div>

      {/* Radiant Light Cone Projection: GOES OFF AFTER BLAST */}
      <div
        className={`pointer-events-none absolute top-32 w-[140%] -left-[20%] h-[580px] transition-opacity duration-500 ease-in-out z-0 ${
          isOn && !lampDamaged ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(254, 243, 199, 0.45) 0%, rgba(253, 230, 138, 0.22) 35%, rgba(245, 158, 11, 0.08) 65%, transparent 80%)',
          clipPath: 'polygon(38% 0%, 62% 0%, 100% 100%, 0% 100%)',
        }}
      />
    </div>
  );
};
