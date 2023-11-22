from django.db import models

from authentication.models import User

from utils import snowflakes

import json


class Review(models.Model):
    id = snowflakes.SnowflakeIDField(primary_key=True, unique=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE)

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

    reviews = models.ManyToManyField(Review, related_name="user_reviews")

    tested = models.BooleanField(default=False)

    def to_dict(self) -> dict:
        reviews = []

        for review in self.reviews.all():
            reviews.append(review.to_dict())

        return {
            'id' : self.id,
            'title' : self.title,
            'description' : self.description,
            'time' : self.time,
            'languages' : json.loads(self.languages),
            'player_amounts' : json.loads(self.player_amounts),
            'reviews' : reviews,
        }