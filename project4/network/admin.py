from django.contrib import admin

# Register your models here.
from .models import User,  Post

admin.site.register(Post)
admin.site.register(User)

