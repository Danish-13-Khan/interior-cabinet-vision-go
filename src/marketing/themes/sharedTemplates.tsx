import type { ReactNode } from 'react'

export type TemplateItem = { title: string; desc: string; svg: ReactNode }

export const templatesCalm: TemplateItem[] = [
  {
    title: 'L-shaped kitchen',
    desc: 'Classic L with island placeholder and sink wall.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="20" y="15" width="160" height="90" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="20" y="15" width="18" height="90" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="20" y="87" width="160" height="18" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="70" y="45" width="55" height="35" fill="#2a3a2e" stroke="#7dba8a" />
        <rect x="100" y="15" width="40" height="6" fill="#4a6a7a" />
      </svg>
    ),
  },
  {
    title: 'Galley kitchen',
    desc: 'Parallel runs — ideal for apartments and remodels.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="25" y="20" width="150" height="80" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="25" y="20" width="150" height="16" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="25" y="84" width="150" height="16" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="85" y="48" width="30" height="24" fill="#2a3a2e" stroke="#9fd4a8" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    title: 'U-shaped kitchen',
    desc: 'Maximum storage with full three-wall coverage.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="30" y="18" width="140" height="84" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="30" y="18" width="140" height="14" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="30" y="18" width="14" height="84" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="156" y="18" width="14" height="84" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="70" y="50" width="60" height="36" fill="#2a3a2e" stroke="#7dba8a" />
      </svg>
    ),
  },
  {
    title: 'Vanity bath',
    desc: 'Single vanity run with mirror and linen tower.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="40" y="25" width="120" height="70" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="40" y="79" width="120" height="16" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="50" y="35" width="28" height="20" fill="#2e4034" stroke="#7dba8a" opacity="0.8" />
        <circle cx="130" cy="55" r="12" fill="none" stroke="#5a5a5a" />
      </svg>
    ),
  },
  {
    title: 'Kitchen + pantry',
    desc: 'Primary run with tall pantry and appliance garage.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="20" y="20" width="160" height="80" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="20" y="84" width="100" height="16" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="130" y="40" width="50" height="60" fill="#2a3a2e" stroke="#7dba8a" />
        <text x="140" y="75" fill="#6e6e6e" fontSize="8" fontFamily="IBM Plex Sans,sans-serif">
          Pantry
        </text>
      </svg>
    ),
  },
  {
    title: 'Empty room shell',
    desc: 'Blank walls and openings — draw your own run.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="25" y="20" width="150" height="80" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="25" y="20" width="18" height="80" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="55" y="55" width="90" height="45" fill="#1e2a22" stroke="#5a7a60" strokeDasharray="3 2" />
        <text x="75" y="82" fill="#6e6e6e" fontSize="8" fontFamily="IBM Plex Sans,sans-serif">
          Empty shell
        </text>
      </svg>
    ),
  },
]

export const templatesCompact: TemplateItem[] = [
  {
    title: 'L-shaped kitchen',
    desc: 'Island + sink wall starter.',
    svg: templatesCalm[0].svg,
  },
  {
    title: 'Galley',
    desc: 'Parallel runs for tight footprints.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="25" y="20" width="150" height="80" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="25" y="20" width="150" height="16" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="25" y="84" width="150" height="16" fill="#3d5a42" stroke="#7dba8a" />
      </svg>
    ),
  },
  {
    title: 'U-shaped',
    desc: 'Three-wall storage maximum.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="30" y="18" width="140" height="84" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="30" y="18" width="140" height="14" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="30" y="18" width="14" height="84" fill="#3d5a42" stroke="#7dba8a" />
        <rect x="156" y="18" width="14" height="84" fill="#3d5a42" stroke="#7dba8a" />
      </svg>
    ),
  },
  {
    title: 'Vanity bath',
    desc: 'Single run with linen tower.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="40" y="25" width="120" height="70" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="40" y="79" width="120" height="16" fill="#3d5a42" stroke="#7dba8a" />
      </svg>
    ),
  },
  {
    title: 'Kitchen + pantry',
    desc: 'Tall pantry and appliance garage.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="20" y="20" width="160" height="80" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <rect x="130" y="40" width="50" height="60" fill="#2a3a2e" stroke="#7dba8a" />
      </svg>
    ),
  },
  {
    title: 'Empty shell',
    desc: 'Walls and openings only.',
    svg: (
      <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="120" fill="#161616" />
        <rect x="25" y="20" width="150" height="80" fill="none" stroke="#4a4a4a" strokeWidth="2" />
        <text x="70" y="65" fill="#6e6e6e" fontSize="10" fontFamily="IBM Plex Sans,sans-serif">
          Empty shell
        </text>
      </svg>
    ),
  },
]
