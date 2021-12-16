from django.contrib import admin
from .models import Employee, Company, Division, Schedule


class CompanyNameFilter(admin.SimpleListFilter):
    title = 'Company'
    parameter_name = 'company'

    def lookups(self, request, model_admin):
        """
        Returns the available company names
        """
        return [(y, y) for y in [x.name for x in Company.objects.all()]]

    def queryset(self, request, queryset):
        if self.value() == None:
            return queryset

        company = Company.objects.get(name=self.value())
        divisions = Division.objects.filter(company=company.company_id)
        return Employee.objects.filter(division__in=divisions)

class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'get_company')
    list_filter = (CompanyNameFilter, )


class CompanyAdmin(admin.ModelAdmin):
    list_display = ('__str__', )


class DivisionAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'company')

# Register your models here.
admin.site.register(Employee, EmployeeAdmin)
admin.site.register(Company, CompanyAdmin)
admin.site.register(Division, DivisionAdmin)
admin.site.register(Schedule)
