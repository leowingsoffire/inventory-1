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

      {/* ──── HAIR BACK ──── */}
      <HairBack s={face.hairStyle} hc={hc} hcH={hcH} hcL={hcL} uid={uid} />

      {/* ──── NECK + SHOULDERS ──── */}
      <path d="M82,148 Q82,142 88,138 L112,138 Q118,142 118,148 L120,186 Q112,196 100,197 Q88,196 80,186 Z" fill={sk} />
      <ellipse cx="100" cy="143" rx="18" ry="4" fill={skD} opacity="0.14" filter={`url(#b1-${uid})`} />
      <path d="M85,160 Q94,157 100,158 Q106,157 115,160" stroke={skD} strokeWidth="0.5" fill="none" opacity="0.06" />

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

      {/* ──── BLUSH ──── */}
      <ellipse cx="66" cy="108" rx="17" ry="11" fill={`url(#bl-${uid})`} />
      <ellipse cx="134" cy="108" rx="17" ry="11" fill={`url(#bl-${uid})`} />

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

      {/* ──── LIPS — mood + style ──── */}
      <g>
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

      {/* ──── HAIR FRONT ──── */}
      <HairFront s={face.hairStyle} hc={hc} hcH={hcH} hcL={hcL} uid={uid} />

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

      {/* Pupil */}
      <circle cx={cx + f * 1} cy={cy + 0.5} r="3.8" fill="#080808" />

      {/* Catchlight — large primary */}
      <ellipse cx={cx + f * 4.5} cy={cy - 2.5} rx="3.2" ry="3.8" fill="white" opacity="0.88" />
      {/* Secondary */}
      <circle cx={cx - f * 2.5} cy={cy + 3} r="1.4" fill="white" opacity="0.42" />
      {/* Tertiary sparkle */}
      <circle cx={cx + f * 1.5} cy={cy + 1} r="0.6" fill="white" opacity="0.55" />

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
    </g>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Hair Back (behind face) — with highlight streaks                     */
/* ═══════════════════════════════════════════════════════════════════════ */
function HairBack({ s, hc, hcH, hcL, uid }: { s: string; hc: string; hcH: string; hcL: string; uid: string }) {
  const dome = <path d="M36,75 Q30,44 56,24 Q76,8 100,6 Q124,8 144,24 Q170,44 164,75 L160,62 Q155,38 136,24 Q120,12 100,10 Q80,12 64,24 Q45,38 40,62 Z" fill={hc} />;

  // Highlight streak helper
  const hl = (x1: string, y1: string, x2: string, y2: string, w = '2') =>
    <line key={`${x1}${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={hcH} strokeWidth={w} opacity="0.12" />;
  const sh = (x1: string, y1: string, x2: string, y2: string, w = '1.5') =>
    <line key={`s${x1}${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={hcL} strokeWidth={w} opacity="0.1" />;

  switch (s) {
    case 'long-straight':
      return <g>{dome}
        <path d="M36,75 L32,200 L52,200 L52,100 Z" fill={hc} />
        <path d="M164,75 L168,200 L148,200 L148,100 Z" fill={hc} />
        {hl("38","90","34","190")}{hl("43","88","39","185")}{sh("46","86","42","180")}
        {hl("162","90","166","190")}{hl("157","88","161","185")}{sh("154","86","158","180")}
        <path d="M52,80 L52,180" stroke={hcH} strokeWidth="3" opacity="0.08" />
        <path d="M148,80 L148,180" stroke={hcH} strokeWidth="3" opacity="0.08" />
      </g>;
    case 'bob':
      return <g>{dome}
        <path d="M36,75 Q30,110 44,130 Q56,144 68,142 L68,100 Z" fill={hc} />
        <path d="M164,75 Q170,110 156,130 Q144,144 132,142 L132,100 Z" fill={hc} />
        {hl("40","85","44","130")}{sh("44","83","48","125")}
        {hl("160","85","156","130")}{sh("156","83","152","125")}
        <path d="M42,90 Q38,115 46,132" stroke={hcH} strokeWidth="2.5" opacity="0.08" fill="none" />
      </g>;
    case 'ponytail':
      return <g>{dome}
        <path d="M36,75 L40,100 L48,96 Z" fill={hc} />
        <path d="M164,75 L160,100 L152,96 Z" fill={hc} />
        <ellipse cx="145" cy="38" rx="14" ry="30" fill={hc} transform="rotate(25,145,38)" />
        <path d="M148,58 Q160,100 152,148 Q148,164 140,172" stroke={hc} strokeWidth="17" fill="none" strokeLinecap="round" />
        <path d="M148,58 Q160,100 152,148" stroke={hcL} strokeWidth="2" fill="none" opacity="0.1" />
        <path d="M148,58 Q158,95 150,140" stroke={hcH} strokeWidth="3" fill="none" opacity="0.08" />
      </g>;
    case 'bangs':
      return <g>{dome}
        <path d="M36,75 L32,192 L52,192 L52,100 Z" fill={hc} />
        <path d="M164,75 L168,192 L148,192 L148,100 Z" fill={hc} />
        {hl("38","88","34","182")}{sh("42","86","38","178")}
        {hl("162","88","166","182")}{sh("158","86","162","178")}
      </g>;
    case 'wavy':
      return <g>{dome}
        <path d="M36,75 Q28,110 36,130 Q44,148 36,168 Q32,188 40,200 L56,200 Q58,180 52,160 Q44,140 52,118 L52,96 Z" fill={hc} />
        <path d="M164,75 Q172,110 164,130 Q156,148 164,168 Q168,188 160,200 L144,200 Q142,180 148,160 Q156,140 148,118 L148,96 Z" fill={hc} />
        {hl("40","100","36","168")}{sh("44","98","40","162")}
        {hl("160","100","164","168")}{sh("156","98","160","162")}
      </g>;
    case 'bun':
      return <g>{dome}
        <path d="M36,75 L40,96 L48,92 Z" fill={hc} />
        <path d="M164,75 L160,96 L152,92 Z" fill={hc} />
        <circle cx="100" cy="-2" r="21" fill={hc} />
        <circle cx="100" cy="-2" r="19" fill="none" stroke={hcH} strokeWidth="1.4" opacity="0.1" />
        <ellipse cx="96" cy="-8" rx="7" ry="5" fill={hcL} opacity="0.05" />
      </g>;
    case 'side-part':
      return <g>{dome}
        <path d="M36,75 Q28,110 34,140 L32,200 L56,200 L52,110 Z" fill={hc} />
        <path d="M164,75 L160,100 L152,96 Z" fill={hc} />
        {hl("40","90","34","185")}{sh("44","88","38","180")}
      </g>;
    case 'twin-tail':
      return <g>{dome}
        <path d="M36,75 L40,94 L48,90 Z" fill={hc} />
        <path d="M164,75 L160,94 L152,90 Z" fill={hc} />
        <path d="M48,82 Q32,110 28,148 Q26,168 32,192" stroke={hc} strokeWidth="17" fill="none" strokeLinecap="round" />
        <path d="M152,82 Q168,110 172,148 Q174,168 168,192" stroke={hc} strokeWidth="17" fill="none" strokeLinecap="round" />
        {sh("48","82","30","186")}{sh("152","82","170","186")}
        <circle cx="46" cy="82" r="4" fill={darken(hc, 15)} stroke="white" strokeWidth="0.8" opacity="0.4" />
        <circle cx="154" cy="82" r="4" fill={darken(hc, 15)} stroke="white" strokeWidth="0.8" opacity="0.4" />
      </g>;
    case 'short':
      return <g>{dome}
        <path d="M36,75 Q30,95 40,112 Q48,120 56,116 L52,90 Z" fill={hc} />
        <path d="M164,75 Q170,95 160,112 Q152,120 144,116 L148,90 Z" fill={hc} />
        {hl("38","82","42","110")}{hl("162","82","158","110")}
      </g>;
    case 'updo':
      return <g>{dome}
        <path d="M36,75 L40,94 L48,90 Z" fill={hc} />
        <path d="M164,75 L160,94 L152,90 Z" fill={hc} />
        <path d="M80,12 Q70,-4 84,-8 Q110,-12 124,2 Q136,14 120,14 Q104,14 96,6 Q88,-2 80,12" fill={hc} />
        <path d="M90,0 Q100,-6 116,2" stroke={hcL} strokeWidth="1.2" fill="none" opacity="0.1" />
        <circle cx="118" cy="8" r="2.5" fill="white" opacity="0.35" />
      </g>;
    default:
      return <g>{dome}</g>;
  }
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Hair Front (over forehead) — with highlight streaks                  */
/* ═══════════════════════════════════════════════════════════════════════ */
function HairFront({ s, hc, hcH, hcL, uid }: { s: string; hc: string; hcH: string; hcL: string; uid: string }) {
  switch (s) {
    case 'bangs':
      return <g>
        <path d="M44,36 Q60,14 100,10 Q140,14 156,36 L152,72 Q140,66 124,67 Q110,68 100,70 Q90,68 76,67 Q60,66 48,72 Z" fill={hc} />
        {/* See-through bang strands */}
        <path d="M58,28 L54,68" stroke={hcL} strokeWidth="0.8" opacity="0.11" />
        <path d="M74,20 L70,68" stroke={hcL} strokeWidth="0.8" opacity="0.09" />
        <path d="M90,16 L88,70" stroke={hcL} strokeWidth="0.8" opacity="0.11" />
        <path d="M100,14 L100,70" stroke={hcH} strokeWidth="1.2" opacity="0.13" />
        <path d="M110,16 L112,70" stroke={hcL} strokeWidth="0.8" opacity="0.11" />
        <path d="M126,20 L130,68" stroke={hcL} strokeWidth="0.8" opacity="0.09" />
        <path d="M142,28 L146,68" stroke={hcL} strokeWidth="0.8" opacity="0.11" />
        <path d="M48,66 Q74,60 100,64 Q126,60 152,66 L152,72 Q126,66 100,70 Q74,66 48,72 Z" fill={hc} opacity="0.42" />
      </g>;
    case 'side-part':
      return <g>
        <path d="M44,36 Q56,16 90,12 Q112,14 120,28 L116,56 Q104,50 90,52 Q72,54 56,60 L48,64 Z" fill={hc} />
        <path d="M60,26 Q70,20 82,24" stroke={hcL} strokeWidth="1" opacity="0.08" fill="none" />
        <path d="M66,22 L62,54" stroke={hcH} strokeWidth="0.8" opacity="0.07" />
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
