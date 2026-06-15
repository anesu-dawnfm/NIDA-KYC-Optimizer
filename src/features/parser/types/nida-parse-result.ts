export type ParsedFieldConfidence = {
  value: string | null;
  confidence: number;
  sourceText: string | null;
  normalizedText: string | null;
};

export type NidaParsedResult = {
  fullName: ParsedFieldConfidence;
  nidaNumber: ParsedFieldConfidence;
  dateOfBirth: ParsedFieldConfidence;
  expiryDate: ParsedFieldConfidence;
  overallConfidence: number;
  warnings: string[];
  normalizedText: string;
};

export type NidaParseInput = {
  rawText: string;
};
