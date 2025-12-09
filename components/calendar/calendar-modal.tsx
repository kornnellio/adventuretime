import { Button } from "@/components/ui/button";
import { Calendar, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { CalendarWidget } from "./calendar-widget";
import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ro } from "date-fns/locale";

interface CalendarModalProps {
  onDateSelect: (date: Date) => void;
  eventDates: Date[];
  currentMonth: Date;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  selectedDate: Date | null;
}

export function CalendarModal({
  onDateSelect,
  eventDates,
  currentMonth,
  onNextMonth,
  onPreviousMonth,
  selectedDate
}: CalendarModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="lg:hidden flex items-center gap-2 bg-card border-border hover:bg-muted text-foreground px-4 py-2.5 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
        >
          <Calendar className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium">
            {selectedDate 
              ? format(selectedDate, 'dd MMM yyyy')
              : 'Select Date'}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 bg-card border-border rounded-xl shadow-2xl">
        <div className="p-5 bg-gradient-to-b from-card to-card/80">
          {/* Enhanced header with better contrast */}
          <div className="flex items-center justify-between mb-4 bg-muted/30 rounded-lg p-3 border border-border/50">
            <h2 className="text-lg font-bold text-foreground tracking-wide">
              {format(currentMonth, 'MMMM yyyy', { locale: ro }).toUpperCase()}
            </h2>
            <div className="flex items-center gap-1">
              <Button 
                onClick={onPreviousMonth}
                variant="outline"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8 border-border/50 hover:border-primary/50 hover:bg-primary/10 rounded-md shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                onClick={onNextMonth}
                variant="outline"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8 border-border/50 hover:border-primary/50 hover:bg-primary/10 rounded-md shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Calendar widget container with enhanced background */}
          <div className="bg-background/20 rounded-lg p-1 border border-border/30 shadow-inner">
            <CalendarWidget 
              onDateSelect={handleDateSelect}
              eventDates={eventDates}
              currentMonth={currentMonth}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
