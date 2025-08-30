#!/usr/bin/env python3
"""
Script to parse raw.txt and convert it to pfn_cards.json format.
Each line contains: easy_word hard_word(s)
"""

import json
import re

def capitalize_first_letter(text):
    """Capitalize the first letter of each word in the text."""
    return ' '.join(word.capitalize() for word in text.split())

def parse_raw_file(input_file, output_file):
    """Parse the raw.txt file and create pfn_cards.json."""
    cards = []
    
    with open(input_file, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:  # Skip empty lines
                continue
                
            # Split on first space to separate easy word from hard word(s)
            parts = line.split(' ', 1)
            if len(parts) != 2:
                print(f"Warning: Line {line_num} doesn't have expected format: '{line}'")
                continue
                
            easy_word, hard_word = parts
            
            # Clean up the words
            easy_word = easy_word.strip()
            hard_word = hard_word.strip()
            
            # Skip if either word is empty
            if not easy_word or not hard_word:
                print(f"Warning: Line {line_num} has empty word: '{line}'")
                continue
            
            # Capitalize first letter of each word
            easy_word = capitalize_first_letter(easy_word)
            hard_word = capitalize_first_letter(hard_word)
            
            # Create card object
            card = {
                "easy": easy_word,
                "hard": hard_word
            }
            
            cards.append(card)
    
    # Write to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully parsed {len(cards)} cards from {input_file}")
    print(f"Output written to {output_file}")
    
    # Show first few cards as preview
    print("\nFirst 5 cards:")
    for i, card in enumerate(cards[:5]):
        print(f"  {i+1}. Easy: '{card['easy']}' | Hard: '{card['hard']}'")

if __name__ == "__main__":
    input_file = "raw.txt"
    output_file = "pfn_cards.json"
    
    try:
        parse_raw_file(input_file, output_file)
    except FileNotFoundError:
        print(f"Error: Could not find input file '{input_file}'")
    except Exception as e:
        print(f"Error: {e}")
