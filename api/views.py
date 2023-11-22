from django.http import JsonResponse

from app import models


def get_objects(request, page):
    if page == "testing":
        games = models.Game.objects.filter(tested=False)
    else:
        games = models.Game.objects.filter(tested=True)

    objects = []

    for game in games:
        objects.append(game.to_dict())

    return JsonResponse({'objects' : objects})