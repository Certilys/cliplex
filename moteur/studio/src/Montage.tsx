import { useMemo } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import "./polices";
import { usePolicesLocales } from "./PolicesLocales";
import { Clip } from "./composants/Clip";
import { SousTitres } from "./composants/SousTitres";
import { Element } from "./composants/Elements";
import { Transitions, effetCamera } from "./composants/Transitions";

// Volume de la musique image par image : baisse sous la voix, remonte dans les pauses, coupures, fondu final
const useVolumesMusique = (T: any) =>
  useMemo(() => {
    const m = T.musique;
    if (!m) return [];
    const n = T.duree;
    const parle = new Float32Array(n);
    for (const w of T.mots) for (let f = Math.max(0, w.de - 4); f < Math.min(n, w.a + 6); f++) parle[f] = 1;
    // lissage (~0,3 s) pour un ducking naturel
    const R = Math.round(T.fps * 0.15);
    const out: number[] = [];
    for (let f = 0; f < n; f++) {
      let s = 0, c = 0;
      for (let k = f - R; k <= f + R; k++) if (k >= 0 && k < n) { s += parle[k]; c++; }
      const p = s / c;
      let v = m.volume * p + m.volumeSansVoix * (1 - p);
      for (const [a, b] of m.coupes ?? []) if (f >= a && f < b) v = 0;
      const fin = Math.round(m.fondu * T.fps);
      v *= interpolate(f, [0, 6, n - fin, n], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      out.push(v);
    }
    return out;
  }, [T]);

// Éléments posés dans l'image (soumis aux mouvements de caméra), les autres passent au-dessus
const DANS_IMAGE = ["broll", "carton"];
const dansImage = (el: any) => el.couche === "decor" || DANS_IMAGE.includes(el.type);

export const Montage: React.FC<{ timeline: any }> = ({ timeline: T }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const vols = useVolumesMusique(T);
  usePolicesLocales(T.polices);
  const cam = effetCamera(T.transitions, frame, width);
  const e = T.etalonnage ?? {};
  // Passe du son (rendre.sh) : seulement les pistes audio, aucune image à dessiner, bien plus rapide.
  if (T.audioSeul) {
    return (
      <AbsoluteFill>
        {T.clips.map((c: any, k: number) => (
          <Sequence key={k} from={c.de} durationInFrames={c.duree}>
            <Clip clip={c} zooms={T.zooms} audioSeul />
          </Sequence>
        ))}
        {T.musique && (
          <Audio src={staticFile(T.musique.src)} loop startFrom={Math.round((T.musique.debut ?? 0) * T.fps)} volume={(f) => vols[f] ?? 0} />
        )}
        {T.sons.map((s: any, k: number) => (
          <Sequence key={`s${k}`} from={s.de} durationInFrames={Math.round(T.fps * 4)}>
            <Audio src={staticFile(s.src)} volume={s.volume} />
          </Sequence>
        ))}
      </AbsoluteFill>
    );
  }
  const filtre = `contrast(${e.contraste ?? 1.04}) saturate(${e.saturation ?? 1.06}) brightness(${e.luminosite ?? 1}) sepia(${e.chaleur ?? 0}) hue-rotate(${e.teinte ?? 0}deg)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill style={{ transform: cam.transform, filter: `${filtre} ${cam.filter}` }}>
        {T.clips.map((c: any, k: number) => (
          <Sequence key={k} from={c.de} durationInFrames={c.duree}>
            <Clip clip={c} zooms={T.zooms} />
          </Sequence>
        ))}
        {T.elements.filter(dansImage).map((el: any, k: number) => (
          <Sequence key={k} from={el.de} durationInFrames={Math.max(1, el.a - el.de)}>
            <Element el={el} theme={T.theme} />
          </Sequence>
        ))}
      </AbsoluteFill>

      {T.vignette > 0 && (
        <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${T.vignette}) 100%)`, pointerEvents: "none" }} />
      )}

      {T.elements.filter((el: any) => !dansImage(el)).map((el: any, k: number) => (
        <Sequence key={k} from={el.de} durationInFrames={Math.max(1, el.a - el.de)}>
          <Element el={el} theme={T.theme} />
        </Sequence>
      ))}

      <SousTitres config={T.sousTitres} theme={T.theme} />
      <Transitions transitions={T.transitions} />

      {T.musique && (
        <Audio src={staticFile(T.musique.src)} loop startFrom={Math.round((T.musique.debut ?? 0) * T.fps)} volume={(f) => vols[f] ?? 0} />
      )}
      {T.sons.map((s: any, k: number) => (
        <Sequence key={`s${k}`} from={s.de} durationInFrames={Math.round(T.fps * 4)}>
          <Audio src={staticFile(s.src)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
