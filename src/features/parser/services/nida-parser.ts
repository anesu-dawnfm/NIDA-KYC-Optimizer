import { NidaParserError } from "@/features/parser/errors/nida-parser-error";
import type {
  NidaParseInput,
  NidaParsedResult,
  ParsedFieldConfidence,
} from "@/features/parser/types/nida-parse-result";

type FieldMatch = {
  value: string | null;
  sourceText: string | null;
  confidence: number;
  normalizedText: string | null;
};

const LABEL_ALIASES = {
  fullName: [
    "FULL NAME",
    "FULL NAMES",
    "NAME",
    "NAMES",
  ],
  nidaNumber: [
    "NIDA NUMBER",
    "NIDA NO",
    "NIDA NO.",
    "NIDA NUMBER:",
    "ID NUMBER",
    "ID NO",
    "NIN",
    "NUMBER",
  ],
  dateOfBirth: [
    "DATE OF BIRTH",
    "DOB",
    "D.O.B",
    "BIRTH DATE",
  ],
  expiryDate: [
    "EXPIRY DATE",
    "DATE OF EXPIRY",
    "EXP DATE",
    "EXPIRES",
    "VALID UNTIL",
  ],
} as const;

const OCR_NUMBER_FIXES: Record<string, string> = {
  O: "0",
  Q: "0",
  D: "0",
  I: "1",
  L: "1",
  "|": "1",
  "¡": "1",
  S: "5",
  B: "8",
  Z: "2",
  G: "6",
};

const OCR_DATE_FIXES: Record<string, string> = {
  O: "0",
  Q: "0",
  I: "1",
  L: "1",
  "|": "1",
  S: "5",
};

const DATE_PATTERNS = [
  /\b(\d{2})[\/\-.](\d{2})[\/\-.](\d{4})\b/g,
  /\b(\d{4})[\/\-.](\d{2})[\/\-.](\d{2})\b/g,
  /\b(\d{1,2})\s+([A-Z]{3,9})\s+(\d{4})\b/g,
] as const;

export function parseNidaDocument({
  rawText,
}: NidaParseInput): NidaParsedResult {
  if (!rawText.trim()) {
    throw new NidaParserError("empty_input", "Raw OCR text is required.");
  }

  const normalizedText = normalizeText(rawText);
  const lines = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  try {
    const fullName = parseFullName(lines, normalizedText);
    const nidaNumber = parseNidaNumber(lines, normalizedText);
    const dateOfBirth = parseDateField(lines, normalizedText, "dateOfBirth");
    const expiryDate = parseDateField(lines, normalizedText, "expiryDate");
    const warnings = collectWarnings({
      fullName,
      nidaNumber,
      dateOfBirth,
      expiryDate,
    });

    return {
      fullName,
      nidaNumber,
      dateOfBirth,
      expiryDate,
      overallConfidence: computeOverallConfidence([
        fullName.confidence,
        nidaNumber.confidence,
        dateOfBirth.confidence,
        expiryDate.confidence,
      ]),
      warnings,
      normalizedText,
    };
  } catch (cause) {
    throw new NidaParserError(
      "parse_failed",
      "Unable to parse NIDA document fields.",
      cause,
    );
  }
}

function parseFullName(lines: string[], normalizedText: string): ParsedFieldConfidence {
  const field = extractLabelledValue(lines, LABEL_ALIASES.fullName);

  if (field.value) {
    const normalized = normalizeName(field.value);
    return {
      value: normalized,
      confidence: scoreNameConfidence(normalized, field.confidence + 0.12),
      sourceText: field.sourceText,
      normalizedText: normalized,
    };
  }

  const combinedName = combineNameParts(lines);
  if (combinedName) {
    return {
      value: combinedName.value,
      confidence: scoreNameConfidence(combinedName.value, combinedName.confidence),
      sourceText: combinedName.sourceText,
      normalizedText: combinedName.value,
    };
  }

  const inferred = inferNameFromBody(normalizedText);
  if (inferred) {
    return {
      value: inferred.value,
      confidence: scoreNameConfidence(inferred.value, inferred.confidence),
      sourceText: inferred.sourceText,
      normalizedText: inferred.value,
    };
  }

  return missingField();
}

function parseNidaNumber(lines: string[], normalizedText: string): ParsedFieldConfidence {
  const labelled = extractLabelledValue(lines, LABEL_ALIASES.nidaNumber);
  const labelledCandidate = normalizeNidaNumber(labelled.value ?? "");
  if (labelledCandidate) {
    return buildNumberField(labelledCandidate, labelled.sourceText, labelled.confidence);
  }

  const numberCandidates = extractNumericCandidates(normalizedText);
  const bestCandidate = scoreNidaNumberCandidates(numberCandidates);
  if (bestCandidate) {
    return buildNumberField(bestCandidate.value, bestCandidate.sourceText, bestCandidate.confidence);
  }

  return missingField();
}

function parseDateField(
  lines: string[],
  normalizedText: string,
  kind: "dateOfBirth" | "expiryDate",
): ParsedFieldConfidence {
  const aliases = kind === "dateOfBirth" ? LABEL_ALIASES.dateOfBirth : LABEL_ALIASES.expiryDate;
  const labelled = extractLabelledValue(lines, aliases);
  const labelledDate = normalizeDate(labelled.value ?? "");
  if (labelledDate) {
    const canonicalValue =
      canonicalizeDateValue(labelledDate.value) ?? labelledDate.value;
    return {
      value: canonicalValue,
      confidence: clampConfidence(labelled.confidence + labelledDate.confidence),
      sourceText: labelled.sourceText,
      normalizedText: canonicalValue,
    };
  }

  const fallbackDate = findDateInText(normalizedText, kind);
  if (fallbackDate) {
    return fallbackDate;
  }

  return missingField();
}

function extractLabelledValue(lines: string[], aliases: readonly string[]): FieldMatch {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }
    const normalizedLine = normalizeLabels(line);
    const alias = aliases.find((candidate) => labelMatches(normalizedLine, candidate));

    if (!alias) {
      continue;
    }

    if (
      (alias === "NAME" || alias === "NAMES") &&
      (labelMatches(normalizedLine, "GIVEN NAME") || labelMatches(normalizedLine, "SURNAME"))
    ) {
      continue;
    }

    const delimiterMatch = line.match(/[:\-–—]\s*(.+)$/);
    if (delimiterMatch?.[1]) {
      const value = delimiterMatch[1].trim();
      return {
        value: value || null,
        sourceText: line,
        confidence: 0.88,
        normalizedText: value || null,
      };
    }

    const directValue = extractTrailingValue(line, alias);
    if (directValue) {
      return {
        value: directValue,
        sourceText: line,
        confidence: 0.78,
        normalizedText: directValue,
      };
    }

    const nextLine = lines[index + 1];
    if (typeof nextLine === "string" && !looksLikeLabel(nextLine)) {
      return {
        value: nextLine,
        sourceText: `${line} ${nextLine}`.trim(),
        confidence: 0.72,
        normalizedText: nextLine,
      };
    }
  }

  return {
    value: null,
    sourceText: null,
    confidence: 0,
    normalizedText: null,
  };
}

function extractTrailingValue(line: string, alias: string): string | null {
  const position = normalizeLabels(line).indexOf(alias);
  if (position < 0) {
    return null;
  }

  const rawTail = line.slice(position + alias.length).replace(/^[^A-Z0-9]+/i, "").trim();
  return rawTail || null;
}

function combineNameParts(lines: string[]): { value: string; confidence: number; sourceText: string } | null {
  let surname: string | null = null;
  let givenNames: string | null = null;

  for (const line of lines) {
    const normalized = normalizeLabels(line);
    if (labelMatches(normalized, "SURNAME")) {
      surname = extractFieldTail(line, "SURNAME");
    }
    if (labelMatches(normalized, "GIVEN NAME")) {
      givenNames = extractFieldTail(line, "GIVEN NAME");
    }
  }

  if (surname && givenNames) {
    const value = normalizeName(`${givenNames} ${surname}`);
    return {
      value,
      confidence: 0.84,
      sourceText: `GIVEN NAME: ${givenNames}; SURNAME: ${surname}`,
    };
  }

  return null;
}

function inferNameFromBody(normalizedText: string): { value: string; confidence: number; sourceText: string } | null {
  const candidateLine = normalizedText
    .split("\n")
    .map((line) => line.trim())
    .find((line) => {
      if (!line) {
        return false;
      }
      const lettersOnly = line.replace(/[^A-Z\s'-]/gi, "").trim();
      return lettersOnly.length >= 8 && lettersOnly.split(/\s+/).length >= 2;
    });

  if (!candidateLine) {
    return null;
  }

  return {
    value: normalizeName(candidateLine),
    confidence: 0.56,
    sourceText: candidateLine,
  };
}

function extractFieldTail(line: string, label: string): string {
  const normalized = normalizeLabels(line);
  const position = normalized.indexOf(label);
  const tail = position >= 0 ? line.slice(position + label.length) : line;
  return tail.replace(/^[^A-Z0-9]+/i, "").trim();
}

function extractNumericCandidates(
  normalizedText: string,
): { value: string; sourceText: string; confidence: number }[] {
  const compactText = normalizedText.replace(/[^A-Z0-9]/g, " ");
  const rawCandidates = compactText.match(/\b[0-9OQDILSBZG]{14,24}\b/g) ?? [];

  return rawCandidates.map((candidate) => {
    const cleaned = normalizeNidaNumber(candidate) ?? candidate.replace(/\s+/g, "");
    const sourceConfidence = cleaned.length === 20 ? 0.88 : cleaned.length >= 16 ? 0.68 : 0.45;
    return {
      value: cleaned,
      sourceText: candidate,
      confidence: sourceConfidence,
    };
  });
}

function scoreNidaNumberCandidates(
  candidates: { value: string; sourceText: string; confidence: number }[],
): { value: string; sourceText: string; confidence: number } | null {
  let best: { value: string; sourceText: string; confidence: number } | null = null;

  for (const candidate of candidates) {
    const score = scoreNidaNumber(candidate.value, candidate.sourceText, candidate.confidence);
    if (!best || score > best.confidence) {
      best = { ...candidate, confidence: score };
    }
  }

  return best;
}

function scoreNidaNumber(value: string, sourceText: string, baseConfidence: number): number {
  let confidence = baseConfidence;

  if (value.length === 20) {
    confidence += 0.12;
  } else if (value.length >= 18) {
    confidence += 0.04;
  } else {
    confidence -= 0.15;
  }

  if (/^(\d)\1+$/.test(value)) {
    confidence -= 0.18;
  }

  if (/[^0-9]/.test(sourceText)) {
    confidence -= 0.05;
  }

  return clampConfidence(confidence);
}

function buildNumberField(
  value: string,
  sourceText: string | null,
  baseConfidence: number,
): ParsedFieldConfidence {
  return {
    value,
    confidence: scoreNidaNumber(value, sourceText ?? value, baseConfidence),
    sourceText,
    normalizedText: value,
  };
}

function normalizeNidaNumber(value: string): string | null {
  const corrected = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .split("")
    .map((char) => OCR_NUMBER_FIXES[char] ?? char)
    .join("");

  if (!corrected) {
    return null;
  }

  if (!/^\d{16,20}$/.test(corrected)) {
    return null;
  }

  return corrected;
}

function normalizeDate(rawValue: string): { value: string; confidence: number; normalizedText: string } | null {
  const corrected = rawValue
    .toUpperCase()
    .replace(/[^A-Z0-9\s\/\-.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const numericCandidate = corrected
    .split("")
    .map((char) => OCR_DATE_FIXES[char] ?? char)
    .join("");

  for (const pattern of DATE_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(numericCandidate);
    if (!match) {
      continue;
    }

    const [, first, second, third] = match;
    if (!first || !second || !third) {
      continue;
    }

    if (first.length === 4) {
      const value = `${third}/${second}/${first}`;
      return {
        value,
        confidence: 0.88,
        normalizedText: value,
      };
    }

    const value = `${first.padStart(2, "0")}/${second.padStart(2, "0")}/${third}`;
    return {
      value,
      confidence: 0.9,
      normalizedText: value,
    };
  }

  const monthMatch = corrected.match(/\b(\d{1,2})\s+([A-Z]{3,9})\s+(\d{4})\b/);
  if (monthMatch) {
    const [, day, monthName, year] = monthMatch;
    if (!day || !monthName || !year) {
      return null;
    }

    const month = normalizeMonth(monthName);
    if (!month) {
      return null;
    }

    const value = `${day.padStart(2, "0")}/${month}/${year}`;
    return {
      value,
      confidence: 0.84,
      normalizedText: value,
    };
  }

  return null;
}

function findDateInText(
  normalizedText: string,
  kind: "dateOfBirth" | "expiryDate",
): ParsedFieldConfidence | null {
  const matches = [
    ...normalizedText.matchAll(
      /\b\d{2}[\/\-.]\d{2}[\/\-.]\d{4}\b|\b\d{4}[\/\-.]\d{2}[\/\-.]\d{2}\b|\b\d{1,2}\s+[A-Z]{3,9}\s+\d{4}\b/g,
    ),
  ];

  if (!matches.length) {
    return null;
  }

  const preferred = kind === "dateOfBirth" ? matches[0] : matches[matches.length - 1];
  if (!preferred) {
    return null;
  }
  const normalized = normalizeDate(preferred[0]);
  if (!normalized) {
    return null;
  }

  const canonicalValue =
    canonicalizeDateValue(normalized.value) ?? normalized.value;

  return {
    value: canonicalValue,
    confidence: clampConfidence(normalized.confidence - 0.08),
    sourceText: preferred[0],
    normalizedText: canonicalValue,
  };
}

function canonicalizeDateValue(value: string): string | null {
  const cleaned = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned.split(" ");
  if (parts.length !== 3) {
    return null;
  }

  const [first, second, third] = parts;
  if (!first || !second || !third) {
    return null;
  }

  if (/^\d{4}$/.test(first) && /^\d{1,2}$/.test(second) && /^\d{1,2}$/.test(third)) {
    return `${third.padStart(2, "0")}/${second.padStart(2, "0")}/${first}`;
  }

  const month = normalizeMonth(second);
  if (/^\d{1,2}$/.test(first) && month && /^\d{4}$/.test(third)) {
    return `${first.padStart(2, "0")}/${month}/${third}`;
  }

  if (/^\d{1,2}$/.test(first) && /^\d{1,2}$/.test(second) && /^\d{4}$/.test(third)) {
    return `${first.padStart(2, "0")}/${second.padStart(2, "0")}/${third}`;
  }

  return null;
}

function normalizeMonth(month: string): string | null {
  const lookup: Record<string, string> = {
    JAN: "01",
    JANUARY: "01",
    FEB: "02",
    FEBRUARY: "02",
    MAR: "03",
    MARCH: "03",
    APR: "04",
    APRIL: "04",
    MAY: "05",
    JUN: "06",
    JUNE: "06",
    JUL: "07",
    JULY: "07",
    AUG: "08",
    AUGUST: "08",
    SEP: "09",
    SEPT: "09",
    SEPTEMBER: "09",
    OCT: "10",
    OCTOBER: "10",
    NOV: "11",
    NOVEMBER: "11",
    DEC: "12",
    DECEMBER: "12",
  };

  return lookup[month.toUpperCase()] ?? null;
}

function normalizeName(value: string): string {
  const corrected = value
    .toUpperCase()
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/8/g, "B")
    .replace(/[^A-Z\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return corrected
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    .replace(/\bOf\b/g, "of");
}

function scoreNameConfidence(value: string, baseConfidence: number): number {
  const tokens = value.split(/\s+/).filter(Boolean);
  let confidence = baseConfidence;

  if (tokens.length >= 3) {
    confidence += 0.06;
  } else if (tokens.length === 2) {
    confidence += 0.02;
  } else if (tokens.length === 1) {
    confidence -= 0.42;
  } else {
    confidence -= 0.6;
  }

  if (value.length < 8) {
    confidence -= 0.12;
  }

  return clampConfidence(confidence);
}

function normalizeText(rawText: string): string {
  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}

function normalizeLabels(value: string): string {
  return value
    .toUpperCase()
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/8/g, "B")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeLabel(line: string): boolean {
  const normalized = normalizeLabels(line);
  return [
    ...LABEL_ALIASES.fullName,
    ...LABEL_ALIASES.nidaNumber,
    ...LABEL_ALIASES.dateOfBirth,
    ...LABEL_ALIASES.expiryDate,
  ].some((alias) => normalized.includes(alias));
}

function collectWarnings(fields: {
  fullName: ParsedFieldConfidence;
  nidaNumber: ParsedFieldConfidence;
  dateOfBirth: ParsedFieldConfidence;
  expiryDate: ParsedFieldConfidence;
}): string[] {
  const warnings: string[] = [];

  if (fields.nidaNumber.confidence < 0.75) {
    warnings.push("NIDA number confidence is low.");
  }

  if (fields.fullName.confidence < 0.7) {
    warnings.push("Full name confidence is low.");
  }

  if (fields.dateOfBirth.confidence < 0.7) {
    warnings.push("Date of birth confidence is low.");
  }

  if (fields.expiryDate.confidence < 0.7) {
    warnings.push("Expiry date confidence is low.");
  }

  return warnings;
}

function computeOverallConfidence(confidences: number[]): number {
  if (!confidences.length) {
    return 0;
  }

  const average = confidences.reduce((sum, value) => sum + value, 0) / confidences.length;
  return clampConfidence(average);
}

function missingField(): ParsedFieldConfidence {
  return {
    value: null,
    confidence: 0,
    sourceText: null,
    normalizedText: null,
  };
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function labelMatches(normalizedLine: string, alias: string): boolean {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`);
  return pattern.test(normalizedLine);
}
