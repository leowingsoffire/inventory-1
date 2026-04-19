'use client';

import { motion } from 'framer-motion';
import type { AiAvatar } from '@/lib/ai-avatars';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Colour helpers                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */
function darken(hex: string, n: number) {
  const v = parseInt(hex.replace('#', ''), 16);
  return `#${(Math.max(0, (v >> 16) - n) << 16 | Math.max(0, ((v >> 8) & 255) - n) << 8 | Math.max(0, (v & 255) - n)).toString(16).padStart(6, '0')}`;
}
function lighten(hex: string, n: number) {
  const v = parseInt(hex.replace('#', ''), 16);
  return `#${(Math.min(255, (v >> 16) + n) << 16 | Math.min(255, ((v >> 8) & 255) + n) << 8 | Math.min(255, (v & 255) + n)).toString(16).padStart(6, '0')}`;
}
function rgba(hex: string, a: number) {
  const v = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${a})`;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Hyper-Realistic Korean Actress-Quality Face — 200×200 viewBox        */
/*  Advanced: SVG lighting, texture noise, mood expressions, full        */
/*  makeup (eyeshadow, eyeliner, lip style), hair highlights, etc.       */
/* ═══════════════════════════════════════════════════════════════════════ */
function FaceSVG({ face, uid }: { face: AiAvatar['face']; uid: string }) {
  const sk = face.skinTone;
  const skD = darken(sk, 15);
  const skD2 = darken(sk, 28);
  const skD3 = darken(sk, 42);
  const skL = lighten(sk, 14);
  const skL2 = lighten(sk, 24);
  const hc = face.hairColor;
  const hcH = face.hairHighlight;
  const hcL = lighten(hc, 35);

  /* ── Mouth shape per mood ── */
  const mouthData: Record<string, { u: string; l: string; teeth?: boolean; dimple?: boolean }> = {
    smile:      { u: 'M80,131 Q88,128 96,129 Q99,127 100,127.5 Q101,127 104,129 Q112,128 120,131', l: 'M80,131 Q90,139 100,140 Q110,139 120,131', teeth: true, dimple: true },
    wink:       { u: 'M82,131 Q90,128 97,129 Q99,127 100,128 Q101,127 103,129 Q110,128 118,131', l: 'M82,131 Q90,136 100,137 Q110,136 118,131' },
    gentle:     { u: 'M83,132 Q90,130 97,130 Q99,129 100,129.5 Q101,129 103,130 Q110,130 117,132', l: 'M83,132 Q90,136 100,137 Q110,136 117,132', dimple: true },
    playful:    { u: 'M80,130 Q88,127 96,128 Q99,126 100,127 Q101,126 104,128 Q112,127 120,130', l: 'M80,130 Q90,140 100,142 Q110,140 120,130', teeth: true, dimple: true },
    confident:  { u: 'M82,132 Q90,129 97,130 Q99,128 100,129 Q101,128 103,130 Q110,129 118,132', l: 'M82,132 Q92,137 100,138 Q108,137 118,132' },
    shy:        { u: 'M85,132 Q92,130 97,131 Q99,130 100,130.5 Q101,130 103,131 Q108,130 115,132', l: 'M85,132 Q92,135 100,135.5 Q108,135 115,132' },
    cheerful:   { u: 'M79,130 Q87,126 95,128 Q99,125 100,126 Q101,125 105,128 Q113,126 121,130', l: 'M79,130 Q90,141 100,143 Q110,141 121,130', teeth: true, dimple: true },
    cool:       { u: 'M83,132 Q90,130 97,131 Q99,130 100,130.5 Q101,130 103,131 Q110,130 117,132', l: 'M83,132 Q90,135 100,135.5 Q110,135 117,132' },
    caring:     { u: 'M82,131 Q89,128 96,129 Q99,127.5 100,128 Q101,127.5 104,129 Q111,128 118,131', l: 'M82,131 Q90,137 100,138 Q110,137 118,131', dimple: true },
    mysterious: { u: 'M84,132 Q90,130 97,131 Q99,129 100,130 Q101,129 103,131 Q110,130 116,132', l: 'M84,132 Q92,135 100,136 Q108,135 116,132' },
  };
  const mouth = mouthData[face.mood] ?? mouthData.smile!;
  const isWink = face.mood === 'wink';

  /* ── Eyeliner/lash thickness ── */
  const linerW: Record<string, number> = { wing: 1.8, sharp: 2, natural: 1.2, doll: 1.6, smoky: 2.3, cat: 2, bold: 2.6, precise: 1.4, soft: 1 };
  const lw = linerW[face.eyeliner] ?? 1.5;
  const hasWing = ['wing', 'cat', 'sharp'].includes(face.eyeliner);
  const isSmoky = face.eyeliner === 'smoky';

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Multi-stop skin radial — subsurface scattering */}
        <radialGradient id={`sk-${uid}`} cx="48%" cy="44%" r="42%">
          <stop offset="0%" stopColor={skL2} />
          <stop offset="20%" stopColor={skL} />
          <stop offset="55%" stopColor={sk} />
          <stop offset="82%" stopColor={skD} />
          <stop offset="100%" stopColor={skD2} />
        </radialGradient>
        {/* Warm subsurface layer */}
        <radialGradient id={`ss-${uid}`} cx="50%" cy="46%" r="38%">
          <stop offset="0%" stopColor="#ffccaa" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#ffccaa" stopOpacity="0" />
        </radialGradient>
        {/* Forehead glow */}
        <radialGradient id={`fg-${uid}`} cx="50%" cy="28%" r="28%">
          <stop offset="0%" stopColor="white" stopOpacity="0.22" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        {/* Cheek blush */}
        <radialGradient id={`bl-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={face.blush} stopOpacity="0.44" />
          <stop offset="45%" stopColor={face.blush} stopOpacity="0.15" />
          <stop offset="100%" stopColor={face.blush} stopOpacity="0" />
        </radialGradient>
        {/* Iris multi-layer */}
        <radialGradient id={`ir-${uid}`} cx="42%" cy="38%" r="50%">
          <stop offset="0%" stopColor={lighten(face.eyeColor, 45)} />
          <stop offset="30%" stopColor={face.eyeColor} />
          <stop offset="65%" stopColor={darken(face.eyeColor, 25)} />
          <stop offset="100%" stopColor={darken(face.eyeColor, 55)} />
        </radialGradient>
        {/* Lip gradient */}
        <radialGradient id={`lp-${uid}`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={lighten(face.lipColor, 40)} />
          <stop offset="40%" stopColor={face.lipColor} />
          <stop offset="100%" stopColor={darken(face.lipColor, 22)} />
        </radialGradient>
        {/* Eyeshadow */}
        <radialGradient id={`es-${uid}`} cx="50%" cy="65%" r="55%">
          <stop offset="0%" stopColor={face.eyeshadow} stopOpacity="0.38" />
          <stop offset="55%" stopColor={face.eyeshadow} stopOpacity="0.12" />
          <stop offset="100%" stopColor={face.eyeshadow} stopOpacity="0" />
        </radialGradient>
        {/* Nose highlight */}
        <linearGradient id={`nh-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.28" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        {/* Jaw shadow */}
        <radialGradient id={`jw-${uid}`} cx="50%" cy="88%" r="35%">
          <stop offset="0%" stopColor={skD3} stopOpacity="0.22" />
          <stop offset="100%" stopColor={skD3} stopOpacity="0" />
        </radialGradient>
        {/* Specular skin filter — 3D depth */}
        <filter id={`spec-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="3" specularConstant="0.5" specularExponent="18" result="specOut">
            <fePointLight x="80" y="60" z="120" />
          </feSpecularLighting>
          <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specClip" />
          <feComposite in="SourceGraphic" in2="specClip" operator="arithmetic" k1="0" k2="1" k3="0.12" k4="0" />
        </filter>
        {/* Skin surface texture */}
        <filter id={`tx-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="4" result="n" />
          <feColorMatrix type="saturate" values="0" in="n" result="g" />
          <feBlend in="SourceGraphic" in2="g" mode="overlay" />
        </filter>
        {/* Blur filters */}
        <filter id={`b1-${uid}`}><feGaussianBlur stdDeviation="1" /></filter>
        <filter id={`b2-${uid}`}><feGaussianBlur stdDeviation="2.5" /></filter>
        <filter id={`b3-${uid}`}><feGaussianBlur stdDeviation="4" /></filter>
        {/* Diffuse light for cheeks / 3D shaping */}
        <filter id={`dif-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDiffuseLighting in="SourceAlpha" surfaceScale="4" diffuseConstant="0.7" result="diff">
            <feDistantLight azimuth="240" elevation="50" />
          </feDiffuseLighting>
          <feComposite in="diff" in2="SourceGraphic" operator="in" result="diffClip" />
          <feBlend in="SourceGraphic" in2="diffClip" mode="soft-light" />
        </filter>
      </defs>

      {/* ──── HAIR BACK (gentle sway) ──── */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0,100,0;-0.4,100,0;0,100,0;0.3,100,0;0,100,0" dur="6s" repeatCount="indefinite" />
        <HairBack s={face.hairStyle} hc={hc} hcH={hcH} hcL={hcL} uid={uid} />
      </g>

      {/* ──── NECK + SHOULDERS (subtle head tilt) ──── */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0,100,130;0.8,100,130;0,100,130;-0.6,100,130;0,100,130" dur="7s" repeatCount="indefinite" />
        <path d="M82,148 Q82,142 88,138 L112,138 Q118,142 118,148 L120,186 Q112,196 100,197 Q88,196 80,186 Z" fill={sk} />
        <ellipse cx="100" cy="143" rx="18" ry="4" fill={skD} opacity="0.14" filter={`url(#b1-${uid})`} />
        <path d="M85,160 Q94,157 100,158 Q106,157 115,160" stroke={skD} strokeWidth="0.5" fill="none" opacity="0.06" />
      </g>

      {/* ──── FACE — V-line jaw (specular lit) ──── */}
      <g filter={`url(#spec-${uid})`}>
        <path d="M44,82 Q40,56 56,36 Q72,18 100,16 Q128,18 144,36 Q160,56 156,82 L154,104 Q150,122 138,134 Q122,150 100,154 Q78,150 62,134 Q50,122 46,104 Z"
          fill={`url(#sk-${uid})`} />
      </g>
      {/* Subsurface scatter */}
      <path d="M48,82 Q44,58 60,40 Q76,22 100,20 Q124,22 140,40 Q156,58 152,82 L150,102 Q146,118 136,130 Q120,146 100,150 Q80,146 64,130 Q54,118 50,102 Z"
        fill={`url(#ss-${uid})`} />
      {/* Skin micro-texture */}
      <path d="M48,82 Q44,58 60,40 Q76,22 100,20 Q124,22 140,40 Q156,58 152,82 L150,102 Q146,118 136,130 Q120,146 100,150 Q80,146 64,130 Q54,118 50,102 Z"
        fill="transparent" filter={`url(#tx-${uid})`} opacity="0.025" />
      {/* Diffuse shading layer */}
      <path d="M48,82 Q44,58 60,40 Q76,22 100,20 Q124,22 140,40 Q156,58 152,82 L150,102 Q146,118 136,130 Q120,146 100,150 Q80,146 64,130 Q54,118 50,102 Z"
        fill={rgba(sk, 0.15)} filter={`url(#dif-${uid})`} />

      {/* Forehead glow */}
      <ellipse cx="100" cy="50" rx="38" ry="24" fill={`url(#fg-${uid})`} />
      {/* T-zone highlight */}
      <path d="M97,48 Q100,44 103,48 L103.5,106 Q100,109 96.5,106 Z" fill="white" opacity="0.045" />
      {/* Cheekbone highlights with diffuse feel */}
      <ellipse cx="66" cy="96" rx="13" ry="7" fill="white" opacity="0.065" transform="rotate(-8,66,96)" />
      <ellipse cx="134" cy="96" rx="13" ry="7" fill="white" opacity="0.065" transform="rotate(8,134,96)" />
      {/* Jaw contour */}
      <path d="M52,110 Q60,135 100,152 Q140,135 148,110 L148,122 Q136,142 100,158 Q64,142 52,122 Z"
        fill={`url(#jw-${uid})`} />

      {/* ──── BLUSH (animated glow pulse) ──── */}
      <ellipse cx="66" cy="108" rx="17" ry="11" fill={`url(#bl-${uid})`}>
        <animate attributeName="opacity" values="1;0.7;1" dur="3.5s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="134" cy="108" rx="17" ry="11" fill={`url(#bl-${uid})`}>
        <animate attributeName="opacity" values="1;0.7;1" dur="3.5s" repeatCount="indefinite" />
      </ellipse>

      {/* Dimples (for dimple moods) */}
      {mouth.dimple && <>
        <ellipse cx="72" cy="126" rx="2" ry="3" fill={skD} opacity="0.06" />
        <ellipse cx="128" cy="126" rx="2" ry="3" fill={skD} opacity="0.06" />
      </>}

      {/* ──── NOSE (detailed) ──── */}
      <path d="M98,76 Q100,72 102,76 L103,105 Q100,108 97,105 Z" fill={`url(#nh-${uid})`} />
      <ellipse cx="100" cy="107" rx="6.5" ry="3.5" fill={skD} opacity="0.1" />
      <ellipse cx="100" cy="106" rx="4.5" ry="2.5" fill="white" opacity="0.055" />
      <ellipse cx="95.5" cy="109" rx="2.8" ry="1.6" fill={skD2} opacity="0.12" />
      <ellipse cx="104.5" cy="109" rx="2.8" ry="1.6" fill={skD2} opacity="0.12" />
      <path d="M93,88 Q94,100 95,108" stroke={skD} strokeWidth="0.6" fill="none" opacity="0.07" />
      <path d="M107,88 Q106,100 105,108" stroke={skD} strokeWidth="0.6" fill="none" opacity="0.07" />

      {/* ──── EYES ──── */}
      <RealisticEye cx={76} cy={88} face={face} uid={uid} side="left" lw={lw} hasWing={hasWing} isSmoky={isSmoky} isWink={false} />
      <RealisticEye cx={124} cy={88} face={face} uid={uid} side="right" lw={lw} hasWing={hasWing} isSmoky={isSmoky} isWink={isWink} />

      {/* ──── EYEBROWS — Korean straight/arch ──── */}
      <g>
        <path d="M57,70 Q64,64 76,65.5 Q84,66.5 88,69" stroke={hc} strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M59,70 Q65,65 76,66 Q83,67 87,69" stroke={hc} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.3" filter={`url(#b1-${uid})`} />
        {/* Hair detail strokes */}
        <path d="M62,69 L64,66.5" stroke={hc} strokeWidth="0.5" opacity="0.18" />
        <path d="M70,67 L72,65" stroke={hc} strokeWidth="0.5" opacity="0.18" />
        <path d="M79,67.5 L81,66" stroke={hc} strokeWidth="0.4" opacity="0.14" />

        <path d="M112,69 Q116,66.5 124,65.5 Q136,64 143,70" stroke={hc} strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M113,69 Q117,67 124,66 Q135,65 142,70" stroke={hc} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.3" filter={`url(#b1-${uid})`} />
        <path d="M119,67 L121,65" stroke={hc} strokeWidth="0.5" opacity="0.18" />
        <path d="M128,66 L130,64.5" stroke={hc} strokeWidth="0.5" opacity="0.18" />
        <path d="M137,68 L139,66.5" stroke={hc} strokeWidth="0.4" opacity="0.14" />
      </g>

      {/* ──── LIPS — mood + style (subtle breathing anim) ──── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-0.4;0,0" dur="4s" repeatCount="indefinite" />
        {/* Lip shadow */}
        <ellipse cx="100" cy="138" rx="16" ry="3" fill={skD2} opacity="0.05" filter={`url(#b1-${uid})`} />
        {/* Upper lip */}
        <path d={mouth.u} fill={`url(#lp-${uid})`} opacity={face.lipStyle === 'matte' ? '0.95' : '0.88'} />
        {/* Lower lip */}
        <path d={mouth.l} fill={`url(#lp-${uid})`} opacity={face.lipStyle === 'matte' ? '0.9' : '0.82'} />
        {/* Lip line */}
        <path d={mouth.u} stroke={darken(face.lipColor, 32)} strokeWidth="0.45" fill="none" opacity="0.28" />

        {/* Teeth hint for open-mouth moods */}
        {mouth.teeth && (
          <ellipse cx="100" cy="134" rx="10" ry="4" fill="white" opacity="0.12" />
        )}

        {/* Lip gloss / highlight per style */}
        {(face.lipStyle === 'glossy' || face.lipStyle === 'gradient') && (
          <ellipse cx="100" cy="129" rx="7" ry="2" fill="white" opacity="0.22" />
        )}
        <ellipse cx="100" cy="134" rx="8" ry="2.5" fill="white" opacity={face.lipStyle === 'glossy' ? '0.22' : '0.1'} />

        {/* Ombre effect — Korean gradient lip */}
        {(face.lipStyle === 'ombre' || face.lipStyle === 'gradient') && (
          <>
            <path d={mouth.u} fill={lighten(face.lipColor, 35)} opacity="0.25" />
            <ellipse cx="100" cy="131" rx="6" ry="3.5" fill={face.lipColor} opacity="0.42" />
          </>
        )}

        {/* Full lip style — saturated coverage */}
        {face.lipStyle === 'full' && (
          <>
            <path d={mouth.l} fill={darken(face.lipColor, 8)} opacity="0.25" />
            <ellipse cx="100" cy="133" rx="9" ry="3" fill="white" opacity="0.06" />
          </>
        )}
      </g>

      {/* ──── HAIR FRONT (gentle sway animation) ──── */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0,100,0;0.6,100,0;0,100,0;-0.5,100,0;0,100,0" dur="5s" repeatCount="indefinite" />
        <HairFront s={face.hairStyle} hc={hc} hcH={hcH} hcL={hcL} uid={uid} />
      </g>

      {/* ──── ACCESSORIES ──── */}
      {face.accessory === 'glasses' && (
        <g>
          <path d="M59,87 Q59,77 69,77 L83,77 Q89,77 89,87 Q89,97 79,99 L69,99 Q59,97 59,87 Z"
            stroke="#9999bb" strokeWidth="1.3" fill={rgba('#c8d8f0', 0.06)} />
          <path d="M111,87 Q111,77 121,77 L135,77 Q141,77 141,87 Q141,97 131,99 L121,99 Q111,97 111,87 Z"
            stroke="#9999bb" strokeWidth="1.3" fill={rgba('#c8d8f0', 0.06)} />
          <path d="M89,85 Q94,81 100,81 Q106,81 111,85" stroke="#9999bb" strokeWidth="1" fill="none" />
          <line x1="59" y1="83" x2="46" y2="79" stroke="#9999bb" strokeWidth="0.8" />
          <line x1="141" y1="83" x2="154" y2="79" stroke="#9999bb" strokeWidth="0.8" />
          <ellipse cx="69" cy="83" rx="5" ry="4" fill="white" opacity="0.06" transform="rotate(-15,69,83)" />
          <ellipse cx="127" cy="83" rx="5" ry="4" fill="white" opacity="0.06" transform="rotate(-15,127,83)" />
        </g>
      )}
      {face.accessory === 'headband' && (
        <g>
          <path d="M38,50 Q56,28 100,24 Q144,28 162,50"
            stroke={face.lipColor} strokeWidth="5.5" fill="none" opacity="0.42" strokeLinecap="round" />
          <path d="M38,50 Q56,28 100,24 Q144,28 162,50"
            stroke="white" strokeWidth="1.5" fill="none" opacity="0.1" strokeLinecap="round" />
          {/* Bow */}
          <ellipse cx="142" cy="40" rx="6" ry="4.5" fill={face.lipColor} opacity="0.32" transform="rotate(20,142,40)" />
          <ellipse cx="150" cy="38" rx="5.5" ry="3.5" fill={face.lipColor} opacity="0.28" transform="rotate(-10,150,38)" />
        </g>
      )}
      {face.accessory === 'earrings' && (
        <g>
          <line x1="42" y1="108" x2="40" y2="119" stroke="white" strokeWidth="0.5" opacity="0.28" />
          <circle cx="40" cy="121" r="3.5" fill="white" opacity="0.35" />
          <circle cx="40" cy="121" r="2" fill="white" opacity="0.65" />
          <circle cx="39" cy="120" r="0.8" fill="white" opacity="0.9" />
          {/* Earring swing animation — left */}
          <animateTransform attributeName="transform" type="rotate" values="0,41,108;3,41,108;0,41,108;-2,41,108;0,41,108" dur="4s" repeatCount="indefinite" />
          <line x1="158" y1="108" x2="160" y2="119" stroke="white" strokeWidth="0.5" opacity="0.28" />
          <circle cx="160" cy="121" r="3.5" fill="white" opacity="0.35" />
          <circle cx="160" cy="121" r="2" fill="white" opacity="0.65" />
          <circle cx="161" cy="120" r="0.8" fill="white" opacity="0.9" />
        </g>
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Hyper-Realistic Eye — with eyeshadow, eyeliner, iris detail          */
/* ═══════════════════════════════════════════════════════════════════════ */
function RealisticEye({ cx, cy, face, uid, side, lw, hasWing, isSmoky, isWink }: {
  cx: number; cy: number; face: AiAvatar['face']; uid: string; side: 'left' | 'right';
  lw: number; hasWing: boolean; isSmoky: boolean; isWink: boolean;
}) {
  const f = side === 'right' ? -1 : 1;
  const hc = face.hairColor;
  const lashC = darken(hc, 20);

  // ── Wink — closed eye
  if (isWink) {
    return (
      <g>
        <ellipse cx={cx} cy={cy - 3} rx="16" ry="11" fill={`url(#es-${uid})`} />
        {isSmoky && <ellipse cx={cx} cy={cy - 2} rx="18" ry="12" fill={face.eyeshadow} opacity="0.12" filter={`url(#b2-${uid})`} />}
        <path d={`M${cx - 14},${cy + 1} Q${cx},${cy - 5} ${cx + 14},${cy + 1}`}
          stroke={lashC} strokeWidth={lw + 0.3} fill="none" strokeLinecap="round" />
        {/* Lashes on closed eye */}
        {[-11, -7, -2, 3, 7, 11].map((o, i) => (
          <path key={i} d={`M${cx + o},${cy + 1 - Math.abs(o) * 0.18} L${cx + o + o * 0.12},${cy - 5 - (7 - Math.abs(o) * 0.5)}`}
            stroke={lashC} strokeWidth="0.8" opacity={0.35 + (1 - Math.abs(o) / 13) * 0.2} />
        ))}
        {/* Aegyo-sal */}
        <path d={`M${cx - 11},${cy + 4} Q${cx},${cy + 9} ${cx + 11},${cy + 4}`} fill="white" opacity="0.07" />
      </g>
    );
  }

  return (
    <g>
      {/* Eye socket shadow */}
      <ellipse cx={cx} cy={cy + 2} rx="17" ry="9" fill={darken(face.skinTone, 10)} opacity="0.06" filter={`url(#b2-${uid})`} />

      {/* Eyeshadow — multi-layer Korean gradient */}
      <ellipse cx={cx} cy={cy - 4} rx="16" ry="11" fill={`url(#es-${uid})`} />
      {/* Extended eyeshadow for smoky/bold styles */}
      {isSmoky && <ellipse cx={cx} cy={cy - 2} rx="19" ry="13" fill={face.eyeshadow} opacity="0.14" filter={`url(#b3-${uid})`} />}
      {/* Upper lid crease eyeshadow accent */}
      <path d={`M${cx - 14},${cy} Q${cx},${cy - 15} ${cx + 14},${cy}`}
        fill={face.eyeshadow} opacity="0.08" />

      {/* Sclera — naturalistic almond */}
      <path d={`M${cx - 15},${cy + 1} Q${cx - 8},${cy - 10.5} ${cx},${cy - 11} Q${cx + 8},${cy - 10.5} ${cx + 15},${cy + 1} Q${cx + 8},${cy + 9.5} ${cx},${cy + 9.5} Q${cx - 8},${cy + 9.5} ${cx - 15},${cy + 1} Z`}
        fill="#fefcf8" />
      {/* Sclera upper lid shadow */}
      <path d={`M${cx - 13},${cy - 2} Q${cx},${cy - 9} ${cx + 13},${cy - 2}`}
        fill={darken(face.skinTone, 18)} opacity="0.05" />
      {/* Sclera blood vessel hint */}
      <path d={`M${cx - 12},${cy} Q${cx - 8},${cy - 1} ${cx - 5},${cy + 1}`}
        stroke="#e8cccc" strokeWidth="0.3" fill="none" opacity="0.12" />
      <path d={`M${cx + 12},${cy + 1} Q${cx + 9},${cy} ${cx + 6},${cy + 1.5}`}
        stroke="#e8cccc" strokeWidth="0.25" fill="none" opacity="0.1" />

      {/* Iris — multi-gradient with limbal ring */}
      <circle cx={cx + f * 1} cy={cy + 0.5} r="7.8" fill={`url(#ir-${uid})`} />
      <circle cx={cx + f * 1} cy={cy + 0.5} r="7.5" stroke={darken(face.eyeColor, 50)} strokeWidth="0.7" fill="none" opacity="0.5" />
      <circle cx={cx + f * 1} cy={cy + 0.5} r="5" stroke={lighten(face.eyeColor, 15)} strokeWidth="0.3" fill="none" opacity="0.2" />
      {/* Iris radiating starburst */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => (
        <line key={a}
          x1={cx + f * 1 + Math.cos(a * Math.PI / 180) * 3}
          y1={cy + 0.5 + Math.sin(a * Math.PI / 180) * 3}
          x2={cx + f * 1 + Math.cos(a * Math.PI / 180) * 6.8}
          y2={cy + 0.5 + Math.sin(a * Math.PI / 180) * 6.8}
          stroke={lighten(face.eyeColor, 22)} strokeWidth="0.25" opacity="0.14" />
      ))}

      {/* Pupil — micro-saccade movement */}
      <circle cx={cx + f * 1} cy={cy + 0.5} r="3.8" fill="#080808">
        <animateTransform attributeName="transform" type="translate" values="0,0;0.6,0;0.3,-0.3;-0.3,0.2;0,0" dur="5s" repeatCount="indefinite" />
      </circle>

      {/* Catchlight — large primary (sparkle anim) */}
      <ellipse cx={cx + f * 4.5} cy={cy - 2.5} rx="3.2" ry="3.8" fill="white" opacity="0.88">
        <animate attributeName="opacity" values="0.88;0.6;0.88;0.95;0.88" dur="3s" repeatCount="indefinite" />
      </ellipse>
      {/* Secondary */}
      <circle cx={cx - f * 2.5} cy={cy + 3} r="1.4" fill="white" opacity="0.42">
        <animate attributeName="opacity" values="0.42;0.2;0.42;0.55;0.42" dur="4s" repeatCount="indefinite" />
      </circle>
      {/* Tertiary sparkle */}
      <circle cx={cx + f * 1.5} cy={cy + 1} r="0.6" fill="white" opacity="0.55">
        <animate attributeName="opacity" values="0.55;0.3;0.55;0.7;0.55" dur="2.5s" repeatCount="indefinite" />
      </circle>

      {/* Double eyelid fold — Korean beauty signature */}
      <path d={`M${cx - 16},${cy - 1} Q${cx - 8},${cy - 16} ${cx},${cy - 15.5} Q${cx + 8},${cy - 16} ${cx + 16},${cy - 1}`}
        stroke={darken(face.skinTone, 22)} strokeWidth="0.8" fill="none" opacity="0.3" />

      {/* Upper eyelid / lash line — eyeliner style */}
      <path d={`M${cx - 15.5},${cy + 1} Q${cx - 8},${cy - 11.5} ${cx},${cy - 11.5} Q${cx + 8},${cy - 11.5} ${cx + 15.5},${cy + 1}`}
        stroke={lashC} strokeWidth={lw} fill="none" strokeLinecap="round" />

      {/* Wing eyeliner extension */}
      {hasWing && side === 'left' && (
        <path d={`M${cx - 15},${cy + 1} L${cx - 20},${cy - 6}`} stroke={lashC} strokeWidth={lw * 0.7} strokeLinecap="round" />
      )}
      {hasWing && side === 'right' && (
        <path d={`M${cx + 15},${cy + 1} L${cx + 20},${cy - 6}`} stroke={lashC} strokeWidth={lw * 0.7} strokeLinecap="round" />
      )}

      {/* Individual upper lashes — feathered */}
      {[-12, -9, -5, -2, 2, 5, 9, 12].map((off, i) => {
        const lx = cx + off;
        const baseY = cy - 9.5 + Math.abs(off) * 0.16;
        const len = 5 + (3.5 - Math.abs(off) * 0.2);
        const tipX = lx + off * 0.18;
        return <line key={i} x1={lx} y1={baseY} x2={tipX} y2={baseY - len}
          stroke={lashC} strokeWidth="0.75" opacity={0.38 + (1 - Math.abs(off) / 14) * 0.28} />;
      })}

      {/* Lower lash line */}
      <path d={`M${cx - 13},${cy + 4} Q${cx},${cy + 10.5} ${cx + 13},${cy + 4}`}
        stroke={darken(hc, 10)} strokeWidth="0.5" fill="none" opacity="0.2" />

      {/* 애교살 Aegyo-sal (under-eye charm) */}
      <path d={`M${cx - 12},${cy + 6.5} Q${cx},${cy + 12.5} ${cx + 12},${cy + 6.5}`}
        fill="white" opacity="0.08" />
      <path d={`M${cx - 10},${cy + 7.5} Q${cx},${cy + 11.5} ${cx + 10},${cy + 7.5}`}
        fill="white" opacity="0.04" />

      {/* ── Blink animation — skin-colored eyelid overlay ── */}
      <ellipse cx={cx} cy={cy - 1} rx="16" ry="12" fill={face.skinTone}>
        <animate attributeName="ry" values="0;0;0;0;0;0;0;0;12;0;0;0;0;0;0;0;0;0;0;0;0;12;12;0;0;0;0;0;0;0" dur="6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;0;0;0;0;0;0;1;0;0;0;0;0;0;0;0;0;0;0;0;1;1;0;0;0;0;0;0;0" dur="6s" repeatCount="indefinite" />
      </ellipse>
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Hair Back (behind face) — realistic Korean actress hairstyles        */
/* ═══════════════════════════════════════════════════════════════════════ */
function HairBack({ s, hc, hcH, hcL, uid }: { s: string; hc: string; hcH: string; hcL: string; uid: string }) {
  const hcD = darken(hc, 18);
  const hcD2 = darken(hc, 32);
  /* Scalp/crown dome — shared by all styles */
  const dome = <path d="M36,75 Q30,44 56,24 Q76,8 100,6 Q124,8 144,24 Q170,44 164,75 L160,62 Q155,38 136,24 Q120,12 100,10 Q80,12 64,24 Q45,38 40,62 Z" fill={hc} />;
  /* Dome inner shadow for depth */
  const domeShadow = <path d="M42,70 Q38,48 58,30 Q78,14 100,12 Q122,14 142,30 Q162,48 158,70 L155,60 Q152,42 138,28 Q122,16 100,14 Q78,16 62,28 Q48,42 45,60 Z" fill={hcD} opacity="0.15" />;

  /* Strand line helpers */
  const strand = (d: string, c: string, w: number, o: number) =>
    <path key={d} d={d} stroke={c} strokeWidth={w} fill="none" opacity={o} strokeLinecap="round" />;

  switch (s) {
    /* ── Long Straight — flowing past shoulders, layered ── */
    case 'long-straight':
      return <g>{dome}{domeShadow}
        {/* Left hair mass — flowing layers */}
        <path d="M36,72 Q28,82 26,100 Q24,130 26,160 Q27,178 30,200 L58,200 Q56,178 54,155 Q52,130 52,108 Q52,92 52,82 Z" fill={hc} />
        <path d="M36,72 Q30,85 28,105 Q26,135 28,165 Q30,185 32,200 L44,200 Q42,182 40,160 Q38,135 38,110 Q38,90 40,78 Z" fill={hcD} opacity="0.3" />
        {/* Right hair mass */}
        <path d="M164,72 Q172,82 174,100 Q176,130 174,160 Q173,178 170,200 L142,200 Q144,178 146,155 Q148,130 148,108 Q148,92 148,82 Z" fill={hc} />
        <path d="M164,72 Q170,85 172,105 Q174,135 172,165 Q170,185 168,200 L156,200 Q158,182 160,160 Q162,135 162,110 Q162,90 160,78 Z" fill={hcD} opacity="0.3" />
        {/* Individual strand highlights — left */}
        {strand("M38,80 Q34,120 32,165 Q31,184 32,200", hcH, 2, 0.1)}
        {strand("M42,78 Q38,115 36,158 Q35,180 36,198", hcL, 1.5, 0.08)}
        {strand("M46,76 Q42,110 42,155 Q42,178 43,196", hcH, 1, 0.09)}
        {strand("M50,76 Q48,108 48,150 Q48,175 49,194", hcL, 1.2, 0.07)}
        {/* Individual strand highlights — right */}
        {strand("M162,80 Q166,120 168,165 Q169,184 168,200", hcH, 2, 0.1)}
        {strand("M158,78 Q162,115 164,158 Q165,180 164,198", hcL, 1.5, 0.08)}
        {strand("M154,76 Q158,110 158,155 Q158,178 157,196", hcH, 1, 0.09)}
        {strand("M150,76 Q152,108 152,150 Q152,175 151,194", hcL, 1.2, 0.07)}
        {/* Hair tips — natural tapered ends */}
        <path d="M30,194 Q34,200 42,200" stroke={hcD} strokeWidth="0.6" fill="none" opacity="0.15" />
        <path d="M170,194 Q166,200 158,200" stroke={hcD} strokeWidth="0.6" fill="none" opacity="0.15" />
      </g>;

    /* ── Medium Bob — C-curl inward at jawline, volumetric ── */
    case 'bob':
      return <g>{dome}{domeShadow}
        {/* Left hair mass — voluminous with inward C-curl */}
        <path d="M36,72 Q26,82 24,98 Q22,115 26,130 Q30,142 40,148 Q50,152 60,148 Q66,144 66,136 Q66,120 64,105 Q62,90 58,80 Z" fill={hc} />
        <path d="M36,72 Q28,84 26,102 Q24,118 28,134 Q32,144 42,148 L48,148 Q40,142 36,132 Q32,118 34,100 Q36,86 40,76 Z" fill={hcD} opacity="0.25" />
        {/* C-curl tip detail — left */}
        <path d="M40,144 Q48,154 62,150 Q68,146 66,138" fill={hc} />
        <path d="M42,146 Q50,152 60,148" stroke={hcD} strokeWidth="0.8" fill="none" opacity="0.12" />
        {/* Right hair mass — mirror C-curl */}
        <path d="M164,72 Q174,82 176,98 Q178,115 174,130 Q170,142 160,148 Q150,152 140,148 Q134,144 134,136 Q134,120 136,105 Q138,90 142,80 Z" fill={hc} />
        <path d="M164,72 Q172,84 174,102 Q176,118 172,134 Q168,144 158,148 L152,148 Q160,142 164,132 Q168,118 166,100 Q164,86 160,76 Z" fill={hcD} opacity="0.25" />
        {/* C-curl tip detail — right */}
        <path d="M160,144 Q152,154 138,150 Q132,146 134,138" fill={hc} />
        <path d="M158,146 Q150,152 140,148" stroke={hcD} strokeWidth="0.8" fill="none" opacity="0.12" />
        {/* Strand highlights */}
        {strand("M38,80 Q30,105 28,132 Q30,144 42,148", hcH, 1.8, 0.1)}
        {strand("M42,78 Q34,100 34,128 Q36,142 46,148", hcL, 1.2, 0.08)}
        {strand("M162,80 Q170,105 172,132 Q170,144 158,148", hcH, 1.8, 0.1)}
        {strand("M158,78 Q166,100 166,128 Q164,142 154,148", hcL, 1.2, 0.08)}
        {/* Volume highlight at crown */}
        <ellipse cx="100" cy="20" rx="28" ry="8" fill={hcL} opacity="0.06" />
      </g>;

    /* ── Ponytail — high gathered + flowing tail ── */
    case 'ponytail':
      return <g>{dome}{domeShadow}
        {/* Pulled-back sides — smooth, tight */}
        <path d="M36,72 Q32,86 36,100 L48,96 Q46,86 48,76 Z" fill={hc} />
        <path d="M164,72 Q168,86 164,100 L152,96 Q154,86 152,76 Z" fill={hc} />
        {/* Hair gathered at crown-back */}
        <ellipse cx="130" cy="24" rx="22" ry="18" fill={hc} transform="rotate(15,130,24)" />
        <ellipse cx="130" cy="24" rx="18" ry="14" fill={hcD} opacity="0.2" transform="rotate(15,130,24)" />
        {/* Scrunchie / hair tie */}
        <ellipse cx="142" cy="36" rx="8" ry="5" fill={darken(hc, 25)} opacity="0.6" transform="rotate(20,142,36)" />
        <ellipse cx="142" cy="36" rx="6" ry="3.5" fill={hcD2} opacity="0.3" transform="rotate(20,142,36)" />
        {/* Flowing ponytail — multiple layers for volume */}
        <path d="M142,40 Q158,65 160,100 Q162,135 156,165 Q152,182 144,192" fill={hc} stroke={hc} strokeWidth="18" strokeLinecap="round" />
        <path d="M140,42 Q155,68 157,105 Q159,138 154,168 Q150,185 142,195" fill="none" stroke={hcD} strokeWidth="14" strokeLinecap="round" opacity="0.2" />
        {/* Ponytail strand detail */}
        {strand("M142,42 Q156,70 158,108 Q160,142 154,172 Q150,188 142,196", hcH, 2, 0.12)}
        {strand("M140,44 Q154,72 155,112 Q156,145 152,174", hcL, 1.5, 0.09)}
        {strand("M144,38 Q160,62 162,98 Q164,132 158,162", hcH, 1.2, 0.08)}
        {/* Ponytail tip — natural tapered strands */}
        <path d="M144,188 Q148,196 146,200" stroke={hc} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.7" />
        <path d="M148,186 Q152,194 150,200" stroke={hc} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M152,184 Q154,190 154,196" stroke={hc} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
        {/* Pulled-back texture lines */}
        {strand("M52,50 Q80,30 120,24", hcD, 0.6, 0.1)}
        {strand("M48,58 Q76,38 116,28", hcD, 0.5, 0.08)}
      </g>;

    /* ── Bangs (curtain) — long hair with see-through Korean bangs ── */
    case 'bangs':
      return <g>{dome}{domeShadow}
        {/* Left flowing hair */}
        <path d="M36,72 Q28,84 26,104 Q24,134 26,164 Q28,184 32,200 L56,200 Q54,180 52,155 Q50,130 52,108 Q52,90 52,80 Z" fill={hc} />
        <path d="M36,72 Q30,88 28,110 Q26,140 28,170 Q30,188 34,200 L44,200 Q42,186 40,166 Q38,138 38,112 Q38,92 40,78 Z" fill={hcD} opacity="0.25" />
        {/* Right flowing hair */}
        <path d="M164,72 Q172,84 174,104 Q176,134 174,164 Q172,184 168,200 L144,200 Q146,180 148,155 Q150,130 148,108 Q148,90 148,80 Z" fill={hc} />
        <path d="M164,72 Q170,88 172,110 Q174,140 172,170 Q170,188 166,200 L156,200 Q158,186 160,166 Q162,138 162,112 Q162,92 160,78 Z" fill={hcD} opacity="0.25" />
        {/* Strand highlights */}
        {strand("M38,82 Q34,120 32,168 Q31,186 32,200", hcH, 1.8, 0.1)}
        {strand("M44,78 Q40,112 40,160 Q40,182 42,198", hcL, 1.2, 0.08)}
        {strand("M162,82 Q166,120 168,168 Q169,186 168,200", hcH, 1.8, 0.1)}
        {strand("M156,78 Q160,112 160,160 Q160,182 158,198", hcL, 1.2, 0.08)}
      </g>;

    /* ── Wavy — flowing S-curves with multiple wave layers ── */
    case 'wavy':
      return <g>{dome}{domeShadow}
        {/* Left wavy mass — multiple S-curves */}
        <path d="M36,72 Q26,88 28,108 Q30,124 24,140 Q18,158 22,178 Q26,194 34,200 L58,200 Q56,192 52,176 Q48,158 52,140 Q56,124 52,108 Q48,92 52,80 Z" fill={hc} />
        <path d="M36,72 Q28,90 30,112 Q32,128 26,144 Q20,162 24,182 Q28,196 36,200 L46,200 Q42,194 38,180 Q34,162 38,144 Q44,128 40,112 Q36,94 40,78 Z" fill={hcD} opacity="0.25" />
        {/* Right wavy mass */}
        <path d="M164,72 Q174,88 172,108 Q170,124 176,140 Q182,158 178,178 Q174,194 166,200 L142,200 Q144,192 148,176 Q152,158 148,140 Q144,124 148,108 Q152,92 148,80 Z" fill={hc} />
        <path d="M164,72 Q172,90 170,112 Q168,128 174,144 Q180,162 176,182 Q172,196 164,200 L154,200 Q158,194 162,180 Q166,162 162,144 Q156,128 160,112 Q164,94 160,78 Z" fill={hcD} opacity="0.25" />
        {/* Wave ridge highlights */}
        {strand("M30,108 Q24,140 22,178", hcH, 2, 0.1)}
        {strand("M34,112 Q28,144 26,180", hcL, 1.5, 0.08)}
        {strand("M40,106 Q36,136 34,172", hcH, 1, 0.09)}
        {strand("M170,108 Q176,140 178,178", hcH, 2, 0.1)}
        {strand("M166,112 Q172,144 174,180", hcL, 1.5, 0.08)}
        {strand("M160,106 Q164,136 166,172", hcH, 1, 0.09)}
        {/* Wave definition strokes */}
        <path d="M28,108 Q26,116 24,126" stroke={hcD2} strokeWidth="0.5" fill="none" opacity="0.08" />
        <path d="M172,108 Q174,116 176,126" stroke={hcD2} strokeWidth="0.5" fill="none" opacity="0.08" />
      </g>;

    /* ── Bun — elegant messy bun with wispy tendrils ── */
    case 'bun':
      return <g>{dome}{domeShadow}
        {/* Pulled-back sides — sleek */}
        <path d="M36,72 Q32,84 34,98 L48,94 Q46,84 48,76 Z" fill={hc} />
        <path d="M164,72 Q168,84 166,98 L152,94 Q154,84 152,76 Z" fill={hc} />
        {/* Bun — layered circles for 3D donut shape */}
        <circle cx="100" cy="-4" r="24" fill={hc} />
        <circle cx="100" cy="-4" r="22" fill={hcD} opacity="0.15" />
        <ellipse cx="96" cy="-10" rx="14" ry="10" fill={hcL} opacity="0.06" />
        {/* Bun twist/wrap detail */}
        <path d="M82,-8 Q88,-20 100,-22 Q112,-20 118,-8" stroke={hcD} strokeWidth="1.5" fill="none" opacity="0.2" />
        <path d="M86,-2 Q92,-14 100,-16 Q108,-14 114,-2" stroke={hcD2} strokeWidth="1" fill="none" opacity="0.12" />
        <path d="M90,4 Q96,-6 100,-8 Q104,-6 110,4" stroke={hcD} strokeWidth="0.8" fill="none" opacity="0.1" />
        {/* Bun highlights */}
        <ellipse cx="94" cy="-12" rx="6" ry="4" fill="white" opacity="0.06" transform="rotate(-15,94,-12)" />
        <ellipse cx="108" cy="-8" rx="4" ry="3" fill={hcH} opacity="0.08" />
        {/* Wispy loose tendrils at nape */}
        {strand("M44,92 Q38,106 36,120 Q35,130 37,138", hc, 2.5, 0.4)}
        {strand("M46,90 Q42,102 40,116 Q39,124 40,132", hcD, 1.5, 0.25)}
        {strand("M156,92 Q162,106 164,120 Q165,130 163,138", hc, 2.5, 0.4)}
        {strand("M154,90 Q158,102 160,116 Q161,124 160,132", hcD, 1.5, 0.25)}
        {/* Pulled-back texture */}
        {strand("M50,52 Q74,32 100,26 Q126,32 150,52", hcD, 0.6, 0.08)}
        {strand("M48,60 Q76,40 100,34 Q124,40 152,60", hcD, 0.5, 0.06)}
      </g>;

    /* ── Side Part — glamorous asymmetric sweep ── */
    case 'side-part':
      return <g>{dome}{domeShadow}
        {/* Left — heavy volume side (more hair) */}
        <path d="M36,72 Q24,86 22,108 Q20,136 22,166 Q24,186 30,200 L58,200 Q56,182 54,158 Q52,132 52,108 Q52,90 52,80 Z" fill={hc} />
        <path d="M36,72 Q26,88 24,112 Q22,142 24,172 Q26,190 32,200 L44,200 Q42,188 40,168 Q38,140 38,114 Q38,92 40,78 Z" fill={hcD} opacity="0.28" />
        {/* Left extra volume — layered */}
        <path d="M36,72 Q22,80 18,98 Q14,120 18,145 Q22,168 28,188 Q30,196 34,200 L40,200 Q36,194 32,180 Q26,160 24,140 Q20,118 24,96 Q28,80 36,72 Z" fill={hc} opacity="0.5" />
        {/* Right — minimal swept side */}
        <path d="M164,72 Q170,84 168,100 Q167,112 168,120 L152,116 Q152,102 152,90 Q152,82 152,76 Z" fill={hc} />
        {/* Strand highlights — left (dominant) */}
        {strand("M36,80 Q28,108 24,148 Q22,178 26,200", hcH, 2, 0.12)}
        {strand("M40,78 Q32,104 30,142 Q28,172 32,198", hcL, 1.5, 0.09)}
        {strand("M44,76 Q38,100 36,138 Q34,168 38,196", hcH, 1.2, 0.08)}
        {strand("M48,76 Q44,98 42,134 Q40,164 44,194", hcL, 1, 0.07)}
        {/* Right strand */}
        {strand("M162,78 Q166,92 166,112", hcH, 1.2, 0.08)}
      </g>;

    /* ── Twin Tail — pigtails with ties + flowing tails ── */
    case 'twin-tail':
      return <g>{dome}{domeShadow}
        {/* Pulled-back sides to tie points */}
        <path d="M36,72 Q32,82 36,92 L48,88 Q46,80 48,74 Z" fill={hc} />
        <path d="M164,72 Q168,82 164,92 L152,88 Q154,80 152,74 Z" fill={hc} />
        {/* Left tail — flowing with volume */}
        <path d="M42,86 Q28,100 24,124 Q20,152 24,180 Q26,194 30,200 L50,200 Q46,192 42,176 Q38,154 40,130 Q42,110 48,96 Z" fill={hc} />
        <path d="M42,86 Q30,102 26,128 Q22,158 26,184 Q28,196 32,200 L40,200 Q38,194 36,182 Q32,160 34,134 Q36,112 42,98 Z" fill={hcD} opacity="0.25" />
        {/* Right tail — flowing with volume */}
        <path d="M158,86 Q172,100 176,124 Q180,152 176,180 Q174,194 170,200 L150,200 Q154,192 158,176 Q162,154 160,130 Q158,110 152,96 Z" fill={hc} />
        <path d="M158,86 Q170,102 174,128 Q178,158 174,184 Q172,196 168,200 L160,200 Q162,194 164,182 Q168,160 166,134 Q164,112 158,98 Z" fill={hcD} opacity="0.25" />
        {/* Hair ties — decorative */}
        <ellipse cx="44" cy="88" rx="6" ry="5" fill={darken(hc, 22)} opacity="0.65" />
        <ellipse cx="44" cy="88" rx="4" ry="3.5" fill="white" opacity="0.15" />
        <ellipse cx="156" cy="88" rx="6" ry="5" fill={darken(hc, 22)} opacity="0.65" />
        <ellipse cx="156" cy="88" rx="4" ry="3.5" fill="white" opacity="0.15" />
        {/* Tail strand highlights */}
        {strand("M40,92 Q30,118 26,152 Q24,178 28,200", hcH, 1.8, 0.1)}
        {strand("M44,94 Q34,120 32,156 Q30,182 34,200", hcL, 1.2, 0.08)}
        {strand("M160,92 Q170,118 174,152 Q176,178 172,200", hcH, 1.8, 0.1)}
        {strand("M156,94 Q166,120 168,156 Q170,182 166,200", hcL, 1.2, 0.08)}
        {/* Centre part texture */}
        {strand("M56,50 Q80,28 100,24 Q120,28 144,50", hcD, 0.5, 0.08)}
      </g>;

    /* ── Short — chic layered pixie cut ── */
    case 'short':
      return <g>{dome}{domeShadow}
        {/* Left — textured short layers covering ear */}
        <path d="M36,72 Q28,82 28,96 Q28,108 34,116 Q40,122 48,120 Q54,118 56,112 Q58,104 56,94 Q54,84 52,78 Z" fill={hc} />
        <path d="M36,72 Q30,84 30,98 Q30,110 36,118 Q42,124 48,122" fill={hcD} opacity="0.2" />
        {/* Left layered texture */}
        <path d="M42,76 Q34,86 34,100 Q34,112 40,118" stroke={hcD} strokeWidth="0.8" fill="none" opacity="0.12" />
        <path d="M46,74 Q38,84 38,96 Q38,106 42,114" stroke={hcD} strokeWidth="0.6" fill="none" opacity="0.1" />
        {/* Right — textured short layers */}
        <path d="M164,72 Q172,82 172,96 Q172,108 166,116 Q160,122 152,120 Q146,118 144,112 Q142,104 144,94 Q146,84 148,78 Z" fill={hc} />
        <path d="M164,72 Q170,84 170,98 Q170,110 164,118 Q158,124 152,122" fill={hcD} opacity="0.2" />
        {/* Right layered texture */}
        <path d="M158,76 Q166,86 166,100 Q166,112 160,118" stroke={hcD} strokeWidth="0.8" fill="none" opacity="0.12" />
        <path d="M154,74 Q162,84 162,96 Q162,106 158,114" stroke={hcD} strokeWidth="0.6" fill="none" opacity="0.1" />
        {/* Top volume — tousled layers */}
        <path d="M46,38 Q60,12 100,8 Q140,12 154,38 L150,48 Q138,24 100,20 Q62,24 50,48 Z" fill={hcD} opacity="0.12" />
        {/* Pixie texture strands */}
        {strand("M38,78 Q32,92 32,108 Q34,116 40,120", hcH, 1.5, 0.1)}
        {strand("M42,76 Q36,88 36,102 Q37,112 42,118", hcL, 1, 0.08)}
        {strand("M162,78 Q168,92 168,108 Q166,116 160,120", hcH, 1.5, 0.1)}
        {strand("M158,76 Q164,88 164,102 Q163,112 158,118", hcL, 1, 0.08)}
        {/* Volume highlight */}
        <ellipse cx="100" cy="16" rx="24" ry="6" fill={hcL} opacity="0.06" />
      </g>;

    /* ── Updo — elegant chignon / French twist ── */
    case 'updo':
      return <g>{dome}{domeShadow}
        {/* Pulled-back sleek sides */}
        <path d="M36,72 Q32,84 34,96 L48,92 Q46,82 48,74 Z" fill={hc} />
        <path d="M164,72 Q168,84 166,96 L152,92 Q154,82 152,74 Z" fill={hc} />
        {/* Chignon — elegant twisted bun at back-crown */}
        <ellipse cx="108" cy="2" rx="26" ry="20" fill={hc} transform="rotate(10,108,2)" />
        <ellipse cx="108" cy="2" rx="22" ry="16" fill={hcD} opacity="0.18" transform="rotate(10,108,2)" />
        {/* Twist detail lines */}
        <path d="M88,-8 Q96,-18 108,-18 Q120,-16 126,-6" stroke={hcD} strokeWidth="1.5" fill="none" opacity="0.18" />
        <path d="M92,0 Q100,-8 108,-8 Q116,-6 120,2" stroke={hcD2} strokeWidth="1" fill="none" opacity="0.14" />
        <path d="M96,8 Q104,2 108,2 Q112,2 116,8" stroke={hcD} strokeWidth="0.8" fill="none" opacity="0.1" />
        {/* Elegant twist wrap */}
        <path d="M86,-4 Q82,4 86,10 Q90,14 96,12 Q102,8 104,0 Q106,-6 112,-8 Q118,-6 120,-2 Q124,4 120,10 Q118,14 114,16" stroke={hcD} strokeWidth="0.6" fill="none" opacity="0.12" />
        {/* Hair pin / decorative stick */}
        <line x1="120" y1="-10" x2="126" y2="8" stroke="#d4af37" strokeWidth="1.5" opacity="0.55" />
        <circle cx="126" cy="8" r="2.5" fill="#d4af37" opacity="0.6" />
        <circle cx="126" cy="8" r="1.5" fill="white" opacity="0.3" />
        {/* Shine on bun */}
        <ellipse cx="102" cy="-8" rx="8" ry="5" fill="white" opacity="0.06" transform="rotate(-12,102,-8)" />
        <ellipse cx="114" cy="-2" rx="5" ry="3" fill={hcH} opacity="0.08" />
        {/* Wispy tendrils at nape */}
        {strand("M44,90 Q38,104 36,118 Q35,128 37,136", hc, 2, 0.35)}
        {strand("M46,88 Q42,100 40,112 Q39,120 40,128", hcD, 1.2, 0.2)}
        {strand("M156,90 Q162,104 164,118 Q165,128 163,136", hc, 2, 0.35)}
        {strand("M154,88 Q158,100 160,112 Q161,120 160,128", hcD, 1.2, 0.2)}
        {/* Pulled-back texture */}
        {strand("M50,52 Q76,30 100,24 Q124,30 150,52", hcD, 0.6, 0.08)}
      </g>;

    default:
      return <g>{dome}{domeShadow}</g>;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Hair Front (over forehead) — realistic per-style front rendering     */
/* ═══════════════════════════════════════════════════════════════════════ */
function HairFront({ s, hc, hcH, hcL, uid }: { s: string; hc: string; hcH: string; hcL: string; uid: string }) {
  const hcD = darken(hc, 18);

  switch (s) {

    /* ── Long Straight — centre-part face-framing layers ── */
    case 'long-straight':
      return <g>
        {/* Centre part line */}
        <line x1="100" y1="10" x2="100" y2="36" stroke={darken(hc, 40)} strokeWidth="0.6" opacity="0.15" />
        {/* Left face-framing layer */}
        <path d="M44,36 Q54,20 80,14 Q92,12 100,12 L100,36 Q88,32 76,34 Q60,38 52,48 L48,58 Z" fill={hc} />
        <path d="M48,42 Q58,26 82,18 Q92,16 100,16 L100,36 Q90,34 80,36 Q64,40 56,50 L52,58 Z" fill={hcD} opacity="0.15" />
        {/* Right face-framing layer */}
        <path d="M156,36 Q146,20 120,14 Q108,12 100,12 L100,36 Q112,32 124,34 Q140,38 148,48 L152,58 Z" fill={hc} />
        <path d="M152,42 Q142,26 118,18 Q108,16 100,16 L100,36 Q110,34 120,36 Q136,40 144,50 L148,58 Z" fill={hcD} opacity="0.15" />
        {/* Soft face-framing wisps */}
        <path d="M52,48 Q50,56 48,66" stroke={hcL} strokeWidth="0.7" fill="none" opacity="0.1" />
        <path d="M148,48 Q150,56 152,66" stroke={hcL} strokeWidth="0.7" fill="none" opacity="0.1" />
      </g>;

    /* ── Bob — side-swept fringe with face framing ── */
    case 'bob':
      return <g>
        {/* Left face frame — sweeps to side */}
        <path d="M44,36 Q54,18 84,12 Q94,11 100,12 L100,34 Q90,30 78,32 Q62,36 54,46 L50,58 Z" fill={hc} />
        <path d="M48,40 Q58,24 84,16 Q94,15 100,16 L100,34 Q92,32 82,34 Q66,38 58,48 L54,58 Z" fill={hcD} opacity="0.15" />
        {/* Right face frame */}
        <path d="M156,36 Q146,18 116,12 Q106,11 100,12 L100,34 Q110,30 122,32 Q138,36 146,46 L150,58 Z" fill={hc} />
        <path d="M152,40 Q142,24 116,16 Q106,15 100,16 L100,34 Q108,32 118,34 Q134,38 142,48 L146,58 Z" fill={hcD} opacity="0.15" />
        {/* Part line */}
        <line x1="100" y1="12" x2="100" y2="32" stroke={darken(hc, 40)} strokeWidth="0.5" opacity="0.12" />
        {/* Wispy face strands */}
        <path d="M54,46 Q52,54 50,64" stroke={hcH} strokeWidth="0.6" fill="none" opacity="0.08" />
        <path d="M146,46 Q148,54 150,64" stroke={hcH} strokeWidth="0.6" fill="none" opacity="0.08" />
      </g>;

    /* ── Ponytail — swept-back hairline with baby hairs ── */
    case 'ponytail':
      return <g>
        {/* Swept-back smooth hairline */}
        <path d="M44,36 Q58,18 100,12 Q142,18 156,36 L152,44 Q140,26 100,20 Q60,26 48,44 Z" fill={hc} />
        <path d="M48,38 Q62,22 100,16 Q138,22 152,38 L150,42 Q138,28 100,22 Q62,28 50,42 Z" fill={hcD} opacity="0.12" />
        {/* Baby hairs / wispy edges */}
        <path d="M56,36 Q52,42 50,50" stroke={hc} strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M60,32 Q54,38 52,44" stroke={hc} strokeWidth="0.8" fill="none" opacity="0.25" strokeLinecap="round" />
        <path d="M144,36 Q148,42 150,50" stroke={hc} strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M140,32 Q146,38 148,44" stroke={hc} strokeWidth="0.8" fill="none" opacity="0.25" strokeLinecap="round" />
        {/* Pulled-back texture */}
        <path d="M60,30 Q80,18 100,16 Q120,18 140,30" stroke={hcD} strokeWidth="0.5" fill="none" opacity="0.06" />
      </g>;

    /* ── Bangs — Korean see-through curtain bangs ── */
    case 'bangs':
      return <g>
        {/* Full bang coverage */}
        <path d="M44,36 Q60,14 100,10 Q140,14 156,36 L152,72 Q140,66 124,67 Q110,68 100,70 Q90,68 76,67 Q60,66 48,72 Z" fill={hc} />
        {/* See-through strands — Korean style separated */}
        <path d="M56,26 Q54,44 52,68" stroke={hcL} strokeWidth="1" opacity="0.12" />
        <path d="M66,20 Q64,42 62,66" stroke={hcL} strokeWidth="0.8" opacity="0.1" />
        <path d="M76,16 Q74,40 74,68" stroke={hcH} strokeWidth="1" opacity="0.11" />
        <path d="M86,14 Q86,38 86,68" stroke={hcL} strokeWidth="0.8" opacity="0.09" />
        <path d="M96,12 Q96,36 96,70" stroke={hcL} strokeWidth="0.8" opacity="0.1" />
        <path d="M100,12 L100,70" stroke={hcH} strokeWidth="1.2" opacity="0.13" />
        <path d="M104,12 Q104,36 104,70" stroke={hcL} strokeWidth="0.8" opacity="0.1" />
        <path d="M114,14 Q114,38 114,68" stroke={hcL} strokeWidth="0.8" opacity="0.09" />
        <path d="M124,16 Q126,40 126,68" stroke={hcH} strokeWidth="1" opacity="0.11" />
        <path d="M134,20 Q136,42 138,66" stroke={hcL} strokeWidth="0.8" opacity="0.1" />
        <path d="M144,26 Q146,44 148,68" stroke={hcL} strokeWidth="1" opacity="0.12" />
        {/* Feathered tip edge — wispy */}
        <path d="M48,66 Q62,60 76,63 Q88,66 100,64 Q112,66 124,63 Q138,60 152,66 L152,72 Q138,66 124,68 Q112,70 100,70 Q88,70 76,68 Q62,66 48,72 Z" fill={hc} opacity="0.45" />
        <path d="M54,68 Q60,64 68,66" stroke={hcD} strokeWidth="0.4" fill="none" opacity="0.08" />
        <path d="M132,66 Q140,64 146,68" stroke={hcD} strokeWidth="0.4" fill="none" opacity="0.08" />
      </g>;

    /* ── Wavy — soft wave framing face ── */
    case 'wavy':
      return <g>
        {/* Centre part */}
        <line x1="100" y1="10" x2="100" y2="36" stroke={darken(hc, 40)} strokeWidth="0.6" opacity="0.15" />
        {/* Left face frame — with gentle wave */}
        <path d="M44,36 Q54,18 80,12 Q92,11 100,12 L100,36 Q88,30 76,32 Q62,38 54,50 Q50,58 48,66 Z" fill={hc} />
        <path d="M48,40 Q58,24 82,16 Q94,15 100,16 L100,36 Q90,32 80,34 Q66,42 58,52 Q54,58 52,66 Z" fill={hcD} opacity="0.15" />
        {/* Right face frame */}
        <path d="M156,36 Q146,18 120,12 Q108,11 100,12 L100,36 Q112,30 124,32 Q138,38 146,50 Q150,58 152,66 Z" fill={hc} />
        <path d="M152,40 Q142,24 118,16 Q106,15 100,16 L100,36 Q110,32 120,34 Q134,42 142,52 Q146,58 148,66 Z" fill={hcD} opacity="0.15" />
        {/* Wavy framing wisps */}
        <path d="M52,50 Q48,60 50,68" stroke={hcH} strokeWidth="0.8" fill="none" opacity="0.09" />
        <path d="M148,50 Q152,60 150,68" stroke={hcH} strokeWidth="0.8" fill="none" opacity="0.09" />
      </g>;

    /* ── Bun — pulled-back smooth hairline with wispy edges ── */
    case 'bun':
      return <g>
        {/* Sleek pulled-back hairline */}
        <path d="M44,36 Q58,16 100,10 Q142,16 156,36 L152,44 Q140,24 100,18 Q60,24 48,44 Z" fill={hc} />
        <path d="M48,38 Q62,20 100,14 Q138,20 152,38 L150,42 Q138,26 100,20 Q62,26 50,42 Z" fill={hcD} opacity="0.12" />
        {/* Wispy flyaway tendrils */}
        <path d="M54,38 Q50,46 48,56" stroke={hc} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
        <path d="M58,34 Q52,40 50,48" stroke={hc} strokeWidth="0.7" fill="none" opacity="0.2" strokeLinecap="round" />
        <path d="M146,38 Q150,46 152,56" stroke={hc} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
        <path d="M142,34 Q148,40 150,48" stroke={hc} strokeWidth="0.7" fill="none" opacity="0.2" strokeLinecap="round" />
        {/* Smooth pulled texture */}
        <path d="M58,28 Q78,16 100,14 Q122,16 142,28" stroke={hcD} strokeWidth="0.4" fill="none" opacity="0.06" />
      </g>;

    /* ── Side Part — dramatic swept fringe ── */
    case 'side-part':
      return <g>
        {/* Swept from right to left — dramatic coverage */}
        <path d="M44,36 Q56,14 90,10 Q118,12 140,22 L136,42 Q120,26 96,22 Q70,24 56,40 L50,54 Z" fill={hc} />
        <path d="M48,38 Q60,18 92,14 Q116,16 136,24 L134,38 Q118,28 96,26 Q72,28 58,42 L54,54 Z" fill={hcD} opacity="0.15" />
        {/* Sweep direction highlights */}
        <path d="M62,24 Q76,18 92,16" stroke={hcL} strokeWidth="0.8" fill="none" opacity="0.09" />
        <path d="M68,20 Q82,14 98,14" stroke={hcH} strokeWidth="1" fill="none" opacity="0.08" />
        {/* Face-framing strand */}
        <path d="M52,42 Q48,54 48,66" stroke={hc} strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M56,38 Q52,48 50,60" stroke={hcD} strokeWidth="0.8" fill="none" opacity="0.2" strokeLinecap="round" />
        {/* Minimal right side edge */}
        <path d="M156,36 Q150,28 140,24 L140,36 Q148,38 152,44 Z" fill={hc} opacity="0.5" />
      </g>;

    /* ── Twin Tail — centre part with face-framing tendrils ── */
    case 'twin-tail':
      return <g>
        {/* Centre part line */}
        <line x1="100" y1="10" x2="100" y2="36" stroke={darken(hc, 40)} strokeWidth="0.6" opacity="0.15" />
        {/* Left hairline */}
        <path d="M44,36 Q56,18 80,12 Q92,11 100,12 L100,36 Q88,30 76,32 Q60,38 52,48 L48,58 Z" fill={hc} />
        <path d="M48,40 Q58,24 82,16 Q94,14 100,16 L100,34 Q90,32 80,34 Q66,40 56,50 L52,58 Z" fill={hcD} opacity="0.12" />
        {/* Right hairline */}
        <path d="M156,36 Q144,18 120,12 Q108,11 100,12 L100,36 Q112,30 124,32 Q140,38 148,48 L152,58 Z" fill={hc} />
        <path d="M152,40 Q142,24 118,16 Q106,14 100,16 L100,34 Q110,32 120,34 Q134,40 144,50 L148,58 Z" fill={hcD} opacity="0.12" />
        {/* Face-framing tendrils */}
        <path d="M52,48 Q48,58 48,68" stroke={hc} strokeWidth="1.2" fill="none" opacity="0.3" strokeLinecap="round" />
        <path d="M148,48 Q152,58 152,68" stroke={hc} strokeWidth="1.2" fill="none" opacity="0.3" strokeLinecap="round" />
      </g>;

    /* ── Short — textured layers framing face ── */
    case 'short':
      return <g>
        {/* Textured tousled top — with natural side-swept direction */}
        <path d="M44,36 Q56,14 100,8 Q144,14 156,36 L152,50 Q142,32 120,22 Q106,18 100,18 Q94,18 80,22 Q58,32 48,50 Z" fill={hc} />
        <path d="M48,38 Q60,18 100,12 Q140,18 152,38 L150,46 Q140,30 118,22 Q106,20 100,20 Q94,20 82,22 Q60,30 50,46 Z" fill={hcD} opacity="0.15" />
        {/* Tousled texture strands on top */}
        <path d="M68,24 Q72,16 78,20" stroke={hcH} strokeWidth="0.7" fill="none" opacity="0.1" />
        <path d="M86,18 Q90,12 96,16" stroke={hcL} strokeWidth="0.6" fill="none" opacity="0.08" />
        <path d="M110,16 Q114,12 118,18" stroke={hcH} strokeWidth="0.7" fill="none" opacity="0.1" />
        <path d="M128,20 Q132,16 136,24" stroke={hcL} strokeWidth="0.6" fill="none" opacity="0.08" />
        {/* Side texture wisps */}
        <path d="M50,46 Q48,54 48,62" stroke={hc} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
        <path d="M150,46 Q152,54 152,62" stroke={hc} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
      </g>;

    /* ── Updo — elegant pulled-back with loose strands ── */
    case 'updo':
      return <g>
        {/* Sleek swept-back hairline */}
        <path d="M44,36 Q58,16 100,10 Q142,16 156,36 L152,44 Q140,24 100,18 Q60,24 48,44 Z" fill={hc} />
        <path d="M48,38 Q62,20 100,14 Q138,20 152,38 L150,42 Q138,26 100,20 Q62,26 50,42 Z" fill={hcD} opacity="0.12" />
        {/* Elegant loose tendrils framing face */}
        <path d="M52,38 Q48,48 46,60 Q45,68 46,76" stroke={hc} strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M56,34 Q50,44 48,56 Q47,62 48,70" stroke={hcD} strokeWidth="0.8" fill="none" opacity="0.22" strokeLinecap="round" />
        <path d="M148,38 Q152,48 154,60 Q155,68 154,76" stroke={hc} strokeWidth="1.5" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M144,34 Q150,44 152,56 Q153,62 152,70" stroke={hcD} strokeWidth="0.8" fill="none" opacity="0.22" strokeLinecap="round" />
        {/* Smooth pulled texture */}
        <path d="M58,28 Q78,16 100,14 Q122,16 142,28" stroke={hcD} strokeWidth="0.4" fill="none" opacity="0.06" />
        <path d="M62,24 Q80,14 100,12 Q120,14 138,24" stroke={hcD} strokeWidth="0.3" fill="none" opacity="0.05" />
      </g>;

    default:
      return <g>
        <path d="M44,36 Q48,26 56,36 L52,56 Q48,52 44,56 Z" fill={hc} opacity="0.62" />
        <path d="M156,36 Q152,26 144,36 L148,56 Q152,52 156,56 Z" fill={hc} opacity="0.62" />
      </g>;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Main Component                                                       */
/* ═══════════════════════════════════════════════════════════════════════ */
interface KoreanFaceAvatarProps {
  avatar: AiAvatar;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
  animation?: 'float' | 'rotate3d' | 'pulse' | 'breathe' | 'bounce';
}

const sizeClasses = { xs: 'w-6 h-6', sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16', xl: 'w-20 h-20' };

const animations = {
  float: { y: [0, -4, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } },
  rotate3d: { rotateY: [0, 8, -8, 0], rotateX: [0, -4, 4, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } },
  pulse: { scale: [1, 1.05, 1], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const } },
  breathe: { scale: [1, 1.03, 1], opacity: [1, 0.9, 1], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } },
  bounce: { y: [0, -6, 0], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const } },
};

export default function KoreanFaceAvatar({ avatar, size = 'md', animate = true, animation = 'rotate3d' }: KoreanFaceAvatarProps) {
  const cls = sizeClasses[size];
  const uid = avatar.id.replace(/[^a-z0-9]/gi, '');

  const inner = (
    <div className={`${cls} rounded-2xl bg-gradient-to-br ${avatar.gradient} shadow-lg ${avatar.glow} relative overflow-hidden`}
      style={{ perspective: '500px', transformStyle: 'preserve-3d' }}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-white/8 z-10 pointer-events-none" />
      <div className="absolute inset-0.5 rounded-[14px] border border-white/10 z-10 pointer-events-none" />
      <FaceSVG face={avatar.face} uid={uid} />
    </div>
  );

  if (!animate) return inner;

  return (
    <motion.div animate={animations[animation]} style={{ transformStyle: 'preserve-3d' }}>
      {inner}
    </motion.div>
  );
}
