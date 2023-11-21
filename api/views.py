from django.http import JsonResponse

from app import models


def get_objects(request, page):
    games = models.Game.objects.all()

    objects = []

    for game in games:
        objects.append(game.to_dict())

    return JsonResponse({'objects' : objects})