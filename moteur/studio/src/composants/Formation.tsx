// Éléments pour les formations et vidéos YouTube (16:9, mais tout s'adapte au format) :
// chapitres, encarts posés à côté de la personne, bandeau nom, idée clé, captures d'écran
// avec zones mises en avant, code, schémas, définitions. Sobres : aplats, pas d'ombre
// sur les textes, une seule couleur d'accent, celle du style de la personne.
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { police } from "../polices";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const doux = Easing.bezier(0.22, 1, 0.36, 1);
const src = (s: string) => (s.startsWith("http") ? s : staticFile(s));

// Unité : 1 px en 1080p, quel que soit le format (4K, vertical…).
const useK = () => {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 1080;
};

// Couleurs du thème : texte et panneaux clairs ou sombres selon theme.panneau.
export const palette = (theme: any) => {
  const clair = theme.panneau === "clair";
  return {
    accent: theme.accent ?? "#FFFFFF",
    panneau: theme.couleurPanneau ?? (clair ? "#FFFFFF" : "rgba(16,16,20,.92)"),
    texte: theme.textePanneau ?? (clair ? "#111114" : "#FFFFFF"),
    doux: clair ? "rgba(17,17,20,.6)" : "rgba(255,255,255,.66)",
    trait: clair ? "rgba(17,17,20,.12)" : "rgba(255,255,255,.14)",
    fond: theme.fond ?? "#0E0E10",
    surFond: theme.texte ?? "#FFFFFF",
  };
};

// « *mot* » = mot dans la couleur d'accent
const Riche: React.FC<{ texte: string; accent: string }> = ({ texte, accent }) => (
  <>
    {String(texte)
      .split(/(\*[^*]+\*)/g)
      .map((m, k) => (m.startsWith("*") && m.endsWith("*") ? <span key={k} style={{ color: accent }}>{m.slice(1, -1)}</span> : <span key={k}>{m}</span>))}
  </>
);

// Entrée et sortie communes : glisse depuis le côté, fondu, rien qui rebondit.
const useEntree = (el: any, depuis = 40) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = el.a - el.de;
  const e = interpolate(f, [0, Math.round(fps * 0.45)], [0, 1], { ...clamp, easing: doux });
  const s = interpolate(f, [d - Math.round(fps * 0.3), d], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) });
  return { f, d, p: Math.min(e, s), dx: (1 - e) * depuis - (1 - s) * depuis * 0.4 };
};

// Une ligne qui apparaît sur son mot (items[].de en images absolues)
const useItem = (it: any, el: any) => {
  const f = useCurrentFrame() + el.de;
  const { fps } = useVideoConfig();
  const t = f - (it.de ?? el.de);
  return interpolate(t, [0, Math.round(fps * 0.35)], [0, 1], { ...clamp, easing: doux });
};

// Zone libre à côté de la personne : gauche ou droite, largeur en part de l'image.
const useCote = (el: any) => {
  const { width: W, height: H } = useVideoConfig();
  const k = useK();
  const largeur = W * (el.largeur ?? (W > H ? 0.34 : 0.84));
  const marge = W * (el.marge ?? 0.05);
  const gauche = el.cote === "gauche";
  const left = W > H ? (gauche ? marge : W - marge - largeur) : (W - largeur) / 2;
  return { W, H, k, largeur, left, sens: gauche ? -1 : 1 };
};

const Panneau: React.FC<{ el: any; theme: any; children: React.ReactNode; centreY?: number }> = ({ el, theme, children, centreY }) => {
  const c = palette(theme);
  const { H, k, largeur, left, sens } = useCote(el);
  const a = useEntree(el, 50 * k * sens);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute", left, width: largeur, top: H * (centreY ?? el.y ?? 0.5), transform: `translate(${a.dx}px, -50%)`, opacity: a.p,
          background: c.panneau, color: c.texte, borderRadius: 22 * k, padding: `${34 * k}px ${38 * k}px`, boxShadow: `0 ${18 * k}px ${50 * k}px rgba(0,0,0,.28)`,
          fontFamily: police(theme.police, "Inter"),
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Surtitre: React.FC<{ texte: string; theme: any }> = ({ texte, theme }) => {
  const k = useK();
  const c = palette(theme);
  return <div style={{ fontSize: 22 * k, fontWeight: 600, letterSpacing: 0.4 * k, color: c.accent === "#FFFFFF" ? c.doux : c.accent, marginBottom: 14 * k }}>{texte}</div>;
};

// Chapitre : carton plein cadre (début d'une partie) ou bandeau discret en bas à gauche.
export const Chapitre: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const k = useK();
  const c = palette(theme);
  const a = useEntree(el, 0);
  const e = useEntree(el, -40 * k);
  if (el.mode === "bandeau") {
    return (
      <div style={{ position: "absolute", left: W * 0.045, bottom: H * 0.07, transform: `translateX(${e.dx}px)`, opacity: e.p, display: "flex", alignItems: "center", gap: 16 * k, background: c.panneau, color: c.texte, borderRadius: 14 * k, padding: `${16 * k}px ${24 * k}px`, fontFamily: police(theme.police, "Inter") }}>
        {el.numero && <span style={{ fontSize: 24 * k, fontWeight: 700, color: c.accent === "#FFFFFF" ? c.doux : c.accent }}>{el.numero}</span>}
        <span style={{ fontSize: 28 * k, fontWeight: 600 }}>{el.titre}</span>
      </div>
    );
  }
  const ligne = interpolate(a.f, [Math.round(fps * 0.15), Math.round(fps * 0.7)], [0, 1], { ...clamp, easing: doux });
  return (
    <AbsoluteFill style={{ background: c.fond, opacity: interpolate(a.f, [0, 6, a.d - 6, a.d], [0, 1, 1, 0], clamp), justifyContent: "center", padding: `0 ${W * 0.1}px`, fontFamily: police(theme.policeTitre ?? theme.police, "Inter Tight") }}>
      {el.numero && <div style={{ fontSize: 30 * k, fontWeight: 600, color: c.accent === "#FFFFFF" ? "rgba(255,255,255,.6)" : c.accent, fontFamily: police(theme.police, "Inter"), opacity: ligne }}>{el.numero}</div>}
      <div style={{ height: 3 * k, width: 120 * k * ligne, background: c.accent, margin: `${22 * k}px 0 ${30 * k}px` }} />
      <div style={{ fontSize: (el.taille ?? 92) * k, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 * k, color: c.surFond, transform: `translateY(${(1 - ligne) * 24 * k}px)`, opacity: ligne }}>
        <Riche texte={el.titre} accent={c.accent} />
      </div>
      {el.sousTitre && <div style={{ marginTop: 22 * k, fontSize: 32 * k, color: "rgba(255,255,255,.62)", fontFamily: police(theme.police, "Inter"), opacity: ligne }}>{el.sousTitre}</div>}
    </AbsoluteFill>
  );
};

// Encart à côté de la personne : un titre et des points qui arrivent chacun sur leur mot.
export const Encart: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const k = useK();
  const c = palette(theme);
  return (
    <Panneau el={el} theme={theme}>
      {el.surtitre && <Surtitre texte={el.surtitre} theme={theme} />}
      {el.titre && <div style={{ fontFamily: police(theme.policeTitre ?? theme.police, "Inter Tight"), fontSize: (el.taille ?? 40) * k, fontWeight: 700, lineHeight: 1.15, marginBottom: el.items?.length ? 24 * k : 0 }}><Riche texte={el.titre} accent={c.accent} /></div>}
      {(el.items ?? []).map((it: any, n: number) => <Point key={n} it={it} n={n} el={el} theme={theme} />)}
    </Panneau>
  );
};

const Point: React.FC<{ it: any; n: number; el: any; theme: any }> = ({ it, n, el, theme }) => {
  const k = useK();
  const c = palette(theme);
  const p = useItem(it, el);
  const numerote = el.numeros !== false;
  return (
    <div style={{ display: "flex", gap: 18 * k, alignItems: "baseline", padding: `${12 * k}px 0`, borderTop: n ? `1px solid ${c.trait}` : "none", opacity: 0.25 + 0.75 * p, transform: `translateY(${(1 - p) * 10 * k}px)` }}>
      <span style={{ flex: "none", width: 34 * k, fontSize: 24 * k, fontWeight: 700, color: c.accent === "#FFFFFF" ? c.doux : c.accent }}>{numerote ? String(n + 1).padStart(2, "0") : "•"}</span>
      <span style={{ fontSize: 30 * k, fontWeight: 500, lineHeight: 1.3 }}><Riche texte={it.texte} accent={c.accent} /></span>
    </div>
  );
};

// Idée clé : une phrase forte posée à côté de la personne.
export const Idee: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const k = useK();
  const c = palette(theme);
  return (
    <Panneau el={el} theme={theme}>
      {el.surtitre && <Surtitre texte={el.surtitre} theme={theme} />}
      <div style={{ fontFamily: police(theme.policeTitre ?? theme.police, "Inter Tight"), fontSize: (el.taille ?? 52) * k, fontWeight: 700, lineHeight: 1.12, letterSpacing: -0.5 * k }}>
        <Riche texte={el.texte} accent={c.accent} />
      </div>
    </Panneau>
  );
};

// Définition : le terme, puis son explication en une phrase.
export const Definition: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const k = useK();
  const c = palette(theme);
  return (
    <Panneau el={el} theme={theme}>
      <Surtitre texte={el.surtitre ?? "Définition"} theme={theme} />
      <div style={{ fontFamily: police(theme.policeTitre ?? theme.police, "Inter Tight"), fontSize: 46 * k, fontWeight: 700 }}>{el.terme}</div>
      <div style={{ marginTop: 14 * k, fontSize: 29 * k, lineHeight: 1.4, color: c.doux }}><Riche texte={el.texte} accent={c.accent} /></div>
    </Panneau>
  );
};

// Bandeau nom (présentation de la personne)
export const Tiers: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H } = useVideoConfig();
  const k = useK();
  const c = palette(theme);
  const a = useEntree(el, -40 * k);
  const gauche = el.cote !== "droite";
  return (
    <div style={{ position: "absolute", [gauche ? "left" : "right"]: W * 0.05, bottom: H * (el.y ?? 0.17), transform: `translateX(${gauche ? a.dx : -a.dx}px)`, opacity: a.p, display: "flex", gap: 18 * k, alignItems: "stretch", fontFamily: police(theme.police, "Inter") }}>
      <div style={{ width: 5 * k, borderRadius: 3 * k, background: c.accent }} />
      <div style={{ background: c.panneau, color: c.texte, borderRadius: 12 * k, padding: `${14 * k}px ${24 * k}px` }}>
        <div style={{ fontSize: 34 * k, fontWeight: 700 }}>{el.nom}</div>
        {el.role && <div style={{ fontSize: 24 * k, color: c.doux, marginTop: 4 * k }}>{el.role}</div>}
      </div>
    </div>
  );
};

// Capture d'écran ou enregistrement d'écran dans un cadre (navigateur, fenêtre ou sans cadre),
// à côté de la personne ou en plein cadre. zones : rectangles (x, y, l, h en part de l'image)
// mis en avant chacun sur son mot, avec un zoom doux vers la zone si zoom > 1.
export const Ecran: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H, fps } = useVideoConfig();
  const k = useK();
  const c = palette(theme);
  const a = useEntree(el, 0);
  const f = a.f + el.de;
  const plein = el.cote === "plein" || el.cote === undefined;
  const largeur = plein ? W * (el.largeur ?? 0.86) : W * (el.largeur ?? 0.5);
  const ratio = el.ratio ?? 16 / 10;
  const barre = el.cadre === "aucun" ? 0 : 44 * k;
  const hauteurImage = largeur / ratio;
  const left = plein ? (W - largeur) / 2 : el.cote === "gauche" ? W * 0.04 : W * 0.96 - largeur;
  const top = (H - hauteurImage - barre) / 2;
  // Zone active : la dernière commencée
  const zones = (el.zones ?? []).filter((z: any) => f >= (z.de ?? el.de));
  const z = zones[zones.length - 1];
  const tz = z ? interpolate(f - (z.de ?? el.de), [0, Math.round(fps * 0.6)], [0, 1], { ...clamp, easing: doux }) : 0;
  const facteur = z?.zoom ? 1 + (z.zoom - 1) * tz : 1;
  const cx = z ? z.x + z.l / 2 : 0.5, cy = z ? z.y + z.h / 2 : 0.5;
  const tx = (0.5 - cx) * (facteur - 1) * largeur, ty = (0.5 - cy) * (facteur - 1) * hauteurImage;
  const media = /\.(mp4|mov|webm|m4v)$/i.test(el.src)
    ? <OffthreadVideo src={src(el.src)} muted startFrom={Math.round((el.debutSrc ?? 0) * fps)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
    : <Img src={src(el.src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", background: plein && el.fond !== false ? `rgba(8,8,10,${0.82 * a.p})` : undefined }}>
      <div style={{ position: "absolute", left, top, width: largeur, opacity: a.p, transform: `translateY(${(1 - a.p) * 30 * k}px) scale(${0.97 + 0.03 * a.p})`, borderRadius: 16 * k, overflow: "hidden", background: "#fff", boxShadow: `0 ${24 * k}px ${70 * k}px rgba(0,0,0,.4)` }}>
        {barre > 0 && (
          <div style={{ height: barre, background: "#F1F1F3", display: "flex", alignItems: "center", gap: 8 * k, padding: `0 ${16 * k}px`, borderBottom: "1px solid #E4E4E7" }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((x) => <span key={x} style={{ width: 13 * k, height: 13 * k, borderRadius: "50%", background: x }} />)}
            {el.cadre !== "fenetre" && el.url && <span style={{ marginLeft: 16 * k, flex: 1, height: 26 * k, borderRadius: 7 * k, background: "#fff", color: "#52525B", fontSize: 16 * k, display: "flex", alignItems: "center", padding: `0 ${12 * k}px`, fontFamily: police(theme.police, "Inter") }}>{el.url}</span>}
          </div>
        )}
        <div style={{ position: "relative", width: largeur, height: hauteurImage, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, transform: `translate(${tx}px, ${ty}px) scale(${facteur})` }}>
            {media}
            {z && (
              <div style={{ position: "absolute", left: `${z.x * 100}%`, top: `${z.y * 100}%`, width: `${z.l * 100}%`, height: `${z.h * 100}%`, border: `${3 * k / facteur}px solid ${c.accent === "#FFFFFF" ? "#111114" : c.accent}`, borderRadius: 8 * k / facteur, boxShadow: `0 0 0 ${4000}px rgba(0,0,0,${0.35 * tz})`, opacity: tz }} />
            )}
          </div>
        </div>
      </div>
      {z?.legende && (
        <div style={{ position: "absolute", left, width: largeur, top: top + barre + hauteurImage + 22 * k, textAlign: "center", opacity: tz, fontFamily: police(theme.police, "Inter"), fontSize: 30 * k, fontWeight: 600, color: "#fff" }}>{z.legende}</div>
      )}
    </AbsoluteFill>
  );
};

// Bloc de code qui s'écrit ligne par ligne
export const Code: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { fps } = useVideoConfig();
  const k = useK();
  const c = palette(theme);
  const f = useCurrentFrame();
  const lignes = String(el.code).split("\n");
  const total = String(el.code).length;
  const n = Math.floor(interpolate(f, [Math.round(fps * 0.3), Math.round(fps * 0.3) + total * (el.vitesse ?? 0.6)], [0, total], clamp));
  let reste = n;
  return (
    <Panneau el={{ ...el, largeur: el.largeur ?? 0.4 }} theme={{ ...theme, couleurPanneau: "#121216", textePanneau: "#E7E7EA" }}>
      {el.titre && <div style={{ fontSize: 22 * k, color: "rgba(255,255,255,.55)", marginBottom: 16 * k }}>{el.titre}</div>}
      <pre style={{ margin: 0, fontFamily: police("Mono"), fontSize: (el.taille ?? 26) * k, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
        {lignes.map((l, i) => {
          const visible = l.slice(0, Math.max(0, reste));
          reste -= l.length + 1;
          const surligne = (el.surligner ?? []).includes(i + 1);
          return <div key={i} style={{ minHeight: "1.55em", background: surligne ? `${c.accent === "#FFFFFF" ? "#FFFFFF" : c.accent}22` : undefined }}>{visible}</div>;
        })}
      </pre>
    </Panneau>
  );
};

// Schéma : des étapes reliées par des flèches, chacune sur son mot.
export const Schema: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H } = useVideoConfig();
  const k = useK();
  const c = palette(theme);
  const a = useEntree(el, 0);
  const items = el.items ?? [];
  const vertical = el.sens === "vertical" || W < H;
  const cote = useCote(el);
  const zone = el.cote === "gauche" || el.cote === "droite" ? cote : { left: W * 0.08, largeur: W * 0.84 };
  return (
    <AbsoluteFill style={{ pointerEvents: "none", background: el.fond ?? !(el.cote === "gauche" || el.cote === "droite") ? `rgba(8,8,10,${0.82 * a.p})` : undefined }}>
      <div style={{ position: "absolute", left: zone.left, width: zone.largeur, top: H * (el.y ?? 0.5), transform: "translateY(-50%)", opacity: a.p, fontFamily: police(theme.police, "Inter") }}>
        {el.titre && <div style={{ textAlign: "center", marginBottom: 30 * k, fontSize: 36 * k, fontWeight: 700, color: "#fff", fontFamily: police(theme.policeTitre ?? theme.police, "Inter Tight") }}>{el.titre}</div>}
        <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", alignItems: "center", justifyContent: "center", gap: 14 * k }}>
          {items.map((it: any, n: number) => <Noeud key={n} it={it} n={n} el={el} theme={theme} c={c} vertical={vertical} />)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Noeud: React.FC<{ it: any; n: number; el: any; theme: any; c: any; vertical: boolean }> = ({ it, n, el, c, vertical }) => {
  const k = useK();
  const p = useItem(it, el);
  return (
    <>
      {n > 0 && (
        <svg width={vertical ? 30 * k : 54 * k} height={vertical ? 40 * k : 30 * k} viewBox={vertical ? "0 0 30 40" : "0 0 54 30"} style={{ opacity: p, flex: "none" }}>
          {vertical ? <path d="M15 2 V34 M6 26 L15 36 L24 26" stroke="rgba(255,255,255,.7)" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M2 15 H48 M38 6 L50 15 L38 24" stroke="rgba(255,255,255,.7)" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
        </svg>
      )}
      <div style={{ background: c.panneau, color: c.texte, borderRadius: 16 * k, padding: `${22 * k}px ${26 * k}px`, minWidth: 180 * k, maxWidth: 360 * k, textAlign: "center", opacity: p, transform: `scale(${0.94 + 0.06 * p})`, border: it.actif ? `2px solid ${c.accent}` : `1px solid ${c.trait}` }}>
        {it.surtitre && <div style={{ fontSize: 20 * k, color: c.accent === "#FFFFFF" ? c.doux : c.accent, fontWeight: 600, marginBottom: 6 * k }}>{it.surtitre}</div>}
        <div style={{ fontSize: 28 * k, fontWeight: 600, lineHeight: 1.25 }}>{it.texte}</div>
      </div>
    </>
  );
};

// Mise en avant d'une zone de la vidéo elle-même (enregistrement d'écran) : le reste s'assombrit.
export const Surlignage: React.FC<{ el: any; theme: any }> = ({ el, theme }) => {
  const { width: W, height: H } = useVideoConfig();
  const k = useK();
  const c = palette(theme);
  const a = useEntree(el, 0);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity: a.p }}>
      <div style={{ position: "absolute", left: el.x * W, top: el.y * H, width: el.l * W, height: el.h * H, borderRadius: 10 * k, border: `${3 * k}px solid ${c.accent === "#FFFFFF" ? "#FFFFFF" : c.accent}`, boxShadow: `0 0 0 ${4000}px rgba(0,0,0,${el.assombrir ?? 0.45})` }} />
      {el.legende && <div style={{ position: "absolute", left: el.x * W, top: (el.y + el.h) * H + 16 * k, background: c.panneau, color: c.texte, borderRadius: 10 * k, padding: `${10 * k}px ${16 * k}px`, fontSize: 26 * k, fontWeight: 600, fontFamily: police(theme.police, "Inter") }}>{el.legende}</div>}
    </AbsoluteFill>
  );
};
