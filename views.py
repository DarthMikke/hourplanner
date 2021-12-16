import hourplanner.Responses as Responses

from django.shortcuts import render
from django.http import JsonResponse

from .models import Employee

# Create your views here.

def me(request):
    # is the user authenticated?
    # if the user is not authenticated, return 404 with JSON error
    if not request.user.is_authenticated:
        return Responses.unauthorized()

    # otherwise, return the user, user's company and their division
    employee = Employee.objects.get(user=request.user)

    response = {
      "employee": employee.serialize(),
      "company": employee.division.company.serialize(),
      "division": employee.division.serialize(),
    }
    return JsonResponse(response)

def schedules_list(request):
    # is the user authenticated?
    # if the user is not authenticated, return 404 with JSON error
    if not request.user.is_authenticated:
        return Responses.unauthorized()

    ...
