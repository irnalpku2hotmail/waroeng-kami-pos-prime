
// Utility to parse voice commands and extract quantity and product name
export interface ParsedVoiceCommand {
  quantity: number;
  productName: string;
  originalText: string;
}

// Common number words in Indonesian
const NUMBER_WORDS: Record<string, number> = {
  'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
  'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
  'sebelas': 11, 'dua belas': 12, 'tiga belas': 13, 'empat belas': 14, 'lima belas': 15,
  'enam belas': 16, 'tujuh belas': 17, 'delapan belas': 18, 'sembilan belas': 19,
  'dua puluh': 20, 'tiga puluh': 30, 'empat puluh': 40, 'lima puluh': 50,
  'enam puluh': 60, 'tujuh puluh': 70, 'delapan puluh': 80, 'sembilan puluh': 90,
  'seratus': 100
};

// Alternative number words
const ALT_NUMBER_WORDS: Record<string, number> = {
  'se': 1, 'sae': 1, 'sa': 1,
  'duo': 2, 'tre': 3, 'for': 4, 'faiv': 5,
  'siks': 6, 'seven': 7, 'eit': 8, 'nain': 9, 'ten': 10
};

export const parseVoiceCommand = (text: string): ParsedVoiceCommand => {
  console.log('Parsing voice command:', text);
  
  const cleanText = text.toLowerCase().trim();
  let quantity = 1;
  let productName = cleanText;

  // Try to extract quantity from the beginning of the text
  const words = cleanText.split(' ');
  
  // Check for numeric digits at the start
  const firstWord = words[0];
  const numericMatch = firstWord.match(/^(\d+)/);
  
  if (numericMatch) {
    quantity = parseInt(numericMatch[1]);
    productName = words.slice(1).join(' ').trim();
  } else {
    // Check for number words
    let foundNumber = false;
    
    // Check single word numbers
    if (NUMBER_WORDS[firstWord]) {
      quantity = NUMBER_WORDS[firstWord];
      productName = words.slice(1).join(' ').trim();
      foundNumber = true;
    } else if (ALT_NUMBER_WORDS[firstWord]) {
      quantity = ALT_NUMBER_WORDS[firstWord];
      productName = words.slice(1).join(' ').trim();
      foundNumber = true;
    }
    
    // Check two-word numbers like "dua puluh"
    if (!foundNumber && words.length >= 2) {
      const twoWordNumber = `${words[0]} ${words[1]}`;
      if (NUMBER_WORDS[twoWordNumber]) {
        quantity = NUMBER_WORDS[twoWordNumber];
        productName = words.slice(2).join(' ').trim();
        foundNumber = true;
      }
    }
    
    // Check for compound numbers like "dua puluh lima" (25)
    if (!foundNumber && words.length >= 3) {
      const baseNumber = NUMBER_WORDS[`${words[0]} ${words[1]}`];
      const additionalNumber = NUMBER_WORDS[words[2]];
      
      if (baseNumber && additionalNumber && additionalNumber < 10) {
        quantity = baseNumber + additionalNumber;
        productName = words.slice(3).join(' ').trim();
        foundNumber = true;
      }
    }
  }

  // Clean up product name - remove common words that might be misheard
  productName = productName
    .replace(/^(beli|ambil|tambah|mau|ingin)\s+/i, '')
    .replace(/\s+(dong|ya|aja|saja|please)$/i, '')
    .trim();

  // Ensure quantity is at least 1
  if (quantity < 1) {
    quantity = 1;
  }

  const result = {
    quantity,
    productName,
    originalText: text
  };

  console.log('Parsed voice command result:', result);
  return result;
};

// Function to find best matching product based on voice input
export const findBestProductMatch = (voiceInput: string, products: any[]): any | null => {
  const cleanInput = voiceInput.toLowerCase().trim();
  
  // Direct name match (case insensitive)
  let bestMatch = products.find(product => 
    product.name.toLowerCase() === cleanInput
  );
  
  if (bestMatch) return bestMatch;
  
  // Partial name match (contains)
  bestMatch = products.find(product => 
    product.name.toLowerCase().includes(cleanInput) || 
    cleanInput.includes(product.name.toLowerCase())
  );
  
  if (bestMatch) return bestMatch;
  
  // Barcode match
  bestMatch = products.find(product => 
    product.barcode && product.barcode.includes(cleanInput)
  );
  
  if (bestMatch) return bestMatch;
  
  // Fuzzy matching - check for similar words
  bestMatch = products.find(product => {
    const productWords = product.name.toLowerCase().split(' ');
    const inputWords = cleanInput.split(' ');
    
    // Check if any word from input matches any word from product name
    return inputWords.some(inputWord => 
      productWords.some(productWord => 
        productWord.includes(inputWord) || inputWord.includes(productWord)
      )
    );
  });
  
  return bestMatch || null;
};
