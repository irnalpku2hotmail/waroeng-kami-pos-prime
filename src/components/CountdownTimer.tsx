
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  className?: string;
}

const CountdownTimer = ({ endDate, className = "" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="h-5 w-5" />
      <span className="text-lg font-semibold">
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
      </span>
    </div>
  );
};

export default CountdownTimer;
