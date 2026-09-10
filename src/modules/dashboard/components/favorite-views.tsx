"use client";

import React from 'react';
import { YStack, XStack, Text } from 'tamagui';
import { Star, ChevronRight } from 'lucide-react';
import { FavoriteView } from '../types/dashboard.types';
import Link from 'next/link';

interface FavoriteViewsProps {
  favorites: FavoriteView[];
}

export const FavoriteViews: React.FC<FavoriteViewsProps> = ({ favorites }) => {
  return (
    <YStack gap="$4">
      <XStack gap="$2" alignItems="center">
        <Star size={18} color="#f59e0b" fill="#f59e0b" />
        <Text fontSize="$5" fontWeight="700" color="$color">Your Favorite Views</Text>
      </XStack>

      <YStack gap="$2">
        {favorites.map((view) => (
          <Link key={view.id} href={view.path} style={{ textDecoration: 'none' }}>
            <YStack 
              padding="$3" 
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$4"
              hoverStyle={{ backgroundColor: '$gray3', scale: 1.01 }} 
              pressStyle={{ scale: 0.98 }}
              animation="bouncy"
              cursor="pointer"
              backgroundColor="$background"
            >
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontWeight="600" fontSize="$3" color="$color">{view.title}</Text>
                <ChevronRight size={16} color="#9ca3af" />
              </XStack>
            </YStack>
          </Link>
        ))}
      </YStack>
    </YStack>
  );
};