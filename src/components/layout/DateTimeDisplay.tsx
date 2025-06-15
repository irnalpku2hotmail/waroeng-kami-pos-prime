
import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

const DateTimeDisplay = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        {currentDateTime.toLocaleDateString('id-ID', { 
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })}
      </div>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        {currentDateTime.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
};

export default DateTimeDisplay;
