"use client";

import React from 'react';
import { YStack, XStack, Text } from 'tamagui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Indicator } from '../types/dashboard.types';

interface CompanyIndicatorsProps {
  indicators: Indicator[];
}

export const CompanyIndicators: React.FC<CompanyIndicatorsProps> = ({ indicators }) => {
  return (
    <YStack gap="$4">
      <Text fontSize="$5" fontWeight="700" color="$color">Company Indicators</Text>
      
      <XStack flexWrap="wrap" gap="$3">
        {indicators.map((indicator) => (
          <YStack 
            key={indicator.id} 
            flex={1} 
            minWidth={150} 
            padding="$4" 
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$4"
            backgroundColor="$background"
            hoverStyle={{ scale: 1.02 }}
            animation="lazy"
          >
            <YStack gap="$1">
              <Text fontSize="$2" color="$gray11" textTransform="uppercase" fontWeight="600">
                {indicator.label}
              </Text>
              <Text fontSize="$6" fontWeight="800" color="$color">{indicator.value}</Text>
              <XStack alignItems="center" gap="$1">
                {indicator.trend === 'up' && <TrendingUp size={14} color="#10b981" />}
                {indicator.trend === 'down' && <TrendingDown size={14} color="#ef4444" />}
                {indicator.trend === 'neutral' && <Minus size={14} color="#9ca3af" />}
                <Text 
                  fontSize="$2" 
                  fontWeight="600"
                  color={indicator.trend === 'up' ? '$green10' : indicator.trend === 'down' ? '$red10' : '$gray10'}
                >
                  {indicator.change > 0 ? '+' : ''}{indicator.change}%
                </Text>
              </XStack>
            </YStack>
          </YStack>
        ))}
      </XStack>
    </YStack>
  );
};