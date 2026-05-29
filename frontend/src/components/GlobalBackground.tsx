"use client";

export function GlobalBackground() {
  return (
    <div 
      className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden"
    >
      {/* Blueprint Cross Grid (Subtle) */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3C!-- Faint grid lines --%3E%3Cline x1='60' y1='0' x2='60' y2='120' stroke='rgba(255,255,255,0.02)' stroke-width='1'/%3E%3Cline x1='0' y1='60' x2='120' y2='60' stroke='rgba(255,255,255,0.02)' stroke-width='1'/%3E%3C!-- Brighter intersection crosses --%3E%3Cline x1='54' y1='60' x2='66' y2='60' stroke='rgba(255,255,255,0.07)' stroke-width='1'/%3E%3Cline x1='60' y1='54' x2='60' y2='66' stroke='rgba(255,255,255,0.07)' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px',
          backgroundPosition: 'center center',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 80%)'
        }}
      />
    </div>
  );
}
