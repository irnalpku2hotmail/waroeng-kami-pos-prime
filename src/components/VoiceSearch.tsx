import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface VoiceSearchProps {
  onVoiceResult: (text: string) => void;
}

const VoiceSearch = ({ onVoiceResult }: VoiceSearchProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        const recognitionInstance = new SpeechRecognitionAPI();
        
        recognitionInstance.continuous = true; // Enable continuous recognition
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

          // In continuous mode, keep listening
          if (!isContinuousMode) {
            setIsListening(false);
          }
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

          // In continuous mode, try to restart after error
          if (isContinuousMode && event.error !== 'aborted') {
            setTimeout(() => {
              if (recognitionInstance && isContinuousMode) {
                try {
                  recognitionInstance.start();
                } catch (error) {
                  console.log('Failed to restart recognition:', error);
                }
              }
            }, 1000);
          } else {
            setIsListening(false);
          }
        };

        recognitionInstance.onend = () => {
          console.log('Voice recognition ended');
          
          // In continuous mode, restart recognition automatically
          if (isContinuousMode) {
            setTimeout(() => {
              if (recognitionInstance && isContinuousMode) {
                try {
                  recognitionInstance.start();
                } catch (error) {
                  console.log('Recognition already running or failed to restart:', error);
                }
              }
            }, 500);
          } else {
            setIsListening(false);
          }
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [onVoiceResult, isContinuousMode]);

  const startListening = () => {
    if (recognition) {
      try {
        recognition.start();
        toast({
          title: 'Voice Search Aktif',
          description: isContinuousMode ? 'Mode berkelanjutan aktif' : 'Silakan ucapkan perintah',
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

  const toggleContinuousMode = () => {
    const newMode = !isContinuousMode;
    setIsContinuousMode(newMode);
    
    // If switching to continuous mode and currently listening, restart with new settings
    if (newMode && isListening) {
      stopListening();
      setTimeout(() => startListening(), 300);
    }
    
    toast({
      title: newMode ? 'Mode Berkelanjutan Aktif' : 'Mode Sekali Pakai Aktif',
      description: newMode ? 'Voice search akan tetap aktif' : 'Voice search akan berhenti setelah sekali pakai',
      duration: 2000
    });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center space-x-2">
        <Switch
          id="continuous-mode"
          checked={isContinuousMode}
          onCheckedChange={toggleContinuousMode}
          disabled={isListening}
        />
        <Label htmlFor="continuous-mode" className="text-sm">
          Mode Berkelanjutan
        </Label>
      </div>
      
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        onClick={isListening ? stopListening : startListening}
        className="flex items-center gap-2"
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            {isContinuousMode ? 'Stop' : 'Berhenti'}
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Voice Search
          </>
        )}
      </Button>
      
      {isContinuousMode && isListening && (
        <div className="flex items-center gap-1 text-sm text-green-600">
          <RotateCcw className="h-3 w-3 animate-spin" />
          Mendengarkan...
        </div>
      )}
    </div>
  );
};

export default VoiceSearch;
