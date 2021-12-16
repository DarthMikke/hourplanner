from django.db import models
from django.utils.translation import get_language
from babel.dates import format_datetime, format_time

from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

# Create your models here.

class Company(models.Model):
    company_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

    def serialize(self):
        return {
            "company_id": self.company_id,
            "name": self.name,
        }


class Division(models.Model):
    division_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

    def serialize(self):
        return {
            "division_id": self.division_id,
            "name": self.name,
            "company": self.company.company_id
        }


# https://simpleisbetterthancomplex.com/tutorial/2016/07/22/how-to-extend-django-user-model.html#onetoone
class Employee(models.Model):
    employee_id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    #accessToken = models.CharField(max_length=100)
    # TODO: *divisions* should be a many to many field
    division = models.ForeignKey(Division, on_delete=models.CASCADE, null=True)

    def __str__(self):
        return self.user.username

    def get_company(self):
        if self.division == None:
            return None

        return self.division.company

    def serialize(self):
        company_id = None if self.division is None else self.get_company().company_id
        # TODO: *division_ids* should be a list of divisions.
        division_id = None if self.division is None else self.division.division_id

        return {
            "employee_id": self.employee_id,
            "name": self.name,
            "staff": self.user.is_staff,
            "division": division_id,
            "company": company_id,
        }

    def add_schedule(self, start, end, division=None):
        if division is None:
            division = self.division # TODO: Vel første "division" eller hovudavdeling, dersom det blir spesifisert.
        new_schedule = Schedule.objects.create(
            employee=self,
            division=division,
            start=start,
            end=end
        )
        return new_schedule

    #def generateToken():
    #    does_exist_already = True
    #    encoded = ""
    #
    #    while does_exist_already:
    #        arr = bytearray()
    #        for i in range(20):
    #            arr.append(random.randint(0, 255))
    #        encoded = base64.b64encode(arr).decode('utf-8')
    #
    #        if len(Profile.objects.filter(accessToken=encoded)) == 0:
    #            does_exist_already = False
    #        else:
    #            does_exist_already = True
    #
    #    return encoded


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Employee.objects.create(user=instance)

#@receiver(post_save, sender=User)
#def save_user_profile(sender, instance, **kwargs):
#    instance.employee.accessToken = Employee.generateToken()
#    instance.employee.save()

class Schedule(models.Model):
    """Scheduled work hours"""
    schedule_id = models.BigAutoField(primary_key=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    division = models.ForeignKey(Division, on_delete=models.SET_NULL, null=True)
    start = models.DateTimeField()
    end = models.DateTimeField()

    def __str__(self):
        lang = get_language()
        return f"{employee.name}, {format_datetime(start, locale=lang)}–{format_time(end, locale=lang)}"

    def serialize(self):
        serialized = {
            "schedule_id": self.schedule_id,
            "employee": self.employee.employee_id,
            "division": self.division.division_id,
            "from": self.start.isoformat(),
            "to": self.end.isoformat(),
        }
        return serialized
