'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, isBefore, startOfDay, getDay } from 'date-fns';
import { ro } from 'date-fns/locale';

interface CalendarWidgetProps {
  onDateSelect?: (date: Date) => void;
  eventDates?: Date[]; // Array of dates that have events
  currentMonth?: Date; // Optional prop to control the displayed month
}

export function CalendarWidget({ onDateSelect, eventDates = [], currentMonth }: CalendarWidgetProps) {
  const [internalCurrentDate, setInternalCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  
  // Use the provided currentMonth if available, otherwise use internal state
  const displayedMonth = currentMonth || internalCurrentDate;
  
  const firstDayOfMonth = startOfMonth(displayedMonth);
  const lastDayOfMonth = endOfMonth(displayedMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  // These functions are only used if currentMonth is not provided
  const nextMonth = () => setInternalCurrentDate(addMonths(internalCurrentDate, 1));
  const previousMonth = () => setInternalCurrentDate(subMonths(internalCurrentDate, 1));

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const hasEvent = (date: Date) => {
    return eventDates.some(eventDate => isSameDay(eventDate, date));
  };

  // Check if a date is in the past or today
  const isPastOrToday = (date: Date) => {
    const today = startOfDay(new Date());
    return isBefore(date, today) || isSameDay(date, today);
  };

  // Get the first day of the month to determine the offset
  const firstDayOffset = getDay(firstDayOfMonth);
  
  // Create an array of empty cells for the offset
  const emptyCells = Array(firstDayOffset).fill(null);

  // Use Romanian weekday names
  const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <div className="w-full px-2 py-2 sm:px-3 sm:py-3 bg-card/50 rounded-lg border border-border">
      {/* Weekday headers with background */}
      <div className="grid grid-cols-7 gap-1 mb-3 bg-muted/50 rounded-md p-2">
        {weekDays.map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="text-xs font-semibold text-muted-foreground text-center py-1 bg-background/20 rounded-sm"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid with enhanced contrast */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 bg-background/10 p-2 rounded-md">
        {emptyCells.map((_, index) => (
          <div key={`empty-${index}`} className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" />
        ))}
        {daysInMonth.map((date) => {
          const isCurrentMonth = isSameMonth(date, displayedMonth);
          const isCurrentDay = isToday(date);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const dateHasEvent = hasEvent(date);
          const isPast = isPastOrToday(date);

          return (
            <div key={date.toString()} className="relative flex items-center justify-center p-0.5">
              <Button
                variant="ghost"
                onClick={() => handleDateClick(date)}
                disabled={isPast && !dateHasEvent} // Only disable past dates without events
                className={cn(
                  'h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 p-0 text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg border-0',
                  // Base styles - no backgrounds anywhere
                  'hover:text-primary',
                  // Not current month
                  !isCurrentMonth && 'text-muted-foreground/60',
                  // Current month available dates
                  isCurrentMonth && !isPast && 'text-foreground hover:text-primary',
                  // Past dates without events
                  isPast && !dateHasEvent && 'text-muted-foreground/40 cursor-not-allowed opacity-50',
                  // Past dates with events
                  isPast && dateHasEvent && 'text-amber-400 hover:text-amber-300', 
                  // Today - use bold text and color instead of background
                  isCurrentDay && !isPast && 'text-orange-500 font-bold hover:text-orange-600',
                  // Selected date (future) - use underline and color
                  isSelected && !isCurrentDay && !isPast && 'text-primary font-bold underline underline-offset-2',
                  // Selected date (past with event)
                  isSelected && isPast && dateHasEvent && 'text-amber-300 font-bold underline underline-offset-2',
                  // Available dates with events - use color to indicate events
                  !isSelected && !isCurrentDay && !isPast && dateHasEvent && 'text-red-400 hover:text-red-300'
                )}
              >
                {date.getDate()}
              </Button>
              {dateHasEvent && (
                <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2">
                  <div className={cn(
                    'h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full shadow-sm',
                    isPast ? 'bg-amber-400 shadow-amber-400/50' : 'bg-red-500 shadow-red-500/50'
                  )}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 
