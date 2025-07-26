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

from .models import UserDataset, ImportTask, TemporaryUpload
from .utils.dynamic_tables import DynamicTableManager, analyze_file_for_import

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def import_data_task(self, dataset_id: str):
    """
    Background task to import data from uploaded file into dynamic table
    
    Args:
        dataset_id: UUID of the UserDataset to process
    """
    try:
        # Get the dataset record
        dataset = UserDataset.objects.get(id=dataset_id)
        
        # Create import task tracking record
        import_task = ImportTask.objects.create(
            user=dataset.user,
            dataset=dataset,
            celery_task_id=str(self.request.id),
            task_name=f"Import {dataset.name}",
            status='running'
        )
        
        # Update dataset status
        dataset.status = 'importing'
        dataset.celery_task_id = str(self.request.id)
        dataset.save()
        
        # Start timing
        import_task.started_at = timezone.now()
        import_task.save()
        
        logger.info(f"Starting data import for table {dataset.table_name}")
        
        # Get file path from the temporary upload
        temp_upload = dataset.temporary_upload
        if not temp_upload:
            raise ValueError("No temporary upload associated with this dataset")
        file_path = os.path.join(settings.MEDIA_ROOT, temp_upload.file_path)
        
        # Triggers the worker function to handle the data processing
        progress_data = _process_file_import(
            file_path=file_path,
            dataset=dataset,
            import_task=import_task,
            celery_task=self
        )
        
        if progress_data['success']:
            # Mark as completed
            dataset.status = 'active'
            dataset.total_rows = progress_data['total_imported']
            dataset.imported_at = timezone.now()
            dataset.save()
            
            import_task.status = 'completed'
            import_task.completed_at = timezone.now()
            import_task.progress_message = f"Successfully imported {progress_data['total_imported']} rows"
            import_task.save()
            
            # Clean up temporary upload data after successful import
            try:
                temp_upload = dataset.temporary_upload
                if temp_upload:
                    # Delete temporary file
                    temp_file_path = os.path.join(settings.MEDIA_ROOT, temp_upload.file_path)
                    if os.path.exists(temp_file_path):
                        os.remove(temp_file_path)
                        logger.info(f"Deleted temporary file: {temp_file_path}")
                    
                    # Delete temporary upload record
                    temp_upload.delete()
                    logger.info(f"Deleted temporary upload record for {dataset.table_name}")
            except Exception as e:
                # Don't fail the import if cleanup fails
                logger.warning(f"Failed to cleanup temporary upload for {dataset.table_name}: {str(e)}")
            
            logger.info(f"Data import completed for table {dataset.table_name}: {progress_data['total_imported']} rows")
            
            return {
                'success': True,
                'message': f"Successfully imported {progress_data['total_imported']} rows",
                'total_rows': progress_data['total_imported']
            }
        else:
            # Mark as failed
            dataset.status = 'failed'
            dataset.error_details = {'error': progress_data.get('error', 'Unknown error during import')}
            dataset.save()
            
            import_task.status = 'failed'
            import_task.error_message = progress_data.get('error', 'Unknown error during import')
            import_task.completed_at = timezone.now()
            import_task.save()
            
            logger.error(f"Data import failed for table {dataset.table_name}: {progress_data.get('error')}")
            
            return {
                'success': False,
                'error': progress_data.get('error', 'Unknown error during import')
            }
            
    except UserDataset.DoesNotExist:
        logger.error(f"UserDataset not found: {dataset_id}")
        return {'success': False, 'error': 'Dataset not found'}
    
    except Exception as e:
        logger.error(f"Unexpected error in import_data_task: {str(e)}")
        
        # Try to update status if possible
        try:
            dataset = UserDataset.objects.get(id=dataset_id)
            dataset.status = 'failed'
            dataset.error_details = {'error': f"Unexpected error: {str(e)}"}
            dataset.save()
        except:
            pass
        
        return {'success': False, 'error': f"Unexpected error: {str(e)}"}

def _process_file_import(file_path: str, dataset: UserDataset, import_task: ImportTask, celery_task) -> Dict[str, Any]:
    """
    Process file import with progress tracking
    
    Args:
        file_path: Path to the file to import
        dataset: UserDataset instance
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
        selected_columns = dataset.selected_columns
        available_columns = [col for col in selected_columns if col in df.columns]
        
        if not available_columns:
            return {'success': False, 'error': 'No valid columns found in file'}
        
        df_filtered = df[available_columns]
        
        # Remove completely empty rows
        df_filtered = df_filtered.dropna(how='all')
        
        total_rows = len(df_filtered)
        
        # Update total rows if different from expected
        if dataset.total_rows != total_rows:
            dataset.total_rows = total_rows
            dataset.save()
        
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
                        elif isinstance(value, pd.Timestamp):
                            # Keep timestamps as timestamps for proper database insertion
                            cleaned_row[original_col] = value.to_pydatetime() if pd.notna(value) else None
                        elif hasattr(value, 'date') and callable(getattr(value, 'date')):
                            # Handle datetime objects
                            cleaned_row[original_col] = value
                        else:
                            cleaned_row[original_col] = str(value) if value is not None else None
                
                cleaned_data.append(cleaned_row)
            
            # Insert batch into database
            try:
                with transaction.atomic():
                    inserted_count, batch_errors = DynamicTableManager.insert_batch_data(
                        table_name=dataset.table_name,
                        data=cleaned_data,
                        column_mapping=dataset.column_mapping
                    )
                    
                    total_imported += inserted_count
                    errors.extend(batch_errors)
                    
                    # Update progress
                    dataset.total_rows = total_imported
                    dataset.save()
                    
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
    Periodic task to clean up expired temporary files and database records
    """
    try:
        # Find expired uploads
        expired_uploads = TemporaryUpload.objects.filter(
            expires_at__lt=timezone.now(),
            status__in=['uploaded', 'validated', 'failed']
        )
        
        cleaned_files = 0
        deleted_records = 0
        
        for upload in expired_uploads:
            try:
                # Delete physical file if it exists
                temp_file_path = os.path.join(settings.MEDIA_ROOT, upload.file_path)
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)
                    cleaned_files += 1
                    logger.info(f"Deleted expired file: {temp_file_path}")
                
                # Delete the database record
                upload.delete()
                deleted_records += 1
                logger.info(f"Deleted expired upload record: {upload.original_filename}")
                
            except Exception as e:
                logger.error(f"Error cleaning up expired upload {upload.original_filename}: {str(e)}")
        
        logger.info(f"Cleanup completed: {cleaned_files} files deleted, {deleted_records} records removed")
        
        return {
            'success': True,
            'cleaned_files': cleaned_files,
            'deleted_records': deleted_records
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
def cancel_import_task(dataset_id: str):
    """
    Cancel a running import task
    """
    try:
        dataset = UserDataset.objects.get(id=dataset_id)
        
        # Update status
        dataset.status = 'failed'
        dataset.save()
        
        # Update import task if exists
        try:
            import_task = ImportTask.objects.get(
                dataset=dataset,
                status__in=['pending', 'running']
            )
            import_task.status = 'cancelled'
            import_task.completed_at = timezone.now()
            import_task.save()
        except ImportTask.DoesNotExist:
            pass
        
        logger.info(f"Import task cancelled for table {dataset.table_name}")
        
        return {'success': True, 'message': 'Import task cancelled'}
        
    except UserDataset.DoesNotExist:
        return {'success': False, 'error': 'Dataset not found'}
    except Exception as e:
        logger.error(f"Error cancelling import task: {str(e)}")
        return {'success': False, 'error': str(e)}