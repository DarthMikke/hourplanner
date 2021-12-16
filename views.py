from datetime import datetime, timedelta
import hourplanner.Responses as Responses

from django.shortcuts import render
from django.http import JsonResponse

from .models import Employee, Company, Division, Schedule

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
        start = datetime.fromisoformat(request.GET['from'])
    except ValueError as e:
        print(e)
        return Responses.bad_request()
    
    try:
        end = datetime.fromisoformat(request.GET['to'])
    except ValueError as e:
        print(e)
        return Responses.bad_request()

    end_filter = end + timedelta(1)

    # check that the user is employee at the specified company.
    # return 404 if company id is not among user's companies.
    company = Employee.objects.get(user=request.user).get_company()
    if not company.company_id == int(request.GET['company']):
        return Responses.not_found()

    # employee is successfully authenticated!
    # return list of schedules in the company in the requested time period.
    divisions = Division.objects.filter(company=company)
    schedules = []
    for division in divisions:
        [schedules.append(x.serialize()) for x in Schedule.objects.filter(
            division=division,
            start__gte=start,
            start__lte=end_filter
        )]
    employees = []
    for division in divisions:
        [employees.append(x.serialize()) for x in Employee.objects.filter(division=division)]


    response = {
        "company": company.serialize(),
        "divisions": [x.serialize() for x in divisions],
        "employees": employees,
        "schedules": schedules,
        "from": start,
        "to": end
    }

    return JsonResponse(response)
