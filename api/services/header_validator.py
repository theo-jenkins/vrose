from fuzzywuzzy import fuzz
from typing import Dict, List, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class HeaderValidator:
    """
    Service for validating table headers using fuzzy string matching.
    Identifies datetime, product_id, quantity, and revenue columns.
    """
    
    # Word banks for different header types
    DATETIME_WORDS = [
        'date', 'time', 'datetime', 'timestamp', 'created_at', 'updated_at',
        'order_date', 'purchase_date', 'transaction_date', 'sale_date',
        'created', 'modified', 'when', 'occurrence', 'event_date'
    ]
    
    PRODUCT_ID_WORDS = [
        'product_id', 'sku', 'product_code', 'item_id', 'barcode',
        'product_number', 'item_code', 'article_number', 'upc',
        'product_ref', 'item_ref', 'reference', 'catalog_number',
        'part_number', 'model_number', 'identifier', 'product_key'
    ]
    
    QUANTITY_WORDS = [
        'quantity', 'qty', 'amount', 'count', 'units', 'pieces',
        'volume', 'number', 'sold', 'purchased', 'ordered',
        'total_items', 'item_count', 'num_items', 'units_sold'
    ]
    
    REVENUE_WORDS = [
        'revenue', 'price', 'cost', 'total', 'unit_price', 'sales',
        'amount', 'value', 'total_amount', 'gross_amount', 'net_amount',
        'sale_price', 'selling_price', 'total_price', 'total_cost',
        'revenue_amount', 'sales_amount', 'income', 'earnings'
    ]
    
    # Confidence threshold for matches
    CONFIDENCE_THRESHOLD = 70
    
    def __init__(self):
        self.header_types = {
            'datetime': self.DATETIME_WORDS,
            'product_id': self.PRODUCT_ID_WORDS,
            'quantity': self.QUANTITY_WORDS,
            'revenue': self.REVENUE_WORDS
        }
    
    def validate_headers(self, headers: List[str]) -> Dict[str, Dict]:
        """
        Validate a list of headers against required types.
        
        Args:
            headers: List of column header strings
            
        Returns:
            Dict with validation results for each header type
        """
        results = {}
        
        for header_type, word_bank in self.header_types.items():
            best_match = self._find_best_match(headers, word_bank)
            results[header_type] = best_match
        
        return results
    
    def _find_best_match(self, headers: List[str], word_bank: List[str]) -> Dict:
        """
        Find the best matching header for a given word bank.
        
        Args:
            headers: List of column headers
            word_bank: List of words to match against
            
        Returns:
            Dict with match details
        """
        best_score = 0
        best_header = None
        best_word = None
        
        for header in headers:
            # Clean header for comparison
            clean_header = self._clean_header(header)
            
            for word in word_bank:
                # Calculate fuzzy match score
                score = fuzz.partial_ratio(clean_header.lower(), word.lower())
                
                if score > best_score:
                    best_score = score
                    best_header = header
                    best_word = word
        
        return {
            'matched_column': best_header if best_score >= self.CONFIDENCE_THRESHOLD else None,
            'confidence_score': best_score,
            'is_found': best_score >= self.CONFIDENCE_THRESHOLD,
            'best_match_word': best_word,
            'validation_method': 'fuzzy_match'
        }
    
    def _clean_header(self, header: str) -> str:
        """
        Clean header string for better matching.
        
        Args:
            header: Raw header string
            
        Returns:
            Cleaned header string
        """
        import re
        
        # Remove special characters and replace with spaces
        clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', header)
        
        # Replace multiple spaces with single space
        clean = re.sub(r'\s+', ' ', clean)
        
        # Strip whitespace
        clean = clean.strip()
        
        return clean
    
    def get_validation_summary(self, validation_results: Dict[str, Dict]) -> Dict:
        """
        Get a summary of validation results.
        
        Args:
            validation_results: Results from validate_headers
            
        Returns:
            Summary dict with overall validation status
        """
        found_headers = []
        missing_headers = []
        total_confidence = 0
        
        for header_type, result in validation_results.items():
            if result['is_found']:
                found_headers.append({
                    'type': header_type,
                    'column': result['matched_column'],
                    'confidence': result['confidence_score']
                })
                total_confidence += result['confidence_score']
            else:
                missing_headers.append(header_type)
        
        return {
            'all_headers_found': len(missing_headers) == 0,
            'found_count': len(found_headers),
            'missing_count': len(missing_headers),
            'found_headers': found_headers,
            'missing_headers': missing_headers,
            'average_confidence': total_confidence / len(validation_results) if validation_results else 0,
            'can_generate_insights': len(missing_headers) == 0
        }
    
    def validate_single_header(self, header: str, header_type: str) -> Dict:
        """
        Validate a single header against a specific type.
        
        Args:
            header: Header string to validate
            header_type: Type to validate against (datetime, product_id, quantity, revenue)
            
        Returns:
            Validation result dict
        """
        if header_type not in self.header_types:
            raise ValueError(f"Invalid header type: {header_type}")
        
        word_bank = self.header_types[header_type]
        return self._find_best_match([header], word_bank)