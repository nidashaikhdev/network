from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from .models import User, Post


def index(request):
    if request.user.is_authenticated:
        return render(request, "network/index.html")
    else:
        return HttpResponseRedirect(reverse("login"))

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

@csrf_exempt
@login_required
def new_post(request):
    if request.method == "POST":
        data = json.loads(request.body)
        content = data.get("content", "")
        post = Post(user=request.user, content=content)
        post.save()
        return JsonResponse({"message": " New Post created successfully."}, status=201)
    else:
        return JsonResponse({"error": "request must be POST ."}, status=400)

@login_required
def all_posts(request):
    posts = Post.objects.all().order_by('-timestamp')
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)


    return JsonResponse({
        "posts": [post.serialize() for post in page_obj.object_list],
        "page_number": page_number,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous()
    }, safe=False)


@login_required
def profile_view(request, username):
    try:
        user_profile = User.objects.get(username=username)
        posts = Post.objects.filter(user=user_profile).order_by('-timestamp')
        paginator = Paginator(posts, 10)
        page_number = request.GET.get('page', 1)
        page_obj = paginator.get_page(page_number)
        isfollow = user_profile.followers.filter(id=request.user.id).exists()
        return JsonResponse({
            "profile": {
                "username": user_profile.username,
                "wersco": user_profile.followers.count(),
                "wingco": user_profile.following.all().count(),
                "isfollow": isfollow
            },
            "posts": [post.serialize() for post in page_obj.object_list],
            "pagination": {
                "page_number": page_number,
                "has_next": page_obj.has_next(),
                "has_previous": page_obj.has_previous()
            }
        })
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found."}, status=404)

@csrf_exempt
@login_required
def follow(request, username):
    if request.method == "POST":
        try:
            user_to_follow = User.objects.get(username=username)
            if request.user != user_to_follow:
                if request.user.following.filter(username=username).exists():
                    request.user.following.remove(user_to_follow)
                    followed = False
                else:
                    request.user.following.add(user_to_follow)
                    followed = True
                return JsonResponse({"followed": followed}, status=200)
            else:
                return JsonResponse({"error": "You cannot follow yourself."}, status=400)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found."}, status=404)
    else:
        return JsonResponse({"error": "request must be POST."}, status=400)

@login_required
def following_view(request):
    user_following = request.user.following.all()
    posts = Post.objects.filter(user__in=user_following).order_by('-timestamp')
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)
    return JsonResponse({
        "posts": [post.serialize() for post in page_obj.object_list],
        "pagination": {
            "page_number": page_number,
            "has_next": page_obj.has_next(),
            "has_previous": page_obj.has_previous()
        }
    })

@csrf_exempt
@login_required
def edit_post(request, post_id):
    if request.method == "PUT":
        try:
            post = Post.objects.get(pk=post_id, user=request.user)
            data = json.loads(request.body)
            post.content = data['content']
            post.save()
            return JsonResponse({"message": "Post edited successfully."}, status=200)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Post not found."}, status=404)
    else:
        return JsonResponse({"error": "request must be PUT."}, status=400)

@csrf_exempt
@login_required
def like_post(request, post_id):
    if request.method == "PUT":
        try:
            post = Post.objects.get(pk=post_id)
            if request.user in post.likes.all():
                post.likes.remove(request.user)
                liked = False
            else:
                post.likes.add(request.user)
                liked = True
            return JsonResponse({"liked": liked, "likes_count": post.likes.count()}, status=200)
        except Post.DoesNotExist:
            return JsonResponse({"error": "Unable to find the post."}, status=404)
    else:
        return JsonResponse({"error": "request must be POST."}, status=400)
