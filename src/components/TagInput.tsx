import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxLength?: number;
}

const TagInput = ({ tags, onChange, maxTags = 20, maxLength = 20 }: TagInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch existing tags for autosuggest
  const { data: existingTags = [] } = useQuery({
    queryKey: ['all-product-tags'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('tags')
        .not('tags', 'is', null);
      const tagSet = new Set<string>();
      (data || []).forEach((p: any) => {
        if (Array.isArray(p.tags)) {
          p.tags.forEach((t: string) => tagSet.add(t));
        }
      });
      return Array.from(tagSet).sort();
    }
  });

  const suggestions = inputValue.trim()
    ? existingTags.filter(t => 
        t.includes(inputValue.trim().toLowerCase()) && !tags.includes(t)
      ).slice(0, 8)
    : [];

  const addTag = (value: string) => {
    const tag = value.trim().toLowerCase();
    if (!tag || tag.length > maxLength || tags.length >= maxTags || tags.includes(tag)) return;
    onChange([...tags, tag]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-1.5 p-2 min-h-[42px] border border-input rounded-md bg-background cursor-text focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary" className="text-xs gap-1 pl-2 pr-1 py-0.5">
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(i); }}
              className="hover:bg-muted-foreground/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {tags.length < maxTags && (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={tags.length === 0 ? "Tambah tag (tekan enter)..." : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            maxLength={maxLength}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {tags.length}/{maxTags} tag
      </p>

      {/* Autosuggest dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-md shadow-md max-h-40 overflow-y-auto">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
              onMouseDown={(e) => { e.preventDefault(); addTag(s); }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;
