# Installation manuelle des outils

Cliplex installe ces outils depuis son écran de premier lancement. Si tu préfères le faire toi-même, voici exactement ce qu'il lance. `<dossier>` est ton dossier de travail (par défaut `~/Cliplex`).

| Outil | Rôle dans le montage | Commande |
| --- | --- | --- |
| Homebrew | Installe les outils suivants | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
| ffmpeg | Découpe, assemble, exporte la vidéo | `brew install ffmpeg` |
| Node.js | Fait tourner le moteur d'animation | `brew install node` |
| whisper.cpp | Transcrit ta voix en sous-titres, en local | `brew install whisper.cpp` |
| Modèle de transcription (≈ 575 Mo) | Reconnaissance de la parole, 90 langues | voir ci-dessous |
| Python et numpy | Repère les silences et la parole | voir ci-dessous |
| Claude Code | Monte la vidéo selon tes consignes | `curl -fsSL https://claude.ai/install.sh \| bash` |

Modèle de transcription :

```bash
mkdir -p <dossier>/.outils/modeles
curl -L --fail -o <dossier>/.outils/modeles/ggml-large-v3-turbo-q5_0.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin
```

Python et numpy, dans un environnement isolé qui ne touche pas au Python du système :

```bash
python3 -m venv <dossier>/.outils/python
<dossier>/.outils/python/bin/pip install --upgrade numpy
```

Connexion de Claude Code à ton compte :

```bash
claude auth login
```
