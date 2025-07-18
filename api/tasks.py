import os
import pandas as pd
import numpy as np
import logging
from datetime import timedelta
from typing import Dict, List, Any

from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.db import transaction

from .models import ImportedDataMetadata, ImportTask, TemporaryUpload
from .utils.dynamic_tables import DynamicTableManager, analyze_file_for_import

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def import_data_task(self, data_table_id: str):
    """
    Background task to import data from uploaded file into dynamic table
    
    Args:
        data_table_id: UUID of the ImportedDataMetadata to process
    """
    try:
        # Get the data table record
        data_table = ImportedDataMetadata.objects.get(id=data_table_id)
        
        # Create import task tracking record
        import_task = ImportTask.objects.create(
            user=data_table.user,
            data_table=data_table,
            celery_task_id=self.request.id,
            task_name=f"Import {data_table.display_name}",
            status='running'
        )
        
        # Update data table status
        data_table.import_status = 'processing'
        data_table.celery_task_id = self.request.id
        data_table.save()
        
        # Start timing
        import_task.started_at = timezone.now()
        import_task.save()
        
        logger.info(f"Starting data import for table {data_table.table_name}")
        
        # Get file path
        file_path = os.path.join(settings.MEDIA_ROOT, data_table.processed_upload.processed_file_path)
        
        # Read and process the file
        progress_data = _process_file_import(
            file_path=file_path,
            data_table=data_table,
            import_task=import_task,
            celery_task=self
        )
        
        if progress_data['success']:
            # Mark as completed
            data_table.import_status = 'completed'
            data_table.processed_rows = progress_data['total_imported']
            data_table.completed_at = timezone.now()
            data_table.save()
            
            import_task.status = 'completed'
            import_task.completed_at = timezone.now()
            import_task.progress_message = f"Successfully imported {progress_data['total_imported']} rows"
            import_task.save()
            
            logger.info(f"Data import completed for table {data_table.table_name}: {progress_data['total_imported']} rows")
            
            return {
                'success': True,
                'message': f"Successfully imported {progress_data['total_imported']} rows",
                'total_rows': progress_data['total_imported']
            }
        else:
            # Mark as failed
            data_table.import_status = 'failed'
            data_table.error_message = progress_data.get('error', 'Unknown error during import')
            data_table.save()
            
            import_task.status = 'failed'
            import_task.error_message = progress_data.get('error', 'Unknown error during import')
            import_task.completed_at = timezone.now()
            import_task.save()
            
            logger.error(f"Data import failed for table {data_table.table_name}: {progress_data.get('error')}")
            
            return {
                'success': False,
                'error': progress_data.get('error', 'Unknown error during import')
            }
            
    except ImportedDataMetadata.DoesNotExist:
        logger.error(f"ImportedDataMetadata not found: {data_table_id}")
        return {'success': False, 'error': 'Data table not found'}
    
    except Exception as e:
        logger.error(f"Unexpected error in import_data_task: {str(e)}")
        
        # Try to update status if possible
        try:
            data_table = ImportedDataMetadata.objects.get(id=data_table_id)
            data_table.import_status = 'failed'
            data_table.error_message = f"Unexpected error: {str(e)}"
            data_table.save()
        except:
            pass
        
        return {'success': False, 'error': f"Unexpected error: {str(e)}"}

def _process_file_import(file_path: str, data_table: ImportedDataMetadata, import_task: ImportTask, celery_task) -> Dict[str, Any]:
    """
    Process file import with progress tracking
    
    Args:
        file_path: Path to the file to import
        data_table: ImportedDataMetadata instance
        import_task: ImportTask instance for tracking
        celery_task: Celery task instance for progress updates
    
    Returns:
        Dict with success status and results
    """
    try:
        # Read the file
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            df = pd.read_excel(file_path)
        
        # Filter to selected columns
        selected_columns = data_table.selected_columns
        available_columns = [col for col in selected_columns if col in df.columns]
        
        if not available_columns:
            return {'success': False, 'error': 'No valid columns found in file'}
        
        df_filtered = df[available_columns]
        
        # Remove completely empty rows
        df_filtered = df_filtered.dropna(how='all')
        
        total_rows = len(df_filtered)
        
        # Update total rows if different from expected
        if data_table.total_rows != total_rows:
            data_table.total_rows = total_rows
            data_table.save()
        
        import_task.total_steps = total_rows
        import_task.save()
        
        # Process in batches for memory efficiency and progress tracking
        batch_size = 100
        total_imported = 0
        errors = []
        
        for start_idx in range(0, total_rows, batch_size):
            end_idx = min(start_idx + batch_size, total_rows)
            batch_df = df_filtered.iloc[start_idx:end_idx]
            
            # Convert DataFrame to list of dictionaries
            batch_data = batch_df.to_dict('records')
            
            # Clean and prepare data
            cleaned_data = []
            for row in batch_data:
                cleaned_row = {}
                for original_col, value in row.items():
                    # Handle NaN values
                    if pd.isna(value):
                        cleaned_row[original_col] = None
                    else:
                        # Convert numpy types to Python types
                        if isinstance(value, (np.integer, np.floating)):
                            cleaned_row[original_col] = value.item()
                        else:
                            cleaned_row[original_col] = str(value) if value is not None else None
                
                cleaned_data.append(cleaned_row)
            
            # Insert batch into database
            try:
                with transaction.atomic():
                    inserted_count, batch_errors = DynamicTableManager.insert_batch_data(
                        table_name=data_table.table_name,
                        data=cleaned_data,
                        column_mapping=data_table.column_mapping
                    )
                    
                    total_imported += inserted_count
                    errors.extend(batch_errors)
                    
                    # Update progress
                    data_table.processed_rows = total_imported
                    data_table.save()
                    
                    import_task.current_step = end_idx
                    import_task.progress_message = f"Imported {total_imported} of {total_rows} rows"
                    import_task.save()
                    
                    # Update Celery task progress
                    celery_task.update_state(
                        state='PROGRESS',
                        meta={
                            'current': total_imported,
                            'total': total_rows,
                            'message': f"Importing row {total_imported} of {total_rows}"
                        }
                    )
                    
                    logger.info(f"Batch {start_idx}-{end_idx} imported successfully: {inserted_count} rows")
                    
            except Exception as e:
                error_msg = f"Error importing batch {start_idx}-{end_idx}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
                
                # Continue with next batch rather than failing completely
                continue
        
        if errors:
            logger.warning(f"Import completed with {len(errors)} errors: {errors}")
        
        return {
            'success': True,
            'total_imported': total_imported,
            'errors': errors
        }
        
    except Exception as e:
        logger.error(f"Error in _process_file_import: {str(e)}")
        return {
            'success': False,
            'error': f"File processing error: {str(e)}"
        }

@shared_task
def cleanup_expired_files():
    """
    Periodic task to clean up expired temporary files
    """
    from .utils.file_handlers import cleanup_expired_files
    
    try:
        cleaned_count = cleanup_expired_files()
        logger.info(f"Cleaned up {cleaned_count} expired files")
        
        return {
            'success': True,
            'cleaned_files': cleaned_count
        }
    except Exception as e:
        logger.error(f"Error in cleanup_expired_files task: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def cleanup_old_import_tasks():
    """
    Clean up old import task records (older than 30 days)
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=30)
        
        # Delete old completed/failed import tasks
        deleted_count = ImportTask.objects.filter(
            completed_at__lt=cutoff_date,
            status__in=['completed', 'failed', 'cancelled']
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old import task records")
        
        return {
            'success': True,
            'deleted_tasks': deleted_count
        }
    except Exception as e:
        logger.error(f"Error in cleanup_old_import_tasks: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }

@shared_task
def cancel_import_task(data_table_id: str):
    """
    Cancel a running import task
    """
    try:
        data_table = ImportedDataMetadata.objects.get(id=data_table_id)
        
        # Update status
        data_table.import_status = 'cancelled'
        data_table.save()
        
        # Update import task if exists
        try:
            import_task = ImportTask.objects.get(
                data_table=data_table,
                status__in=['pending', 'running']
            )
            import_task.status = 'cancelled'
            import_task.completed_at = timezone.now()
            import_task.save()
        except ImportTask.DoesNotExist:
            pass
        
        logger.info(f"Import task cancelled for table {data_table.table_name}")
        
        return {'success': True, 'message': 'Import task cancelled'}
        
    except ImportedDataMetadata.DoesNotExist:
        return {'success': False, 'error': 'Data table not found'}
    except Exception as e:
        logger.error(f"Error cancelling import task: {str(e)}")
        return {'success': False, 'error': str(e)}