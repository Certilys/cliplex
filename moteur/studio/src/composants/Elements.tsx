// Éléments graphiques posés sur la vidéo : mots géants, titres, cartons, B-roll, compteurs, listes, flèches…
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { police } from "../polices";
import { Notif, Particules, Titre3D } from "./Motion";
import { Chapitre, Code, Definition, Ecran, Encart, Idee, Schema, Surlignage, Tiers } from "./Formation";
import { PERSO } from "../perso";

export const couleur = (c: string | undefined, theme: any) =>
  !c ? "#fff" : c === "accent" ? theme.accent : c === "rouge" ? theme.rouge : c === "cyan" ? theme.cyan : c === "blanc" ? "#fff" : c === "noir" ? "#0b0b0b" : c;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ombre = "0 4px 0 rgba(0,0,0,.35), 0 10px 40px rgba(0,0,0,.55)";
const posY = (p: any, H: number) => (typeof p === "number" ? H * p : p === "centre" ? H * 0.5 : p === "bas" ? H * 0.74 : H * 0.24);
const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));

// Entrée/sortie communes : apparition nette avec léger flou de mouvement, sortie rapide
const useAnim = (el: any, mode = "pop") => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = el.a - el.de;
  const sp = spring({ frame: f, fps, config: { damping: 15, stiffness: 220, mass: 0.6 } });
  const out = interpolate(f, [d - 5, d], [1, 0], clamp);
  let scale = 1, y = 0, blur = 0;
  if (mode === "pop") { scale = 0.6 + 0.4 * sp; blur = (1 - Math.min(1, sp)) * 10; }
  if (mode === "slam") { scale = interpolate(f, [0, 4], [1.9, 1], { ...clamp, easing: Easing.out(Easing.cubic) }); blur = interpolate(f, [0, 4], [18, 0], clamp); }
  if (mode === "monte") { y = (1 - sp) * 60; blur = (1 - Math.min(1, sp)) * 8; }
  const outBlur = (1 - out) * 12;
  return { f, d, sp, scale, y: y - (1 - out) * 30, blur: blur + outBlur, opacity: Math.min(1, f / 2) * out };
};

const MotGeant: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H } = useVideoConfig();
  const a = useAnim(el, el.anim ?? "slam");
  const lignes = String(el.texte).split("\\n");
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{
        position: "absolute", left: W * 0.05, right: W * 0.05, top: posY(el.position, H), textAlign: "center",
        transform: `translateY(-50%) translateY(${a.y}px) scale(${a.scale}) rotate(${el.rotation ?? 0}deg)`, opacity: a.opacity, filter: `blur(${a.blur}px)`,
        fontFamily: police(el.police ?? theme.policeTitre), fontSize: el.taille ?? 190, lineHeight: 0.95, color: couleur(el.couleur ?? "blanc", theme),
        textTransform: el.casse === "normale" ? "none" : "uppercase", fontStyle: el.italique ? "italic" : "normal", fontWeight: el.graisse ?? 900,
        textShadow: el.sobre ? "none" : el.halo ? `${ombre}, 0 0 40px ${couleur(el.couleur ?? "blanc", theme)}88` : ombre, letterSpacing: el.espacement ?? 0,
      }}>
        {lignes.map((l: string, k: number) => <div key={k}>{l}</div>)}
      </div>
    </AbsoluteFill>
  );
};

// Titre machine à écrire en haut d'écran, avec curseur
const Titre: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const a = useAnim(el, "none");
  const n = Math.floor((a.f / fps) / (el.vitesse ?? 0.045));
  const txt = String(el.texte).slice(0, n);
  const curseur = n < el.texte.length || Math.floor(a.f / 8) % 2 === 0;
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", left: W * 0.07, right: W * 0.07, top: posY(el.position ?? 0.13, H), opacity: a.opacity, filter: `blur(${a.blur}px)`,
        fontFamily: police(el.police ?? theme.police), fontWeight: 900, fontSize: el.taille ?? 84, color: couleur(el.couleur ?? "blanc", theme),
        textTransform: "uppercase", textAlign: el.alignement ?? "center", lineHeight: 1.05, textShadow: el.sobre ? "none" : ombre,
      }}>
        {txt}<span style={{ opacity: curseur ? 1 : 0, fontWeight: 300 }}>|</span>
      </div>
    </AbsoluteFill>
  );
};

// Cartons plein écran mot par mot (hook typographique, phrase-thèse)
const Carton: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const f = useCurrentFrame() + el.de;
  const { width: W } = useVideoConfig();
  const fonds = el.fonds ?? ["#0b0b0b", "#f4f4f0", "#0b0b0b"];
  const c = el.cartes.find((x: any) => f >= x.de && f < x.a) ?? el.cartes[el.cartes.length - 1];
  if (!c) return null;
  const dernier = c.k === el.cartes.length - 1;
  const accentue = (el.accent ?? []).includes(c.k) || (dernier && el.accentDernier !== false);
  const fond = accentue ? theme.accent : fonds[c.k % fonds.length];
  const clair = ["#f4f4f0", "#fff", "#ffffff"].includes(fond) || accentue;
  const t = f - c.de;
  const sc = interpolate(t, [0, 5], [1.08, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ backgroundColor: fond, justifyContent: "center", alignItems: "center" }}>
      <div style={{
        fontFamily: police(el.police ?? "Unbounded"), fontWeight: 900, fontSize: el.taille ?? Math.min(170, (W * 0.82) / Math.max(3, c.texte.length) * 1.55),
        color: clair ? "#0b0b0b" : "#fff", textTransform: "uppercase", transform: `scale(${sc})`, letterSpacing: -2, textAlign: "center",
        filter: `blur(${interpolate(t, [0, 3], [6, 0], clamp)}px)`,
      }}>{c.texte}</div>
    </AbsoluteFill>
  );
};

// B-roll vidéo ou image : plein écran (léger zoom), carte arrondie, ou moitié haute
const Media: React.FC<{ el: any; theme: any }> = ({ el }) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const f = useCurrentFrame();
  const d = el.a - el.de;
  const z = interpolate(f, [0, d], el.zoom ?? [1.0, 1.1]);
  const isImg = el.type === "image";
  const m = isImg
    ? <Img src={src(el.src)} style={{ width: "100%", height: "100%", objectFit: el.ajustement ?? "cover", transform: `scale(${z})` }} />
    : <OffthreadVideo src={src(el.src)} muted startFrom={Math.round((el.debutSrc ?? 0) * fps)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${(el.cadrage ?? 0.5) * 100}% 50%`, transform: `scale(${z})` }} />;
  const mode = el.mode ?? "plein";
  if (mode === "plein") return <AbsoluteFill style={{ overflow: "hidden" }}>{m}</AbsoluteFill>;
  const sp = spring({ frame: f, fps, config: { damping: 16, stiffness: 180 } });
  const out = interpolate(f, [d - 5, d], [1, 0], clamp);
  if (mode === "haut")
    return <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H * 0.5, overflow: "hidden", transform: `translateY(${(1 - sp) * -80}px)`, opacity: out }}>{m}</div>;
  // carte
  const cw = Math.min(W, H * 0.75) * (el.largeur ?? 0.84), ch = Math.min(cw * (el.ratio ?? 1.25), H * 0.8);
  return (
    <AbsoluteFill style={{ backdropFilter: `blur(${18 * Math.min(sp, out)}px) brightness(${1 - 0.45 * Math.min(sp, out)})` }}>
      <div style={{
        position: "absolute", left: (W - cw) / 2, top: posY(el.position ?? 0.4, H) - ch / 2, width: cw, height: ch, borderRadius: 34, overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,.6)", border: "3px solid rgba(255,255,255,.9)",
        transform: `scale(${0.85 + 0.15 * sp}) rotate(${(1 - sp) * (el.rotation ?? -4)}deg)`, opacity: Math.min(1, sp * 1.5) * out,
      }}>{m}</div>
    </AbsoluteFill>
  );
};

const fmt = (n: number, dec = 0) => n.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/ /g, " ");
const Compteur: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { fps } = useVideoConfig();
  const a = useAnim(el, "pop");
  const v = interpolate(a.f, [0, (el.vitesse ?? 0.8) * fps], [el.de_ ?? el.depart ?? 0, el.arrivee], { ...clamp, easing: Easing.out(Easing.cubic) });
  return <MotGeant el={{ ...el, texte: `${el.prefixe ?? ""}${fmt(v, el.decimales ?? 0)}${el.suffixe ?? ""}`, anim: "none" }} theme={theme} />;
};

// Croix rouge / coche dessinées au trait
const Trait: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H } = useVideoConfig();
  const f = useCurrentFrame();
  const d = el.a - el.de;
  const p1 = interpolate(f, [0, 5], [1, 0], clamp), p2 = interpolate(f, [4, 9], [1, 0], clamp);
  const out = interpolate(f, [d - 5, d], [1, 0], clamp);
  const t = el.taille ?? 300;
  const c = couleur(el.couleur ?? (el.type === "croix" ? "rouge" : "accent"), theme);
  const st = { fill: "none", stroke: c, strokeWidth: 26, strokeLinecap: "round" as const, pathLength: 1, strokeDasharray: 1, filter: `drop-shadow(0 0 18px ${c}aa)` };
  return (
    <svg width={t} height={t} viewBox="0 0 100 100" style={{ position: "absolute", left: W * (el.x ?? 0.5) - t / 2, top: posY(el.position ?? 0.3, H) - t / 2, opacity: out, overflow: "visible" }}>
      {el.type === "croix" ? (<>
        <path d="M18 18 L82 82" {...st} strokeDashoffset={p1} />
        <path d="M82 18 L18 82" {...st} strokeDashoffset={p2} />
      </>) : <path d="M14 54 L40 78 L88 22" {...st} strokeDashoffset={interpolate(f, [0, 8], [1, 0], clamp)} />}
    </svg>
  );
};

// Checklist construite ligne par ligne
const Liste: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const f = useCurrentFrame() + el.de;
  const out = interpolate(f, [el.a - 5, el.a], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: W * 0.08, right: W * 0.08, top: posY(el.position ?? 0.1, H), opacity: out, ...(el.plaque ? { display: "flex", justifyContent: "center" } : {}) }}>
      <div style={el.plaque ? { background: "rgba(14,13,18,.88)", borderRadius: 30, padding: "34px 44px 18px", opacity: interpolate(f - el.de, [0, 6], [0, 1], clamp), transform: `scale(${interpolate(f - el.de, [0, 8], [0.94, 1], { ...clamp, easing: Easing.out(Easing.cubic) })})` } : undefined}>
      {el.titre && <div style={{ fontFamily: police(theme.police), fontWeight: 900, fontSize: 86, color: couleur("accent", theme), textTransform: "uppercase", marginBottom: 28, textShadow: el.sobre ? "none" : ombre }}>{el.titre}</div>}
      {el.items.map((it: any, k: number) => {
        const t = f - it.de;
        if (t < 0 && !el.plaque) return null;
        const sp = t < 0 ? 0 : spring({ frame: t, fps, config: { damping: 16, stiffness: 200 } });
        return (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 18, transform: `translateX(${(1 - sp) * -60}px)`, opacity: sp }}>
            <div style={{ width: (el.tailleItem ?? 76) * 1.1, height: (el.tailleItem ?? 76) * 1.1, borderRadius: (el.tailleItem ?? 76) * 0.26, flexShrink: 0, background: couleur("accent", theme), display: "flex", alignItems: "center", justifyContent: "center", fontSize: (el.tailleItem ?? 76) * 0.76, fontWeight: 900, color: "#0b0b0b", fontFamily: police(theme.police) }}>✓</div>
            <div style={{ fontFamily: police(theme.police), fontWeight: 800, fontSize: el.tailleItem ?? 76, color: "#fff", textShadow: el.sobre ? "none" : ombre }}>{it.texte}</div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

// Carte numérotée motion design (explication en N points)
const Carte: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H } = useVideoConfig();
  const a = useAnim(el, "monte");
  return (
    <div style={{
      position: "absolute", left: W * 0.06, right: W * 0.06, top: posY(el.position ?? 0.08, H), padding: "44px 48px", borderRadius: 36,
      background: el.fond ?? "rgba(12,12,14,.88)", border: `3px solid ${couleur("accent", theme)}`, boxShadow: "0 30px 80px rgba(0,0,0,.5)",
      transform: `translateY(${a.y}px) scale(${0.96 + 0.04 * Math.min(1, a.sp)})`, opacity: a.opacity, filter: `blur(${a.blur}px)`,
    }}>
      {el.numero && <div style={{ fontFamily: police(theme.policeTitre), fontSize: 120, color: couleur("accent", theme), lineHeight: 1 }}>{el.numero}</div>}
      <div style={{ fontFamily: police(theme.police), fontWeight: 800, fontSize: el.taille ?? 64, color: "#fff", lineHeight: 1.15, marginTop: 10 }}
        dangerouslySetInnerHTML={{ __html: String(el.texte).replace(/\*(.+?)\*/g, `<span style="color:${couleur("accent", theme)}">$1</span>`) }} />
    </div>
  );
};

const Fleche: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H } = useVideoConfig();
  const f = useCurrentFrame();
  const d = el.a - el.de;
  const p = interpolate(f, [0, 7], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(f, [d - 5, d], [1, 0], clamp);
  const t = el.taille ?? 260;
  return (
    <svg width={t} height={t} viewBox="0 0 100 100" style={{ position: "absolute", left: W * el.x - t / 2, top: H * el.y - t / 2, transform: `rotate(${el.angle ?? 0}deg)`, opacity: out, overflow: "visible" }}>
      <path d="M10 90 Q 30 30 85 18" fill="none" stroke={couleur(el.couleur ?? "blanc", theme)} strokeWidth={9} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={p} />
      <path d="M68 8 L88 17 L76 36" fill="none" stroke={couleur(el.couleur ?? "blanc", theme)} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" opacity={p < 0.1 ? 1 : 0} />
    </svg>
  );
};

export const Element: React.FC<{ el: any; theme: any }> = ({ el: el0, theme }) => {
  // theme.sobre : textes sans ombre ni halo (lisibles grâce à une plaque unie)
  const el = theme?.sobre ? { ...el0, sobre: true } : el0;
  switch (el.type) {
    case "motGeant": return <MotGeant el={el} theme={theme} />;
    case "titre": return <Titre el={el} theme={theme} />;
    case "carton": return <Carton el={el} theme={theme} />;
    case "broll": case "image": return <Media el={el} theme={theme} />;
    case "compteur": return <Compteur el={el} theme={theme} />;
    case "croix": case "coche": return <Trait el={el} theme={theme} />;
    case "liste": return <Liste el={el} theme={theme} />;
    case "carte": return <Carte el={el} theme={theme} />;
    case "fleche": return <Fleche el={el} theme={theme} />;
    case "notif": return <Notif el={el} theme={theme} />;
    case "particules": return <Particules el={el} theme={theme} />;
    case "titre3d": return <Titre3D el={el} theme={theme} />;
    case "chapitre": return <Chapitre el={el} theme={theme} />;
    case "encart": return <Encart el={el} theme={theme} />;
    case "idee": return <Idee el={el} theme={theme} />;
    case "definition": return <Definition el={el} theme={theme} />;
    case "tiers": return <Tiers el={el} theme={theme} />;
    case "ecran": return <Ecran el={el} theme={theme} />;
    case "code": return <Code el={el} theme={theme} />;
    case "schema": return <Schema el={el} theme={theme} />;
    case "surlignage": return <Surlignage el={el} theme={theme} />;
    case "perso": {
      const C = PERSO[el.composant];
      return C ? <C el={el} theme={theme} /> : null;
    }
    default: return null;
  }
};
