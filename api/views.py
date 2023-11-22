from django.core.cache import cache
from django.http import JsonResponse

from app import models


def get_objects(request, page):
    cache_key = f'objects_{page}'

    cached = cache.get(cache_key)

    if cached:
        return JsonResponse(cached)

    if page == "testing":
        games = models.Game.objects.filter(tested=False)
        
    else:
        games = models.Game.objects.filter(tested=True)

    objects = []

    for game in games:
        objects.append(game.to_dict())

    cache.set(cache_key, {'objects' : objects}, timeout=600)

    return JsonResponse({'objects' : objects})


def get_object(request, id):
    cache_key = f'object_{id}'

    cached = cache.get(cache_key)

    if cached:
        return JsonResponse(cached)

    game = models.Game.objects.get(id=id)

    response = game.to_dict()

    cache.set(cache_key, response, timeout=600)

    return JsonResponse(response)