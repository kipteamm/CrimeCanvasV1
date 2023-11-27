from django.http import HttpRequest
from django.urls import resolve

from authentication import models

from app.models import Game, SpecificGame

from hashlib import sha512

from six import text_type

import secrets


def sha256(input: str) -> str:
    return sha512(text_type(input).encode()).hexdigest()


def random_string(amount: int) -> str:
    return secrets.token_hex(amount)


def path_exists(path: str) -> bool:
    try:
        resolve(path)

        return True
    except:
        return False
    

def logged_in(request: HttpRequest) -> bool:
    return models.User.objects.filter(token=request.COOKIES.get('au_id')).exists()


def get_specific_game(game: Game, players: int, language: str, testing: bool) -> SpecificGame:
    specific_game = SpecificGame.objects.filter(game=game, players=players, language=language).select_related('game')

    if not specific_game.exists():
        specific_game = SpecificGame.objects.create(
            game=game, 
            players=players, 
            language=language,
            testing=testing
        )
    
    else:
        specific_game = specific_game.first()
    
    return specific_game # type: ignore
