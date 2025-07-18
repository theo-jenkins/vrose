from fuzzywuzzy import fuzz
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from abc import ABC, abstractmethod
import logging
import json
from pathlib import Path

logger = logging.getLogger(__name__)

@dataclass
class ColumnDefinition:
    """Configuration for a column type"""
    name: str
    word_bank: List[str]
    is_required: bool
    confidence_threshold: int = 75
    description: str = ""

@dataclass
class ValidationResult:
    """Result of header validation"""
    matched_column: Optional[str]
    confidence_score: int
    is_found: bool
    best_match_word: Optional[str]
    validation_method: str

class MatchingStrategy(ABC):
    """Abstract base class for matching strategies"""
    
    @abstractmethod
    def match(self, header: str, word_bank: List[str]) -> Tuple[int, str]:
        """Return (confidence_score, best_match_word)"""
        pass

class FuzzyMatchStrategy(MatchingStrategy):
    """Fuzzy string matching strategy"""
    
    def match(self, header: str, word_bank: List[str]) -> Tuple[int, str]:
        best_score = 0
        best_word = ""
        
        clean_header = self._clean_header(header)
        
        for word in word_bank:
            score = fuzz.partial_ratio(clean_header.lower(), word.lower())
            if score > best_score:
                best_score = score
                best_word = word
                
        return best_score, best_word
    
    def _clean_header(self, header: str) -> str:
        import re
        clean = re.sub(r'[^a-zA-Z0-9\s]', ' ', header)
        clean = re.sub(r'\s+', ' ', clean)
        return clean.strip()

class ExactMatchStrategy(MatchingStrategy):
    """Exact string matching strategy"""
    
    def match(self, header: str, word_bank: List[str]) -> Tuple[int, str]:
        clean_header = header.lower().strip()
        
        for word in word_bank:
            if clean_header == word.lower():
                return 100, word
            if word.lower() in clean_header:
                return 90, word
                
        return 0, ""

class HeaderValidatorConfig:
    """Configuration management for header validation"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path
        self._column_definitions = {}
        self._system_headers = set()
        self._load_default_config()
        
        if config_path:
            self._load_config_file(config_path)
    
    def _load_default_config(self):
        """Load default configuration"""
        # System reserved headers
        self._system_headers = {
            '__sys_id', '__sys_created_at', '__sys_updated_at',
            'id', 'created_at', 'updated_at'
        }
        
        # Default column definitions
        self._column_definitions = {
            'datetime': ColumnDefinition(
                name='datetime',
                word_bank=[
                    'date', 'time', 'datetime', 'timestamp', 'order_date', 
                    'purchase_date', 'transaction_date', 'sale_date', 
                    'event_date', 'occurrence', 'when', 'created', 'modified'
                ],
                is_required=True,
                confidence_threshold=75,
                description="Date/time columns for temporal analysis"
            ),
            'revenue_sales': ColumnDefinition(
                name='revenue_sales',
                word_bank=[
                    'revenue', 'sales', 'price', 'cost', 'total', 'amount',
                    'value', 'total_amount', 'sale_price', 'income', 
                    'earnings', 'proceeds', 'turnover'
                ],
                is_required=True,
                confidence_threshold=75,
                description="Revenue/sales columns for financial analysis"
            ),
            'category': ColumnDefinition(
                name='category',
                word_bank=[
                    'category', 'type', 'class', 'classification', 'group',
                    'segment', 'division', 'department', 'product_category'
                ],
                is_required=False,
                confidence_threshold=70,
                description="Category columns for segmentation"
            ),
            'promotion': ColumnDefinition(
                name='promotion',
                word_bank=[
                    'promotion', 'promo', 'discount', 'sale', 'offer',
                    'deal', 'coupon', 'voucher', 'rebate', 'special'
                ],
                is_required=False,
                confidence_threshold=70,
                description="Promotion columns for marketing analysis"
            )
        }
    
    def _load_config_file(self, config_path: str):
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                config_data = json.load(f)
                
            # Update system headers
            if 'system_headers' in config_data:
                self._system_headers.update(config_data['system_headers'])
            
            # Update column definitions
            if 'column_definitions' in config_data:
                for name, config in config_data['column_definitions'].items():
                    self._column_definitions[name] = ColumnDefinition(**config)
                    
        except Exception as e:
            logger.warning(f"Failed to load config file {config_path}: {e}")
    
    def add_column_definition(self, definition: ColumnDefinition):
        """Add or update a column definition"""
        self._column_definitions[definition.name] = definition
    
    def get_column_definition(self, name: str) -> Optional[ColumnDefinition]:
        """Get column definition by name"""
        return self._column_definitions.get(name)
    
    def get_all_definitions(self) -> Dict[str, ColumnDefinition]:
        """Get all column definitions"""
        return self._column_definitions.copy()
    
    def get_required_definitions(self) -> Dict[str, ColumnDefinition]:
        """Get only required column definitions"""
        return {
            name: defn for name, defn in self._column_definitions.items() 
            if defn.is_required
        }
    
    def get_optional_definitions(self) -> Dict[str, ColumnDefinition]:
        """Get only optional column definitions"""
        return {
            name: defn for name, defn in self._column_definitions.items() 
            if not defn.is_required
        }
    
    @property
    def system_headers(self) -> set:
        return self._system_headers.copy()

class HeaderValidator:
    """
    Configurable service for validating table headers using multiple matching strategies.
    Supports easy modification through configuration and extensible matching strategies.
    """
    
    def __init__(self, 
                 config: Optional[HeaderValidatorConfig] = None,
                 strategies: Optional[List[MatchingStrategy]] = None):
        self.config = config or HeaderValidatorConfig()
        self.strategies = strategies or [
            ExactMatchStrategy(),
            FuzzyMatchStrategy()
        ]
    
    def validate_headers(self, headers: List[str]) -> Dict[str, Any]:
        """
        Validate headers against all configured column definitions.
        
        Args:
            headers: List of column header strings
            
        Returns:
            Comprehensive validation results
        """
        # Filter system headers
        filtered_headers = self._filter_system_headers(headers)
        
        logger.info(f"Validating {len(filtered_headers)} headers "
                   f"(filtered from {len(headers)} total)")
        
        # Get column definitions
        required_defs = self.config.get_required_definitions()
        optional_defs = self.config.get_optional_definitions()
        
        # Validate against all definitions
        required_results = self._validate_against_definitions(
            filtered_headers, required_defs)
        optional_results = self._validate_against_definitions(
            filtered_headers, optional_defs)
        
        # Generate status report
        status_report = self._generate_status_report(
            required_results, optional_results)
        
        return {
            'required_columns': required_results,
            'optional_columns': optional_results,
            'status_report': status_report,
            'filtered_headers': filtered_headers,
            'system_headers_excluded': len(headers) - len(filtered_headers),
            'config_summary': self._get_config_summary()
        }
    
    def _filter_system_headers(self, headers: List[str]) -> List[str]:
        """Filter out system reserved headers"""
        system_headers_lower = {h.lower() for h in self.config.system_headers}
        
        filtered = []
        for header in headers:
            if header.lower() not in system_headers_lower:
                filtered.append(header)
            else:
                logger.debug(f"Excluded system header: {header}")
        
        return filtered
    
    def _validate_against_definitions(self, 
                                    headers: List[str], 
                                    definitions: Dict[str, ColumnDefinition]) -> Dict[str, ValidationResult]:
        """Validate headers against column definitions"""
        results = {}
        
        for name, definition in definitions.items():
            best_result = ValidationResult(
                matched_column=None,
                confidence_score=0,
                is_found=False,
                best_match_word=None,
                validation_method="no_match"
            )
            
            # Try each strategy
            for strategy in self.strategies:
                result = self._validate_with_strategy(
                    headers, definition, strategy)
                
                # Keep the best result
                if result.confidence_score > best_result.confidence_score:
                    best_result = result
            
            results[name] = best_result
        
        return results
    
    def _validate_with_strategy(self, 
                              headers: List[str], 
                              definition: ColumnDefinition,
                              strategy: MatchingStrategy) -> ValidationResult:
        """Validate using a specific strategy"""
        best_score = 0
        best_header = None
        best_word = None
        
        for header in headers:
            score, match_word = strategy.match(header, definition.word_bank)
            
            if score > best_score:
                best_score = score
                best_header = header
                best_word = match_word
        
        return ValidationResult(
            matched_column=best_header if best_score >= definition.confidence_threshold else None,
            confidence_score=best_score,
            is_found=best_score >= definition.confidence_threshold,
            best_match_word=best_word,
            validation_method=strategy.__class__.__name__
        )
    
    def _generate_status_report(self, 
                              required_results: Dict[str, ValidationResult],
                              optional_results: Dict[str, ValidationResult]) -> Dict[str, Any]:
        """Generate comprehensive status report"""
        # Process required columns
        required_found = []
        required_missing = []
        
        for name, result in required_results.items():
            if result.is_found:
                required_found.append({
                    'type': name,
                    'column': result.matched_column,
                    'confidence': result.confidence_score,
                    'method': result.validation_method
                })
            else:
                required_missing.append(name)
        
        # Process optional columns
        optional_found = []
        optional_missing = []
        
        for name, result in optional_results.items():
            if result.is_found:
                optional_found.append({
                    'type': name,
                    'column': result.matched_column,
                    'confidence': result.confidence_score,
                    'method': result.validation_method
                })
            else:
                optional_missing.append(name)
        
        # Calculate overall metrics
        validation_success = len(required_missing) == 0
        all_found = required_found + optional_found
        avg_confidence = (sum(item['confidence'] for item in all_found) / len(all_found)) if all_found else 0
        
        return {
            'validation_success': validation_success,
            'can_proceed_to_analysis': validation_success,
            'required_columns': {
                'found': required_found,
                'missing': required_missing,
                'found_count': len(required_found),
                'required_count': len(required_results),
                'success_rate': len(required_found) / len(required_results) if required_results else 0
            },
            'optional_columns': {
                'found': optional_found,
                'missing': optional_missing,
                'found_count': len(optional_found),
                'total_count': len(optional_results),
                'success_rate': len(optional_found) / len(optional_results) if optional_results else 0
            },
            'overall_stats': {
                'total_columns_found': len(all_found),
                'total_columns_checked': len(required_results) + len(optional_results),
                'average_confidence': round(avg_confidence, 2)
            },
            'recommendations': self._generate_recommendations(required_missing, optional_missing)
        }
    
    def _generate_recommendations(self, 
                                required_missing: List[str], 
                                optional_missing: List[str]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        if required_missing:
            recommendations.append(
                f"REQUIRED: Add {', '.join(required_missing)} column(s) for analysis.")
        
        if optional_missing:
            recommendations.append(
                f"OPTIONAL: Consider adding {', '.join(optional_missing)} "
                f"column(s) for better predictions.")
        
        if not required_missing and not optional_missing:
            recommendations.append(
                "Excellent! All recommended columns found.")
        elif not required_missing:
            recommendations.append(
                "Good! All required columns found. Analysis can proceed.")
        
        return recommendations
    
    def _get_config_summary(self) -> Dict[str, Any]:
        """Get summary of current configuration"""
        all_defs = self.config.get_all_definitions()
        
        return {
            'total_column_types': len(all_defs),
            'required_types': len([d for d in all_defs.values() if d.is_required]),
            'optional_types': len([d for d in all_defs.values() if not d.is_required]),
            'strategies_used': [s.__class__.__name__ for s in self.strategies],
            'system_headers_count': len(self.config.system_headers)
        }
    
    def add_column_type(self, definition: ColumnDefinition):
        """Add a new column type for validation"""
        self.config.add_column_definition(definition)
    
    def validate_single_header(self, header: str, column_type: str) -> ValidationResult:
        """Validate a single header against a specific type"""
        definition = self.config.get_column_definition(column_type)
        if not definition:
            raise ValueError(f"Unknown column type: {column_type}")
        
        filtered_headers = self._filter_system_headers([header])
        
        if not filtered_headers:
            return ValidationResult(
                matched_column=None,
                confidence_score=0,
                is_found=False,
                best_match_word=None,
                validation_method="system_header_excluded"
            )
        
        best_result = ValidationResult(
            matched_column=None,
            confidence_score=0,
            is_found=False,
            best_match_word=None,
            validation_method="no_match"
        )
        
        for strategy in self.strategies:
            result = self._validate_with_strategy(
                filtered_headers, definition, strategy)
            if result.confidence_score > best_result.confidence_score:
                best_result = result
        
        return best_result

# Example usage and configuration
def create_custom_validator() -> HeaderValidator:
    """Create a validator with custom configuration"""
    config = HeaderValidatorConfig()
    
    # Add custom column type
    config.add_column_definition(ColumnDefinition(
        name='customer_id',
        word_bank=['customer', 'client', 'user_id', 'account', 'member'],
        is_required=False,
        confidence_threshold=80,
        description="Customer identification columns"
    ))
    
    # Use custom strategies
    strategies = [
        ExactMatchStrategy(),
        FuzzyMatchStrategy()
    ]
    
    return HeaderValidator(config=config, strategies=strategies)

# Example configuration file format (config.json)
EXAMPLE_CONFIG = {
    "system_headers": ["__internal_id", "row_num"],
    "column_definitions": {
        "product_id": {
            "name": "product_id",
            "word_bank": ["product", "item", "sku", "product_code"],
            "is_required": True,
            "confidence_threshold": 75,
            "description": "Product identification columns"
        }
    }
}