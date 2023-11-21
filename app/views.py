from django.shortcuts import render

from utils import decorators
from utils import functions

from .models import Game

import json


def index(request):
    return render(request, 'app/index.html', {'logged_in' : functions.logged_in(request)})


@decorators.logged_in(required_permission=2)
def create_object(request):

    Game.objects.create(
        title="Another test",
        description="A cool game set in 1935",
        time=180,
        languages=json.dumps(['english']),
        player_amounts=json.dumps([9, 11]),
    )

    return render(request, 'app/create_object.html')