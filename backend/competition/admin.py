from django.contrib import admin
from .models import Contest, Genre

# Register Genre model
@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

# Register your models here.
@admin.register(Contest)
class ContestAdmin(admin.ModelAdmin):
    list_display = ['name', 'starting_time', 'get_duration', 'get_genres', 'creator']
    list_filter = ['starting_time', 'genres']
    search_fields = ['name', 'description']
    date_hierarchy = 'starting_time'
    readonly_fields = ['creator']
    filter_horizontal = ['genres']
    
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if not request.user.is_superuser:
            return queryset.filter(creator=request.user)
        return queryset
    
    def get_duration(self, obj):
        """Format duration in a human-readable format"""
        total_seconds = obj.duration.total_seconds()
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        return f"{hours}h {minutes}m"
    get_duration.short_description = "Duration"
    
    def get_genres(self, obj):
        """Return comma-separated list of genres"""
        return ", ".join([genre.name for genre in obj.genres.all()[:3]])
    get_genres.short_description = "Genres"
    
    def save_model(self, request, obj, form, change):
        """Set creator when saving the model"""
        if not change:  # Only set creator when creating, not updating
            obj.creator = request.user
        super().save_model(request, obj, form, change)