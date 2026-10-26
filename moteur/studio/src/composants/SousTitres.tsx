import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { police } from "../polices";
import { couleur } from "./Elements";

// Sous-titres façon monteur pro : groupes de 1 à 3 mots, entrée nette (pas de rebond « IA »),
// mot prononcé légèrement accentué, un mot-clé coloré avec halo.
export const SousTitres: React.FC<{ config: any; theme: any }> = ({ config, theme }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const g = config.groupes.find((x: any) => frame >= x.de && frame < x.a);
  if (!g) return null;
  const style = config.style ?? "bold";
  const t = frame - g.de;
  const dyn = style === "dynamique";
  const entree = interpolate(t, [0, dyn ? 3 : 4], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const rebond = dyn ? spring({ frame: t, fps, config: { damping: 9, stiffness: 260, mass: 0.5 } }) : 1;
  const sortie = interpolate(frame, [g.a - 2, g.a], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const expl = style === "explicatif";
  const base = expl
      ? { fontFamily: police(config.police ?? "Montserrat"), fontWeight: 800, fontSize: config.taille ?? 50, textTransform: "none" as const, letterSpacing: -0.3 }
      : style === "fin"
      ? { fontFamily: police(config.police ?? "Inter"), fontWeight: 600, fontSize: config.taille ?? 54, textTransform: "none" as const, letterSpacing: 0 }
      : { fontFamily: police(config.police ?? theme.police), fontWeight: 900, fontSize: config.taille ?? 76, textTransform: "uppercase" as const, letterSpacing: -0.5 };
  const contour = expl || theme.sobre ? "none" : style === "fin"
    ? "0 2px 10px rgba(0,0,0,.65)"
    : "0 0 2px #000, 0 3px 0 rgba(0,0,0,.85), 0 6px 18px rgba(0,0,0,.55)";
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute", left: g.zone === "gauche" ? W * 0.02 : W * 0.07, right: g.zone === "gauche" ? W * 0.52 : W * 0.07, top: H * (g.position ?? config.position), transform: dyn ? `translateY(-50%) scale(${0.7 + 0.3 * rebond})` : `translateY(-50%) translateY(${(1 - entree) * 14}px) scale(${0.94 + 0.06 * entree})`,
          opacity: entree * sortie, filter: `blur(${(1 - entree) * 6}px)`, textAlign: "center", lineHeight: 1.08, ...base,
          ...(g.zone === "gauche" ? { fontSize: (base.fontSize as number) * 0.9 } : {}),
        }}
      >
        <span style={expl && g.encadre ? { background: "#fff", border: "4px solid #161616", boxShadow: "6px 6px 0 #161616", padding: "6px 14px", display: "inline-block" } : g.plaque ? { background: "rgba(14,13,18,.86)", borderRadius: 18, padding: "10px 14px 12px", display: "inline-block" } : undefined}>
        {g.mots.map((m: any, k: number) => {
          const actif = frame >= m.de && frame < m.a + 3;
          const c = m.couleur ? couleur(m.couleur, theme) : null;
          const cActif = config.couleurActif ?? (dyn || expl ? "accent" : null);
          const coul = c ?? (cActif && actif ? (expl && cActif === "accent" ? theme.accentTexte ?? couleur(cActif, theme) : couleur(cActif, theme)) : expl ? "#161616" : "#fff");
          return (
            <span key={k} style={{
              color: coul, display: "inline-block", margin: dyn ? "0 0.24em" : "0 0.17em",
              textShadow: expl || theme.sobre ? "none" : c ? `${contour}, 0 0 22px ${c}99` : contour,
              transform: `scale(${config.accentActif !== false && actif && style !== "fin" && !expl ? (dyn ? 1.08 : 1.06) : 1})`,
            }}>
              {m.texte.replace(/[,.;:]$/, "")}
            </span>
          );
        })}
        </span>
      </div>
    </AbsoluteFill>
  );
};
