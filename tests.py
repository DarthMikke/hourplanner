import json

from django.test import RequestFactory, TestCase
from django.contrib.auth.models import AnonymousUser, User
from .models import Employee, Company, Division
from .views import me

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
        ...
