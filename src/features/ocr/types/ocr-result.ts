import type {
  CornerPoints,
  Frame,
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";

export type OcrScript =
  | TextRecognitionScript.LATIN
  | TextRecognitionScript.CHINESE
  | TextRecognitionScript.DEVANAGARI
  | TextRecognitionScript.JAPANESE
  | TextRecognitionScript.KOREAN;

export type OcrBoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type OcrPoint = {
  x: number;
  y: number;
};

export type OcrWord = {
  text: string;
  boundingBox?: OcrBoundingBox;
  cornerPoints?: OcrPoint[];
};

export type OcrLine = {
  text: string;
  boundingBox?: OcrBoundingBox;
  cornerPoints?: OcrPoint[];
  words: OcrWord[];
  languages: string[];
};

export type OcrBlock = {
  text: string;
  boundingBox?: OcrBoundingBox;
  cornerPoints?: OcrPoint[];
  lines: OcrLine[];
  languages: string[];
};

export type OcrProcessingMetrics = {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  sourceUriDeleted: boolean;
};

export type OcrResult = {
  script: OcrScript;
  text: string;
  blocks: OcrBlock[];
  metrics: OcrProcessingMetrics;
};

export type NativeFrame = Frame;
export type NativeCornerPoints = CornerPoints;
