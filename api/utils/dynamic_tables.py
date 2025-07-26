import re
import pandas as pd
import numpy as np
from django.db import connection
from django.core.exceptions import ValidationError
from typing import Dict, List, Tuple, Any
import logging

logger = logging.getLogger(__name__)

class DataTypeDetector:
    """Detect and validate data types for dynamic table creation"""
    
    @staticmethod
    def detect_column_type(series: pd.Series, column_name: str) -> str:
        """
        Detect the most appropriate data type for a pandas Series
        Returns PostgreSQL-compatible data type
        """
        try:
            # Remove null values for type detection
            non_null_series = series.dropna()
            
            if len(non_null_series) == 0:
                logger.info(f"Column '{column_name}' is empty, defaulting to TEXT")
                return 'TEXT'  # Default for empty columns
            
            logger.debug(f"Detecting type for column '{column_name}' with {len(non_null_series)} non-null values")
            
            # Try integer first (most restrictive)
            if DataTypeDetector._is_integer(non_null_series):
                logger.debug(f"Column '{column_name}' detected as INTEGER")
                return 'INTEGER'
            
            # Try float
            if DataTypeDetector._is_float(non_null_series):
                logger.debug(f"Column '{column_name}' detected as DECIMAL")
                return 'DECIMAL(15,6)'
            
            # Try boolean (before date/timestamp to catch true/false strings)
            if DataTypeDetector._is_boolean(non_null_series):
                logger.debug(f"Column '{column_name}' detected as BOOLEAN")
                return 'BOOLEAN'
            
            # Try timestamp first (more specific than date)
            if DataTypeDetector._is_timestamp(non_null_series):
                logger.debug(f"Column '{column_name}' detected as TIMESTAMP")
                return 'TIMESTAMP'
            
            # Try date
            if DataTypeDetector._is_date(non_null_series):
                logger.debug(f"Column '{column_name}' detected as DATE")
                return 'DATE'
            
            # Default to text with appropriate length
            max_length = DataTypeDetector._get_max_text_length(non_null_series)
            if max_length <= 255:
                detected_type = f'VARCHAR({max(max_length * 2, 50)})'  # Double length for safety
                logger.debug(f"Column '{column_name}' detected as {detected_type}")
                return detected_type
            else:
                logger.debug(f"Column '{column_name}' detected as TEXT (max_length: {max_length})")
                return 'TEXT'
                
        except Exception as e:
            logger.warning(f"Error detecting type for column '{column_name}': {str(e)}, defaulting to TEXT")
            return 'TEXT'
    
    @staticmethod
    def _is_integer(series: pd.Series) -> bool:
        """Check if series can be converted to integer"""
        try:
            # Remove null values for testing
            non_null_series = series.dropna()
            if len(non_null_series) == 0:
                return False
            
            # Convert to string to check for date-like patterns that should NOT be integers
            str_series = non_null_series.astype(str)
            
            # Exclude values that look like dates (common date patterns)
            date_like_patterns = [
                r'\d{1,2}/\d{1,2}/\d{4}',  # MM/DD/YYYY or DD/MM/YYYY
                r'\d{4}-\d{1,2}-\d{1,2}',  # YYYY-MM-DD
                r'\d{1,2}-\d{1,2}-\d{4}',  # MM-DD-YYYY or DD-MM-YYYY
                r'\d{1,2}\.\d{1,2}\.\d{4}', # DD.MM.YYYY
                r'\d{4}/\d{1,2}/\d{1,2}'   # YYYY/MM/DD
            ]
            
            # If any values match date patterns, this is likely not an integer column
            for pattern in date_like_patterns:
                if str_series.str.match(pattern).any():
                    logger.debug(f"Rejecting integer detection - found date-like pattern: {pattern}")
                    return False
            
            # Convert to numeric first, handling strings
            numeric_series = pd.to_numeric(non_null_series, errors='coerce')
            
            # Check if most values were successfully converted
            success_rate = numeric_series.notna().sum() / len(non_null_series)
            if success_rate < 0.8:  # 80% success rate
                return False
            
            # Check if all numeric values are integers (no decimal parts)
            valid_numeric = numeric_series.dropna()
            is_integer = (valid_numeric == valid_numeric.astype(int)).all()
            
            if is_integer:
                logger.debug(f"Integer detection successful with {success_rate:.2%} success rate")
            
            return is_integer
            
        except (ValueError, TypeError) as e:
            logger.debug(f"Integer detection failed: {str(e)}")
            return False
    
    @staticmethod
    def _is_float(series: pd.Series) -> bool:
        """Check if series can be converted to float"""
        try:
            # Convert to numeric first
            numeric_series = pd.to_numeric(series, errors='coerce')
            
            # Check if most values were successfully converted
            success_rate = numeric_series.notna().sum() / len(series)
            return success_rate >= 0.8  # 80% success rate
            
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def _is_boolean(series: pd.Series) -> bool:
        """Check if series represents boolean values"""
        try:
            # Get unique non-null values and convert to lowercase strings
            non_null_series = series.dropna()
            if len(non_null_series) == 0:
                return False
                
            unique_values = set(str(v).lower().strip() for v in non_null_series.unique())
            
            # Remove empty strings
            unique_values = {v for v in unique_values if v}
            
            boolean_values = {
                'true', 'false', '1', '0', 'yes', 'no', 't', 'f', 'y', 'n',
                'on', 'off', 'enabled', 'disabled'
            }
            
            # Must have at least 2 unique values and all must be boolean-like
            return len(unique_values) >= 1 and unique_values.issubset(boolean_values)
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def _is_date(series: pd.Series) -> bool:
        """Check if series can be converted to date"""
        try:
            # Remove null values for testing
            non_null_series = series.dropna()
            if len(non_null_series) == 0:
                return False
            
            # Convert to string first to handle mixed types
            str_series = non_null_series.astype(str)
            
            # Check for obvious date patterns first
            date_patterns = [
                r'\d{1,2}/\d{1,2}/\d{4}',  # MM/DD/YYYY or DD/MM/YYYY
                r'\d{4}-\d{1,2}-\d{1,2}',  # YYYY-MM-DD
                r'\d{1,2}-\d{1,2}-\d{4}',  # MM-DD-YYYY or DD-MM-YYYY
                r'\d{1,2}\.\d{1,2}\.\d{4}' # DD.MM.YYYY
            ]
            
            # Check if any values match common date patterns
            has_date_pattern = False
            for pattern in date_patterns:
                if str_series.str.match(pattern).any():
                    has_date_pattern = True
                    break
            
            if not has_date_pattern:
                return False
            
            # Try common date formats first to avoid warnings
            common_date_formats = [
                '%d/%m/%Y', '%m/%d/%Y', '%Y-%m-%d', '%Y-%m-%d %H:%M:%S',
                '%m-%d-%Y', '%d-%m-%Y', '%Y/%m/%d', '%d.%m.%Y'
            ]
            
            # Test a sample of the data to avoid performance issues
            test_series = str_series.head(min(100, len(str_series)))
            
            # Check if any common date patterns exist
            for fmt in common_date_formats:
                try:
                    parsed_dates = pd.to_datetime(test_series, format=fmt, errors='coerce')
                    success_rate = parsed_dates.notna().sum() / len(parsed_dates)
                    if success_rate > 0.8:  # 80% success rate
                        logger.debug(f"Date format {fmt} matched with {success_rate:.2%} success rate")
                        return True
                except (ValueError, TypeError):
                    continue
            
            # Last resort: try inference with warnings suppressed
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                result = pd.to_datetime(test_series, errors='coerce', infer_datetime_format=True)
                success_rate = result.notna().sum() / len(result)
                if success_rate > 0.8:  # 80% success rate
                    logger.debug(f"Date inference matched with {success_rate:.2%} success rate")
                    return True
            
            return False
            
        except (ValueError, TypeError) as e:
            logger.debug(f"Date detection failed: {str(e)}")
            return False
    
    @staticmethod
    def _is_timestamp(series: pd.Series) -> bool:
        """Check if series can be converted to timestamp"""
        try:
            # Try common timestamp formats first
            common_timestamp_formats = [
                '%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M:%S.%f',
                '%m/%d/%Y %H:%M:%S', '%d/%m/%Y %H:%M:%S',
                '%Y-%m-%dT%H:%M:%S', '%Y-%m-%dT%H:%M:%SZ',
                '%Y-%m-%d %H:%M', '%m/%d/%Y %H:%M'
            ]
            
            # Convert to string first
            str_series = series.astype(str)
            
            # Check for timestamp patterns (must have time component)
            has_time_pattern = str_series.str.contains(
                r'\d{1,2}:\d{2}', regex=True, na=False
            ).any()
            
            if not has_time_pattern:
                return False
            
            # Try specific formats first
            for fmt in common_timestamp_formats:
                try:
                    pd.to_datetime(str_series, format=fmt, errors='raise')
                    return True
                except (ValueError, TypeError):
                    continue
            
            # Last resort with warnings suppressed
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                result = pd.to_datetime(str_series, errors='coerce', infer_datetime_format=True)
                return result.notna().sum() > len(result) * 0.8  # 80% success rate
            
        except (ValueError, TypeError):
            return False
    
    @staticmethod
    def _get_max_text_length(series: pd.Series) -> int:
        """Get maximum string length in series"""
        return max(len(str(v)) for v in series)

class ColumnNameSanitizer:
    """Sanitize column names for database compatibility"""
    
    @staticmethod
    def sanitize_column_name(name: str) -> str:
        """
        Convert column name to database-safe format
        - Remove special characters
        - Replace spaces with underscores
        - Ensure starts with letter
        - Handle reserved keywords
        """
        # Convert to lowercase and replace spaces/special chars
        sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', str(name).lower())
        
        # Remove multiple consecutive underscores
        sanitized = re.sub(r'_+', '_', sanitized)
        
        # Remove leading/trailing underscores
        sanitized = sanitized.strip('_')
        
        # Ensure starts with letter
        if sanitized and not sanitized[0].isalpha():
            sanitized = f'col_{sanitized}'
        
        # Handle empty names
        if not sanitized:
            sanitized = 'unnamed_column'
        
        # Handle reserved keywords and system columns
        reserved_keywords = {
            'select', 'from', 'where', 'insert', 'update', 'delete', 'create', 'drop',
            'table', 'index', 'user', 'group', 'order', 'by', 'group', 'having',
            'union', 'join', 'inner', 'outer', 'left', 'right', 'on', 'as',
            # System columns to avoid conflicts
            '__sys_id', '__sys_created_at', '__sys_updated_at', 'id', 'created_at', 'updated_at'
        }
        
        if sanitized in reserved_keywords:
            sanitized = f'{sanitized}_col'
        
        # Ensure length limit
        if len(sanitized) > 60:
            sanitized = sanitized[:60]
        
        return sanitized
    
    @staticmethod
    def create_column_mapping(original_columns: List[str]) -> Dict[str, str]:
        """
        Create mapping from original column names to sanitized names
        Handles duplicate names by adding suffixes
        Avoids conflicts with system columns
        """
        mapping = {}
        used_names = set()
        
        # Reserve system column names to avoid conflicts
        reserved_system_names = {'__sys_id', '__sys_created_at', '__sys_updated_at'}
        used_names.update(reserved_system_names)
        
        for original in original_columns:
            sanitized = ColumnNameSanitizer.sanitize_column_name(original)
            
            # Handle duplicates and system column conflicts
            if sanitized in used_names:
                counter = 1
                base_name = sanitized
                while f"{base_name}_{counter}" in used_names:
                    counter += 1
                sanitized = f"{base_name}_{counter}"
            
            mapping[original] = sanitized
            used_names.add(sanitized)
        
        return mapping

class DynamicTableManager:
    """Manage creation and manipulation of dynamic user data tables"""
    
    @staticmethod
    def create_table(table_name: str, column_definitions: Dict[str, str]) -> bool:
        """
        Create a new table with specified columns and types
        
        Args:
            table_name: Name of the table to create
            column_definitions: Dict mapping column names to SQL types
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with connection.cursor() as cursor:
                # Build CREATE TABLE statement
                columns_sql = []
                
                # Add system primary key with unique name to avoid conflicts
                columns_sql.append('__sys_id SERIAL PRIMARY KEY')
                
                # Add user data columns (preserve original structure)
                for col_name, col_type in column_definitions.items():
                    # Ensure column name is quoted and type is valid
                    sanitized_col_name = col_name.replace('"', '""')  # Escape quotes
                    columns_sql.append(f'"{sanitized_col_name}" {col_type}')
                
                # Add system metadata columns with unique names to avoid conflicts
                columns_sql.extend([
                    '__sys_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
                    '__sys_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
                ])
                
                sql = f'''
                CREATE TABLE "{table_name}" (
                    {', '.join(columns_sql)}
                )
                '''
                
                logger.debug(f"Creating table with SQL: {sql}")
                cursor.execute(sql)
                
                # Create indexes for better performance (sanitize index name)
                index_name = f'idx_{table_name}_sys_created_at'.replace('-', '_')
                cursor.execute(f'CREATE INDEX "{index_name}" ON "{table_name}" (__sys_created_at)')
                
                logger.info(f"Successfully created table: {table_name}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to create table {table_name}: {str(e)}")
            return False
    
    @staticmethod
    def drop_table(table_name: str) -> bool:
        """Drop a table if it exists"""
        try:
            with connection.cursor() as cursor:
                cursor.execute(f'DROP TABLE IF EXISTS "{table_name}" CASCADE')
                logger.info(f"Successfully dropped table: {table_name}")
                return True
        except Exception as e:
            logger.error(f"Failed to drop table {table_name}: {str(e)}")
            return False
    
    @staticmethod
    def table_exists(table_name: str) -> bool:
        """Check if a table exists"""
        try:
            with connection.cursor() as cursor:
                cursor.execute('''
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = %s
                    )
                ''', [table_name])
                return cursor.fetchone()[0]
        except Exception as e:
            logger.error(f"Error checking if table exists {table_name}: {str(e)}")
            return False
    
    @staticmethod
    def get_table_info(table_name: str) -> Dict[str, Any]:
        """Get information about a table's structure"""
        try:
            with connection.cursor() as cursor:
                cursor.execute('''
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = %s
                    ORDER BY ordinal_position
                ''', [table_name])
                
                columns = []
                for row in cursor.fetchall():
                    columns.append({
                        'name': row[0],
                        'type': row[1],
                        'nullable': row[2] == 'YES'
                    })
                
                return {
                    'exists': True,
                    'columns': columns
                }
        except Exception as e:
            logger.error(f"Error getting table info for {table_name}: {str(e)}")
            return {'exists': False, 'columns': []}
    
    @staticmethod
    def insert_batch_data(table_name: str, data: List[Dict[str, Any]], column_mapping: Dict[str, str]) -> Tuple[int, List[str]]:
        """
        Insert batch data into table
        
        Args:
            table_name: Target table name
            data: List of dictionaries with data to insert
            column_mapping: Mapping from original to sanitized column names
            
        Returns:
            Tuple of (inserted_count, errors)
        """
        errors = []
        inserted_count = 0
        
        if not data:
            return 0, []
        
        try:
            with connection.cursor() as cursor:
                # Prepare column names (sanitized)
                columns = list(column_mapping.values())
                placeholders = ', '.join(['%s'] * len(columns))
                
                sql = f'''
                INSERT INTO "{table_name}" ({', '.join(f'"{col}"' for col in columns)})
                VALUES ({placeholders})
                '''
                
                # Prepare batch data
                batch_values = []
                for row_data in data:
                    try:
                        row_values = []
                        for original_col, sanitized_col in column_mapping.items():
                            value = row_data.get(original_col)
                            # Convert NaN to None for database
                            if pd.isna(value):
                                value = None
                            row_values.append(value)
                        batch_values.append(row_values)
                    except Exception as e:
                        errors.append(f"Error preparing row data: {str(e)}")
                
                # Execute batch insert
                cursor.executemany(sql, batch_values)
                inserted_count = len(batch_values)
                
        except Exception as e:
            errors.append(f"Database error during batch insert: {str(e)}")
            logger.error(f"Batch insert failed for table {table_name}: {str(e)}")
        
        return inserted_count, errors
    
    @staticmethod
    def validate_table_name(table_name: str) -> bool:
        """Validate that table name is safe for SQL"""
        pattern = r'^[a-zA-Z][a-zA-Z0-9_]*$'
        return bool(re.match(pattern, table_name)) and len(table_name) <= 63
    
    @staticmethod
    def drop_table(table_name: str) -> bool:
        """
        Drop a dynamic table and its associated indexes
        
        Args:
            table_name: Name of the table to drop
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with connection.cursor() as cursor:
                # Drop the table (CASCADE will also drop indexes)
                sql = f'DROP TABLE IF EXISTS "{table_name}" CASCADE'
                logger.debug(f"Dropping table with SQL: {sql}")
                cursor.execute(sql)
                
                logger.info(f"Successfully dropped table: {table_name}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to drop table {table_name}: {str(e)}")
            return False

def analyze_file_for_import(file_path: str, selected_columns: List[str]) -> Dict[str, Any]:
    """
    Analyze file and prepare data for import
    
    Args:
        file_path: Path to the file to analyze
        selected_columns: List of column names selected by user
        
    Returns:
        Dict with analysis results
    """
    try:
        # Read file with minimal parsing to detect raw data types
        if file_path.endswith('.csv'):
            # Read as strings first to analyze raw data
            df_raw = pd.read_csv(file_path, dtype=str, na_filter=False)
            # Then read normally for actual data processing
            df = pd.read_csv(file_path)
        else:
            # Read as strings first to analyze raw data
            df_raw = pd.read_excel(file_path, dtype=str, na_filter=False)
            # Then read normally for actual data processing
            df = pd.read_excel(file_path)
        
        # Filter to selected columns
        available_columns = [col for col in selected_columns if col in df.columns]
        df_filtered = df[available_columns]
        df_raw_filtered = df_raw[available_columns] if all(col in df_raw.columns for col in available_columns) else df_filtered
        
        # Create column mapping
        column_mapping = ColumnNameSanitizer.create_column_mapping(available_columns)
        
        # Detect data types using raw string data first
        column_types = {}
        for original_col in available_columns:
            sanitized_col = column_mapping[original_col]
            # Use raw data for type detection to avoid pandas auto-conversion
            raw_series = df_raw_filtered[original_col].replace('', pd.NA) if original_col in df_raw_filtered.columns else df_filtered[original_col]
            detected_type = DataTypeDetector.detect_column_type(raw_series, original_col)
            column_types[sanitized_col] = detected_type
            logger.info(f"Column '{original_col}' detected as type: {detected_type}")
        
        return {
            'success': True,
            'total_rows': len(df_filtered),
            'column_mapping': column_mapping,
            'column_types': column_types,
            'sample_data': df_filtered.head(5).to_dict('records'),
            'data_frame': df_filtered  # For further processing
        }
        
    except Exception as e:
        logger.error(f"Error analyzing file {file_path}: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }