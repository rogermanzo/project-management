from django.urls import path
from . import views, notification_views

app_name = 'projects'

urlpatterns = [
    # Proyectos
    path('', views.ProjectListView.as_view(), name='project_list'),
    path('<int:pk>/', views.ProjectDetailView.as_view(), name='project_detail'),
    path('<int:project_id>/stats/', views.project_stats, name='project_stats'),
    
    # Tareas
    path('tasks/', views.TaskListView.as_view(), name='task_list'),
    path('tasks/<int:pk>/', views.TaskDetailView.as_view(), name='task_detail'),
    path('tasks/<int:task_id>/status/', views.update_task_status, name='update_task_status'),
    path('<int:project_id>/tasks/', views.TaskListView.as_view(), name='project_tasks'),
    path('my-tasks/', views.user_tasks, name='user_tasks'),
    
    # Miembros de proyecto
    path('<int:project_id>/members/', views.project_members, name='project_members'),
    path('<int:project_id>/members/add/', views.add_project_member, name='add_project_member'),
    path('<int:project_id>/members/<int:member_id>/remove/', views.remove_project_member, name='remove_project_member'),
    path('<int:project_id>/members/<int:user_id>/remove-user/', views.remove_user_from_project, name='remove_user_from_project'),
    
    # Comentarios de tareas
    path('tasks/<int:task_id>/comments/', views.task_comments, name='task_comments'),
    path('tasks/<int:task_id>/comments/create/', views.create_task_comment, name='create_task_comment'),
    path('comments/<int:comment_id>/update/', views.update_task_comment, name='update_task_comment'),
    path('comments/<int:comment_id>/delete/', views.delete_task_comment, name='delete_task_comment'),
    
    # Notificaciones
    path('notifications/', notification_views.NotificationListView.as_view(), name='notification_list'),
    path('notifications/unread-count/', notification_views.unread_notifications_count, name='unread_notifications_count'),
    path('notifications/<int:notification_id>/mark-read/', notification_views.mark_notification_as_read, name='mark_notification_as_read'),
    path('notifications/mark-all-read/', notification_views.mark_all_as_read, name='mark_all_as_read'),
]
