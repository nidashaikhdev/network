from django.urls import path
from . import views

urlpatterns = [

    path('', views.index, name='index'),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('register', views.register, name='register'),

    #API routes
    path('new_post', views.new_post, name='new_post'),
    path('all_posts', views.all_posts, name='all_posts'),
    path('profile/<str:username>', views.profile_view, name='profile'),
    path('follow/<str:username>', views.follow, name='follow'),
    path('following', views.following_view, name='following'),
    path('edit_post/<int:post_id>', views.edit_post, name='edit_post'),
    path('like_post/<int:post_id>', views.like_post, name='like_post'),
]
