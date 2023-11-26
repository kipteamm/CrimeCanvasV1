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
        }

        if user:
            data.update({
                'wishlisted': user.wishlist.filter(id=self.id).exists(),
                'owned': user.collection.filter(id=self.id).exists(),
                'reviewed': self.reviews.filter(user=user).exists(),
            })

        if attach_reviews:
            data['reviews'] = self._get_reviews_data()

        else:
            data['rating'] = _overall_ratings(self.reviews.all(), 'total')

        return data


    def _get_reviews_data(self) -> dict:
        reviews_data = {
            'reviews': [],
            'total': 0,
            'story': 0,
            'gameplay': 0,
            'difficulty': 0,
            'enjoyment': 0,
        }

        reviews = self.reviews.all()

        if not reviews:
            return reviews_data

        for review in reviews:
            review_data = {
                'id': review.id,
                'review': review.review,
                'creation_timestamp': review.creation_timestamp,
            }

            reviews_data['reviews'].append(review_data)
            total = 0

            for field in ['story', 'gameplay', 'difficulty', 'enjoyment']:
                rating = getattr(review, field)

                reviews_data[field] += rating

                total += rating

            reviews_data['total'] += round(total / 4, 2)

        total_reviews = len(reviews_data['reviews'])
        
        for field in reviews_data:
            if field != 'reviews':
                reviews_data[field] = round(reviews_data[field] / total_reviews, 2)

        return reviews_data
    

def _overall_ratings(reviews: QuerySet, rating_type: str) -> float:
    if rating_type == 'total':
        individual_ratings = [review._overall_rating() for review in reviews]
    
    else:
        individual_ratings = [getattr(review, rating_type) for review in reviews]

    if len(individual_ratings) == 0:
        return 0

    overall_rating = sum(individual_ratings) / len(individual_ratings)

    return round(overall_rating, 2)