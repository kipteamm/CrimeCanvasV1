from django.core.cache import cache
from django.http import JsonResponse

from utils import decorators

from app import models

import json


@decorators.authenticated(required=False)
def get_objects(request, page):
    user = request.user

    if page == "testing":
        games = models.Game.objects.filter(tested=False).prefetch_related('reviews')
    
    elif page == "wishlist":
        if not user:
            return JsonResponse({'error' : 'No authentication token provided.'}, status=401)
        
        games = user.wishlist.all()

    elif page == "collection": 
        if not user:
            return JsonResponse({'error' : 'No authentication token provided.'}, status=401)
        
        games = user.collection.all()

    else:
        games = models.Game.objects.filter(tested=True).prefetch_related('reviews')

    objects = []

    for game in games:
        objects.append(game.to_dict(user, False))

    return JsonResponse({'objects' : objects})


@decorators.authenticated(required=False)
def get_object(request, id):
    game = models.Game.objects.filter(id=id).prefetch_related('reviews')

    if not game.exists():
        return JsonResponse({'error' : 'No game with that id.'}, status=404)
    
    game = game.first()

    response = game.to_dict(request.user, True) # type: ignore

    return JsonResponse(response)


@decorators.authenticated()
def toggle_wishlist(request):
    game_id = json.loads(request.body.decode('utf-8')).get('id')

    if not game_id:
        return JsonResponse({'error' : 'No game id provided.'}, status=400)
    
    game = models.Game.objects.get(id=game_id)
    user = request.user

    if user.wishlist.filter(id=game.id).exists():
        user.wishlist.remove(game)
    
    else:
        user.wishlist.add(game)

    return JsonResponse({'success' : True})