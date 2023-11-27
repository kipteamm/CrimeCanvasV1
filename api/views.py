from django.core.cache import cache
from django.http import JsonResponse

from utils import decorators, functions

from app import models

import json
import time


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
    body = json.loads(request.body.decode('utf-8'))

    game_id = body.get('id')

    if not game_id:
        return JsonResponse({'error' : 'No game id provided.'}, status=400)
    
    game = models.Game.objects.get(id=game_id)
    user = request.user

    if user.wishlist.filter(id=game.id).exists():
        user.wishlist.remove(game)
    
    else:
        user.wishlist.add(game)

    return JsonResponse({'success' : True})


@decorators.authenticated()
def test_game(request):
    body = json.loads(request.body.decode('utf-8'))

    game_id = body.get('id')

    if not game_id:
        return JsonResponse({'error' : 'No game id provided.'}, status=400)
    
    game = models.Game.objects.get(id=game_id)
    user = request.user

    specific_game = functions.get_specific_game(game, body.get('players'), body.get('language'), True)

    if user.collection.filter(id=specific_game.id).exists():
        return JsonResponse({'error' : 'You are already testing this game.'}, status=403)

    if time.time() - user.last_test_timestamp < 2628000:
        return JsonResponse({'error' : 'You have to wait 30 days before you can test again.'}, status=403)
    
    user.last_test_timestamp = time.time()
    user.collection.add(specific_game)
    user.save()

    return JsonResponse({'success' : True})


@decorators.authenticated()
def add_review(request):
    body = json.loads(request.body.decode('utf-8'))

    game_id = body.get('id')

    if not game_id:
        return JsonResponse({'error' : 'No game id provided.'}, status=400)

    game = models.Game.objects.get(id=game_id)
    user = request.user

    if not user.collection.filter(id=game.id).exists():
        return JsonResponse({'error' : 'You have to test the game before you can review it.'}, status=403)
    
    if game.reviews.filter(user=user).exists():
        return JsonResponse({'error' : 'You have already reviewed this game.'}, status=403)

    ratings = body.get('ratings')

    if not ratings:
        return JsonResponse({'error' : 'No ratings provided.'}, status=400)

    review = body.get('review')

    review = models.Review.objects.create(
        user=user,  
        story=ratings[0],
        gameplay=ratings[1],
        difficulty=ratings[2],
        enjoyment=ratings[3],
        review=review,
        creation_timestamp=time.time(),
    )

    game.reviews.add(review)

    return JsonResponse(review.to_dict())


@decorators.authenticated(required=False)
def get_reviews(request, id):
    game = models.Game.objects.filter(id=id).prefetch_related('reviews')

    if not game.exists():
        return JsonResponse({'error' : 'No game with that id.'}, status=404)
    
    cache_key = f'reviews_{id}'
    cache_data = cache.get(cache_key)

    if cache_data:
        return JsonResponse(cache_data)

    game = game.first()

    response = []

    for review in game.reviews.all(): # type: ignore
        response.append(review.to_dict(request.user))

    data = {'reviews' : response}

    cache.set(cache_key, cache_data, timeout=600)

    return JsonResponse(data)


@decorators.authenticated()
def add_cart(request):
    body = json.loads(request.body.decode('utf-8'))

    game_id = body.get('id')

    if not game_id:
        return JsonResponse({'error' : 'No game id provided.'}, status=400)

    game = models.Game.objects.get(id=game_id)
    user = request.user

    specific_game = functions.get_specific_game(game, body.get('players'), body.get('language'), False)

    if user.cart.filter(id=specific_game.id).exists():
        return JsonResponse({'error' : 'You have already added this game to your cart.'}, status=403)
    
    user.cart.add(specific_game)

    return JsonResponse({'success' : True})