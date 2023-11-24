from django.db.models.query import QuerySet
from django.db import models

from utils import snowflakes

import json


def overall_ratings(reviews: QuerySet, rating_type: str) -> float:
    individual_ratings = [getattr(review, rating_type) for review in reviews]

    if len(individual_ratings) == 0:
        return 0

    """
    if rating_type == "total":
        individual_ratings = [review.overall_rating() for review in reviews]

    elif rating_type == "story":
        individual_ratings = [review.story for review in reviews]
    
    elif rating_type == "gameplay":
        individual_ratings = [review.gameplay for review in reviews]
    
    elif rating_type == "difficulty":
        individual_ratings = [review.difficulty for review in reviews]

    else:
        individual_ratings = [review.enjoyment for review in reviews]
    """

    overall_rating = sum(individual_ratings) / len(individual_ratings)

    return round(overall_rating, 2)


class Review(models.Model):
    id = snowflakes.SnowflakeIDField(primary_key=True, unique=True)

    user = models.ForeignKey('authentication.User', on_delete=models.CASCADE)

    story = models.IntegerField(default=1)
    gameplay = models.IntegerField(default=1)
    difficulty = models.IntegerField(default=1)
    enjoyment = models.IntegerField(default=1)

    review = models.TextField(max_length=1000)

    def overall_rating(self) -> float:
        individual_ratings = [self.story, self.gameplay, self.difficulty, self.enjoyment]

        overall_rating = sum(individual_ratings) / len(individual_ratings)

        return round(overall_rating, 2)

    def to_dict(self) -> dict:
        return {
            'story' : self.story,
            'fun' : self.gameplay,
            'difficulty' : self.difficulty,
            'enjoyment' : self.enjoyment,
            'review' : self.review
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

    def to_dict(self, user=None, attach_reviews: bool=False) -> dict:
        wishlisted = False
        owned = False

        if user:
            wishlisted = user.wishlist.filter(id=self.id).exists()
            owned = user.collection.filter(id=self.id).exists()

        data = {
            'id' : self.id,
            'title' : self.title,
            'description' : self.description,
            'time' : self.time,
            'languages' : json.loads(self.languages),
            'player_amounts' : json.loads(self.player_amounts),
            'age' : f'{self.age}+',
            'themes' : self.themes,
            'wishlisted' : wishlisted,
            'owned' : owned,
        }

        if attach_reviews:
            reviews = []

            for review in self.reviews.all():
                reviews.append(review.to_dict())

            data['reviews'] = reviews

            reviews = self.reviews.all()

            data['ratings'] = {
                'total' : overall_ratings(reviews, "total"),
                'story' : overall_ratings(reviews, "story"),
                'gameplay' : overall_ratings(reviews, 'gameplay'),
                'difficulty' : overall_ratings(reviews, "difficulty"),
                'enjoyment' : overall_ratings(reviews, "enjoyment")
            }

        return data