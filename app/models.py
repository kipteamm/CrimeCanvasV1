from django.db.models.query import QuerySet
from django.db import models

from utils import snowflakes

import json


class Review(models.Model):
    id = snowflakes.SnowflakeIDField(primary_key=True, unique=True)

    user = models.ForeignKey('authentication.User', on_delete=models.CASCADE)

    story = models.IntegerField(default=1)
    gameplay = models.IntegerField(default=1)
    difficulty = models.IntegerField(default=1)
    enjoyment = models.IntegerField(default=1)

    review = models.TextField(max_length=1000, blank=True, null=True)

    creation_timestamp = models.FloatField()

    def _overall_rating(self) -> float:
        individual_ratings = [self.story, self.gameplay, self.difficulty, self.enjoyment]

        overall_rating = sum(individual_ratings) / len(individual_ratings)

        return round(overall_rating, 2)

    def to_dict(self, user=None) -> dict:
        """
            'story' : self.story,
            'fun' : self.gameplay,
            'difficulty' : self.difficulty,
            'enjoyment' : self.enjoyment,
        """

        writer = False

        if user:
            writer = self.user == user

        return {
            'review' : self.review,
            'total' : self._overall_rating(),
            'creation_timestamp' : self.creation_timestamp,
            'writer' : writer
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

    def to_dict(self, user=None, attach_reviews: bool = False) -> dict:
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'time': self.time,
            'languages': json.loads(self.languages),
            'player_amounts': json.loads(self.player_amounts),
            'age': f'{self.age}+',
            'themes': self.themes,
            'tested': self.tested,
        }

        if user:
            data.update({
                'wishlisted': user.wishlist.filter(id=self.id).exists(),
                'owned': user.collection.filter(id=self.id).exists(),
                'reviewed': self.reviews.filter(user=user).exists(),
            })

        if attach_reviews:
            data['rating'] = self._get_reviews_data()

        else:
            data['rating'] = _overall_ratings(self.reviews.all(), 'total')

        return data


    def _get_reviews_data(self) -> dict:
        ratings = {
            'reviews': 0,
            'total': 0.0,
            'story': 0.0,
            'gameplay': 0.0,
            'difficulty': 0.0,
            'enjoyment': 0.0,
        }

        reviews = self.reviews.all()

        if not reviews:
            return ratings

        for review in reviews:
            ratings['reviews'] += 1
            
            total = 0

            for field in ['story', 'gameplay', 'difficulty', 'enjoyment']:
                rating = getattr(review, field)

                ratings[field] += rating

                total += rating

            ratings['total'] += round(total / 4, 2)
        
        for field in ratings:
            if field != 'reviews':
                ratings[field] = round(ratings[field] / ratings['reviews'], 2)

        return ratings
    

def _overall_ratings(reviews: QuerySet, rating_type: str) -> float:
    if rating_type == 'total':
        individual_ratings = [review._overall_rating() for review in reviews]
    
    else:
        individual_ratings = [getattr(review, rating_type) for review in reviews]

    if len(individual_ratings) == 0:
        return 0

    overall_rating = sum(individual_ratings) / len(individual_ratings)

    return round(overall_rating, 2)