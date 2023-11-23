from django.db import models

from utils import snowflakes

import json


class Review(models.Model):
    id = snowflakes.SnowflakeIDField(primary_key=True, unique=True)

    user = models.ForeignKey('authentication.User', on_delete=models.CASCADE)

    story = models.IntegerField(default=1)
    fun = models.IntegerField(default=1)

    def to_dict(self) -> dict:
        return {
            'story' : self.story,
            'fun' : self.fun 
        }


class Game(models.Model):
    id = snowflakes.SnowflakeIDField(primary_key=True, unique=True)

    title = models.CharField(max_length=256)
    description = models.TextField(max_length=5000)

    time = models.IntegerField()

    languages = models.JSONField()
    player_amounts = models.JSONField()
    age = models.IntegerField()
    themes = models.JSONField()

    reviews = models.ManyToManyField(Review, related_name="user_reviews")

    tested = models.BooleanField(default=False)

    def to_dict(self, user=None) -> dict:
        reviews = []

        for review in self.reviews.all():
            reviews.append(review.to_dict())

        wishlisted = False

        if user:
            wishlisted = user.wishlist.filter(id=self.id).exists()

        return {
            'id' : self.id,
            'title' : self.title,
            'description' : self.description,
            'time' : self.time,
            'languages' : json.loads(self.languages),
            'player_amounts' : json.loads(self.player_amounts),
            'age' : f'{self.age}+',
            'themes' : self.themes,
            'reviews' : reviews,
            'wishlisted' : wishlisted
        }