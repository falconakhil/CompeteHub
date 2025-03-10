from django.contrib import admin
from .models import Competitor

class CompetitorAdmin(admin.ModelAdmin):
    model=Competitor

admin.site.register(Competitor, CompetitorAdmin)