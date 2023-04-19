from django.urls import path
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from . import views

urlpatterns = [
    # ex: /simulate/
    path('', views.index, name='index'),
    #ex : /simulate/input/
    path('input/', views.SimulationInput, name='input'),
        #ex : /simulate/results/
    path('results/', views.results, name='results'),
            #ex : /simulate/simulating/
    path('simulating/', views.SimulationResult, name='simulating'),
                #ex : /simulate/credit/
    path('credit/', views.credit, name='credit')
]
urlpatterns += staticfiles_urlpatterns()