from django.shortcuts import render

from utils import functions


def index(request):
    return render(request, 'app/index.html', {'logged_in' : functions.logged_in(request)})