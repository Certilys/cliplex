import { Config } from "@remotion/cli/config";
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setConcurrency(8);
Config.setCodec("h264");
// SANS_CRF=1 : rendu du son seul (wav), qui refuse l'option crf
if (!process.env.SANS_CRF) Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setAudioBitrate("320k");
