from django.urls import path

from .views import *


urlpatterns = [
    path('objects/<str:page>', get_objects, name='get_objects'),
]