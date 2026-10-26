import { AbsoluteFill, Audio, Easing, OffthreadVideo, getRemotionEnvironment, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

const ease = Easing.bezier(0.33, 0, 0.2, 1);
const glisse = Easing.bezier(0.65, 0, 0.35, 1);

// Facteur de zoom global (punch-ins / zooms progressifs posés sur des plages de mots)
export const facteurZoom = (zooms: any[], f: number) => {
  let z = 1;
  let focus: number[] | null = null;
  for (const e of zooms) {
    if (f < e.de || f >= e.a) continue;
    const d = e.a - e.de;
    if (e.mode === "doux") z *= interpolate(f, [e.de, e.a], [1, e.facteur], { easing: Easing.inOut(Easing.sin) });
    else if (e.mode === "rapide") z *= interpolate(f, [e.de, e.de + Math.min(5, d)], [1, e.facteur], { easing: ease, extrapolateRight: "clamp" });
    else if (e.mode === "impact") z *= e.facteur * interpolate(f, [e.de, e.de + 3, e.de + 8], [1.08, 0.985, 1], { easing: ease, extrapolateRight: "clamp" });
    else if (e.mode === "lisse") {
      // mouvement de caméra posé : montée douce, tenue, retour doux (jamais de saut)
      const k = Math.min(1, d / (e.entree + e.sortie + 2));
      const ei = Math.max(2, e.entree * k), so = Math.max(2, e.sortie * k);
      z *= interpolate(f, [e.de, e.de + ei, e.a - so, e.a], [1, e.facteur, e.facteur * 1.015, 1], { easing: glisse, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    }
    else if (e.mode === "recul") z *= interpolate(f, [e.de, e.de + Math.min(d, e.entree * 1.6)], [e.facteur, 1], { easing: glisse, extrapolateRight: "clamp" });
    else if (e.mode === "arriere") z *= interpolate(f, [e.de, e.a], [e.facteur, 1], { easing: Easing.out(Easing.quad) });
    else z *= e.facteur; // "sec" : punch-in franc
    if (e.focus) focus = e.focus;
  }
  return { z, focus };
};

export const Clip: React.FC<{ clip: any; zooms: any[]; src?: string; decalage?: number; audioSeul?: boolean }> = ({ clip, zooms, src, decalage = 0, audioSeul }) => {
  const { fps: fpsA } = useVideoConfig();
  if (audioSeul) {
    const volA = (f: number) => interpolate(f, [0, 2, clip.duree - 2, clip.duree], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return <Audio src={staticFile(clip.src)} startFrom={Math.round(clip.debutSrc * fpsA) + decalage} volume={volA} />;
  }
  const frame = useCurrentFrame() + decalage;
  const { width: W, height: H, fps } = useVideoConfig();
  const [sw, sh] = clip.taille;
  const g = clip.de + frame;
  const { z: zEv, focus: fEv } = facteurZoom(zooms, g);
  const zClip = interpolate(frame, [0, clip.duree], clip.zoom, { easing: Easing.inOut(Easing.sin) }) * (1 + (clip.derive ?? 0) * (frame / Math.max(1, clip.duree)));
  const [fx, fy] = fEv ?? clip.focus;
  // vertical → horizontal (ou l'inverse) : on contient l'image et on remplit avec un fond flou, sinon on recadre
  const ecart = (sw / sh) / (W / H);
  const contenir = clip.ajustement === "flou" || (clip.ajustement !== "couvrir" && (ecart < 0.66 || ecart > 1.5));
  const S = (contenir ? Math.min(W / sw, H / sh) : Math.max(W / sw, H / sh)) * zClip * zEv;
  const w = sw * S, h = sh * S;
  const left = contenir && w <= W ? (W - w) / 2 : Math.min(0, Math.max(W - w, (clip.surPlace ? fx * W : W / 2) - fx * w));
  const top = contenir && h <= H ? (H - h) / 2 : Math.min(0, Math.max(H - h, (clip.surPlace ? fy * H : H * 0.42) - fy * h));
  // micro-fondu audio aux coupes (anti-clic)
  const vol = (f: number) => interpolate(f, [0, 2, clip.duree - 2, clip.duree], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (clip.volume ?? 1);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {contenir && !src && (
        <OffthreadVideo src={staticFile(getRemotionEnvironment().isStudio && clip.apercu ? clip.apercu : clip.src)} muted startFrom={Math.round(clip.debutSrc * fps) + decalage}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.25)", filter: "blur(50px) brightness(.55) saturate(1.2)" }} />
      )}
      <OffthreadVideo
        src={staticFile(src ?? (getRemotionEnvironment().isStudio && clip.apercu ? clip.apercu : clip.src))}
        transparent={!!src}
        muted={!!src}
        startFrom={Math.round(clip.debutSrc * fps) + decalage}
        volume={src ? 0 : vol}
        style={{ position: "absolute", left, top, width: w, height: h, maxWidth: "none" }}
      />
    </AbsoluteFill>
  );
};
