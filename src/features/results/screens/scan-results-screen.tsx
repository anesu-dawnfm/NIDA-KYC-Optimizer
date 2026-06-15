import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { useAppTheme } from "@/core/theme/theme-provider";
import type { ScanResult } from "@/features/results/types/scan-result";
import { useScanResultStore } from "@/features/results/store/use-scan-result-store";
import { ResultFieldRow } from "@/features/results/components/result-field-row";
import { Button, Card, StatusBadge } from "@/shared/components/ui";

type ScanResultsScreenProps = {
  result?: ScanResult | null;
};

export function ScanResultsScreen({ result: resultProp }: ScanResultsScreenProps) {
  const { colors, spacing, typography } = useAppTheme();
  const storeResult = useScanResultStore((state) => state.currentResult);
  const currentResult = resultProp ?? storeResult;

  const confidence = currentResult
    ? Math.round(currentResult.parsed.overallConfidence * 100)
    : 0;
  const isWarning = confidence < 70;

  const statusTone = useMemo(() => {
    if (!currentResult) {
      return "neutral" as const;
    }

    switch (currentResult.validation.status) {
      case "VALID":
        return "success" as const;
      case "WARNING":
        return "warning" as const;
      case "INVALID":
      default:
        return "danger" as const;
    }
  }, [currentResult]);

  const handleConfirm = () => {
    if (!currentResult) {
      Alert.alert("No scan result", "There is no scan result to confirm.");
      return;
    }

    Alert.alert("Confirmed", "The scan result has been confirmed.");
  };

  const handleEdit = () => {
    if (!currentResult) {
      Alert.alert("No scan result", "There is no scan result to edit.");
      return;
    }

    Alert.alert(
      "Edit not wired",
      "Open the edit flow from here once the field editor screen is added.",
    );
  };

  const handleRescan = () => {
    router.replace("/scan");
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.background,
          padding: spacing[4],
        },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.bold,
            },
          ]}
        >
          Scan Results
        </Text>
        <StatusBadge
          label={currentResult ? currentResult.validation.status : "No result"}
          tone={statusTone}
        />
      </View>

      <Card style={styles.summaryCard}>
        <Text
          style={[
            styles.summaryLabel,
            {
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.medium,
            },
          ]}
        >
          OCR Confidence
        </Text>
        <Text
          style={[
            styles.confidence,
            {
              color: isWarning ? colors.warning : colors.textPrimary,
              fontFamily: typography.fontFamily.bold,
            },
          ]}
        >
          {confidence}%
        </Text>
        <Text
          style={[
            styles.summaryText,
            {
              color: colors.textSecondary,
              fontFamily: typography.fontFamily.regular,
            },
          ]}
        >
          {isWarning
            ? "Confidence is below the 70% review threshold."
            : "Confidence is within the acceptable review range."}
        </Text>
      </Card>

      <View style={styles.fields}>
        <ResultFieldRow
          confidence={currentResult?.parsed.fullName.confidence}
          label="Full Name"
          value={currentResult?.parsed.fullName.value ?? null}
        />
        <ResultFieldRow
          confidence={currentResult?.parsed.nidaNumber.confidence}
          label="NIDA Number"
          value={currentResult?.parsed.nidaNumber.value ?? null}
        />
        <ResultFieldRow
          confidence={currentResult?.parsed.dateOfBirth.confidence}
          label="Date of Birth"
          value={currentResult?.parsed.dateOfBirth.value ?? null}
        />
        <ResultFieldRow
          confidence={currentResult?.parsed.expiryDate.confidence}
          label="Expiry Date"
          value={currentResult?.parsed.expiryDate.value ?? null}
        />
      </View>

      {currentResult?.validation.issues.length ? (
        <Card style={styles.issuesCard}>
          <Text
            style={[
              styles.issueTitle,
              {
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.semibold,
              },
            ]}
          >
            Validation Notes
          </Text>
          {currentResult.validation.issues.map((issue) => (
            <Text
              key={`${issue.field}-${issue.code}-${issue.message}`}
              style={[
                styles.issueText,
                {
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.regular,
                },
              ]}
            >
              {issue.message}
            </Text>
          ))}
        </Card>
      ) : null}

      <View style={styles.actions}>
        <Button fullWidth label="Confirm" onPress={handleConfirm} />
        <Button
          fullWidth
          label="Edit"
          onPress={handleEdit}
          variant="secondary"
        />
        <Button
          fullWidth
          label="Rescan"
          onPress={handleRescan}
          variant="ghost"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 28,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    fontSize: 26,
    letterSpacing: -0.3,
  },
  summaryCard: {
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  confidence: {
    fontSize: 34,
    letterSpacing: -0.8,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 19,
  },
  fields: {
    gap: 12,
  },
  issuesCard: {
    gap: 8,
  },
  issueTitle: {
    fontSize: 15,
  },
  issueText: {
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
});
