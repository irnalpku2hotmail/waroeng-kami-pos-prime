
import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

const DateTimeDisplay = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5" />
        <span className="font-medium">
          {currentDateTime.toLocaleDateString('id-ID', { 
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-3.5 w-3.5" />
        <span className="tabular-nums font-medium">
          {currentDateTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>
    </div>
  );
};

export default DateTimeDisplay;
