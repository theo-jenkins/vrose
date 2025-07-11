# Base image
FROM python:3.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# Add /app to the Python module search path
ENV PYTHONPATH=/app

# Copy only requirements first (to cache dependencies)
COPY backend/requirements.txt /app/backend/

# Install dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy the backend directory
COPY backend/ /app/backend/
COPY api/ /app/api/

# Copy manage.py to the container
COPY manage.py /app/

# Expose port and run server
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
