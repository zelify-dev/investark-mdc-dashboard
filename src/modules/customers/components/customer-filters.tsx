"use client";

import React from "react";
import { XStack, YStack, Text, Button } from "tamagui";
import { Home, Filter as FilterIcon, Pencil, X, ChevronDown } from "lucide-react";

import { useI18n } from "@/providers/i18n-provider";

const DEMO_BIRTH_DATE = "01-08-2000";

export const CustomerFilters: React.FC = () => {
  const { t } = useI18n();

  return (
    <YStack gap="$4" width="100%">
      {/* Primary Filters Bar */}
      <XStack gap="$3" alignItems="center" flexWrap="wrap">
        <XStack 
          backgroundColor="$background" 
          borderWidth={1} 
          borderColor="$borderColor" 
          borderRadius="$4" 
          paddingHorizontal="$3"
          paddingVertical="$2"
          alignItems="center"
          gap="$2"
          minWidth={200}
        >
          <Home size={16} color="var(--gray10)" />
          <Text fontSize="$3" color="$gray11">
            {t("customers.list.filters.branch")}
          </Text>
          <Text fontSize="$3" fontWeight="600" color="$color" flex={1}>
            {t("customers.list.filters.allBranches")}
          </Text>
          <ChevronDown size={16} color="var(--gray10)" />
        </XStack>

        <Button 
          icon={<FilterIcon size={16} />} 
          backgroundColor="#271a59" 
          color="#ffffff"
          borderRadius="$4"
          hoverStyle={{ backgroundColor: '#3a2a75' }}
        >
          {t("customers.list.filters.filter")}
        </Button>
      </XStack>

      {/* Active Filters Display */}
      <XStack gap="$3" alignItems="center">
        <Text fontSize="$3" color="$gray10">
          {t("customers.list.filters.where")}
        </Text>
        <XStack 
          backgroundColor="$blue3" 
          paddingHorizontal="$3" 
          paddingVertical="$2" 
          borderRadius="$4" 
          alignItems="center" 
          gap="$3"
        >
          <Text fontSize="$3" color="$blue10">
            {t("customers.list.filters.birthDateAfterPrefix")}{" "}
            <Text fontWeight="700">{DEMO_BIRTH_DATE}</Text>
          </Text>
          <XStack gap="$2">
            <Button size="$1" icon={<Pencil size={12} />} chromeless padding={0} />
            <Button size="$1" icon={<X size={12} />} chromeless padding={0} />
          </XStack>
        </XStack>
      </XStack>
    </YStack>
  );
};
