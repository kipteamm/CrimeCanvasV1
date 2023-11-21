from django.urls import path

from .views import *


urlpatterns = [
    path('', index, name='index'),

    path('create-object', create_object, name='create-object'),
]