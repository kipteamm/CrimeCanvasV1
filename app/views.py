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
        title="A murder mystery title",
        description="A very long and interesting description about the murder mystery",
        time=160,
        languages=json.dumps(['english', 'dutch']),
        player_amounts=json.dumps([9, 11, 13]),
    )

    return render(request, 'app/create_object.html')