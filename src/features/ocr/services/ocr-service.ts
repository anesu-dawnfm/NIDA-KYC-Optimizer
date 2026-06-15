import TextRecognition, {
  TextRecognitionScript,
  type TextBlock,
  type TextLine,
  type TextRecognitionResult,
  type TextElement,
} from "@react-native-ml-kit/text-recognition";
import * as FileSystem from "expo-file-system";

import { OcrError } from "@/features/ocr/errors/ocr-error";
import type {
  OcrBlock,
  OcrLine,
  OcrResult,
  OcrScript,
  OcrWord,
} from "@/features/ocr/types/ocr-result";

export type RecognizeOcrInput = {
  imageUri: string;
  script?: OcrScript;
};

const defaultScript = TextRecognitionScript.LATIN satisfies OcrScript;

export async function recognizeOcr({
  imageUri,
  script = defaultScript,
}: RecognizeOcrInput): Promise<OcrResult> {
  if (!imageUri) {
    throw new OcrError("missing_image", "A capture URI is required for OCR.");
  }

  const startedAt = new Date().toISOString();
  const startedAtMs = Date.now();
  let recognitionResult: TextRecognitionResult | undefined;
  let recognitionError: unknown;

  try {
    recognitionResult = await TextRecognition.recognize(imageUri, script);
  } catch (cause) {
    recognitionError = cause;
  }

  let sourceUriDeleted = false;

  try {
    await deleteSourceImage(imageUri);
    sourceUriDeleted = true;
  } catch (cause) {
    if (!recognitionError) {
      throw new OcrError(
        "cleanup_failed",
        "Failed to delete the temporary image.",
        cause,
      );
    }
  }

  if (recognitionError) {
    throw new OcrError(
      "recognition_failed",
      "On-device text recognition failed.",
      recognitionError,
    );
  }

  if (!recognitionResult) {
    throw new OcrError(
      "invalid_result",
      "The OCR engine returned no recognition result.",
    );
  }

  const normalized = normalizeRecognitionResult(recognitionResult);
  const completedAt = new Date().toISOString();

  return {
    script,
    ...normalized,
    metrics: {
      startedAt,
      completedAt,
      durationMs: Date.now() - startedAtMs,
      sourceUriDeleted,
    },
  };
}

function normalizeRecognitionResult(
  result: TextRecognitionResult,
): Pick<OcrResult, "text" | "blocks"> {
  return {
    text: result.text,
    blocks: result.blocks.map(normalizeBlock),
  };
}

function normalizeBlock(block: TextBlock): OcrBlock {
  const boundingBox = normalizeFrame(block.frame);
  const cornerPoints = normalizeCornerPoints(block.cornerPoints);

  return {
    text: block.text,
    lines: block.lines.map(normalizeLine),
    languages: block.recognizedLanguages.map((language) => language.languageCode),
    ...(boundingBox === undefined ? {} : { boundingBox }),
    ...(cornerPoints === undefined ? {} : { cornerPoints }),
  };
}

function normalizeLine(line: TextLine): OcrLine {
  const boundingBox = normalizeFrame(line.frame);
  const cornerPoints = normalizeCornerPoints(line.cornerPoints);

  return {
    text: line.text,
    words: line.elements.map(normalizeWord),
    languages: line.recognizedLanguages.map((language) => language.languageCode),
    ...(boundingBox === undefined ? {} : { boundingBox }),
    ...(cornerPoints === undefined ? {} : { cornerPoints }),
  };
}

function normalizeWord(word: TextElement): OcrWord {
  const boundingBox = normalizeFrame(word.frame);
  const cornerPoints = normalizeCornerPoints(word.cornerPoints);

  return {
    text: word.text,
    ...(boundingBox === undefined ? {} : { boundingBox }),
    ...(cornerPoints === undefined ? {} : { cornerPoints }),
  };
}

function normalizeFrame(frame?: { top: number; left: number; width: number; height: number }) {
  if (!frame) {
    return undefined;
  }

  return {
    top: frame.top,
    left: frame.left,
    width: frame.width,
    height: frame.height,
  };
}

function normalizeCornerPoints(points?: readonly { x: number; y: number }[]) {
  if (!points) {
    return undefined;
  }

  return points.map((point) => ({
    x: point.x,
    y: point.y,
  }));
}

async function deleteSourceImage(imageUri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(imageUri);
    if (info.exists) {
      await FileSystem.deleteAsync(imageUri, { idempotent: true });
    }
  } catch (cause) {
    throw new OcrError("cleanup_failed", "Failed to delete the temporary image.", cause);
  }
}
