"use client";

import React from "react";
import { YStack, XStack, Text, Button } from "tamagui";
import { Plus, GripVertical } from "lucide-react";

import { useI18n } from "@/providers/i18n-provider";

const AVAILABLE_COLUMN_KEYS = [
  "accountState",
  "accountType",
  "address",
  "emailAddress",
  "mobileNumber",
  "postalCode",
  "preferredLanguage",
] as const;

const SELECTED_COLUMN_KEYS = [
  "fullName",
  "id",
  "clientState",
  "creditOfficer",
  "totalBalance",
  "lastModified",
] as const;

export const ColumnPresets: React.FC = () => {
  const { t } = useI18n();

  return (
    <YStack gap="$6" padding="$6" backgroundColor="$gray2" borderRadius="$4" borderTopWidth={1} borderTopColor="$borderColor">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="800" color="$color">
          {t("customers.columnPresets.title")}
        </Text>
        <Text fontSize="$4" color="$gray11">
          {t("customers.columnPresets.subtitle")}
        </Text>
      </YStack>

      <XStack gap="$10">
        <YStack flex={1} gap="$4">
          <Text fontWeight="700" color="$gray10" fontSize="$2">
            {t("customers.columnPresets.availableHeading")}
          </Text>
          <YStack gap="$2">
            {AVAILABLE_COLUMN_KEYS.map((key) => (
              <XStack
                key={key}
                padding="$2"
                alignItems="center"
                justifyContent="space-between"
                hoverStyle={{ backgroundColor: "$gray3" }}
                borderRadius="$2"
              >
                <Text fontSize="$3">{t(`customers.columnPresets.available.${key}`)}</Text>
                <Button size="$1" icon={<Plus size={14} />} chromeless />
              </XStack>
            ))}
          </YStack>
        </YStack>

        <YStack flex={2} gap="$4">
          <Text fontWeight="700" color="$gray10" fontSize="$2">
            {t("customers.columnPresets.selectedHeading")}
          </Text>
          <XStack gap="$2" flexWrap="wrap">
            {SELECTED_COLUMN_KEYS.map((key) => (
              <XStack
                key={key}
                backgroundColor="white"
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$4"
                paddingHorizontal="$3"
                paddingVertical="$2"
                alignItems="center"
                gap="$2"
              >
                <GripVertical size={14} color="var(--gray8)" />
                <Text fontSize="$3" fontWeight="600">
                  {t(`customers.list.columns.${key}`)}
                </Text>
                <Button size="$1" icon={<Plus size={14} style={{ transform: [{ rotate: "45deg" }] }} />} chromeless />
              </XStack>
            ))}
            <Button
              icon={<Plus size={16} />}
              variant="outlined"
              borderColor="#271a59"
              color="#271a59"
              borderRadius="$4"
              size="$3"
            >
              {t("customers.columnPresets.addColumn")}
            </Button>
          </XStack>
        </YStack>
      </XStack>

      <XStack gap="$3" justifyContent="flex-end" marginTop="$4">
        <Button variant="outlined" borderColor="$borderColor">
          {t("customers.columnPresets.cancel")}
        </Button>
        <Button backgroundColor="#271a59" color="#ffffff" hoverStyle={{ backgroundColor: "#3a2a75" }}>
          {t("customers.columnPresets.saveChanges")}
        </Button>
      </XStack>
    </YStack>
  );
};
