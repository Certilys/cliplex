# Installation manuelle des outils

Cliplex installe ces outils depuis son écran de premier lancement, sans mot de passe et sans Homebrew. Tout va dans `<Cliplex>/outils` (par défaut `~/Cliplex/outils`) : supprimer le dossier Cliplex efface tout. Si tu préfères le faire toi-même, voici exactement ce qu'il lance. Remplace `<outils>` par ce dossier ; sur un Mac Intel, remplace `arm64` par `amd64` (ffmpeg) ou `x64` (Node) et `aarch64` par `x86_64` (uv).

| Outil | Rôle dans le montage |
| --- | --- |
| ffmpeg | Découpe, assemble, exporte la vidéo |
| Node.js | Fait tourner le moteur d'animation |
| Python et whisper | Repère la parole, transcrit ta voix mot à mot, en local |
| Modèle de transcription (≈ 575 Mo) | Reconnaissance de la parole, 90 langues |
| Débruiteur de voix (RNNoise) | Retire le souffle et le bruit de fond |
| Moteur d'animation (Remotion) | Dessine chaque image de la vidéo |
| Claude Code | Analyse tes inspirations et monte la vidéo (seulement s'il n'est pas déjà sur ton Mac) |

ffmpeg (builds statiques de ffmpeg.martin-riedl.de) :

```bash
mkdir -p <outils>/bin && cd <outils>/bin
for x in ffmpeg ffprobe; do
  curl -L --fail -o $x.zip https://ffmpeg.martin-riedl.de/redirect/latest/macos/arm64/release/$x.zip && unzip -oq $x.zip && rm $x.zip
done
```

Node.js :

```bash
mkdir -p <outils>/node
curl -L --fail https://nodejs.org/dist/v24.22.1/node-v24.22.1-darwin-arm64.tar.gz | tar xz -C <outils>/node --strip-components 1
```

Python et whisper, dans un environnement isolé créé par uv (le Python du système n'est pas touché) :

```bash
export UV_CACHE_DIR=<outils>/cache/uv UV_PYTHON_INSTALL_DIR=<outils>/python-dist
curl -L --fail https://github.com/astral-sh/uv/releases/download/0.13.6/uv-aarch64-apple-darwin.tar.gz | tar xz -C <outils>/bin --strip-components 1
<outils>/bin/uv venv --python 3.12 <outils>/python
<outils>/bin/uv pip install --python <outils>/python/bin/python numpy pywhispercpp
```

Modèle de transcription :

```bash
mkdir -p <outils>/modeles
curl -L --fail -o <outils>/modeles/ggml-large-v3-turbo-q5_0.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin
```

Débruiteur de voix (modèle RNNoise, sans droit d'auteur) :

```bash
curl -L --fail -o <outils>/modeles/sh.rnnn \
  https://raw.githubusercontent.com/GregorR/rnnoise-models/master/somnolent-hogwash-2018-09-01/sh.rnnn
```

Moteur d'animation : copie `moteur/studio` (src, package.json, remotion.config.ts, tsconfig.json) dans `<outils>/studio`, puis :

```bash
cd <outils>/studio && npm install && npx remotion browser ensure
```

Claude Code, s'il n'est pas déjà installé :

```bash
npm install --prefix <outils>/claude @anthropic-ai/claude-code && touch <outils>/claude/.cliplex
```

Connexion à ton compte (Cliplex garde alors la configuration de Claude Code dans `<outils>/claude/config`) :

```bash
CLAUDE_CONFIG_DIR=<outils>/claude/config <outils>/claude/node_modules/.bin/claude auth login
```

Pour les liens YouTube en inspiration : l'extension Claude pour Chrome (Chrome Web Store), connectée à ton compte.
