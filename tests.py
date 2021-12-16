import json
import datetime

from django.test import RequestFactory, TestCase
from django.contrib.auth.models import AnonymousUser, User
from .models import Employee, Company, Division
from .views import me, schedules_list

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


class ListTestCase(TestCase):
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
        x = 1
        for division in ['cafe', 'cafe', 'cafe', 'bakery', 'bakery']:
            user = User.objects.create_user(
                username=f'employee_{x}',
                email=f'test_{x}@ema.il',
                password='top_secret'
            )
            employee = Employee.objects.get(user=user, name=f"Employee {x}")
            employee.division = self.divisions[division]
            employee.save()
            self.employees.append(employee)
            x += 1

        # Create some planned schedules.
        self.schedules = []
        date = datetime(2021, 11, 1)
        end_date = datetime(2021, 11, 5)
        while date <= end_date:
            self.schedules.append(
                self.employees[0].add_schedule(
                    from_dt=date + timedelta(hours=6),
                    to_dt=date + timedelta(hours=14)
                )
            )
            self.schedules.append(
                self.employees[1].add_schedule(
                    from_dt=date + timedelta(hours=8),
                    to_dt=date + timedelta(hours=16)
                )
            )
            self.schedules.append(
                self.employees[2].add_schedule(
                    from_dt=date + timedelta(hours=11),
                    to_dt=date + timedelta(hours=19)
                )
            )
            self.schedules.append(
                self.employees[3].add_schedule(
                    from_dt=date + timedelta(hours=4),
                    to_dt=date + timedelta(hours=12)
                )
            )
            self.schedules.append(
                self.employees[4].add_schedule(
                    from_dt=date + timedelta(hours=10),
                    to_dt=date + timedelta(hours=18)
                )
            )

            date += timedelta(1)


    def test_api_request(self):
        # Create an instance of a GET request.
        company_id = self.company.company_id
        request = self.factory.get(f"/planner/api/schedules/list?company={company_id}&from=2021-11-01&to=2021-11-07")

        # Recall that middleware are not supported. You can simulate a
        # logged-in user by setting request.user manually.
        request.user = self.user
        response = schedules_list(request)
        response = json.loads(response.content)
        serialized_employees = [x.serialize() for x in self.employees]
        serialized_divisions = [x.serialize() for x in self.divisions]

        for i in range(len(self.employees)):
            self.assertTrue(response['employees'][i] in serialized_employees)

        for (key, value) in self.divisions:
            self.assertTrue(response['divisions'][key] in serialized_divisions)
        self.assertTrue(response['divisions'][1] in [x.serialize() for x in self.divisions])
        self.assertEqual(response['company'], self.company.serialize())

        for schedule in response['schedules']:
            schedule_id = schedule['schedule_id']
            self.assertEqual(Schedule.objects.get(schedule_id=schedule_id).serialize(), schedule)

    def test_api_request_with_error(self):
        ... # TODO
