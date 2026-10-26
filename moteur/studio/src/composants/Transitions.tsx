import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const cloche = (f: number, a: number, d: number) =>
  interpolate(f, [a - d / 2, a, a + d / 2], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Mouvements caméra appliqués à toute la couche image autour d'une coupe (whip pan, zoom blur, glitch)
export const effetCamera = (trs: any[], f: number, W: number) => {
  let tx = 0, ty = 0, rz = 0, s = 1, blur = 0, hue = 0;
  for (const t of trs) {
    if (Math.abs(f - t.a) > Math.max(12, t.duree)) continue;
    if (t.type === "traverse") {
      // zoom traversant : on plonge dans l'image, la coupe passe dans le flou, on ressort sur le plan suivant
      const d = Math.max(8, t.duree / 2);
      const p = f < t.a ? interpolate(f, [t.a - d, t.a], [0, 1], { easing: Easing.in(Easing.cubic), extrapolateLeft: "clamp" })
                        : interpolate(f, [t.a, t.a + d], [1, 0], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" });
      s *= f < t.a ? 1 + p * 0.55 : 1 + p * 0.35; blur += p * 26;
    }
    if (t.type === "balayage") {
      // whip pan : départ vers la gauche, arrivée par la droite, flou de vitesse
      const d = Math.max(6, t.duree / 2);
      const p = f < t.a ? interpolate(f, [t.a - d, t.a], [0, 1], { easing: Easing.in(Easing.quad), extrapolateLeft: "clamp" })
                        : interpolate(f, [t.a, t.a + d], [1, 0], { easing: Easing.out(Easing.cubic), extrapolateRight: "clamp" });
      tx += (f < t.a ? -1 : 1) * p * W * 0.16; s *= 1 + p * 0.38; blur += p * 30;
    }
    if (t.type === "whip") {
      const p = interpolate(f, [t.a - 4, t.a, t.a + 4], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      tx += (f < t.a ? -1 : 1) * p * W * 0.18; blur += p * 28;
    }
    if (t.type === "zoomblur") {
      const p = cloche(f, t.a, 8); s *= 1 + p * 0.22; blur += p * 16;
    }
    if (t.type === "secousse" && f >= t.a && f < t.a + 10) {
      const k = f - t.a, amp = (t.amplitude ?? 22) * Math.pow(0.72, k);
      tx += Math.sin(k * 2.7) * amp; ty += Math.cos(k * 3.3) * amp * 0.8; rz += Math.sin(k * 1.9) * amp * 0.03;
      if (k < 2) blur += 3;
      s *= 1 + amp * 0.002 + 0.02;
    }
    if (t.type === "glitch" && f >= t.a - 2 && f <= t.a + 4) {
      tx += (((f * 7919) % 5) - 2) * 14; hue += ((f * 31) % 3) * 40;
    }
  }
  return { transform: `translate(${tx}px, ${ty}px) rotate(${rz}deg) scale(${s})`, filter: `${blur > 0.5 ? `blur(${blur}px)` : ""} ${hue ? `hue-rotate(${hue}deg)` : ""}` };
};

// Superpositions lumineuses : flash blanc, light leak chaud, flash couleur
export const Transitions: React.FC<{ transitions: any[] }> = ({ transitions }) => {
  const f = useCurrentFrame();
  return (
    <>
      {transitions.map((t, k) => {
        if (Math.abs(f - t.a) > t.duree * 1.5) return null;
        if (t.type === "flash") {
          const o = cloche(f, t.a, Math.max(4, t.duree * 0.6));
          return <AbsoluteFill key={k} style={{ backgroundColor: t.couleur ?? "#fff", opacity: o * 0.92 }} />;
        }
        if (t.type === "leak") {
          const d = Math.max(8, t.duree * 1.4);
          const o = cloche(f, t.a, d);
          const x = interpolate(f, [t.a - d / 2, t.a + d / 2], [20, 80]);
          return (
            <AbsoluteFill key={k} style={{
              mixBlendMode: "screen", opacity: o,
              background: `radial-gradient(circle at ${x}% 40%, rgba(255,240,200,1) 0%, rgba(255,150,40,.95) 22%, rgba(255,40,20,.7) 45%, rgba(120,0,40,0) 75%)`,
            }} />
          );
        }
        if (t.type === "volet") {
          // panneau diagonal couleur de marque qui balaie l'écran (la coupe se fait sous le panneau)
          const d = Math.max(10, t.duree);
          const p = interpolate(f, [t.a - d / 2, t.a + d / 2], [-1.4, 1.4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          if (p <= -1.4 || p >= 1.4) return null;
          return (
            <AbsoluteFill key={k} style={{ overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "-30%", bottom: "-30%", left: `${p * 100}%`, width: "120%", background: t.couleur ?? "#7DC242", transform: "skewX(-18deg)", boxShadow: "0 0 80px rgba(0,0,0,.35)" }} />
              <div style={{ position: "absolute", top: "-30%", bottom: "-30%", left: `${p * 100 - 14}%`, width: "12%", background: "#ffffff", opacity: 0.9, transform: "skewX(-18deg)" }} />
            </AbsoluteFill>
          );
        }
        if (t.type === "glitch") {
          if (f < t.a - 2 || f > t.a + 4) return null;
          return (
            <AbsoluteFill key={k} style={{ mixBlendMode: "screen", opacity: 0.5, background: `repeating-linear-gradient(0deg, rgba(255,0,80,.35) 0 ${3 + (f % 4)}px, rgba(0,255,255,.25) ${3 + (f % 4)}px ${9 + (f % 6)}px, transparent ${9 + (f % 6)}px 28px)` }} />
          );
        }
        return null;
      })}
    </>
  );
};
