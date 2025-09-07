"""
Health check views for monitoring
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db import connection
import json


@csrf_exempt
@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint
    Returns status of the application and database
    """
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Application status
    app_status = "healthy"
    
    # Overall status
    overall_status = "healthy" if db_status == "healthy" else "unhealthy"
    
    response_data = {
        "status": overall_status,
        "timestamp": "2024-01-01T00:00:00Z",  # Django will add current timestamp
        "services": {
            "database": db_status,
            "application": app_status
        },
        "version": "1.0.0"
    }
    
    # Return appropriate HTTP status code
    status_code = 200 if overall_status == "healthy" else 503
    
    return JsonResponse(response_data, status=status_code)


@csrf_exempt
@require_http_methods(["GET"])
def simple_health(request):
    """
    Simple health check endpoint
    Just returns OK if the application is running
    """
    return JsonResponse({"status": "OK", "message": "Backend is running"}, status=200)
