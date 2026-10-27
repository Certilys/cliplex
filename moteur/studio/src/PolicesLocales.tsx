import { loadFont } from "@remotion/fonts";
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

// Polices déposées par la personne (ou téléchargées par Claude) dans bibliotheque/polices,
// décrites dans polices.json et servies par le dossier public du projet (polices/).
export const usePolicesLocales = (polices: { famille: string; fichier: string; graisse?: number | string; style?: string }[] = []) => {
  const [poignee] = useState(() => (polices.length ? delayRender("Polices de la personne") : null));
  useEffect(() => {
    if (poignee === null) return;
    Promise.all(
      polices.map((p) =>
        loadFont({ family: p.famille, url: staticFile(`polices/${p.fichier}`), weight: String(p.graisse ?? "400"), style: p.style ?? "normal" }).catch(() => undefined)
      )
    ).then(() => continueRender(poignee));
  }, [poignee, polices]);
};
