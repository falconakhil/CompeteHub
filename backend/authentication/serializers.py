import rest_framework.serializers as serializers
from .models import Competitor
from django.contrib.auth.hashers import make_password


class CompetitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Competitor
        fields = ['username','email','password']
        
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super(CompetitorSerializer, self).create(validated_data)