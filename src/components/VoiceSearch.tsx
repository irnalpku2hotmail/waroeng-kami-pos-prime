import { useState, useEffect, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VoiceSearchProps {
  onVoiceResult: (text: string) => void;
  buttonRef?: RefObject<HTMLButtonElement>;
}

const VoiceSearch = ({ onVoiceResult, buttonRef }: VoiceSearchProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        
        recognitionInstance.continuous = true; // Always continuous
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'id-ID';

        recognitionInstance.onstart = () => {
          setIsListening(true);
          console.log('Voice recognition started');
        };

        recognitionInstance.onresult = (event) => {
          const transcript = event.results[event.results.length - 1][0].transcript.trim();
          console.log('Voice result:', transcript);
          onVoiceResult(transcript);
          
          // Show feedback toast
          toast({
            title: 'Perintah Suara Diterima',
            description: `"${transcript}"`,
            duration: 2000
          });
        };

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          
          // Handle specific errors
          if (event.error === 'no-speech') {
            toast({
              title: 'Tidak Ada Suara',
              description: 'Silakan coba ucapkan perintah lagi.',
              variant: 'destructive',
              duration: 2000
            });
          } else {
            toast({
              title: 'Error Voice Recognition',
              description: 'Gagal mengenali suara. Silakan coba lagi.',
              variant: 'destructive'
            });
          }

          // Auto restart after error
          if (event.error !== 'aborted') {
            setTimeout(() => {
              if (recognitionInstance && isListening) {
                try {
                  recognitionInstance.start();
                } catch (error) {
                  console.log('Failed to restart recognition:', error);
                }
              }
            }, 1000);
          }
        };

        recognitionInstance.onend = () => {
          console.log('Voice recognition ended');
          
          // Auto restart recognition
          if (isListening) {
            setTimeout(() => {
              if (recognitionInstance) {
                try {
                  recognitionInstance.start();
                } catch (error) {
                  console.log('Recognition already running or failed to restart:', error);
                }
              }
            }, 500);
          }
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [onVoiceResult, isListening]);

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
        toast({
          title: 'Voice Search Aktif',
          description: 'Voice search akan terus berjalan secara otomatis',
          duration: 2000
        });
      } catch (error) {
        console.log('Recognition already running or error:', error);
      }
    } else {
      toast({
        title: 'Error',
        description: 'Voice recognition tidak didukung di browser ini.',
        variant: 'destructive'
      });
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <Button
      ref={buttonRef}
      variant={isListening ? "destructive" : "ghost"}
      size="icon"
      onClick={isListening ? stopListening : startListening}
      className="h-8 w-8"
      type="button"
    >
      {isListening ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};

export default VoiceSearch;
