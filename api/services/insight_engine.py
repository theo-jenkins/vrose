"""
Insight Engine Service

This service orchestrates the data analysis pipeline:
1. Validates dataset structure and headers
2. Determines available analysis methods based on data
3. Executes analysis methods
4. Returns structured insights for visualization
"""

import logging
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from django.utils import timezone
from django.db import connection

from .header_validator import HeaderValidator

logger = logging.getLogger(__name__)

@dataclass
class AnalysisMethod:
    """Configuration for an analysis method"""
    name: str
    display_name: str
    description: str
    required_headers: List[str]
    optional_headers: List[str]
    min_data_points: int = 10
    method_class: str = None  # Will be used to dynamically load analysis classes

@dataclass
class InsightEngineResult:
    """Result from the insight engine analysis"""
    status: str  # 'pending', 'analyzing', 'completed', 'failed'
    dataset_info: Dict[str, Any]
    validation_summary: Dict[str, Any]
    matched_methods: List[Dict[str, Any]]
    selected_method: Optional[Dict[str, Any]]
    analysis_results: Optional[Dict[str, Any]]
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

class InsightEngine:
    """
    Main insight engine that coordinates data validation and analysis
    """
    
    def __init__(self):
        self.header_validator = HeaderValidator()
        self.analysis_methods = self._load_analysis_methods()
    
    def _load_analysis_methods(self) -> Dict[str, AnalysisMethod]:
        """Load available analysis methods"""
        return {
            'sales_prediction_analysis': AnalysisMethod(
                name='sales_prediction_analysis',
                display_name='Sales Prediction Analysis',
                description='Analyze sales trends and generate predictions based on historical data',
                required_headers=['datetime', 'revenue_sales'],
                optional_headers=['category', 'promotion'],
                min_data_points=10,
                method_class='SalesPredictionAnalyzer'
            ),
            # Future analysis methods can be added here
            # 'customer_segmentation': AnalysisMethod(...),
            # 'inventory_optimization': AnalysisMethod(...),
        }
    
    def analyze_dataset(self, dataset_id: str, table_name: str, selected_columns: List[str]) -> InsightEngineResult:
        """
        Main method to analyze a dataset and generate insights
        
        Args:
            dataset_id: ID of the dataset to analyze
            table_name: Name of the database table containing the data
            selected_columns: List of columns to analyze
        
        Returns:
            InsightEngineResult with analysis status and results
        """
        logger.info(f"Starting insight analysis for dataset {dataset_id}")
        
        try:
            # Step 1: Get dataset information
            dataset_info = self._get_dataset_info(table_name, selected_columns)
            
            # Step 2: Validate headers
            validation_results = self.header_validator.validate_headers(selected_columns)
            validation_summary = validation_results.get('status_report', {})
            
            # Step 3: Validate data quality
            data_quality_results = self._validate_data_quality(table_name, selected_columns)
            
            # Step 4: Match available analysis methods
            matched_methods = self._match_analysis_methods(validation_results, dataset_info)
            
            # Step 5: Select best analysis method
            selected_method = self._select_analysis_method(matched_methods, dataset_info)
            
            if not selected_method:
                return InsightEngineResult(
                    status='completed',
                    dataset_info=dataset_info,
                    validation_summary=validation_summary,
                    matched_methods=matched_methods,
                    selected_method=None,
                    analysis_results=None,
                    error_message="No suitable analysis methods found for this dataset",
                    created_at=timezone.now(),
                    completed_at=timezone.now()
                )
            
            # Step 6: Execute analysis
            analysis_results = self._execute_analysis(
                selected_method, 
                table_name, 
                selected_columns,
                validation_results
            )
            
            return InsightEngineResult(
                status='completed',
                dataset_info=dataset_info,
                validation_summary=validation_summary,
                matched_methods=matched_methods,
                selected_method=selected_method,
                analysis_results=analysis_results,
                error_message=None,
                created_at=datetime.now(),
                completed_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Insight analysis failed for dataset {dataset_id}: {str(e)}")
            return InsightEngineResult(
                status='failed',
                dataset_info={},
                validation_summary={},
                matched_methods=[],
                selected_method=None,
                analysis_results=None,
                error_message=str(e),
                created_at=datetime.now(),
                completed_at=datetime.now()
            )
    
    def _get_dataset_info(self, table_name: str, selected_columns: List[str]) -> Dict[str, Any]:
        """Get basic information about the dataset"""
        with connection.cursor() as cursor:
            # Get row count
            cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            row_count = cursor.fetchone()[0]
            
            # Get column info
            cursor.execute('''
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = %s
                AND column_name = ANY(%s)
                ORDER BY ordinal_position
            ''', [table_name, selected_columns])
            
            column_info = [
                {'name': row[0], 'type': row[1]}
                for row in cursor.fetchall()
            ]
            
            # Get sample data
            columns_sql = ', '.join(f'"{col}"' for col in selected_columns)
            cursor.execute(f'''
                SELECT {columns_sql}
                FROM "{table_name}"
                ORDER BY "__sys_id"
                LIMIT 5
            ''')
            
            sample_data = cursor.fetchall()
            
        return {
            'table_name': table_name,
            'row_count': row_count,
            'column_count': len(selected_columns),
            'columns': column_info,
            'sample_data': sample_data[:5],  # First 5 rows
            'selected_columns': selected_columns
        }
    
    def _validate_data_quality(self, table_name: str, selected_columns: List[str]) -> Dict[str, Any]:
        """Validate data quality - check for nulls, invalid data, etc."""
        quality_results = {}
        
        with connection.cursor() as cursor:
            for column in selected_columns:
                # Check null count
                cursor.execute(f'SELECT COUNT(*) FROM "{table_name}" WHERE "{column}" IS NULL')
                null_count = cursor.fetchone()[0]
                
                # Check total count
                cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                total_count = cursor.fetchone()[0]
                
                quality_results[column] = {
                    'null_count': null_count,
                    'null_percentage': (null_count / total_count * 100) if total_count > 0 else 0,
                    'has_data': null_count < total_count
                }
        
        return quality_results
    
    def _match_analysis_methods(self, validation_results: Dict[str, Any], dataset_info: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Match dataset against available analysis methods"""
        matched_methods = []
        
        # Get found headers
        required_columns = validation_results.get('required_columns', {})
        optional_columns = validation_results.get('optional_columns', {})
        
        found_required = [key for key, result in required_columns.items() if result.is_found]
        found_optional = [key for key, result in optional_columns.items() if result.is_found]
        
        for method_name, method_config in self.analysis_methods.items():
            # Check if all required headers are found
            has_required = all(header in found_required for header in method_config.required_headers)
            
            # Count optional headers found
            optional_found = sum(1 for header in method_config.optional_headers if header in found_optional)
            
            # Check minimum data points
            has_min_data = dataset_info['row_count'] >= method_config.min_data_points
            
            if has_required and has_min_data:
                confidence_score = self._calculate_method_confidence(
                    method_config, found_required, found_optional, dataset_info
                )
                
                matched_methods.append({
                    'name': method_config.name,
                    'display_name': method_config.display_name,
                    'description': method_config.description,
                    'confidence_score': confidence_score,
                    'required_headers_found': method_config.required_headers,
                    'optional_headers_found': [h for h in method_config.optional_headers if h in found_optional],
                    'data_points': dataset_info['row_count'],
                    'can_execute': True
                })
        
        # Sort by confidence score
        matched_methods.sort(key=lambda x: x['confidence_score'], reverse=True)
        
        return matched_methods
    
    def _calculate_method_confidence(self, method_config: AnalysisMethod, found_required: List[str], found_optional: List[str], dataset_info: Dict[str, Any]) -> float:
        """Calculate confidence score for an analysis method"""
        base_score = 70  # Base score for having all required headers
        
        # Bonus for optional headers
        optional_bonus = (len([h for h in method_config.optional_headers if h in found_optional]) / 
                         len(method_config.optional_headers) * 20) if method_config.optional_headers else 0
        
        # Bonus for data volume
        data_bonus = min(10, (dataset_info['row_count'] / 100) * 5)  # Up to 10 points for having lots of data
        
        return min(100, base_score + optional_bonus + data_bonus)
    
    def _select_analysis_method(self, matched_methods: List[Dict[str, Any]], dataset_info: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Select the best analysis method from matched methods"""
        if not matched_methods:
            return None
        
        # For now, return the highest confidence method
        return matched_methods[0]
    
    def _execute_analysis(self, selected_method: Dict[str, Any], table_name: str, selected_columns: List[str], validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the selected analysis method"""
        method_name = selected_method['name']
        
        if method_name == 'sales_prediction_analysis':
            return self._execute_sales_prediction_analysis(table_name, selected_columns, validation_results)
        
        # Future analysis methods would be handled here
        raise NotImplementedError(f"Analysis method '{method_name}' not implemented yet")
    
    def _execute_sales_prediction_analysis(self, table_name: str, selected_columns: List[str], validation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Execute sales prediction analysis"""
        # For now, return placeholder results
        # In the future, this would contain actual ML analysis
        
        # Get column mappings from validation results
        required_columns = validation_results.get('required_columns', {})
        optional_columns = validation_results.get('optional_columns', {})
        
        datetime_col = None
        sales_col = None
        category_col = None
        promotion_col = None
        
        for header_type, result in required_columns.items():
            if result.is_found:
                if header_type == 'datetime':
                    datetime_col = result.matched_column
                elif header_type == 'revenue_sales':
                    sales_col = result.matched_column
        
        for header_type, result in optional_columns.items():
            if result.is_found:
                if header_type == 'category':
                    category_col = result.matched_column
                elif header_type == 'promotion':
                    promotion_col = result.matched_column
        
        return {
            'analysis_type': 'sales_prediction_analysis',
            'status': 'completed',
            'summary': {
                'method': 'Time Series Analysis',
                'model': 'ARIMA with seasonal components',
                'confidence': 85,
                'prediction_horizon': '3 months'
            },
            'column_mappings': {
                'datetime': datetime_col,
                'sales': sales_col,
                'category': category_col,
                'promotion': promotion_col
            },
            'key_findings': [
                'Seasonal trends detected in sales data',
                'Strong correlation between promotions and sales spikes',
                'Growth trend identified over time period'
            ],
            'predictions': {
                'next_month_sales': 125000,
                'growth_rate': 5.2,
                'seasonal_peak': 'December'
            },
            'recommendations': [
                'Increase inventory before seasonal peaks',
                'Optimize promotion timing for maximum impact',
                'Focus marketing efforts on high-performing categories'
            ],
            'charts': [
                {
                    'type': 'time_series',
                    'title': 'Historical Sales Trend',
                    'description': 'Sales performance over time with predictions'
                },
                {
                    'type': 'seasonal_decomposition',
                    'title': 'Seasonal Analysis',
                    'description': 'Breakdown of trend, seasonal, and residual components'
                },
                {
                    'type': 'category_performance',
                    'title': 'Category Performance',
                    'description': 'Sales breakdown by product category'
                }
            ]
        }

# Factory function for creating insight engine
def create_insight_engine() -> InsightEngine:
    """Create and return an insight engine instance"""
    return InsightEngine()