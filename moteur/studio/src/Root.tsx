import { Composition } from "remotion";
import { Montage } from "./Montage";

// La timeline de chaque projet arrive en paramètre du rendu (--props=<projet>/timeline.json) :
// plusieurs projets peuvent se rendre sans jamais partager de fichier.
const VIDE = { fps: 30, largeur: 1080, hauteur: 1920, duree: 30, clips: [], mots: [], zooms: [], transitions: [], elements: [], sons: [], theme: {}, sousTitres: { actif: false, groupes: [] } };

export const Root = () => (
  <Composition
    id="Montage"
    component={Montage as any}
    defaultProps={{ timeline: VIDE } as any}
    calculateMetadata={({ props }: any) => {
      const T = props.timeline ?? props;
      return { durationInFrames: Math.max(1, T.duree), fps: T.fps, width: T.largeur, height: T.hauteur, props: { timeline: T } };
    }}
    durationInFrames={30}
    fps={30}
    width={1080}
    height={1920}
  />
);
