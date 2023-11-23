# decorators.py

from django.shortcuts import redirect
from django.http import HttpRequest, JsonResponse

from authentication import models

from . import permissions


def logged_in(required_permission: int = 1):
    def decorator(view_func):
        def _wrapped_view(request: HttpRequest, *args, **kwargs):

            if models.User.objects.filter(token=request.COOKIES.get('au_id')).exists():
                user = models.User.objects.get(token=request.COOKIES.get('au_id'))

                if not permissions.Permissions(permissions=required_permission) in permissions.Permissions(permissions=user.permissions):
                    return redirect('/')

                request.user = user  # type: ignore

                return view_func(request, *args, **kwargs)
            
            else:
                next_url = request.get_full_path()

                if next_url:
                    next_url = f'?next={next_url}'

                return redirect(f'/login{next_url}')

        return _wrapped_view

    return decorator


def authenticated(required: bool=True):
    def decorator(view_func):
        def _wrapped_view(request: HttpRequest, *args, **kwargs):
            
            token = request.META.get('HTTP_AUTHORIZATION')

            if not token and required:
                return JsonResponse({'error' : 'No authentication token provided.'}, status=401)

            user = models.User.objects.filter(token=token)

            if not user.exists() and required:
                return JsonResponse({'error' : 'No authentication token provided.'}, status=401)
            
            request.user = user.first() # type: ignore

            return view_func(request, *args, **kwargs)
        
        return _wrapped_view

    return decorator