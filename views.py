from datetime import datetime, timedelta
import hourplanner.Responses as Responses

from django.shortcuts import render
from django.http import JsonResponse

from .models import Employee, Company, Division, Schedule

# Create your views here.

def me(request):
    # is the user authenticated?
    # if the user is not authenticated, return 404 with JSON error
    if (not request.user.is_authenticated) or request.user.is_anonymous:
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
    if (not request.user.is_authenticated) or request.user.is_anonymous:
        return Responses.unauthorized()

    # check that company, to and from are specified.
    # return 400 if one of those is missing.
    if not (
        'company' in request.GET.keys()
        and 'from' in request.GET.keys()
        and 'to' in request.GET.keys()
        ):
        return Responses.bad_request(data={'internal_error_code': 1})

    # validate the GET fields.
    try:
        int(request.GET['company'])
    except ValueError:
        return Responses.bad_request(data={'internal_error_code': 2})
    
    try:
        start = datetime.fromisoformat(request.GET['from'].replace("Z", "+00:00"))
    except ValueError as e:
        print(e)
        return Responses.bad_request(data={'internal_error_code': 3})
    
    try:
        end = datetime.fromisoformat(request.GET['to'].replace("Z", "+00:00"))
    except ValueError as e:
        print(e)
        return Responses.bad_request(data={'internal_error_code': 4})

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


def schedule_add(request):
    # is the user authenticated?
    # if the user is not authenticated, return 401 with JSON describing the error.
    if (not request.user.is_authenticated) or request.user.is_anonymous:
        return Responses.unauthorized()

    # check that company, to and from are specified.
    # return 400 if one of those is missing.
    if not (
        'division' in request.POST.keys()
        and 'employee' in request.POST.keys()
        and 'from' in request.POST.keys()
        and 'to' in request.POST.keys()
        ):
        return Responses.bad_request(data={'internal_error_code': 1, 'details': f'Provided keys are {request.POST.keys()}'})

    # validate the POST fields.
    try:
        division_id = int(request.POST['division'])
    except ValueError as e:
        print(repr(request))
        return Responses.bad_request(data={'internal_error_code': 2, 'details': str(e)})

    try:
        employee_id = int(request.POST['employee'])
    except ValueError as e:
        print(repr(request))
        return Responses.bad_request(data={'internal_error_code': 5, 'details': str(e)})
    
    try:
        start = datetime.fromisoformat(request.POST['from'].replace("Z", "+00:00"))
    except ValueError as e:
        print(repr(request))
        print(e)
        return Responses.bad_request(data={'internal_error_code': 3, 'details': str(e)})
    
    try:
        end = datetime.fromisoformat(request.POST['to'].replace("Z", "+00:00"))
    except ValueError as e:
        print(repr(request))
        print(e)
        return Responses.bad_request(data={'internal_error_code': 4, 'details': str(e)})

    # check that the specified division and employee both exist
    # return 404 otherwise

    employee = Employee.objects.get(employee_id = employee_id)
    division = Division.objects.get(division_id = division_id)
    if (employee is None 
        or division is None):
        return Responses.not_found()

    # check that the user is staff at the specified company.
    # check that the schedule's employee is employed at the specified company.
    # return 404
    # if division id is not among divisions the employee is part of,
    # or if employee id is not among employees the user can manage.

    # company = Employee.objects.get(user=request.user).get_company()
    user_profile = Employee.objects.get(user=request.user)
    if (not request.user.is_staff
        or user_profile.get_company() != employee.get_company()
        or division != employee.division):
        print(repr(request))
        return Responses.not_found()

    # add the schedule
    schedule = Schedule.objects.create(
        division = division,
        employee = employee,
        start = start,
        end = end
    )
    return JsonResponse(schedule.serialize())
    #return Responses.not_implemented()


def main(request):
    return render(request, 'planner/app.html')
