"use client";

import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Separator } from 'tamagui';
import { Activity as ActivityIcon, User, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { RecentActivity } from '../types/dashboard.types';

interface RecentActivityListProps {
  activities: RecentActivity[];
  itemsPerPage?: number;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ 
  activities, 
  itemsPerPage = 20 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(activities.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = activities.slice(startIndex, startIndex + itemsPerPage);

  return (
    <YStack gap="$4" flex={1}>
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$6" fontWeight="700" color="$color">Recent Activity</Text>
        <Text color="$gray10" fontSize="$3">{activities.length} total events</Text>
      </XStack>

      <YStack 
        borderWidth={1} 
        borderColor="$borderColor" 
        borderRadius="$4" 
        overflow="hidden" 
        backgroundColor="$background"
      >
        <YStack separator={<Separator />}>
          {currentItems.map((activity) => (
            <XStack key={activity.id} padding="$4" gap="$4" hoverStyle={{ backgroundColor: '$gray2' }}>
              <YStack 
                width={40} 
                height={40} 
                borderRadius="$10" 
                backgroundColor={activity.type === 'system' ? '$blue3' : '$orange3'} 
                alignItems="center" 
                justifyContent="center"
              >
                {activity.type === 'system' ? (
                  <ActivityIcon size={20} color="var(--blue10)" />
                ) : (
                  <User size={20} color="var(--orange10)" />
                )}
              </YStack>
              
              <YStack flex={1} gap="$1">
                <Text fontWeight="600" fontSize="$4" color="$color">{activity.description}</Text>
                <XStack gap="$4" alignItems="center">
                  {activity.user && (
                    <XStack gap="$1" alignItems="center">
                      <User size={12} color="var(--gray10)" />
                      <Text color="$gray10" fontSize="$2">{activity.user}</Text>
                    </XStack>
                  )}
                  <XStack gap="$1" alignItems="center">
                    <Clock size={12} color="var(--gray10)" />
                    <Text color="$gray10" fontSize="$2">
                      {new Date(activity.timestamp).toLocaleString()}
                    </Text>
                  </XStack>
                </XStack>
              </YStack>
            </XStack>
          ))}
        </YStack>
      </YStack>

      <XStack justifyContent="center" gap="$4" alignItems="center" marginTop="$2">
        <Button 
          icon={<ChevronLeft size={16} />} 
          circular 
          disabled={currentPage === 1} 
          onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
          chromeless
        />
        <Text fontSize="$3" fontWeight="600" color="$color">
          Page {currentPage} of {totalPages}
        </Text>
        <Button 
          icon={<ChevronRight size={16} />} 
          circular 
          disabled={currentPage === totalPages} 
          onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          chromeless
        />
      </XStack>
    </YStack>
  );
};