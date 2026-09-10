"use client";

import React, { useState } from 'react';
import { YStack, XStack, Text, Button, Separator, Checkbox } from 'tamagui';
import { Check, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Task } from '../types/dashboard.types';

interface TaskListProps {
  tasks: Task[];
  itemsPerPage?: number;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  itemsPerPage = 5 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = tasks.slice(startIndex, startIndex + itemsPerPage);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444'; // red10
      case 'medium': return '#f97316'; // orange10
      default: return '#3b82f6'; // blue10
    }
  };

  return (
    <YStack gap="$4">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$5" fontWeight="700" color="$color">Tasks to Complete</Text>
        <Text color="$gray10" fontSize="$2">{tasks.length} total tasks</Text>
      </XStack>

      <YStack 
        borderWidth={1} 
        borderColor="$borderColor" 
        borderRadius="$4" 
        overflow="hidden" 
        backgroundColor="$background"
      >
        <YStack separator={<Separator />}>
          {currentItems.map((task) => (
            <XStack key={task.id} padding="$3" gap="$3" alignItems="center">
              <Checkbox size="$3" checked={task.status === 'completed'}>
                <Checkbox.Indicator>
                  <Check size={14} />
                </Checkbox.Indicator>
              </Checkbox>
              
              <YStack flex={1}>
                <Text 
                  fontWeight="600" 
                  fontSize="$3" 
                  textDecorationLine={task.status === 'completed' ? 'line-through' : 'none'}
                  color={task.status === 'completed' ? '$gray10' : '$color'}
                >
                  {task.title}
                </Text>
                <XStack gap="$2" alignItems="center">
                  <Text color={getPriorityColor(task.priority)} fontSize="$1" fontWeight="700" textTransform="uppercase">
                    {task.priority}
                  </Text>
                  <Separator vertical height={8} />
                  <XStack gap="$1" alignItems="center">
                    <Clock size={10} color="#9ca3af" />
                    <Text color="$gray10" fontSize="$1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </Text>
                  </XStack>
                </XStack>
              </YStack>

              {task.priority === 'high' && task.status !== 'completed' && (
                <AlertCircle size={16} color="#ef4444" />
              )}
            </XStack>
          ))}
        </YStack>
      </YStack>

      <XStack justifyContent="center" gap="$2" alignItems="center">
        <Button 
          icon={<ChevronLeft size={14} />} 
          size="$2" 
          circular 
          disabled={currentPage === 1} 
          onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
          chromeless
        />
        <Text fontSize="$2" color="$gray10">
          Page {currentPage} of {totalPages}
        </Text>
        <Button 
          icon={<ChevronRight size={14} />} 
          size="$2" 
          circular 
          disabled={currentPage === totalPages} 
          onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          chromeless
        />
      </XStack>
    </YStack>
  );
};