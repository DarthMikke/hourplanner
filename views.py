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
    # if the user is not authenticated, return 404 with JSON error.
    if not request.user.is_authenticated:
        return Responses.unauthorized()

    # check that company, to and from are specified.
    # return 400 if one of those is missing.
    if not (
        'company' in request.GET.keys()
        and 'from' in request.GET.keys()
        and 'to' in request.GET.keys()
        ):
        return Responses.bad_request()

    # validate the GET fields.
    try:
        int(request.GET['company'])
    except ValueError:
        return Responses.bad_request()
    
    try:
        start = datetime.strptime(request.GET['from'], "%Y-%m-%d")
    except ValueError:
        return Responses.bad_request()
    
    try:
        end = datetime.strptime(request.GET['to'], "%Y-%m-%d")
    except ValueError:
        return Responses.bad_request()

    # check that the user is employee at the specified company.
    # return 404 if company id is not among user's companies.
    company = Employee.objects.get(user=request.user).get_company()
    if not company.company_id == int(request.GET['company']):
        return Responses.not_found()

    # employee is successfully authenticated!
    # return list of schedules in the company in the requested time period.
    return Responses.not_implemented()
