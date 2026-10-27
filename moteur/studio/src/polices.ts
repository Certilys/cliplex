import { loadFont as montserrat } from "@remotion/google-fonts/Montserrat";
import { loadFont as anton } from "@remotion/google-fonts/Anton";
import { loadFont as inter } from "@remotion/google-fonts/Inter";
import { loadFont as unbounded } from "@remotion/google-fonts/Unbounded";
import { loadFont as playfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as caveat } from "@remotion/google-fonts/Caveat";
import { loadFont as bebas } from "@remotion/google-fonts/BebasNeue";
import { loadFont as archivoBlack } from "@remotion/google-fonts/ArchivoBlack";
import { loadFont as sora } from "@remotion/google-fonts/Sora";
import { loadFont as manrope } from "@remotion/google-fonts/Manrope";
import { loadFont as poppins } from "@remotion/google-fonts/Poppins";
import { loadFont as dmsans } from "@remotion/google-fonts/DMSans";
import { loadFont as jakarta } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as jetbrains } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as interTight } from "@remotion/google-fonts/InterTight";
import { loadFont as instrumentSerif } from "@remotion/google-fonts/InstrumentSerif";

montserrat("normal", { weights: ["500", "700", "800", "900"], subsets: ["latin", "latin-ext"] });
montserrat("italic", { weights: ["800", "900"], subsets: ["latin", "latin-ext"] });
anton("normal", { subsets: ["latin", "latin-ext"] });
inter("normal", { weights: ["300", "400", "600", "800"], subsets: ["latin", "latin-ext"] });
unbounded("normal", { weights: ["400", "700", "900"], subsets: ["latin", "latin-ext"] });
playfair("normal", { weights: ["700", "900"], subsets: ["latin", "latin-ext"] });
playfair("italic", { weights: ["700"], subsets: ["latin", "latin-ext"] });
caveat("normal", { weights: ["700"], subsets: ["latin", "latin-ext"] });
bebas("normal", { subsets: ["latin", "latin-ext"] });
archivoBlack("normal", { subsets: ["latin", "latin-ext"] });
// polices de marque des projets (visuels et pubs motion)
sora("normal", { weights: ["400", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
manrope("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] });
poppins("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] });
dmsans("normal", { weights: ["500", "700"], subsets: ["latin", "latin-ext"] });
jakarta("normal", { weights: ["500", "700", "800"], subsets: ["latin", "latin-ext"] });
jetbrains("normal", { weights: ["400", "700"], subsets: ["latin", "latin-ext"] });
// Inter Tight (titres) + Instrument Serif italique (mots d'accent)
interTight("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin", "latin-ext"] });
instrumentSerif("normal", { weights: ["400"], subsets: ["latin", "latin-ext"] });
instrumentSerif("italic", { weights: ["400"], subsets: ["latin", "latin-ext"] });

// alias utilisables dans le plan
export const POLICES: Record<string, string> = {
  Montserrat: "Montserrat", Anton: "Anton", Inter: "Inter", Unbounded: "Unbounded", Playfair: "Playfair Display",
  Caveat: "Caveat", Bebas: "Bebas Neue", ArchivoBlack: "Archivo Black",
  Sora: "Sora", Manrope: "Manrope", Poppins: "Poppins", DMSans: "DM Sans", "DM Sans": "DM Sans", PlusJakartaSans: "Plus Jakarta Sans", "Plus Jakarta Sans": "Plus Jakarta Sans", Mono: "JetBrains Mono", InterTight: "Inter Tight", "Inter Tight": "Inter Tight", Serif: "Instrument Serif", "Instrument Serif": "Instrument Serif",
};
export const police = (nom?: string, defaut = "Inter") => `'${POLICES[nom ?? defaut] ?? nom ?? defaut}', sans-serif`;
