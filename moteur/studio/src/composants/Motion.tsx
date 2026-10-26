import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { police } from "../polices";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));

// Fond de marque animé (dégradé sombre + halos verts mouvants + grille) pour les cutaways produit
export const FondMarque: React.FC<{ o: number; theme: any }> = ({ o, theme }) => {
  const f = useCurrentFrame();
  const x1 = 30 + Math.sin(f / 40) * 18, y1 = 30 + Math.cos(f / 50) * 10;
  const x2 = 70 + Math.cos(f / 45) * 16, y2 = 72 + Math.sin(f / 38) * 10;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <AbsoluteFill style={{ background: "linear-gradient(170deg, #0c1a10 0%, #07100a 55%, #040805 100%)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${x1}% ${y1}%, ${theme.accent}55 0%, transparent 38%), radial-gradient(circle at ${x2}% ${y2}%, ${theme.accent}33 0%, transparent 42%)` }} />
      <AbsoluteFill style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.045) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.045) 2px, transparent 2px)",
        backgroundSize: "90px 90px", backgroundPosition: `0 ${(f * 0.8) % 90}px`,
        WebkitMaskImage: "radial-gradient(ellipse at 50% 45%, #000 20%, transparent 75%)",
      }} />
    </AbsoluteFill>
  );
};

// Notification façon iPhone qui descend du haut (glassmorphism)
export const Notif: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const d = el.a - el.de;
  const sp = spring({ frame: f, fps, config: { damping: 14, stiffness: 190, mass: 0.7 } });
  const out = interpolate(f, [d - 7, d], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const y = H * (el.position ?? 0.06) + (1 - sp) * -260 - out * 260;
  const w = Math.min(W, H * 0.75) * 0.88;
  return (
    <div style={{
      position: "absolute", left: (W - w) / 2, top: y, width: w, padding: "30px 34px", borderRadius: 44,
      background: "rgba(245,247,245,.82)", backdropFilter: "blur(30px) saturate(1.6)", boxShadow: "0 25px 70px rgba(0,0,0,.35)",
      display: "flex", gap: 26, alignItems: "center", transform: `scale(${0.92 + 0.08 * sp})`, opacity: 1 - out,
    }}>
      <div style={{ width: 104, height: 104, borderRadius: 26, background: "#0d1a11", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {el.icone ? <Img src={src(el.icone)} style={{ width: 74 }} /> : <span style={{ fontSize: 60 }}>{el.emoji ?? "🔔"}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: police("Inter"), fontSize: 30, color: "#5d665f", fontWeight: 600 }}>
          <span>{(el.app ?? "BAILTO").toUpperCase()}</span><span>{el.heure ?? "maintenant"}</span>
        </div>
        <div style={{ fontFamily: police("Inter"), fontWeight: 800, fontSize: 42, color: "#0b130d", marginTop: 4 }}>{el.titre}</div>
        <div style={{ fontFamily: police("Inter"), fontWeight: 500, fontSize: 36, color: "#2b332d", marginTop: 2 }}
          dangerouslySetInnerHTML={{ __html: String(el.texte ?? "").replace(/\*(.+?)\*/g, `<b style="color:${el.couleurMontant ?? "#2f8a3e"}">$1</b>`) }} />
      </div>
    </div>
  );
};

// Explosion de confettis / particules (déterministe)
export const Particules: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const n = el.nombre ?? 46;
  const cx = W * (el.x ?? 0.5), cy = H * (el.position ?? 0.2);
  const couleurs = el.couleurs ?? [theme.accent, "#ffffff", "#c8f08f", theme.accent];
  const t = f / fps;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: n }).map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2, v = 900 + random(`v${i}`) * 1300;
        const x = cx + Math.cos(a) * v * t * 0.9, y = cy + Math.sin(a) * v * t * 0.75 + 1600 * t * t;
        const r = random(`r${i}`) * 720 * t, s = 14 + random(`s${i}`) * 22;
        const o = interpolate(t, [0, 0.05, 0.75, 1.1], [0, 1, 1, 0], clamp);
        return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s * (random(`h${i}`) > 0.5 ? 0.45 : 1), borderRadius: random(`c${i}`) > 0.6 ? 99 : 3, background: couleurs[i % couleurs.length], transform: `rotate(${r}deg)`, opacity: o }} />;
      })}
    </AbsoluteFill>
  );
};

// Mot géant « premium » : arrivée 3D, surligneur qui balaie derrière, option derrière la personne
export const Titre3D: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const f = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const d = el.a - el.de;
  const sp = spring({ frame: f, fps, config: { damping: 12, stiffness: 150, mass: 0.8 } });
  const out = interpolate(f, [d - 6, d], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const coul = el.couleur === "accent" ? theme.accent : el.couleur === "rouge" ? theme.rouge : el.couleur ?? "#fff";
  const surl = el.surligne ? interpolate(f, [3, 11], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) : 0;
  const respir = 1 + 0.025 * (f / Math.max(1, d));
  return (
    <AbsoluteFill style={{ pointerEvents: "none", perspective: 1400 }}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: H * (el.position ?? 0.22), textAlign: "center",
        transform: `translateY(-50%) rotateX(${(1 - sp) * 75}deg) scale(${(0.6 + 0.4 * sp) * respir}) translateY(${out * -80}px)`,
        transformOrigin: "50% 100%", opacity: Math.min(1, sp * 2) * (1 - out), filter: `blur(${out * 14}px)`,
      }}>
        <span style={{ position: "relative", display: "inline-block", padding: el.surligne ? "0 0.12em" : 0 }}>
          {el.surligne && <span style={{ position: "absolute", left: 0, top: "8%", bottom: "6%", width: `${surl * 100}%`, background: el.surligne === "accent" ? theme.accent : el.surligne, borderRadius: 14, transform: "skewX(-6deg)" }} />}
          <span style={{
            position: "relative", fontFamily: police(el.police ?? theme.policeTitre), fontSize: el.taille ?? 300, lineHeight: 1, letterSpacing: el.espacement ?? 2,
            color: el.surligne && surl > 0.5 ? (el.couleurSurligne ?? "#08130b") : coul, fontStyle: el.italique ? "italic" : "normal",
            textShadow: el.surligne || el.sobre ? "none" : `0 8px 0 rgba(0,0,0,.25), 0 20px 60px rgba(0,0,0,.45)${el.halo ? `, 0 0 60px ${coul}88` : ""}`,
            WebkitTextStroke: el.contour ? `4px ${coul}` : undefined, ...(el.contour ? { color: "transparent" } : {}),
          }}>{el.texte}</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
