import json
from datetime import datetime, timedelta

from django.test import RequestFactory, TestCase
from django.contrib.auth.models import AnonymousUser, User
from .models import Employee, Company, Division, Schedule
from .views import me, schedules_list, schedule_add

# Create your tests here.


class MeAPITestCase(TestCase):
    def setUp(self):
        # Every test needs access to the request factory.
        self.factory = RequestFactory()

        # Create a user and the environment around
        self.company = Company.objects.create(name='Test company')
        self.division = Division.objects.create(name='Test company HQ', company=self.company)
        self.user = User.objects.create_user(
            username='test_user',
            email='test@ema.il',
            password='top_secret'
        )
        self.employee = Employee.objects.get(user=self.user)
        self.employee.division = self.division
        self.employee.save()

    def test_details(self):
        # Create an instance of a GET request.
        request = self.factory.get('/planner/api/me')

        # Recall that middleware are not supported. You can simulate a
        # logged-in user by setting request.user manually.
        request.user = self.user
        response = me(request)
        response = json.loads(response.content)
        self.assertEqual(response['employee'], self.employee.serialize())
        self.assertEqual(response['division'], self.division.serialize())
        self.assertEqual(response['company'], self.company.serialize())

    def test_anonymous(self):
        ...  # TODO


class SchedulesListTestCase(TestCase):
    def setUp(self):
        # Every test needs access to the request factory.
        self.factory = RequestFactory()

        # Create some employees and the environment around
        self.company = Company.objects.create(name="Baker's café")
        self.divisions = {
            'bakery': Division.objects.create(name="Bakery", company=self.company),
            'cafe': Division.objects.create(name="Café", company=self.company),
        }

        self.employees = []
        self.user = User.objects.create_user(
            username='test_boss',
            email='boss@ema.il',
            password='top_secret',
            is_staff=True
        )
        employee = Employee.objects.get(user=self.user)
        employee.name = "Boss"
        employee.division = self.divisions['cafe']
        employee.save()
        self.employees.append(employee)
        x = 1
        for division in ['cafe', 'cafe', 'cafe', 'bakery', 'bakery']:
            user = User.objects.create_user(
                username=f'employee_{x}',
                email=f'test_{x}@ema.il',
                password='top_secret'
            )
            employee = Employee.objects.get(user=user)
            employee.name=f"Employee {x}"
            employee.division = self.divisions[division]
            employee.save()
            self.employees.append(employee)
            x += 1

        # Create some planned schedules.
        tz = datetime.now().astimezone().tzinfo
        self.schedules = []
        date = datetime(2021, 11, 1, tzinfo=tz)
        end_date = datetime(2021, 11, 5, tzinfo=tz)
        while date <= end_date:
            self.schedules.append(
                self.employees[0].add_schedule(
                    start=date + timedelta(hours=6),
                    end=date + timedelta(hours=14)
                )
            )
            self.schedules.append(
                self.employees[1].add_schedule(
                    start=date + timedelta(hours=8),
                    end=date + timedelta(hours=16)
                )
            )
            self.schedules.append(
                self.employees[2].add_schedule(
                    start=date + timedelta(hours=11),
                    end=date + timedelta(hours=19)
                )
            )
            self.schedules.append(
                self.employees[3].add_schedule(
                    start=date + timedelta(hours=4),
                    end=date + timedelta(hours=12)
                )
            )
            self.schedules.append(
                self.employees[4].add_schedule(
                    start=date + timedelta(hours=10),
                    end=date + timedelta(hours=18)
                )
            )

            date += timedelta(1)

    def test_api_request(self):
        # Create an instance of a GET request.
        company_id = self.company.company_id
        request = self.factory.get(f"/planner/api/schedules/list?company={company_id}&from=2021-11-01T00:00%2B01:00&to=2021-11-08T00:00%2B01:00")

        # Recall that middleware are not supported. You can simulate a
        # logged-in user by setting request.user manually.
        request.user = self.user
        response = schedules_list(request)
        self.assertEqual(response.status_code, 200)

        response = json.loads(response.content)
        serialized_employees = [x.serialize() for x in self.employees]
        serialized_divisions = [x.serialize() for x in self.divisions.values()]

        for i in range(len(self.employees)):
            self.assertTrue(response['employees'][i] in serialized_employees)

        # for (key, value) in self.divisions.items():
        #     self.assertTrue(response['divisions'][key] in serialized_divisions)
        for division in serialized_divisions:
            self.assertTrue(division in response['divisions'])
        self.assertEqual(response['company'], self.company.serialize())

        for schedule in response['schedules']:
            schedule_id = schedule['schedule_id']
            self.assertEqual(Schedule.objects.get(schedule_id=schedule_id).serialize(), schedule)

    def test_api_request_with_error(self):
        ... # TODO


class AddScheduleAPITestCase(TestCase):
    def setUp(self):
        # Every test needs access to the request factory.
        self.factory = RequestFactory()

        # Create a user and the environment around
        self.company = Company.objects.create(name='Test company')
        self.division = Division.objects.create(name='Test company HQ', company=self.company)
        self.user = User.objects.create_user(
            username='test_user',
            email='test@ema.il',
            password='top_secret',
            is_staff=True
        )
        self.employee = Employee.objects.get(user=self.user)
        self.employee.division = self.division
        self.employee.save()

    def test_successfully(self):
        start = "1996-07-16T08:00+01:00"
        end = "1996-07-16T16:00+01:00"
        # July 16, 1996 -- discovered the source of the Amazon River
        request = self.factory.post(f"/planner/api/schedules/create", {
            "employee": self.employee.employee_id,
            "division": self.division.division_id,
            "from": start,
            "to": end
        })

        request.user = self.user
        response = schedule_add(request)
        self.assertEqual(response.status_code, 200)
        response = json.loads(response.content)

        self.assertTrue('schedule_id' in response.keys())
        self.assertEqual(type(response['schedule_id']), int)
        self.assertTrue(len(Schedule.objects.filter(schedule_id=response['schedule_id'])), 1)
        self.assertEqual(response['employee'], self.employee.employee_id)
        self.assertEqual(response['division'], self.division.division_id)

        start_datetime = datetime.fromisoformat(start)
        end_datetime = datetime.fromisoformat(end)
        response_from_datetime = datetime.fromisoformat(response['from'].replace("Z", "+00:00"))
        response_to_datetime = datetime.fromisoformat(response['to'].replace("Z", "+00:00"))
        self.assertEqual(response_from_datetime, start_datetime)
        self.assertEqual(response_to_datetime, end_datetime)

    def test_with_non_staff_user(self):
        start = "1996-07-16T08:00+01:00"
        end = "1996-07-16T16:00+01:00"
        # July 16, 1996 -- discovered the source of the Amazon River
        request = self.factory.post(f"/planner/api/schedules/create", {
            "employee": self.employee.employee_id,
            "division": self.division.division_id,
            "from": start,
            "to": end
        })

        request.user = AnonymousUser
        response = schedule_add(request)
        self.assertEqual(response.status_code, 401)
